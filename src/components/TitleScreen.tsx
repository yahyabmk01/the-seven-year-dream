import { motion } from 'motion/react';
import { startAmbientMusic } from '../lib/ambientMusic';
import { playStoneSeal } from '../lib/soundFx';

interface TitleScreenProps {
  onStart: () => void;
}

export function TitleScreen({ onStart }: TitleScreenProps) {
  const handleStart = () => {
    playStoneSeal();
    startAmbientMusic(1500);
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    onStart();
  };

  return (
    <motion.main
      key="title-screen"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 flex min-h-dvh w-full flex-col items-center justify-between px-6 py-14 sm:px-10 sm:py-16"
    >
      {/* Top & Center Title Block */}
      <div className="flex flex-1 flex-col items-center justify-center text-center max-w-3xl mx-auto">
        <h1
          className="font-cinzel font-bold uppercase tracking-[0.12em] text-[#EBD9B4] leading-[1.12] [text-wrap:balance]"
          style={{
            fontSize: 'clamp(2.1rem, 5.4vw, 4.25rem)',
            textShadow:
              '0 2px 18px rgba(30, 20, 13, 0.85), 0 0 36px rgba(232, 136, 58, 0.42), 0 0 64px rgba(201, 153, 58, 0.25)',
          }}
        >
          THE SEVEN-YEAR DREAM
        </h1>

        {/* Geometric Diamond Rule Divider */}
        <div
          className="my-5 sm:my-6 flex items-center justify-center gap-3 w-full max-w-xs"
          aria-hidden="true"
        >
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C9993A]/85" />
          <span className="h-2.5 w-2.5 rotate-45 bg-[#C9993A] shadow-[0_0_12px_rgba(232,136,58,0.65)]" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C9993A]/85" />
        </div>

        {/* One-Sentence Premise */}
        <p
          className="font-lora italic text-[#EBD9B4] text-base sm:text-xl leading-relaxed max-w-xl [text-wrap:balance]"
          style={{
            textShadow: '0 2px 12px rgba(30, 20, 13, 0.92)',
          }}
        >
          Seven years of abundance, seven years of famine — every counsel you offer the crown decides a nation&apos;s survival.
        </p>
      </div>

      {/* Primary Action Area */}
      <div className="pb-4 sm:pb-8 flex flex-col items-center">
        <div className="flex items-center gap-3 sm:gap-4">
          <span
            className="hidden sm:block h-2.5 w-2.5 rotate-45 border border-[#C9993A] bg-[#1E140D]/80"
            aria-hidden="true"
          />

          <div className="relative">
            {/* Gentle Pulse Halo */}
            <span
              className="animate-cta-glow pointer-events-none absolute -inset-1.5 rounded-sm bg-gradient-to-r from-[#C9993A]/55 via-[#E8883A]/60 to-[#C9993A]/55 blur-md"
              aria-hidden="true"
            />

            <motion.button
              type="button"
              onClick={handleStart}
              whileHover={{ scale: 1.035 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="relative cursor-pointer min-h-[52px] min-w-[200px] sm:min-w-[240px] px-10 py-3.5 rounded-sm border border-[#EBD9B4]/75 bg-gradient-to-b from-[#E3B85C] via-[#C9993A] to-[#A67824] font-cinzel text-lg sm:text-xl font-bold tracking-[0.18em] text-[#1E140D] shadow-[0_10px_28px_rgba(30,20,13,0.75),inset_0_1px_0_rgba(255,245,214,0.55)] hover:from-[#ECC56E] hover:via-[#D6A645] hover:to-[#B4842A] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EBD9B4] whitespace-nowrap shrink-0"
            >
              START
            </motion.button>
          </div>

          <span
            className="hidden sm:block h-2.5 w-2.5 rotate-45 border border-[#C9993A] bg-[#1E140D]/80"
            aria-hidden="true"
          />
        </div>
      </div>
    </motion.main>
  );
}
