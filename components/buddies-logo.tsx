import { useId } from "react";

type BuddiesLogoProps = {
  mode?: "light" | "dark";
  layout?: "inline" | "stacked";
  variant?: "full" | "icon";
  showTagline?: boolean;
  className?: string;
};

const logoPalette = {
  light: {
    wordmark: "#002366",
    submark: "rgba(0, 35, 102, 0.68)",
    border: "rgba(0, 35, 102, 0.12)",
    fillStart: "#eaf4ff",
    fillEnd: "#ffffff",
    ring: "rgba(0, 127, 255, 0.18)",
    grid: "rgba(0, 35, 102, 0.22)",
    globeStroke: "#0b4db6",
    accent: "#ff7f50",
    trust: "#007fff",
    success: "#2e8b57",
    glow: "drop-shadow(0 14px 28px rgba(0, 35, 102, 0.12))",
  },
  dark: {
    wordmark: "#f8fbff",
    submark: "rgba(240, 247, 255, 0.76)",
    border: "rgba(255, 255, 255, 0.16)",
    fillStart: "rgba(255,255,255,0.22)",
    fillEnd: "rgba(255,255,255,0.08)",
    ring: "rgba(137, 197, 255, 0.22)",
    grid: "rgba(225, 240, 255, 0.5)",
    globeStroke: "#c7e4ff",
    accent: "#ff9c73",
    trust: "#78b7ff",
    success: "#84cda3",
    glow: "drop-shadow(0 18px 34px rgba(120, 183, 255, 0.22))",
  },
} as const;

export function BuddiesLogo({
  mode = "light",
  layout = "inline",
  variant = "full",
  showTagline = true,
  className = "",
}: BuddiesLogoProps) {
  const palette = logoPalette[mode];
  const gradientId = useId().replace(/:/g, "");
  const iconSize = layout === "stacked" ? 132 : variant === "icon" ? 42 : 52;
  const wrapperClass =
    layout === "stacked"
      ? "inline-flex flex-col items-center text-center"
      : "inline-flex items-center gap-3";

  const wordmarkClass =
    layout === "stacked"
      ? "mt-3 text-[1.55rem] font-extrabold tracking-[-0.04em] md:text-[2.4rem]"
      : "text-[0.98rem] font-extrabold tracking-[-0.035em] sm:text-[1.02rem] md:text-[1.08rem]";

  const submarkClass =
    layout === "stacked"
      ? "mt-2 text-[0.66rem] font-medium uppercase tracking-[0.26em] md:text-xs"
      : "text-[0.55rem] font-medium uppercase tracking-[0.24em] sm:text-[0.6rem]";

  const symbol = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 144 144"
      role="img"
      aria-label="Buddies Worldwide logo"
      style={{ filter: palette.glow }}
    >
      <defs>
        <linearGradient id={`buddies-shell-${gradientId}`} x1="18%" y1="16%" x2="88%" y2="86%">
          <stop offset="0%" stopColor={palette.fillStart} />
          <stop offset="100%" stopColor={palette.fillEnd} />
        </linearGradient>
        <linearGradient id={`buddies-globe-${gradientId}`} x1="20%" y1="14%" x2="80%" y2="88%">
          <stop offset="0%" stopColor={palette.trust} />
          <stop offset="100%" stopColor={palette.success} />
        </linearGradient>
        <clipPath id={`buddies-clip-${gradientId}`}>
          <circle cx="72" cy="72" r="40" />
        </clipPath>
      </defs>

      <circle cx="72" cy="72" r="64" fill={`url(#buddies-shell-${gradientId})`} />
      <circle cx="72" cy="72" r="64" fill="none" stroke={palette.border} strokeWidth="1.5" />

      <path
        d="M32 56C44 35 64 24 86 26C102 28 116 38 122 52"
        fill="none"
        stroke={palette.accent}
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M112 88C99 108 78 120 57 117C41 115 28 106 22 93"
        fill="none"
        stroke={palette.trust}
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="29" cy="86" r="7" fill={palette.trust} />
      <circle cx="116" cy="58" r="7" fill={palette.accent} />

      <circle cx="72" cy="72" r="40" fill="rgba(255,255,255,0.88)" />
      <circle cx="72" cy="72" r="40" fill="none" stroke={palette.ring} strokeWidth="8" />
      <circle cx="72" cy="72" r="40" fill="none" stroke={palette.globeStroke} strokeWidth="2.5" />

      <g clipPath={`url(#buddies-clip-${gradientId})`}>
        <path
          d="M32 72H112"
          fill="none"
          stroke={palette.grid}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M38 56C53 47 91 47 106 56"
          fill="none"
          stroke={palette.grid}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M38 88C53 97 91 97 106 88"
          fill="none"
          stroke={palette.grid}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M48 34C39 49 39 95 48 110"
          fill="none"
          stroke={palette.grid}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M64 36V108"
          fill="none"
          stroke={palette.grid}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <path
          d="M64 42C84 42 92 51 92 59C92 67 84 74 64 74"
          fill="none"
          stroke={palette.grid}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M64 74C86 74 95 84 95 94C95 102 86 108 64 108"
          fill="none"
          stroke={palette.grid}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      <path
        d="M41 58C50 48 61 45 72 48"
        fill="none"
        stroke={palette.accent}
        strokeWidth="5.4"
        strokeLinecap="round"
      />
      <path
        d="M103 86C94 96 83 99 72 96"
        fill="none"
        stroke={palette.success}
        strokeWidth="5.4"
        strokeLinecap="round"
      />
    </svg>
  );

  if (variant === "icon") {
    return <span className={className}>{symbol}</span>;
  }

  return (
    <div className={`${wrapperClass} ${className}`.trim()}>
      {symbol}
      <div className={layout === "stacked" ? "" : "leading-none"}>
        <div className={wordmarkClass} style={{ color: palette.wordmark }}>
          Buddies Worldwide
        </div>
        {showTagline ? (
          <div className={submarkClass} style={{ color: palette.submark }}>
            Secure trade for South Africa
          </div>
        ) : null}
      </div>
    </div>
  );
}
