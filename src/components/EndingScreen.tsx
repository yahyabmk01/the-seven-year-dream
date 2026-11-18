import { useState } from 'react';
import { Loader2, LogOut, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { playStoneSeal, playStoneTap } from '../lib/soundFx';
import type { EndingInfo, RoomRow } from '../types/game';

interface EndingScreenProps {
  room: RoomRow;
  ending: EndingInfo;
  myUserId: string;
  onPlayAgain: () => Promise<void>;
  onLeaveRoom: () => Promise<void>;
}

export function EndingScreen({
  room,
  ending,
  myUserId,
  onPlayAgain,
  onLeaveRoom,
}: EndingScreenProps) {
  const [resetting, setResetting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHost = room.host_id === myUserId;
  const history = Array.isArray(room.history) ? room.history : [];

  const handlePlayAgain = async () => {
    if (!isHost || resetting) return;
    playStoneSeal();
    setError(null);
    setResetting(true);
    try {
      await onPlayAgain();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset room.');
      setResetting(false);
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

  const meters = [
    {
      label: 'Grain Reserves',
      value: Math.max(0, Math.min(100, room.grain ?? 0)),
      barClass: 'bg-gradient-to-r from-[#C9993A] to-[#E5B85C]',
    },
    {
      label: 'Public Panic',
      value: Math.max(0, Math.min(100, room.panic ?? 0)),
      barClass: 'bg-gradient-to-r from-[#A63A2B] to-[#E8883A]',
    },
    {
      label: 'Royal Trust',
      value: Math.max(0, Math.min(100, room.trust ?? 0)),
      barClass: 'bg-gradient-to-r from-[#1B2A41] to-[#3A689E]',
    },
  ];

  return (
    <motion.main
      key="ending-screen"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 flex min-h-dvh w-full items-center justify-center px-4 py-10 sm:px-6"
    >
      <section
        aria-label="Ending summary"
        className="w-full max-w-xl rounded-sm border-2 border-[#C9993A]/75 bg-[#EBD9B4] p-6 sm:p-9 text-[#1E140D] shadow-[0_24px_70px_rgba(0,0,0,0.82)]"
      >
        {/* Ending Banner */}
        <div className="rounded-sm border border-[#C9993A] bg-[#1E140D] px-4 py-3 text-center">
          <p className="font-cinzel text-xs font-semibold tracking-[0.18em] text-[#C9993A] uppercase">
            Ending {ending.number} of 4 Unlocked
          </p>
          <h2 className="mt-1 font-cinzel text-xl sm:text-2xl font-bold tracking-[0.06em] text-[#EBD9B4]">
            {ending.title}
          </h2>
        </div>

        {/* Outcome Narrative */}
        <p className="mt-5 font-lora text-base leading-relaxed text-[#1E140D]">
          {ending.outcome}
        </p>

        {/* Professor Mode Academic Breakdown */}
        <div className="mt-4 rounded-sm border border-[#5C3A21]/30 bg-[#DFC99D]/55 p-4 sm:p-5 space-y-2.5">
          <p className="font-cinzel text-xs font-bold tracking-[0.1em] text-[#4A2E18] uppercase">
            Professor Mode Notes
          </p>
          {ending.coreConcept && (
            <p className="font-cinzel text-xs sm:text-sm font-semibold text-[#1E140D]">
              Core Concept: {ending.coreConcept}
            </p>
          )}
          <p className="font-lora text-sm sm:text-[15px] leading-relaxed text-[#2B1B11]">
            {ending.academicExplanation}
          </p>
          <p className="font-lora text-xs italic text-[#5C3A21]">{ending.sourceNote}</p>
        </div>

        {/* Three Meter Bars */}
        <div className="mt-6 space-y-3">
          {meters.map((m) => (
            <div key={m.label}>
              <div className="flex items-center justify-between font-lora text-sm font-semibold text-[#1E140D]">
                <span>{m.label}</span>
                <span className="font-cinzel tabular-nums text-xs text-[#4A2E18]">
                  {m.value} / 100
                </span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full border border-[#5C3A21]/40 bg-[#2B1B11]/85">
                <div
                  className={`h-full transition-all duration-500 ${m.barClass}`}
                  style={{ width: `${m.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="my-5 flex items-center justify-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-[#5C3A21]/30" />
          <span className="h-2 w-2 rotate-45 bg-[#C9993A]" />
          <span className="h-px flex-1 bg-[#5C3A21]/30" />
        </div>

        {/* Key Choices from History */}
        <div>
          <h3 className="font-cinzel text-sm font-bold tracking-[0.08em] text-[#4A2E18] uppercase text-center">
            Key Choices
          </h3>
          {history.length === 0 ? (
            <p className="mt-2 text-center font-lora text-sm italic text-[#5C3A21]">
              No choices recorded.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {history.map((entry, idx) => (
                <li
                  key={`${entry.scene}-${idx}`}
                  className="flex items-start gap-2.5 font-lora text-sm text-[#1E140D]"
                >
                  <span className="mt-1.5 h-2 w-2 rotate-45 bg-[#C9993A] shrink-0" aria-hidden="true" />
                  <span>
                    <strong className="font-cinzel text-xs mr-1.5 text-[#4A2E18]">
                      {entry.choiceId}.
                    </strong>
                    {entry.choiceText}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-sm border border-[#A63A2B] bg-[#5C2418] px-3.5 py-2.5 font-lora text-sm text-[#FDE8D7]"
          >
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          {isHost ? (
            <button
              type="button"
              disabled={resetting || leaving}
              onClick={handlePlayAgain}
              className="cursor-pointer flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-sm border border-[#1E140D]/40 bg-gradient-to-b from-[#DFB357] via-[#C9993A] to-[#A67824] px-5 py-3 font-cinzel text-sm sm:text-base font-bold tracking-[0.08em] text-[#1E140D] shadow-md hover:from-[#EAC068] hover:via-[#D5A544] disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E140D]"
            >
              {resetting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>Play Again</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-sm border border-[#5C3A21]/30 bg-[#DFC99D]/55 px-4 py-3 text-center font-lora text-xs sm:text-sm italic text-[#4A2E18]">
              Waiting for host to play again...
            </div>
          )}

          <button
            type="button"
            disabled={leaving || resetting}
            onClick={handleLeave}
            className="cursor-pointer inline-flex min-h-[48px] items-center justify-center gap-2 rounded-sm border border-[#5C3A21]/55 bg-[#2B1B11] px-6 py-3 font-cinzel text-sm font-semibold tracking-[0.08em] text-[#EBD9B4] hover:bg-[#3A2517] disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E140D]"
          >
            {leaving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden="true" />
            )}
            <span>Leave</span>
          </button>
        </div>
      </section>
    </motion.main>
  );
}
