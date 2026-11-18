import { motion, useReducedMotion } from 'motion/react';
import type { YearCard } from '../types/game';

interface YearTitleCardProps {
  yearCard: YearCard;
  introRemainingMs: number;
  isFirstScene: boolean;
}

export function YearTitleCard({
  yearCard,
  introRemainingMs,
  isFirstScene,
}: YearTitleCardProps) {
  const prefersReduced = useReducedMotion();
  const mood = yearCard.mood || 'abundance';

  // On subsequent scenes without an intro video, an initial blackout beat is not needed.
  // The first scene's 20s intro video fades to black before handing over to this card.
  const isInitialBlackout = false;

  // Fade out smoothly over the final ~1s before voting opens
  const isFadingOut = introRemainingMs <= 950;

  return (
    <motion.div
      key={`year-card-${yearCard.title}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReduced ? 0.25 : 0.9, ease: [0.16, 1, 0.3, 1] }}
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#060403] px-6 select-none"
    >
      {/* Mood-Matched Atmospheric Glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: isInitialBlackout ? 0 : isFadingOut ? 0.2 : 1,
          background:
            mood === 'drought'
              ? 'radial-gradient(circle at 50% 50%, rgba(168, 120, 74, 0.26) 0%, rgba(92, 86, 80, 0.2) 38%, rgba(6, 4, 3, 0.98) 76%)'
              : 'radial-gradient(circle at 50% 50%, rgba(201, 153, 58, 0.3) 0%, rgba(232, 136, 58, 0.14) 38%, rgba(6, 4, 3, 0.98) 76%)',
        }}
        aria-hidden="true"
      />

      {/* Subtle Low-Poly Horizon Accent for Mood */}
      {!isInitialBlackout && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-44 opacity-30 transition-opacity duration-1000"
          style={{
            opacity: isFadingOut ? 0 : 0.28,
            background:
              mood === 'drought'
                ? 'linear-gradient(to top, rgba(110, 102, 92, 0.28), transparent)'
                : 'linear-gradient(to top, rgba(201, 153, 58, 0.24), transparent)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Year Title Card Copy */}
      {!isInitialBlackout && (
        <motion.div
          initial={{ opacity: 0, y: prefersReduced ? 0 : 10 }}
          animate={{
            opacity: isFadingOut ? 0 : 1,
            y: prefersReduced ? 0 : isFadingOut ? -6 : 0,
          }}
          transition={{
            duration: prefersReduced ? 0.25 : 0.95,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative z-10 max-w-2xl text-center"
        >
          <h2
            className="font-cinzel font-bold uppercase tracking-[0.16em] text-[#EBD9B4] leading-tight [text-wrap:balance]"
            style={{
              fontSize: 'clamp(1.75rem, 4.5vw, 3.25rem)',
              textShadow:
                mood === 'drought'
                  ? '0 0 32px rgba(168, 120, 74, 0.4)'
                  : '0 0 36px rgba(201, 153, 58, 0.5)',
            }}
          >
            {yearCard.title}
          </h2>

          <div
            className="mx-auto my-5 flex w-48 items-center justify-center gap-3"
            aria-hidden="true"
          >
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C9993A]/85" />
            <span className="h-2 w-2 rotate-45 bg-[#C9993A]" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C9993A]/85" />
          </div>

          <p className="font-lora italic text-base sm:text-xl text-[#D9B98A] leading-relaxed [text-wrap:balance]">
            {yearCard.subtitle}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
