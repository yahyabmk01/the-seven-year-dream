import { useState } from 'react';
import { Check } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { playChoiceSelect } from '../lib/soundFx';

export interface ChoiceCardProps {
  choiceId?: string;
  title: string;
  description: string;
  bgImageUrl?: string;
  selected?: boolean;
  disabled?: boolean;
  submitting?: boolean;
  onSelect?: () => void;
}

export function ChoiceCard({
  choiceId,
  title,
  description,
  bgImageUrl,
  selected = false,
  disabled = false,
  submitting = false,
  onSelect,
}: ChoiceCardProps) {
  const prefersReduced = useReducedMotion();
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(bgImageUrl) && !imageFailed;

  const handleSelect = () => {
    if (disabled || submitting) return;
    playChoiceSelect();
    onSelect?.();
  };

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={handleSelect}
      whileHover={!disabled && !prefersReduced ? { y: -4, scale: 1.015 } : undefined}
      whileTap={!disabled && !prefersReduced ? { scale: 0.985 } : undefined}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      aria-pressed={selected}
      className={`group relative flex min-h-[168px] md:min-h-[250px] w-full cursor-pointer flex-col justify-between overflow-hidden rounded-sm border text-left transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EBD9B4] disabled:cursor-not-allowed disabled:opacity-60 ${
        selected
          ? 'border-[#EBD9B4] bg-[#1A110B] shadow-[0_14px_34px_rgba(201,153,58,0.32)] ring-1 ring-[#C9993A]'
          : 'border-[#C9993A]/40 bg-gradient-to-br from-[#120B07] via-[#1E140D] to-[#0F0905] shadow-[0_14px_32px_rgba(0,0,0,0.6)] hover:border-[#C9993A]/90 hover:shadow-[0_18px_38px_rgba(0,0,0,0.75)]'
      }`}
    >
      {/* Background Image Slot (visible artwork with light ambient scrim) */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {showImage ? (
          <img
            src={bgImageUrl}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className={`h-full w-full object-cover transition-all duration-500 ${
              selected
                ? 'opacity-90 scale-[1.03]'
                : 'opacity-75 group-hover:opacity-95 group-hover:scale-[1.04]'
            }`}
          />
        ) : (
          <div
            className={`h-full w-full transition-opacity duration-500 ${
              selected ? 'opacity-85' : 'opacity-65 group-hover:opacity-90'
            }`}
            style={{
              background:
                'radial-gradient(circle at 75% 22%, rgba(201, 153, 58, 0.28) 0%, rgba(232, 136, 58, 0.12) 38%, rgba(27, 42, 65, 0.25) 100%)',
            }}
          />
        )}

        {/* Minimal scrim: transparent at the top, soft tint at the bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E0805]/85 via-[#120B07]/40 to-black/15 transition-opacity duration-300 group-hover:from-[#0E0805]/75 group-hover:via-[#120B07]/30" />

        {/* Subtle diagonal sheen sweep on hover */}
        {!prefersReduced && (
          <div className="absolute inset-0 -skew-x-12 translate-x-full bg-gradient-to-r from-transparent via-[#EBD9B4]/15 to-transparent transition-transform duration-1000 group-hover:translate-x-[-200%]" />
        )}
      </div>

      {/* Subtle Corner Accent Highlights on Hover */}
      <div
        className="pointer-events-none absolute top-0 left-0 h-14 w-14 rounded-br-2xl bg-gradient-to-br from-[#C9993A]/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-14 w-14 rounded-tl-2xl bg-gradient-to-tl from-[#C9993A]/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />

      {/* Foreground Card Content */}
      <div className="relative z-10 flex h-full w-full flex-col justify-between p-5 sm:p-6">
        {/* Top Row: Choice Letter + Selected Check */}
        <div className="flex items-center justify-between gap-2">
          {choiceId ? (
            <span
              className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-sm border px-2 font-cinzel text-sm font-bold tracking-wider transition-colors ${
                selected
                  ? 'border-[#EBD9B4] bg-[#C9993A] text-[#1E140D]'
                  : 'border-[#C9993A]/60 bg-[#1E140D]/85 text-[#EBD9B4] group-hover:border-[#EBD9B4]'
              }`}
            >
              {choiceId}
            </span>
          ) : (
            <span />
          )}

          {selected ? (
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#EBD9B4]/75 bg-[#C9993A] text-[#1E140D] shadow-md"
              aria-label="Selected choice"
            >
              <Check className="h-4 w-4 stroke-[3]" aria-hidden="true" />
            </span>
          ) : submitting ? (
            <span className="font-cinzel text-xs tracking-wider text-[#D9B98A]">...</span>
          ) : null}
        </div>

        {/* Title, Divider, and Description */}
        <div className="mt-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
          <h3 className="font-cinzel text-lg sm:text-xl font-bold tracking-[0.04em] text-[#EBD9B4] transition-colors group-hover:text-white">
            {title}
          </h3>

          <div
            className={`my-2.5 h-0.5 rounded-full bg-gradient-to-r from-[#C9993A] via-[#EBD9B4]/80 to-transparent transition-all duration-500 ${
              selected ? 'w-1/2' : 'w-1/3 group-hover:w-1/2'
            }`}
            aria-hidden="true"
          />

          <p className="font-lora text-[15px] sm:text-base leading-relaxed text-[#F2E5C7] transition-colors group-hover:text-white">
            {description}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
