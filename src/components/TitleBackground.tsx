import { type CSSProperties, useEffect, useState } from 'react';

interface WheatStalk {
  id: number;
  x: number;
  height: number;
  lean: number;
  headScale: number;
  colorBody: string;
  colorHighlight: string;
}

interface DustMote {
  id: number;
  left: string;
  top: string;
  size: number;
  dx: string;
  dy: string;
  duration: string;
  delay: string;
  opacity: number;
}

// Deterministic pseudo-random helper for consistent, SSR-safe low-poly geometry
function seeded(index: number, offset = 0): number {
  const x = Math.sin(index * 127.1 + offset * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function buildWheatLayer(
  count: number,
  seedOffset: number,
  minH: number,
  maxH: number,
  bodyColors: string[],
  highlightColors: string[]
): WheatStalk[] {
  const stalks: WheatStalk[] = [];
  for (let i = 0; i < count; i++) {
    const progress = i / (count - 1);
    const jitter = (seeded(i, seedOffset + 1) - 0.5) * (1440 / count) * 0.75;
    const x = progress * 1460 - 10 + jitter;
    const height = minH + seeded(i, seedOffset + 2) * (maxH - minH);
    const lean = (seeded(i, seedOffset + 3) - 0.5) * 26;
    const headScale = 0.8 + seeded(i, seedOffset + 4) * 0.45;
    const colorBody = bodyColors[i % bodyColors.length];
    const colorHighlight = highlightColors[i % highlightColors.length];
    stalks.push({ id: i, x, height, lean, headScale, colorBody, colorHighlight });
  }
  return stalks;
}

const BACK_WHEAT = buildWheatLayer(
  42,
  10,
  110,
  165,
  ['#8F5922', '#A86A28', '#78471A'],
  ['#C9993A', '#D9B98A']
);

const MID_WHEAT = buildWheatLayer(
  38,
  40,
  145,
  215,
  ['#B87D2C', '#C9993A', '#9E6622'],
  ['#EBD9B4', '#D9B98A']
);

const FRONT_WHEAT = buildWheatLayer(
  32,
  80,
  175,
  260,
  ['#5C3517', '#7A491E', '#3D2310'],
  ['#C9993A', '#E8883A']
);

const DUST_MOTES: DustMote[] = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${(seeded(i, 101) * 96 + 2).toFixed(2)}%`,
  top: `${(seeded(i, 102) * 78 + 14).toFixed(2)}%`,
  size: Math.round(2 + seeded(i, 103) * 3.5),
  dx: `${Math.round((seeded(i, 104) - 0.35) * 70)}px`,
  dy: `${Math.round(-60 - seeded(i, 105) * 95)}px`,
  duration: `${(9 + seeded(i, 106) * 8).toFixed(1)}s`,
  delay: `${(-seeded(i, 107) * 12).toFixed(1)}s`,
  opacity: Number((0.35 + seeded(i, 108) * 0.45).toFixed(2)),
}));

function renderWheatStalk(stalk: WheatStalk, baseY: number) {
  const tipX = stalk.x + stalk.lean;
  const tipY = baseY - stalk.height;
  const midX = stalk.x + stalk.lean * 0.45;
  const midY = baseY - stalk.height * 0.55;
  const hs = stalk.headScale;

  // Low-poly angular blade + faceted diamond wheat ear
  const stemPoints = `${stalk.x - 2.5},${baseY} ${stalk.x + 2.5},${baseY} ${midX + 1.5},${midY} ${tipX},${tipY + 30 * hs} ${midX - 1.5},${midY}`;
  const headLeft = `${tipX},${tipY + 34 * hs} ${tipX - 7 * hs},${tipY + 18 * hs} ${tipX - 5 * hs},${tipY + 5 * hs} ${tipX},${tipY}`;
  const headRight = `${tipX},${tipY + 34 * hs} ${tipX + 7 * hs},${tipY + 18 * hs} ${tipX + 5 * hs},${tipY + 5 * hs} ${tipX},${tipY}`;
  const leafPoints = `${midX},${midY + 18} ${midX + (stalk.lean >= 0 ? 18 : -18)},${midY - 8} ${midX + (stalk.lean >= 0 ? 4 : -4)},${midY + 6}`;

  return (
    <g key={stalk.id}>
      <polygon points={stemPoints} fill={stalk.colorBody} />
      <polygon points={leafPoints} fill={stalk.colorBody} opacity="0.88" />
      <polygon points={headLeft} fill={stalk.colorBody} />
      <polygon points={headRight} fill={stalk.colorHighlight} />
    </g>
  );
}

export function TitleBackground() {
  const [hasVideo, setHasVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    let active = true;
    // Verify /title-bg.mp4 actually serves video bytes (prevents Vite SPA HTML fallback false positive)
    fetch('/title-bg.mp4', { method: 'HEAD' })
      .then((res) => {
        if (!active) return;
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.toLowerCase().startsWith('video/')) {
          setHasVideo(true);
        }
      })
      .catch(() => {
        // Fallback SVG scene remains active
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none pointer-events-none bg-[#1E140D]"
      aria-hidden="true"
    >
      {/* Low-Poly Animated SVG Scene (always rendered as poster / fallback) */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1B2A41" />
            <stop offset="38%" stopColor="#2A3449" />
            <stop offset="62%" stopColor="#7C4425" />
            <stop offset="82%" stopColor="#C97631" />
            <stop offset="100%" stopColor="#E8883A" />
          </linearGradient>

          <radialGradient id="sunGlowOuter" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EBD9B4" stopOpacity="0.95" />
            <stop offset="32%" stopColor="#E8883A" stopOpacity="0.55" />
            <stop offset="68%" stopColor="#C9993A" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1B2A41" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="sunDisc" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF5D6" />
            <stop offset="60%" stopColor="#EBD9B4" />
            <stop offset="100%" stopColor="#E8883A" />
          </linearGradient>

          <linearGradient id="groundWarm" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#B87830" />
            <stop offset="55%" stopColor="#7D491B" />
            <stop offset="100%" stopColor="#1E140D" />
          </linearGradient>

          <linearGradient id="palaceShade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5C3820" />
            <stop offset="100%" stopColor="#2B1A10" />
          </linearGradient>
        </defs>

        {/* Sky Canvas */}
        <rect width="1440" height="900" fill="url(#skyGrad)" />

        {/* Subtle Low-Poly Sky Facets */}
        <g opacity="0.18">
          <polygon points="0,0 420,0 260,210" fill="#233754" />
          <polygon points="420,0 890,0 610,180" fill="#162338" />
          <polygon points="890,0 1440,0 1160,240" fill="#2A3B59" />
          <polygon points="0,0 260,210 0,340" fill="#1B2A41" />
          <polygon points="1440,0 1160,240 1440,390" fill="#3B2E3C" />
          <polygon points="1160,240 1440,390 980,450" fill="#8C4B27" />
          <polygon points="260,210 610,180 410,360" fill="#4E3538" />
        </g>

        {/* Huge Glowing Sun */}
        <g transform="translate(460, 445)">
          <circle r="330" fill="url(#sunGlowOuter)" className="animate-sun-breathe" />
          <circle r="142" fill="url(#sunDisc)" opacity="0.96" />
          {/* Subtle faceted sun rim arc */}
          <circle
            r="156"
            fill="none"
            stroke="#EBD9B4"
            strokeWidth="1.5"
            strokeOpacity="0.28"
          />
        </g>

        {/* Distant Low-Poly Horizon Mountains */}
        <g>
          {/* Far left ridge */}
          <polygon points="-20,565 180,465 340,565" fill="#5A3720" />
          <polygon points="180,465 340,565 250,565" fill="#8B5429" />
          <polygon points="240,565 440,490 610,565" fill="#6E4224" />
          <polygon points="440,490 610,565 505,565" fill="#A1622D" />
          {/* Far right mountain massif behind palace */}
          <polygon points="940,565 1170,410 1350,565" fill="#462A19" />
          <polygon points="1170,410 1350,565 1230,565" fill="#7D4C26" />
          <polygon points="1220,565 1460,435 1460,565" fill="#382214" />
        </g>

        {/* Distant Low-Poly Sandstone Palace Silhouette */}
        <g>
          {/* Elevated citadel plateau */}
          <polygon points="680,585 770,530 1295,530 1380,585" fill="#3A2214" />
          <polygon points="680,585 770,530 820,585" fill="#5C3820" />

          {/* Left Outer Bastion */}
          <rect x="775" y="476" width="54" height="54" fill="#321E12" />
          <polygon points="775,476 792,458 812,458 829,476" fill="#4E301B" />
          <rect x="787" y="492" width="10" height="18" fill="#E8883A" opacity="0.55" />

          {/* Connecting Colonnade Wall */}
          <rect x="829" y="492" width="96" height="38" fill="url(#palaceShade)" />
          <polygon points="829,492 925,492 925,484 835,484" fill="#C9993A" opacity="0.35" />
          <rect x="844" y="502" width="9" height="16" fill="#1E140D" />
          <rect x="866" y="502" width="9" height="16" fill="#1E140D" />
          <rect x="888" y="502" width="9" height="16" fill="#1E140D" />
          <rect x="910" y="502" width="9" height="16" fill="#1E140D" />

          {/* Central Stepped Royal Keep */}
          <rect x="925" y="422" width="128" height="108" fill="#2A190F" />
          {/* Sunlit left facade edge of central keep */}
          <polygon points="925,422 948,422 948,530 925,530" fill="#7D4E28" />
          {/* Upper crown tier */}
          <rect x="949" y="388" width="80" height="34" fill="#331E12" />
          <polygon points="949,388 967,388 967,422 949,422" fill="#9E652E" />
          {/* Faceted pitched pediment (strictly architectural, no religious icons) */}
          <polygon points="945,388 989,364 1033,388" fill="#4D2E1B" />
          <polygon points="945,388 989,364 989,388" fill="#C9993A" opacity="0.5" />

          {/* Warm Torchlit Arches inside Central Keep */}
          <rect x="979" y="446" width="20" height="34" rx="2" fill="#E8883A" opacity="0.72" />
          <rect x="974" y="492" width="30" height="38" fill="#1E140D" />
          <rect x="984" y="500" width="10" height="30" fill="#C9993A" opacity="0.4" />

          {/* Flanking Twin Towers */}
          <rect x="910" y="446" width="24" height="84" fill="#23150C" />
          <polygon points="910,446 922,430 934,446" fill="#8C5828" />
          <rect x="1044" y="442" width="26" height="88" fill="#1E140D" />
          <polygon points="1044,442 1057,424 1070,442" fill="#5E391F" />

          {/* Right Wing & Granary Storehouse */}
          <rect x="1070" y="472" width="110" height="58" fill="#2A190F" />
          <polygon points="1070,472 1180,472 1172,462 1070,462" fill="#6E4424" />
          <rect x="1090" y="488" width="12" height="22" fill="#E8883A" opacity="0.45" />
          <rect x="1116" y="488" width="12" height="22" fill="#1E140D" />
          <rect x="1142" y="488" width="12" height="22" fill="#E8883A" opacity="0.35" />

          {/* Far Right Watchtower */}
          <rect x="1180" y="448" width="44" height="82" fill="#20130B" />
          <polygon points="1180,448 1202,432 1224,448" fill="#4A2D1A" />
          <rect x="1196" y="466" width="10" height="16" fill="#E8883A" opacity="0.5" />
        </g>

        {/* Midground Rolling Low-Poly Golden Hills */}
        <g>
          <polygon points="-20,645 380,555 760,640 1120,560 1460,620 1460,900 -20,900" fill="url(#groundWarm)" />
          <polygon points="-20,645 380,555 240,680" fill="#C98A36" opacity="0.7" />
          <polygon points="380,555 760,640 530,685" fill="#9E6224" opacity="0.75" />
          <polygon points="760,640 1120,560 950,690" fill="#824E1D" opacity="0.8" />
          <polygon points="1120,560 1460,620 1280,700" fill="#5E3616" opacity="0.85" />
        </g>

        {/* Swaying Wheat Field — Back Layer */}
        <g className="animate-wheat-back">
          {BACK_WHEAT.map((stalk) => renderWheatStalk(stalk, 745))}
        </g>

        {/* Mid-field dark brown contour band */}
        <polygon points="-20,740 520,715 980,745 1460,720 1460,900 -20,900" fill="#4A2B14" />

        {/* Swaying Wheat Field — Mid Layer */}
        <g className="animate-wheat-mid">
          {MID_WHEAT.map((stalk) => renderWheatStalk(stalk, 835))}
        </g>

        {/* Foreground Earth */}
        <polygon points="-20,825 460,805 1040,830 1460,810 1460,910 -20,910" fill="#1E140D" />

        {/* Swaying Wheat Field — Foreground Silhouette & Gold Rim Layer */}
        <g className="animate-wheat-front">
          {FRONT_WHEAT.map((stalk) => renderWheatStalk(stalk, 912))}
        </g>
      </svg>

      {/* Muted Background Video Slot (activates automatically when /title-bg.mp4 exists) */}
      {hasVideo && (
        <video
          src="/title-bg.mp4"
          muted
          autoPlay
          loop
          playsInline
          onCanPlay={() => setVideoReady(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            videoReady ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Drifting Golden Dust Particles (CSS/GPU composited) */}
      <div className="absolute inset-0 overflow-hidden">
        {DUST_MOTES.map((mote) => (
          <span
            key={mote.id}
            className="animate-dust absolute rounded-full bg-[#EBD9B4]"
            style={
              {
                left: mote.left,
                top: mote.top,
                width: `${mote.size}px`,
                height: `${mote.size}px`,
                opacity: mote.opacity,
                boxShadow: '0 0 8px rgba(232, 136, 58, 0.75)',
                '--dust-dx': mote.dx,
                '--dust-dy': mote.dy,
                '--dust-dur': mote.duration,
                '--dust-delay': mote.delay,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* Measured Contrast Scrim for High-Contrast Typography */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(30, 20, 13, 0.34) 0%, rgba(27, 42, 65, 0.25) 48%, rgba(30, 20, 13, 0.78) 100%)',
        }}
      />
      <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#1B2A41]/75 via-[#1B2A41]/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#1E140D]/90 via-[#1E140D]/40 to-transparent" />

      {/* Subtle Carved Sandstone & Gold Frame Borders (No faces, no eyes, no religious icons) */}
      <div className="absolute inset-3 sm:inset-5 border border-[#C9993A]/35 pointer-events-none">
        {/* Four geometric diamond corner ornaments */}
        <span className="absolute -top-1.5 -left-1.5 w-3 h-3 rotate-45 bg-[#C9993A] border border-[#1E140D]" />
        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rotate-45 bg-[#C9993A] border border-[#1E140D]" />
        <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rotate-45 bg-[#C9993A] border border-[#1E140D]" />
        <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rotate-45 bg-[#C9993A] border border-[#1E140D]" />
      </div>
    </div>
  );
}
