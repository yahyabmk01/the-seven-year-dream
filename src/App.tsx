import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, Volume2, VolumeX, WifiOff } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { DevPanel } from './components/DevPanel';
import { EndingScreen } from './components/EndingScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { RoomEntryScreen } from './components/RoomEntryScreen';
import { SceneScreen } from './components/SceneScreen';
import { TitleBackground } from './components/TitleBackground';
import { TitleScreen } from './components/TitleScreen';
import { isAmbientMuted, startAmbientMusic, toggleAmbientMute } from './lib/ambientMusic';
import { playStoneTap } from './lib/soundFx';
import {
  DEFAULT_SCENE_DURATION,
  evaluateEnding,
  FIRST_SCENE_ID,
  getEndingByTitle,
  getSceneById,
} from './data/storyData';
import {
  addTestBot,
  createRoom,
  ensureSession,
  fetchMyPlayer,
  fetchRoomBundle,
  getActiveBotIds,
  getClockOffsetMs,
  isSupabaseConfigured,
  joinRoom,
  leaveRoom,
  removeTestBots,
  resetRoom,
  resolveScene,
  startGame,
  submitBotVote,
  submitVote,
  subscribeToRoom,
  syncServerTime,
  touchBots,
  touchPlayer,
  unsubscribeFromRoom,
} from './lib/gameApi';
import type {
  DecisionRule,
  PlayerRow,
  RoomRow,
  StoryScene,
  VoteRow,
} from './types/game';

type UnauthenticatedScreen = 'title' | 'entry';

function clampMeter(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function App() {
  const [unauthScreen, setUnauthScreen] = useState<UnauthenticatedScreen>('title');
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [savedName, setSavedName] = useState<string>(() => {
    try {
      return localStorage.getItem('seven_year_dream_name') || '';
    } catch {
      return '';
    }
  });

  // Authoritative room state mirrored from Supabase
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [votes, setVotes] = useState<VoteRow[]>([]);

  // Clock & UI indicators
  const [clockOffsetMs, setClockOffsetMs] = useState<number>(0);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [isOffline, setIsOffline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [channelDisconnected, setChannelDisconnected] = useState<boolean>(false);
  const [submittingChoice, setSubmittingChoice] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [devPanelOpen, setDevPanelOpen] = useState<boolean>(false);
  const [subscriptionNonce, setSubscriptionNonce] = useState<number>(0);
  const [lockInState, setLockInState] = useState<{ key: string; endsAtMs: number } | null>(null);
  const [skippedTitleCardKey, setSkippedTitleCardKey] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() =>
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false
  );
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => isAmbientMuted());

  useEffect(() => {
    // Attempt gentle ambient music start (respects browser autoplay policies)
    startAmbientMusic(2000);
  }, []);

  const handleToggleAudio = useCallback(() => {
    playStoneTap();
    const muted = toggleAmbientMute();
    setIsAudioMuted(muted);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    playStoneTap();
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Refs for fresh closures inside random-delay resolve timers & listeners
  const roomRef = useRef<RoomRow | null>(null);
  const playersRef = useRef<PlayerRow[]>([]);
  const votesRef = useRef<VoteRow[]>([]);
  const activeCodeRef = useRef<string | null>(null);
  const clockOffsetRef = useRef<number>(0);
  const scheduledResolveKeyRef = useRef<string | null>(null);
  const resolveTimeoutRef = useRef<number | null>(null);
  const wasDisconnectedRef = useRef<boolean>(false);
  const toastTimeoutRef = useRef<number | null>(null);
  const botVoteTimersRef = useRef<number[]>([]);

  roomRef.current = room;
  playersRef.current = players;
  votesRef.current = votes;
  activeCodeRef.current = activeRoomCode;
  clockOffsetRef.current = clockOffsetMs;

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 4000);
  }, []);

  const clearBotVoteTimers = useCallback(() => {
    for (const timerId of botVoteTimersRef.current) {
      window.clearTimeout(timerId);
    }
    botVoteTimersRef.current = [];
  }, []);

  const clearRoomState = useCallback(
    (returnToTitle = true) => {
      clearBotVoteTimers();
      if (resolveTimeoutRef.current !== null) {
        window.clearTimeout(resolveTimeoutRef.current);
        resolveTimeoutRef.current = null;
      }
      scheduledResolveKeyRef.current = null;
      setActiveRoomCode(null);
      setRoom(null);
      setPlayers([]);
      setVotes([]);
      setChannelDisconnected(false);
      setLockInState(null);
      setSkippedTitleCardKey(null);
      wasDisconnectedRef.current = false;
      if (returnToTitle) {
        setUnauthScreen('title');
      }
    },
    [clearBotVoteTimers]
  );

  const refreshRoomState = useCallback(
    async (code: string) => {
      try {
        const bundle = await fetchRoomBundle(code);
        if (!bundle.room) {
          clearRoomState(true);
          showToast('Room no longer exists.');
          return null;
        }
        setRoom(bundle.room as RoomRow);
        setPlayers(bundle.players as PlayerRow[]);
        setVotes(bundle.votes as VoteRow[]);
        return bundle;
      } catch {
        return null;
      }
    },
    [clearRoomState, showToast]
  );

  const ensureAuthAndClock = useCallback(async () => {
    const session = await ensureSession();
    const uid = session?.user?.id ?? null;
    setMyUserId(uid);

    try {
      const offset = await syncServerTime();
      setClockOffsetMs(offset);
    } catch {
      setClockOffsetMs(getClockOffsetMs());
    }

    return uid;
  }, []);

  // Startup: Auth + server_time() + auto-reconnect if player already in a room
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!isSupabaseConfigured()) return;

      try {
        const uid = await ensureAuthAndClock();
        if (cancelled || !uid) return;

        const myPlayer = await fetchMyPlayer(uid);
        if (cancelled || !myPlayer?.room_code) return;

        const bundle = await fetchRoomBundle(myPlayer.room_code);
        if (cancelled) return;

        if (!bundle.room) {
          showToast('Previous room no longer exists.');
          return;
        }

        setRoom(bundle.room as RoomRow);
        setPlayers(bundle.players as PlayerRow[]);
        setVotes(bundle.votes as VoteRow[]);
        setActiveRoomCode(bundle.room.code);
        touchPlayer().catch(() => {});
        showToast(`Welcome back, rejoining room ${bundle.room.code}`);
      } catch {
        // Stay on title screen if initial anonymous auth fails
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [ensureAuthAndClock, showToast]);

  // Press 'D' to toggle hidden dev panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.key === 'd' || e.key === 'D') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setDevPanelOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Online / Offline & visibilitychange reconnect handling
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      const code = activeCodeRef.current;
      if (code) {
        syncServerTime()
          .then((offset) => setClockOffsetMs(offset))
          .catch(() => {});
        refreshRoomState(code);
        touchPlayer().catch(() => {});
        setSubscriptionNonce((n) => n + 1);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && activeCodeRef.current) {
        const code = activeCodeRef.current;
        syncServerTime()
          .then((offset) => setClockOffsetMs(offset))
          .catch(() => {});
        refreshRoomState(code);
        touchPlayer().catch(() => {});
        setSubscriptionNonce((n) => n + 1);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshRoomState]);

  // Realtime subscription + 20s touch_player() heartbeat while in a room
  useEffect(() => {
    if (!activeRoomCode) return;

    const channel = subscribeToRoom(activeRoomCode, {
      onRoomChange: (payload: { eventType?: string; new?: Partial<RoomRow> }) => {
        if (payload.eventType === 'DELETE') {
          clearRoomState(true);
          showToast('Room no longer exists.');
          return;
        }
        if (payload.new && payload.new.code) {
          const nextRoom = payload.new as RoomRow;
          const sceneOrStatusChanged =
            nextRoom.current_scene !== roomRef.current?.current_scene ||
            nextRoom.status !== roomRef.current?.status;
          setRoom(nextRoom);
          if (sceneOrStatusChanged) {
            refreshRoomState(activeRoomCode);
          }
        }
      },
      onPlayersChange: () => {
        refreshRoomState(activeRoomCode);
      },
      onVotesChange: () => {
        refreshRoomState(activeRoomCode);
      },
      onStatusChange: (status: string) => {
        if (status === 'SUBSCRIBED') {
          setChannelDisconnected(false);
          if (wasDisconnectedRef.current) {
            wasDisconnectedRef.current = false;
            refreshRoomState(activeRoomCode);
          }
        } else if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          wasDisconnectedRef.current = true;
          setChannelDisconnected(true);
        }
      },
    });

    const heartbeat = window.setInterval(() => {
      touchPlayer().catch(() => {});
      touchBots(activeRoomCode).catch(() => {});
    }, 20_000);

    return () => {
      window.clearInterval(heartbeat);
      unsubscribeFromRoom(channel);
    };
  }, [activeRoomCode, subscriptionNonce, clearRoomState, refreshRoomState, showToast]);

  // Smooth tick while in lobby or playing so timers & 45s presence dots update
  useEffect(() => {
    if (!room || (room.status !== 'lobby' && room.status !== 'playing')) return;
    setNowTick(Date.now());
    const interval = window.setInterval(() => {
      setNowTick(Date.now());
    }, 250);
    return () => window.clearInterval(interval);
  }, [room?.code, room?.status]);

  // Clear pending scene resolution & bot vote timers whenever scene or status changes
  useEffect(() => {
    clearBotVoteTimers();
    if (resolveTimeoutRef.current !== null) {
      window.clearTimeout(resolveTimeoutRef.current);
      resolveTimeoutRef.current = null;
    }
    scheduledResolveKeyRef.current = null;
    setSubmittingChoice(null);
    setLockInState(null);
    setSkippedTitleCardKey(null);
  }, [room?.code, room?.status, room?.current_scene, clearBotVoteTimers]);

  // Scene resolution trigger (when all players voted OR timer reaches 0)
  const resolveCurrentScene = useCallback(async () => {
    const latestRoom = roomRef.current;
    const latestPlayers = playersRef.current;
    const latestVotes = votesRef.current;

    if (!latestRoom || latestRoom.status !== 'playing' || !latestRoom.current_scene) {
      return;
    }

    const scene = getSceneById(latestRoom.current_scene) as StoryScene | null;
    if (!scene) return;

    const sceneVotes = latestVotes.filter((v) => v.scene_id === scene.id);

    // 1. Tally votes:
    //    - Strict highest count wins ('majority')
    //    - Tie or nobody voted: host's vote wins if host voted ('host'), else scene.defaultChoice ('default')
    let winningChoiceId = scene.defaultChoice;
    let decidedBy: DecisionRule = 'default';
    const hostVote = sceneVotes.find((v) => v.player_id === latestRoom.host_id)?.choice_id;

    if (sceneVotes.length > 0) {
      const counts: Record<string, number> = {};
      for (const choice of scene.choices) {
        counts[choice.id] = 0;
      }
      for (const vote of sceneVotes) {
        if (vote.choice_id in counts) {
          counts[vote.choice_id] += 1;
        }
      }

      const maxCount = Math.max(...Object.values(counts));
      if (maxCount > 0) {
        const tied = scene.choices
          .filter((c) => counts[c.id] === maxCount)
          .map((c) => c.id);

        if (tied.length === 1) {
          winningChoiceId = tied[0];
          decidedBy = 'majority';
        } else if (hostVote) {
          winningChoiceId = hostVote;
          decidedBy = 'host';
        } else {
          winningChoiceId = scene.defaultChoice;
          decidedBy = 'default';
        }
      } else if (hostVote) {
        winningChoiceId = hostVote;
        decidedBy = 'host';
      }
    }

    const winningChoice =
      scene.choices.find((c) => c.id === winningChoiceId) || scene.choices[0];

    // 2. Apply effects clamped 0..100, merge flags, compute year
    const newGrain = clampMeter((latestRoom.grain ?? 30) + (winningChoice.effects?.grain ?? 0));
    const newPanic = clampMeter((latestRoom.panic ?? 10) + (winningChoice.effects?.panic ?? 0));
    const newTrust = clampMeter((latestRoom.trust ?? 50) + (winningChoice.effects?.trust ?? 0));
    const newFlags = {
      ...(latestRoom.flags || {}),
      ...(winningChoice.setFlags || {}),
    };

    // 3. Resolve next scene or ENDING and compute cinematic p_intro
    const rawNext =
      typeof winningChoice.next === 'function'
        ? winningChoice.next({
            grain: newGrain,
            panic: newPanic,
            trust: newTrust,
            flags: newFlags,
            year: latestRoom.year ?? scene.year ?? 1,
            room: latestRoom,
          })
        : winningChoice.next;

    let nextSceneId = rawNext;
    let nextEnding: string | null = null;
    let nextDuration = DEFAULT_SCENE_DURATION;
    let nextYear = latestRoom.year ?? scene.year ?? 1;
    let nextIntro = 4;

    if (rawNext === 'ENDING') {
      const endingTitle = evaluateEnding(newGrain, newPanic);
      const endingInfo = getEndingByTitle(endingTitle);
      nextSceneId = endingInfo.id;
      nextEnding = endingTitle;
      nextIntro = 0;
    } else {
      const nextSceneObj = getSceneById(rawNext) as StoryScene | null;
      nextDuration = nextSceneObj?.duration ?? DEFAULT_SCENE_DURATION;
      nextYear = nextSceneObj?.year ?? nextYear + 1;
      // 9s when next scene opens a new year/phase (4s result card + 5s year title card), else 4s result card only
      nextIntro = nextSceneObj?.yearCard ? 9 : 4;
    }

    // Build votes map keyed by seat number ("1", "2", "3")
    const votesBySeat: Record<string, string> = {};
    for (const p of latestPlayers) {
      const v = sceneVotes.find((item) => item.player_id === p.id);
      if (v) {
        votesBySeat[String(p.seat)] = v.choice_id;
      }
    }

    const entry = {
      scene: scene.id,
      phase: scene.phase,
      choiceId: winningChoice.id,
      choiceText: winningChoice.text,
      resultText: winningChoice.resultText,
      votes: votesBySeat,
      decidedBy,
    };

    // 4. Call resolve_scene RPC (server ignores if another device already resolved)
    try {
      await resolveScene({
        code: latestRoom.code,
        fromScene: scene.id,
        nextScene: nextSceneId,
        grain: newGrain,
        panic: newPanic,
        trust: newTrust,
        year: nextYear,
        flags: newFlags,
        entry,
        duration: nextDuration,
        ending: nextEnding,
        intro: nextIntro,
      });
    } catch {
      // Allow recovery if this device hit a temporary network error
      scheduledResolveKeyRef.current = null;
    }
  }, []);

  // Manage 5-second "Locking in..." countdown & trigger scene resolution
  useEffect(() => {
    if (!room || room.status !== 'playing' || !room.current_scene) {
      if (lockInState !== null) setLockInState(null);
      return;
    }
    const scene = getSceneById(room.current_scene) as StoryScene | null;
    if (!scene) return;

    const serverNowMs = nowTick + clockOffsetMs;
    const votingOpensMs = room.voting_opens_at
      ? new Date(room.voting_opens_at).getTime()
      : 0;
    const sceneEndsMs = room.scene_ends_at
      ? new Date(room.scene_ends_at).getTime()
      : Infinity;

    const votingOpen = !room.voting_opens_at || serverNowMs >= votingOpensMs;
    const sceneVotes = votes.filter((v) => v.scene_id === scene.id);
    const allVoted =
      players.length > 0 &&
      players.every((p) => sceneVotes.some((v) => v.player_id === p.id));
    const timeUp = Boolean(room.scene_ends_at) && serverNowMs >= sceneEndsMs;

    const sceneKey = `${room.code}:${room.current_scene}`;

    // Start / maintain 5s "Locking in..." window when all players have voted
    if (votingOpen && allVoted && !timeUp) {
      if (lockInState?.key !== sceneKey) {
        const localFiveSecEnd = Date.now() + 5000;
        const localSceneEnd = room.scene_ends_at
          ? sceneEndsMs - clockOffsetMs
          : Infinity;
        setLockInState({
          key: sceneKey,
          endsAtMs: Math.min(localFiveSecEnd, localSceneEnd),
        });
        return;
      }
    } else if (lockInState !== null) {
      setLockInState(null);
    }

    const lockInDone =
      votingOpen &&
      allVoted &&
      lockInState?.key === sceneKey &&
      nowTick >= lockInState.endsAtMs;

    if (!votingOpen || (!timeUp && !lockInDone)) return;

    if (scheduledResolveKeyRef.current === sceneKey) return;

    scheduledResolveKeyRef.current = sceneKey;
    const randomDelayMs = Math.floor(Math.random() * 600);

    resolveTimeoutRef.current = window.setTimeout(() => {
      resolveTimeoutRef.current = null;
      resolveCurrentScene();
    }, randomDelayMs);
  }, [room, players, votes, nowTick, clockOffsetMs, lockInState, resolveCurrentScene]);

  // Handlers passed to screens (all DB access delegated to gameApi.js)
  const handleCreateRoom = async (playerName: string) => {
    const trimmed = playerName.trim();
    try {
      localStorage.setItem('seven_year_dream_name', trimmed);
    } catch {
      // Ignore storage failures
    }
    setSavedName(trimmed);

    await ensureAuthAndClock();
    const code = await createRoom(trimmed);
    const bundle = await fetchRoomBundle(code);
    if (!bundle.room) {
      throw new Error('Room was created but could not be loaded.');
    }

    setRoom(bundle.room as RoomRow);
    setPlayers(bundle.players as PlayerRow[]);
    setVotes(bundle.votes as VoteRow[]);
    setActiveRoomCode(bundle.room.code);
    touchPlayer().catch(() => {});
  };

  const handleJoinRoom = async (codeInput: string, playerName: string) => {
    const trimmed = playerName.trim();
    try {
      localStorage.setItem('seven_year_dream_name', trimmed);
    } catch {
      // Ignore storage failures
    }
    setSavedName(trimmed);

    await ensureAuthAndClock();
    const joinedCode = await joinRoom(codeInput, trimmed);
    const bundle = await fetchRoomBundle(joinedCode);
    if (!bundle.room) {
      throw new Error('Room not found.');
    }

    setRoom(bundle.room as RoomRow);
    setPlayers(bundle.players as PlayerRow[]);
    setVotes(bundle.votes as VoteRow[]);
    setActiveRoomCode(bundle.room.code);
    touchPlayer().catch(() => {});
  };

  const handleLeaveRoom = async () => {
    const code = room?.code;
    try {
      await removeTestBots(code);
      await leaveRoom();
    } finally {
      clearRoomState(true);
    }
  };

  const handleAddBot = async () => {
    if (!room) return;
    const bot = await addTestBot(room.code, players.length);
    await refreshRoomState(room.code);
    showToast(`${bot.name} joined the council`);
  };

  const handleRemoveBots = async () => {
    if (!room) return;
    await removeTestBots(room.code);
    await refreshRoomState(room.code);
    showToast('Test bots removed');
  };

  const handleStartGame = async () => {
    if (!room) return;
    const firstScene = getSceneById(FIRST_SCENE_ID) as StoryScene;
    await startGame(
      room.code,
      firstScene.id,
      firstScene.duration || DEFAULT_SCENE_DURATION
    );
    await refreshRoomState(room.code);
  };

  const handleVote = async (choiceId: string) => {
    if (!room || !room.current_scene) return;
    const roomCode = room.code;
    const sceneId = room.current_scene;

    setSubmittingChoice(choiceId);
    clearBotVoteTimers();

    try {
      await submitVote(roomCode, sceneId, choiceId);
      await refreshRoomState(roomCode);

      // Mirror the human player's choice for any active test bots in the room
      const botIds = getActiveBotIds(roomCode);
      botIds.forEach((botId, idx) => {
        const timerId = window.setTimeout(async () => {
          const latest = roomRef.current;
          if (
            !latest ||
            latest.code !== roomCode ||
            latest.status !== 'playing' ||
            latest.current_scene !== sceneId
          ) {
            return;
          }
          try {
            await submitBotVote(botId, roomCode, sceneId, choiceId);
            await refreshRoomState(roomCode);
          } catch {
            // Ignore transient bot vote errors
          }
        }, 380 * (idx + 1));
        botVoteTimersRef.current.push(timerId);
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to submit vote.');
    } finally {
      setSubmittingChoice(null);
    }
  };

  const handlePlayAgain = async () => {
    if (!room) return;
    await resetRoom(room.code);
    await refreshRoomState(room.code);
  };

  const serverNowMs = nowTick + clockOffsetMs;
  const currentScene =
    room?.status === 'playing' && room.current_scene
      ? (getSceneById(room.current_scene) as StoryScene | null)
      : null;

  const currentSceneKey =
    room && currentScene ? `${room.code}:${currentScene.id}` : null;
  const lockInRemainingMs =
    lockInState && currentSceneKey && lockInState.key === currentSceneKey
      ? Math.max(0, lockInState.endsAtMs - nowTick)
      : null;

  const introRemainingMs =
    room?.voting_opens_at ? Math.max(0, new Date(room.voting_opens_at).getTime() - serverNowMs) : 0;
  const isFirstScene = !Array.isArray(room?.history) || room.history.length === 0;
  const isTitleCardActive = Boolean(
    room?.status === 'playing' &&
      currentScene?.yearCard &&
      introRemainingMs > 0 &&
      (!isFirstScene || introRemainingMs <= 5000) &&
      skippedTitleCardKey !== currentSceneKey
  );

  const showReconnectBanner = Boolean(activeRoomCode && (isOffline || channelDisconnected));

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-[#1E140D] text-[#EBD9B4]">
      <TitleBackground />

      {/* Persistent Quick Controls: Audio Mute & Fullscreen Toggle */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleAudio}
          aria-label={isAudioMuted ? 'Unmute ambient music' : 'Mute ambient music'}
          title={isAudioMuted ? 'Unmute Ambient Music' : 'Mute Ambient Music'}
          className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-sm border border-[#C9993A]/50 bg-[#1E140D]/85 text-[#EBD9B4] shadow-[0_4px_16px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-all hover:border-[#EBD9B4] hover:bg-[#2B1D14] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9993A]"
        >
          {isAudioMuted ? (
            <VolumeX className="h-4 w-4 text-[#E8883A]" aria-hidden="true" />
          ) : (
            <Volume2 className="h-4 w-4 text-[#D9B98A]" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
          title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-sm border border-[#C9993A]/50 bg-[#1E140D]/85 text-[#EBD9B4] shadow-[0_4px_16px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-all hover:border-[#EBD9B4] hover:bg-[#2B1D14] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9993A]"
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Maximize className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Reconnecting Banner */}
      <AnimatePresence>
        {showReconnectBanner && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            role="status"
            aria-live="polite"
            className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-[#7A2E1D]/95 px-4 py-2 font-cinzel text-xs font-semibold tracking-[0.12em] text-[#EBD9B4] shadow-md backdrop-blur-sm"
          >
            <WifiOff className="h-3.5 w-3.5 text-[#E8883A]" aria-hidden="true" />
            <span>Reconnecting...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Message */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-sm border border-[#C9993A] bg-[#1E140D]/95 px-5 py-2.5 font-lora text-sm text-[#EBD9B4] shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-sm whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Screen Router (DB status is single source of truth when in a room) */}
      <AnimatePresence mode="wait">
        {!room ? (
          unauthScreen === 'title' ? (
            <TitleScreen key="title" onStart={() => setUnauthScreen('entry')} />
          ) : (
            <RoomEntryScreen
              key="entry"
              initialName={savedName}
              onBackToTitle={() => setUnauthScreen('title')}
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
            />
          )
        ) : room.status === 'lobby' ? (
          <LobbyScreen
            key="lobby"
            room={room}
            players={players}
            myUserId={myUserId || ''}
            serverNowMs={serverNowMs}
            activeBotCount={getActiveBotIds(room.code).length}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
            onAddBot={handleAddBot}
            onRemoveBots={handleRemoveBots}
            onNotify={showToast}
          />
        ) : room.status === 'playing' && currentScene ? (
          <SceneScreen
            key={`scene-${currentScene.id}`}
            room={room}
            scene={currentScene}
            players={players}
            votes={votes}
            myUserId={myUserId || ''}
            serverNowMs={serverNowMs}
            lockInRemainingMs={lockInRemainingMs}
            skipTitleCard={Boolean(currentSceneKey && skippedTitleCardKey === currentSceneKey)}
            submittingChoice={submittingChoice}
            onVote={handleVote}
          />
        ) : room.status === 'finished' ? (
          <EndingScreen
            key="ending"
            room={room}
            ending={getEndingByTitle(room.ending)}
            myUserId={myUserId || ''}
            onPlayAgain={handlePlayAgain}
            onLeaveRoom={handleLeaveRoom}
          />
        ) : (
          <motion.main
            key="unknown-scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 flex min-h-dvh items-center justify-center px-4"
          >
            <div className="w-full max-w-md rounded-sm border border-[#C9993A] bg-[#1E140D]/92 p-6 text-center">
              <p className="font-cinzel text-lg text-[#EBD9B4]">
                Scene not found ({room.current_scene || 'unknown'})
              </p>
              <button
                type="button"
                onClick={handleLeaveRoom}
                className="mt-4 cursor-pointer rounded-sm border border-[#C9993A] bg-[#2B1D14] px-5 py-2.5 font-cinzel text-sm text-[#EBD9B4]"
              >
                Leave Room
              </button>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* Hidden Dev Panel (press D) */}
      <DevPanel
        open={devPanelOpen}
        onClose={() => setDevPanelOpen(false)}
        room={room}
        players={players}
        votes={votes}
        clockOffsetMs={clockOffsetMs}
        myUserId={myUserId}
        canSkipTitleCard={isTitleCardActive}
        onSkipTitleCard={() => {
          if (currentSceneKey) {
            setSkippedTitleCardKey(currentSceneKey);
          }
        }}
        lockInRemainingMs={lockInRemainingMs}
      />
    </div>
  );
}
