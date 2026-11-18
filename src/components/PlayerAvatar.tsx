import { Check } from 'lucide-react';

interface PlayerAvatarProps {
  seat: 1 | 2 | 3;
  occupied?: boolean;
  hasVoted?: boolean;
  revealedChoice?: string | null;
  highlightWinner?: boolean;
  size?: 'sm' | 'md' | 'lg';
  playerName?: string;
}

const SEAT_COLORS: Record<1 | 2 | 3, { bg: string; border: string; ring: string }> = {
  1: {
    bg: 'bg-[#1B2A41]',
    border: 'border-[#C9993A]',
    ring: 'ring-[#C9993A]',
  },
  2: {
    bg: 'bg-[#1E4D3B]',
    border: 'border-[#C9993A]',
    ring: 'ring-[#C9993A]',
  },
  3: {
    bg: 'bg-[#3B234A]',
    border: 'border-[#C9993A]',
    ring: 'ring-[#C9993A]',
  },
};

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', { circle: string; text: string; badge: string }> = {
  sm: {
    circle: 'h-10 w-10',
    text: 'text-xs',
    badge: 'min-w-[20px] h-5 px-1.5 text-[11px]',
  },
  md: {
    circle: 'h-12 w-12',
    text: 'text-sm',
    badge: 'min-w-[22px] h-5 px-1.5 text-xs',
  },
  lg: {
    circle: 'h-16 w-16 sm:h-20 sm:w-20',
    text: 'text-lg sm:text-xl',
    badge: 'min-w-[26px] h-6 px-2 text-xs sm:text-sm',
  },
};

export function PlayerAvatar({
  seat,
  occupied = true,
  hasVoted = false,
  revealedChoice = null,
  highlightWinner = false,
  size = 'md',
  playerName,
}: PlayerAvatarProps) {
  const palette = SEAT_COLORS[seat];
  const sizing = SIZE_CLASSES[size];

  return (
    <div
      className="relative inline-flex flex-col items-center shrink-0"
      aria-label={playerName ? `Player ${seat}: ${playerName}` : `Player ${seat}`}
      title={playerName || `P${seat}`}
    >
      <div
        className={`relative flex items-center justify-center rounded-full border-2 font-cinzel font-bold tracking-wider transition-all duration-200 ${sizing.circle} ${sizing.text} ${
          occupied
            ? `${palette.bg} ${palette.border} text-[#EBD9B4] shadow-[0_4px_14px_rgba(0,0,0,0.55)]`
            : 'border-dashed border-[#C9993A]/35 bg-[#1E140D]/60 text-[#D9B98A]/45'
        } ${
          highlightWinner
            ? `ring-2 ${palette.ring} ring-offset-2 ring-offset-[#1E140D] shadow-[0_0_22px_rgba(201,153,58,0.75)]`
            : ''
        }`}
      >
        <span>{`P${seat}`}</span>
      </div>

      {/* Bottom choice / voted badge */}
      {(revealedChoice || hasVoted) && (
        <span
          className={`-mt-2.5 z-10 inline-flex items-center justify-center rounded-full border font-cinzel font-bold leading-none shadow-md ${sizing.badge} ${
            revealedChoice
              ? highlightWinner
                ? 'border-[#EBD9B4] bg-[#C9993A] text-[#1E140D]'
                : 'border-[#C9993A]/80 bg-[#EBD9B4] text-[#1E140D]'
              : 'border-[#EBD9B4]/75 bg-[#2A6041] text-[#EBD9B4]'
          }`}
        >
          {revealedChoice ? (
            revealedChoice
          ) : (
            <Check className="h-3 w-3 stroke-[3]" aria-label="Voted" />
          )}
        </span>
      )}
    </div>
  );
}
