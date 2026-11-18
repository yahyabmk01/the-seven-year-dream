import { useState } from 'react';
import { Check, Copy, Loader2, LogOut, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { fadeOutForVideo } from '../lib/ambientMusic';
import { playStoneSeal, playStoneTap } from '../lib/soundFx';
import type { PlayerRow, RoomRow } from '../types/game';
import { PlayerAvatar } from './PlayerAvatar';

interface LobbyScreenProps {
  room: RoomRow;
  players: PlayerRow[];
  myUserId: string;
  serverNowMs: number;
  activeBotCount: number;
  onStartGame: () => Promise<void>;
  onLeaveRoom: () => Promise<void>;
  onAddBot: () => Promise<void>;
  onRemoveBots: () => Promise<void>;
  onNotify: (msg: string) => void;
}

const SLOTS: (1 | 2 | 3)[] = [1, 2, 3];

export function LobbyScreen({
  room,
  players,
  myUserId,
  serverNowMs,
  activeBotCount,
  onStartGame,
  onLeaveRoom,
  onAddBot,
  onRemoveBots,
  onNotify,
}: LobbyScreenProps) {
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHost = room.host_id === myUserId;
  const canStart = isHost && players.length >= 2 && players.length <= 3;

  const handleCopy = async () => {
    playStoneTap();
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      onNotify(`Room code ${room.code} copied`);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      onNotify(`Room code: ${room.code}`);
    }
  };

  const handleStart = async () => {
    if (!canStart || starting) return;
    playStoneSeal();
    fadeOutForVideo(600);
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setError(null);
    setStarting(true);
    try {
      await onStartGame();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start the game.');
      setStarting(false);
    }
  };

  const handleLeave = async () => {
    if (leaving) return;
    playStoneTap();
    setLeaving(true);
    try {
      await onLeaveRoom();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to leave room.');
      setLeaving(false);
    }
  };

  const handleAddBot = async () => { await onAddBot(); };
  const handleRemoveBots = async () => { await onRemoveBots(); };

  return (
    <motion.main
      key="lobby-screen"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 flex min-h-dvh w-full items-center justify-center px-4 py-10 sm:px-6"
    >
      <section
        aria-label="Room lobby"
        className="w-full max-w-lg rounded-sm border border-[#C9993A]/60 bg-[#1E140D]/92 p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.8)] backdrop-blur-sm"
      >
        {/* Room Code Header */}
        <div className="text-center">
          <p className="font-cinzel text-xs font-semibold tracking-[0.18em] text-[#D9B98A] uppercase">
            Room Code
          </p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <span className="font-cinzel text-4xl sm:text-5xl font-bold tracking-[0.28em] text-[#EBD9B4] pl-[0.28em] tabular-nums">
              {room.code}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy room code"
              className="cursor-pointer inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-[#C9993A]/65 bg-[#2B1D14] px-3 py-2 font-cinzel text-xs font-semibold tracking-[0.08em] text-[#EBD9B4] transition-colors hover:border-[#EBD9B4] hover:bg-[#3A271B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9993A] whitespace-nowrap shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#4ADE80]" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-[#C9993A]" aria-hidden="true" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="mt-2 font-lora text-sm text-[#D9B98A]">
            Share this code with 1 or 2 advisors to begin ({players.length}/3 joined).
          </p>
        </div>

        <div className="my-5 flex items-center justify-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-[#C9993A]/35" />
          <span className="h-2 w-2 rotate-45 bg-[#C9993A]/80" />
          <span className="h-px flex-1 bg-[#C9993A]/35" />
        </div>

        {/* 3 Player Slots */}
        <ul className="space-y-3" aria-label="Players in room">
          {SLOTS.map((seat) => {
            const player = players.find((p) => p.seat === seat);
            const isPlayerHost = player ? player.id === room.host_id : false;
            const isMe = player ? player.id === myUserId : false;
            const lastSeenMs = player?.last_seen ? new Date(player.last_seen).getTime() : 0;
            const isConnected = Boolean(player && serverNowMs - lastSeenMs <= 45_000);

            return (
              <li
                key={seat}
                className={`flex items-center justify-between gap-3 rounded-sm border px-4 py-3 transition-colors ${
                  player
                    ? 'border-[#C9993A]/45 bg-[#291C13]/90'
                    : 'border-dashed border-[#C9993A]/25 bg-[#160E09]/60'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <PlayerAvatar
                    seat={seat}
                    occupied={Boolean(player)}
                    size="sm"
                    playerName={player?.name}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-lora text-base font-medium truncate ${
                          player ? 'text-[#EBD9B4]' : 'italic text-[#D9B98A]/50'
                        }`}
                      >
                        {player ? player.name : 'Waiting for advisor...'}
                      </span>
                      {isMe && (
                        <span className="font-cinzel text-[11px] font-semibold tracking-wider text-[#D9B98A]">
                          (You)
                        </span>
                      )}
                      {isPlayerHost && (
                        <span className="rounded-sm border border-[#C9993A]/75 bg-[#C9993A]/20 px-1.5 py-0.5 font-cinzel text-[10px] font-bold tracking-[0.1em] text-[#EBD9B4] uppercase">
                          HOST
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {player && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.65)]' : 'bg-stone-500'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="font-lora text-xs text-[#D9B98A]">
                      {isConnected ? 'Online' : 'Away'}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-sm border border-[#E8883A]/60 bg-[#5C2418]/65 px-3.5 py-2.5 font-lora text-sm text-[#FDE8D7]"
          >
            {error}
          </p>
        )}

        {/* Lobby Actions */}
        <div className="mt-6 flex flex-col gap-3">
          {isHost ? (
            <>
              <motion.button
                type="button"
                disabled={!canStart || starting}
                onClick={handleStart}
                whileHover={canStart ? { scale: 1.015 } : undefined}
                whileTap={canStart ? { scale: 0.985 } : undefined}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="cursor-pointer flex min-h-[48px] w-full items-center justify-center gap-2 rounded-sm border border-[#EBD9B4]/65 bg-gradient-to-b from-[#DFB357] via-[#C9993A] to-[#A67824] px-6 py-3 font-cinzel text-base font-bold tracking-[0.12em] text-[#1E140D] shadow-[0_6px_18px_rgba(0,0,0,0.45)] hover:from-[#EAC068] hover:via-[#D5A544] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EBD9B4]"
              >
                {starting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                    <span>Start</span>
                  </>
                )}
              </motion.button>

              {players.length < 2 && (
                <p className="text-center font-lora text-xs text-[#D9B98A]">
                  At least 2 players are needed to begin.
                </p>
              )}
            </>
          ) : (
            <p className="rounded-sm border border-[#C9993A]/30 bg-[#160E09]/70 px-4 py-3 text-center font-lora text-sm italic text-[#D9B98A]">
              Waiting for the host to start the council...
            </p>
          )}

          <button
            type="button"
            disabled={leaving || starting}
            onClick={handleLeave}
            className="cursor-pointer inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-sm border border-[#C9993A]/40 bg-transparent px-4 py-2.5 font-cinzel text-sm font-semibold tracking-[0.1em] text-[#D9B98A] transition-colors hover:border-[#E8883A]/70 hover:bg-[#3A2116]/60 hover:text-[#EBD9B4] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9993A]"
          >
            {leaving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden="true" />
            )}
            <span>Leave room</span>
          </button>
        </div>
      </section>
    </motion.main>
  );
}
