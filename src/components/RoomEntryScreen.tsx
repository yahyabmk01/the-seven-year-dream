import { type FormEvent, useState } from 'react';
import { ArrowLeft, DoorOpen, Loader2, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { playStoneTap } from '../lib/soundFx';

type EntryMode = 'menu' | 'create' | 'join';

interface RoomEntryScreenProps {
  onBackToTitle: () => void;
  onCreateRoom: (playerName: string) => Promise<void>;
  onJoinRoom: (code: string, playerName: string) => Promise<void>;
  initialName?: string;
}

export function RoomEntryScreen({
  onBackToTitle,
  onCreateRoom,
  onJoinRoom,
  initialName = '',
}: RoomEntryScreenProps) {
  const [mode, setMode] = useState<EntryMode>('menu');
  const [name, setName] = useState(initialName);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = (nextMode: EntryMode) => {
    playStoneTap();
    setError(null);
    setMode(nextMode);
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    playStoneTap();
    setError(null);
    setSubmitting(true);
    try {
      await onCreateRoom(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create room.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    playStoneTap();
    setError(null);
    setSubmitting(true);
    try {
      await onJoinRoom(code, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join room.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.main
      key="room-entry"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 flex min-h-dvh w-full items-center justify-center px-4 py-10 sm:px-6"
    >
      <section
        aria-label="Room selection"
        className="w-full max-w-md rounded-sm border border-[#C9993A]/60 bg-[#1E140D]/92 p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.8)] backdrop-blur-sm"
      >
        <div className="text-center">
          <h2 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-[0.08em] text-[#EBD9B4]">
            {mode === 'menu'
              ? 'The Council Chamber'
              : mode === 'create'
                ? 'Create Room'
                : 'Join Room'}
          </h2>
          <p className="mt-2 font-lora text-sm sm:text-base text-[#D9B98A]">
            {mode === 'menu'
              ? 'Gather 2 to 3 advisors to counsel the crown together.'
              : mode === 'create'
                ? 'Enter your name to open a new 4-letter chamber.'
                : 'Enter your name and the 4-letter room code.'}
          </p>
        </div>

        <div className="my-5 flex items-center justify-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-[#C9993A]/35" />
          <span className="h-2 w-2 rotate-45 bg-[#C9993A]/80" />
          <span className="h-px flex-1 bg-[#C9993A]/35" />
        </div>

        {mode === 'menu' && (
          <div className="flex flex-col gap-3.5">
            <motion.button
              type="button"
              onClick={() => switchMode('create')}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="cursor-pointer flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-sm border border-[#EBD9B4]/65 bg-gradient-to-b from-[#DFB357] via-[#C9993A] to-[#A67824] px-6 py-3 font-cinzel text-base font-bold tracking-[0.1em] text-[#1E140D] shadow-[0_6px_18px_rgba(0,0,0,0.45)] hover:from-[#EAC068] hover:via-[#D5A544] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EBD9B4] whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Create Room</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => switchMode('join')}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="cursor-pointer flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-sm border border-[#C9993A]/70 bg-[#1B2A41]/85 px-6 py-3 font-cinzel text-base font-semibold tracking-[0.1em] text-[#EBD9B4] hover:border-[#EBD9B4]/80 hover:bg-[#233654] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9993A] whitespace-nowrap shrink-0"
            >
              <DoorOpen className="h-4 w-4 shrink-0 text-[#C9993A]" aria-hidden="true" />
              <span>Join Room</span>
            </motion.button>

            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  playStoneTap();
                  onBackToTitle();
                }}
                className="cursor-pointer inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 font-cinzel text-sm font-medium tracking-[0.1em] text-[#D9B98A] transition-colors duration-150 hover:text-[#EBD9B4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9993A] whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Back</span>
              </button>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="create-player-name"
                className="block font-cinzel text-xs font-semibold tracking-[0.1em] text-[#D9B98A] mb-1.5"
              >
                Your Name
              </label>
              <input
                id="create-player-name"
                type="text"
                maxLength={24}
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Yusuf"
                className="w-full min-h-[46px] rounded-sm border border-[#C9993A]/55 bg-[#130C08] px-3.5 py-2.5 font-lora text-base text-[#EBD9B4] placeholder:text-[#D9B98A]/45 focus:border-[#EBD9B4] focus:outline-none"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-sm border border-[#E8883A]/60 bg-[#5C2418]/65 px-3.5 py-2.5 font-lora text-sm text-[#FDE8D7]"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="cursor-pointer flex min-h-[48px] w-full items-center justify-center gap-2 rounded-sm border border-[#EBD9B4]/65 bg-gradient-to-b from-[#DFB357] via-[#C9993A] to-[#A67824] px-6 py-3 font-cinzel text-base font-bold tracking-[0.1em] text-[#1E140D] shadow-[0_6px_18px_rgba(0,0,0,0.45)] hover:from-[#EAC068] hover:via-[#D5A544] disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EBD9B4]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Opening Room...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>Create Room</span>
                </>
              )}
            </button>

            <div className="flex justify-center">
              <button
                type="button"
                disabled={submitting}
                onClick={() => switchMode('menu')}
                className="cursor-pointer inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 font-cinzel text-sm font-medium tracking-[0.1em] text-[#D9B98A] hover:text-[#EBD9B4] disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Back</span>
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoinSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="join-player-name"
                className="block font-cinzel text-xs font-semibold tracking-[0.1em] text-[#D9B98A] mb-1.5"
              >
                Your Name
              </label>
              <input
                id="join-player-name"
                type="text"
                maxLength={24}
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Layla"
                className="w-full min-h-[46px] rounded-sm border border-[#C9993A]/55 bg-[#130C08] px-3.5 py-2.5 font-lora text-base text-[#EBD9B4] placeholder:text-[#D9B98A]/45 focus:border-[#EBD9B4] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="join-room-code"
                className="block font-cinzel text-xs font-semibold tracking-[0.1em] text-[#D9B98A] mb-1.5"
              >
                4-Letter Room Code
              </label>
              <input
                id="join-room-code"
                type="text"
                maxLength={4}
                required
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))
                }
                placeholder="ABCD"
                className="w-full min-h-[50px] rounded-sm border border-[#C9993A]/55 bg-[#130C08] px-4 py-2.5 text-center font-cinzel text-2xl font-bold tracking-[0.35em] uppercase text-[#EBD9B4] placeholder:text-[#D9B98A]/30 focus:border-[#EBD9B4] focus:outline-none"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-sm border border-[#E8883A]/60 bg-[#5C2418]/65 px-3.5 py-2.5 font-lora text-sm text-[#FDE8D7]"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !name.trim() || code.trim().length !== 4}
              className="cursor-pointer flex min-h-[48px] w-full items-center justify-center gap-2 rounded-sm border border-[#EBD9B4]/65 bg-gradient-to-b from-[#DFB357] via-[#C9993A] to-[#A67824] px-6 py-3 font-cinzel text-base font-bold tracking-[0.1em] text-[#1E140D] shadow-[0_6px_18px_rgba(0,0,0,0.45)] hover:from-[#EAC068] hover:via-[#D5A544] disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EBD9B4]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <DoorOpen className="h-4 w-4" aria-hidden="true" />
                  <span>Join Room</span>
                </>
              )}
            </button>

            <div className="flex justify-center">
              <button
                type="button"
                disabled={submitting}
                onClick={() => switchMode('menu')}
                className="cursor-pointer inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 font-cinzel text-sm font-medium tracking-[0.1em] text-[#D9B98A] hover:text-[#EBD9B4] disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Back</span>
              </button>
            </div>
          </form>
        )}
      </section>
    </motion.main>
  );
}
