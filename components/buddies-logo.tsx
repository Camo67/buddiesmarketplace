type BuddiesLogoProps = {
  mode?: "light" | "dark";
  layout?: "inline" | "stacked";
  showTagline?: boolean;
  className?: string;
};

const logoPalette = {
  light: {
    wordmark: "#0f4f78",
    submark: "rgba(15, 79, 120, 0.88)",
    orbit: "#b8daea",
    orbitDash: "#3c88d8",
    outline: "#0f4f78",
    glow: "drop-shadow(0 10px 24px rgba(15, 79, 120, 0.12))",
  },
  dark: {
    wordmark: "#eff9ff",
    submark: "rgba(233, 247, 255, 0.86)",
    orbit: "rgba(184, 218, 234, 0.42)",
    orbitDash: "#78b7ff",
    outline: "#d7f0ff",
    glow: "drop-shadow(0 14px 28px rgba(120, 183, 255, 0.22))",
  },
} as const;

export function BuddiesLogo({
  mode = "light",
  layout = "inline",
  showTagline = true,
  className = "",
}: BuddiesLogoProps) {
  const palette = logoPalette[mode];
  const iconSize = layout === "stacked" ? 126 : 52;
  const wrapperClass =
    layout === "stacked"
      ? "inline-flex flex-col items-center text-center"
      : "inline-flex items-center gap-3";
  const wordmarkClass =
    layout === "stacked"
      ? "mt-3 text-2xl font-black tracking-[0.14em] md:text-4xl"
      : "text-sm font-black tracking-[0.12em] md:text-base";
  const submarkClass =
    layout === "stacked"
      ? "mt-2 text-xs font-semibold tracking-[0.55em] md:text-sm"
      : "text-[0.6rem] font-semibold tracking-[0.42em]";

  return (
    <div className={`${wrapperClass} ${className}`.trim()}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 144 144"
        role="img"
        aria-label="Buddies Worldwide logo"
        style={{ filter: palette.glow }}
      >
        <defs>
          <linearGradient id={`globe-ocean-${mode}`} x1="20%" y1="10%" x2="80%" y2="90%">
            <stop offset="0%" stopColor="#66c7ff" />
            <stop offset="100%" stopColor="#1173c7" />
          </linearGradient>
          <linearGradient id={`globe-land-${mode}`} x1="20%" y1="10%" x2="80%" y2="90%">
            <stop offset="0%" stopColor="#9ad460" />
            <stop offset="100%" stopColor="#4f9c3c" />
          </linearGradient>
          <linearGradient id={`ring-warm-${mode}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffbf40" />
            <stop offset="100%" stopColor="#f26b2a" />
          </linearGradient>
          <linearGradient id={`ring-cool-${mode}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#31c7b5" />
            <stop offset="100%" stopColor="#2e8b57" />
          </linearGradient>
        </defs>

        <circle cx="72" cy="72" r="67" fill="none" stroke={palette.orbit} strokeWidth="6" />
        <circle
          cx="72"
          cy="72"
          r="53"
          fill="none"
          stroke={palette.orbitDash}
          strokeWidth="5"
          strokeDasharray="7 10"
          strokeLinecap="round"
        />

        <circle cx="72" cy="72" r="26" fill={`url(#globe-ocean-${mode})`} stroke={palette.outline} strokeWidth="2.4" />
        <path
          d="M60 55c-5 2-9 7-9 12 0 5 5 7 7 10 1 3-1 6 2 9 4 4 7-1 10-3 3-2 8-1 8-5s-5-6-5-10c0-5 4-6 2-11-2-4-10-5-15-2Z"
          fill={`url(#globe-land-${mode})`}
          stroke={palette.outline}
          strokeWidth="1.4"
        />
        <path
          d="M82 54c3 1 9 4 10 9 1 4-3 6-1 10 2 3 7 4 7 8 0 5-7 8-11 9-4 1-6-1-6-4s2-6 1-9c-2-4-7-5-7-10 0-7 4-15 7-13Z"
          fill={`url(#globe-land-${mode})`}
          stroke={palette.outline}
          strokeWidth="1.4"
        />

        <path
          d="M48 64c10-20 30-28 48-22"
          fill="none"
          stroke={`url(#ring-warm-${mode})`}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M95 45c17 5 27 20 24 37"
          fill="none"
          stroke={`url(#ring-cool-${mode})`}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M39 69c3-12 10-21 22-27"
          fill="none"
          stroke="#ef7b2d"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M116 84c-3 11-8 19-17 25"
          fill="none"
          stroke="#7ec654"
          strokeWidth="5"
          strokeLinecap="round"
        />

        <circle cx="44" cy="58" r="7" fill="#f58634" stroke={palette.outline} strokeWidth="2" />
        <circle cx="62" cy="43" r="7" fill="#ffc247" stroke={palette.outline} strokeWidth="2" />
        <circle cx="92" cy="43" r="7" fill="#35bdb0" stroke={palette.outline} strokeWidth="2" />
        <circle cx="111" cy="60" r="7" fill="#8bc34c" stroke={palette.outline} strokeWidth="2" />

        <circle cx="72" cy="18" r="6" fill="#4d95f1" />
        <circle cx="18" cy="72" r="6" fill="#4d95f1" />
        <circle cx="126" cy="72" r="6" fill="#4d95f1" />
        <circle cx="72" cy="126" r="6" fill="#4d95f1" />

        <path
          d="M38 116c11 12 57 12 68 0"
          fill="none"
          stroke="#1eb2a6"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M50 127c9 7 34 7 44 0"
          fill="none"
          stroke="#ef6335"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>

      <div className={layout === "stacked" ? "" : "leading-none"}>
        <div className={wordmarkClass} style={{ color: palette.wordmark }}>
          BUDDIES WORLD WIDE
        </div>
        {showTagline ? (
          <div className={submarkClass} style={{ color: palette.submark }}>
            P2P TRUST
          </div>
        ) : null}
      </div>
    </div>
  );
}
