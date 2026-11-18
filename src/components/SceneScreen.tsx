import { Lock } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { getSceneById } from '../data/storyData';
import type { PlayerRow, RoomRow, StoryScene, VoteRow } from '../types/game';
import { ChoiceCard } from './ChoiceCard';
import { IntroVideoOverlay } from './IntroVideoOverlay';
import { PlayerAvatar } from './PlayerAvatar';
import { YearTitleCard } from './YearTitleCard';

interface SceneScreenProps {
  room: RoomRow;
  scene: StoryScene;
  players: PlayerRow[];
  votes: VoteRow[];
  myUserId: string;
  serverNowMs: number;
  lockInRemainingMs: number | null;
  skipTitleCard: boolean;
  submittingChoice: string | null;
  onVote: (choiceId: string) => Promise<void>;
}

const SEATS: (1 | 2 | 3)[] = [1, 2, 3];

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SceneScreen({
  room,
  scene,
  players,
  votes,
  myUserId,
  serverNowMs,
  lockInRemainingMs,
  skipTitleCard,
  submittingChoice,
  onVote,
}: SceneScreenProps) {
  const prefersReduced = useReducedMotion();

  const votingOpensMs = room.voting_opens_at ? new Date(room.voting_opens_at).getTime() : 0;
  const sceneEndsMs = room.scene_ends_at ? new Date(room.scene_ends_at).getTime() : serverNowMs;
  const totalDurationSec = room.scene_duration || scene.duration || 120;
  const totalDurationMs = totalDurationSec * 1000;

  const introRemainingMs = room.voting_opens_at ? Math.max(0, votingOpensMs - serverNowMs) : 0;
  const isBeforeVotingOpens = Boolean(room.voting_opens_at && serverNowMs < votingOpensMs);

  const history = Array.isArray(room.history) ? room.history : [];
  const lastEntry = history.length > 0 ? history[history.length - 1] : null;
  const isFirstScene = history.length === 0;
  const hasYearCard = Boolean(scene.yearCard);

  // Determine active cinematic overlay phase strictly from server time vs voting_opens_at:
  // - First scene (25s total intro from start_game):
  //     - introRemainingMs > 5000: 20s unskippable Intro Video (/INTRO_2K_upscaled.webm)
  //     - introRemainingMs <= 5000: 5s Year 1 Title Card ("The Golden Harvest")
  // - Subsequent scene WITH yearCard (9s intro): Result Card while > 5000ms remain, then Year Title Card
  // - Subsequent scene WITHOUT yearCard (4s intro): Result Card while > 0ms remain
  let activeOverlay: 'none' | 'intro-video' | 'result' | 'year' = 'none';
  if (isBeforeVotingOpens) {
    if (isFirstScene) {
      if (introRemainingMs > 5000) {
        activeOverlay = 'intro-video';
      } else if (hasYearCard && !skipTitleCard) {
        activeOverlay = 'year';
      }
    } else if (hasYearCard) {
      if (introRemainingMs > 5000 && lastEntry) {
        activeOverlay = 'result';
      } else if (!skipTitleCard) {
        activeOverlay = 'year';
      }
    } else if (lastEntry) {
      activeOverlay = 'result';
    }
  }

  const remainingMs = Math.max(0, sceneEndsMs - serverNowMs);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const progressPct = Math.max(0, Math.min(100, (remainingMs / totalDurationMs) * 100));
  const isUrgent = !isBeforeVotingOpens && remainingSeconds <= 15 && remainingMs > 0;
  const timeUp = !isBeforeVotingOpens && Boolean(room.scene_ends_at) && remainingMs <= 0;

  const sceneVotes = votes.filter((v) => v.scene_id === scene.id);
  const myVote = sceneVotes.find((v) => v.player_id === myUserId)?.choice_id ?? null;

  const missingPlayers = players.filter(
    (p) => !sceneVotes.some((v) => v.player_id === p.id)
  );
  const allVoted = players.length > 0 && missingPlayers.length === 0;
  const revealPicks = !isBeforeVotingOpens && (allVoted || timeUp);

  // Voting stays disabled while server time < voting_opens_at or after scene timer hits 0,
  // but stays ENABLED during the 5s "Locking in..." countdown so players can change their vote!
  const votingDisabled = isBeforeVotingOpens || timeUp;
  const isLockingIn =
    !isBeforeVotingOpens && !timeUp && allVoted && lockInRemainingMs !== null;
  const lockInSec = lockInRemainingMs !== null ? Math.max(0, Math.ceil(lockInRemainingMs / 1000)) : 0;

  // Result Card breakdown summary
  const overlayVotesMap = lastEntry?.votes || {};
  const overlayTotalVoters = Object.keys(overlayVotesMap).length;
  const overlayWinnerCount = lastEntry
    ? Object.values(overlayVotesMap).filter((c) => c === lastEntry.choiceId).length
    : 0;

  let decidedByNote: string | null = null;
  if (lastEntry?.decidedBy === 'host') {
    decidedByNote = 'Tie, the host decided';
  } else if (lastEntry?.decidedBy === 'default') {
    decidedByNote =
      overlayTotalVoters === 0
        ? "No votes, the host's default applied"
        : "Tie with no host vote, the host's default applied";
  }

  const fallbackScene = lastEntry ? (getSceneById(lastEntry.scene) as StoryScene | null) : null;
  const resolvedResultText =
    lastEntry?.resultText ||
    fallbackScene?.choices.find((c) => c.id === lastEntry?.choiceId)?.resultText ||
    null;

  return (
    <motion.main
      key={`scene-${scene.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReduced ? 0.2 : 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 flex min-h-dvh w-full flex-col justify-between px-4 pt-4 pb-8 sm:px-8 sm:pt-7"
    >
      {/* Top Bar: Phase, P1/P2/P3 Avatars, and Thin Timer Bar */}
      <header className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[#C9993A]/55 bg-[#1E140D]/92 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
          {/* Phase + Countdown */}
          <div className="flex flex-col">
            <span className="font-cinzel text-sm sm:text-base font-bold tracking-[0.06em] text-[#EBD9B4]">
              {scene.phase}
            </span>
            <span
              className={`font-lora text-xs sm:text-sm tabular-nums ${
                isLockingIn
                  ? 'font-semibold text-[#E8883A]'
                  : isUrgent
                    ? 'font-semibold text-red-400'
                    : 'text-[#D9B98A]'
              }`}
            >
              {isBeforeVotingOpens
                ? `Voting opens in ${Math.max(1, Math.ceil(introRemainingMs / 1000))}s`
                : isLockingIn
                  ? `Locking in... ${lockInSec}s`
                  : timeUp
                    ? 'Resolving choice...'
                    : `Time remaining: ${formatCountdown(remainingMs)}`}
            </span>
          </div>

          {/* Rounded P1 / P2 / P3 Avatars */}
          <div className="flex items-start gap-2.5 sm:gap-3.5" aria-label="Advisor votes">
            {SEATS.map((seat) => {
              const player = players.find((p) => p.seat === seat);
              const playerVote = player
                ? sceneVotes.find((v) => v.player_id === player.id)?.choice_id ?? null
                : null;

              return (
                <PlayerAvatar
                  key={seat}
                  seat={seat}
                  occupied={Boolean(player)}
                  hasVoted={Boolean(playerVote) && !revealPicks && !isBeforeVotingOpens}
                  revealedChoice={revealPicks ? playerVote : null}
                  size="sm"
                  playerName={player?.name}
                />
              );
            })}
          </div>
        </div>

        {/* Thin Timer Bar (turns red and pulses in last 15 seconds) */}
        <div
          className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#1E140D]/90 border border-[#C9993A]/25"
          role="progressbar"
          aria-label="Scene time remaining"
          aria-valuemin={0}
          aria-valuemax={totalDurationSec}
          aria-valuenow={Math.min(totalDurationSec, remainingSeconds)}
        >
          <div
            className={`h-full transition-[width] duration-300 ease-linear ${
              isUrgent
                ? 'bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.85)]'
                : 'bg-gradient-to-r from-[#C9993A] to-[#E8883A]'
            }`}
            style={{ width: `${isBeforeVotingOpens ? 100 : progressPct}%` }}
          />
        </div>
      </header>

      {/* Center Narrative & Side-by-Side Choice Cards */}
      <div className="mx-auto my-6 flex w-full max-w-5xl flex-1 flex-col items-center justify-center">
        {activeOverlay === 'none' && (
          <motion.div
            key={`card-${scene.id}`}
            initial={{ opacity: 0, y: prefersReduced ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReduced ? 0.2 : 0.48,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex w-full flex-col items-center gap-6"
          >
            {/* Narrative Parchment Card (18px mobile, 20px laptop, 1.6 line-height, ~65ch max-width) */}
            <article className="w-full max-w-[65ch] rounded-sm border-2 border-[#C9993A]/80 bg-[#F2E5C7]/97 p-6 sm:p-8 text-[#1E140D] shadow-[0_24px_65px_rgba(0,0,0,0.82)]">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: prefersReduced ? 0.15 : 0.35 }}
                className="font-lora text-[18px] sm:text-[20px] leading-[1.6] text-[#1E140D]"
              >
                {scene.text}
              </motion.p>

              <p className="mt-5 text-center font-cinzel text-sm sm:text-base font-bold tracking-[0.08em] text-[#4A2E18]">
                What should you do?
              </p>
            </article>

            {/* Side-by-Side Choice Cards */}
            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3 sm:gap-5 items-stretch">
              {scene.choices.map((choice) => {
                const isSelected = myVote === choice.id;
                const isSubmittingThis = submittingChoice === choice.id;

                return (
                  <ChoiceCard
                    key={choice.id}
                    choiceId={choice.id}
                    title={choice.title || `Option ${choice.id}`}
                    description={choice.text}
                    bgImageUrl={choice.bgImageUrl}
                    selected={isSelected}
                    disabled={votingDisabled}
                    submitting={isSubmittingThis}
                    onSelect={() => onVote(choice.id)}
                  />
                );
              })}
            </div>

            {/* Waiting / Locking-In Status Footer */}
            <div className="text-center font-lora text-sm sm:text-base text-[#EBD9B4]">
              {isBeforeVotingOpens ? (
                <span>Voting opens in {Math.max(1, Math.ceil(introRemainingMs / 1000))}s...</span>
              ) : isLockingIn ? (
                <div className="inline-flex items-center justify-center gap-2 rounded-sm border border-[#C9993A] bg-[#1E140D]/95 px-4 py-2 font-cinzel text-xs sm:text-sm font-bold tracking-[0.08em] text-[#EBD9B4] tabular-nums shadow-lg">
                  <Lock className="h-3.5 w-3.5 text-[#E8883A]" aria-hidden="true" />
                  <span>Locking in... {lockInSec}s (you may still change your vote)</span>
                </div>
              ) : allVoted ? (
                <span className="font-semibold text-emerald-300">
                  All advisors have voted — resolving decision...
                </span>
              ) : missingPlayers.length > 0 ? (
                <span className="text-[#D9B98A]">
                  Waiting for {missingPlayers.map((p) => `P${p.seat}`).join(', ')}...
                </span>
              ) : (
                <span className="text-[#D9B98A]">Select a counsel to cast your vote.</span>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Cinematic Intro Video, Result Card & Year Title Card Sequence */}
      <AnimatePresence mode="wait">
        {activeOverlay === 'intro-video' && (
          <IntroVideoOverlay
            key="intro-video"
            introRemainingMs={introRemainingMs}
          />
        )}

        {activeOverlay === 'result' && lastEntry && (
          <motion.div
            key="result-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0.2 : 0.35 }}
            role="dialog"
            aria-modal="true"
            aria-label="Decision result"
            className="fixed inset-0 z-30 flex items-center justify-center bg-[#0B0704]/90 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: prefersReduced ? 1 : 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: prefersReduced ? 1 : 0.98, opacity: 0 }}
              transition={{ duration: prefersReduced ? 0.2 : 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-lg rounded-sm border-2 border-[#C9993A] bg-[#1E140D]/96 p-6 sm:p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.88)]"
            >
              <div className="inline-block rounded-sm border border-[#C9993A]/60 bg-[#2B1D14] px-4 py-1.5 font-cinzel text-xs sm:text-sm font-bold tracking-[0.08em] text-[#EBD9B4]">
                Choice {lastEntry.choiceId} Selected
              </div>

              <div className="mt-6 flex items-center justify-center gap-5 sm:gap-8">
                {SEATS.map((seat) => {
                  const player = players.find((p) => p.seat === seat);
                  const picked = overlayVotesMap[String(seat)] || null;
                  const matchedWinner = Boolean(picked && picked === lastEntry.choiceId);

                  return (
                    <div key={seat} className="flex flex-col items-center gap-1.5">
                      <PlayerAvatar
                        seat={seat}
                        occupied={Boolean(player)}
                        revealedChoice={picked}
                        highlightWinner={matchedWinner}
                        size="lg"
                        playerName={player?.name}
                      />
                      <span className="font-lora text-xs text-[#D9B98A] max-w-[76px] truncate">
                        {player ? player.name : `Seat ${seat}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-sm border border-[#C9993A]/50 bg-[#F2E5C7] px-4 py-3.5 text-[#1E140D]">
                <p className="font-lora text-base sm:text-lg font-semibold leading-snug">
                  Majority chose: {lastEntry.choiceText}
                </p>
                {resolvedResultText && (
                  <p className="mt-2 font-lora italic text-sm sm:text-base leading-relaxed text-[#3A2414]">
                    {resolvedResultText}
                  </p>
                )}
                {decidedByNote && (
                  <p className="mt-1.5 font-cinzel text-xs font-bold tracking-[0.06em] text-[#8B3A1E] uppercase">
                    {decidedByNote}
                  </p>
                )}
                <p className="mt-1.5 font-lora text-xs sm:text-sm text-[#5C3A21]">
                  {overlayTotalVoters > 0
                    ? `${overlayWinnerCount} out of ${overlayTotalVoters} voted for option ${lastEntry.choiceId}.`
                    : 'No votes were cast before time expired.'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeOverlay === 'year' && scene.yearCard && (
          <YearTitleCard
            key={`year-${scene.id}`}
            yearCard={scene.yearCard}
            introRemainingMs={introRemainingMs}
            isFirstScene={isFirstScene}
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}
