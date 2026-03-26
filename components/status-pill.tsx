import type { ReactNode } from "react";

type StatusPillTone = "neutral" | "info" | "success" | "accent" | "warning";
type StatusPillSize = "sm" | "md";

type StatusPillProps = {
  children: ReactNode;
  icon?: ReactNode;
  tone?: StatusPillTone;
  size?: StatusPillSize;
  className?: string;
};

const toneClasses: Record<StatusPillTone, string> = {
  neutral:
    "border-[var(--line)] bg-white/82 text-[var(--foreground)]",
  info:
    "border-[rgba(0,127,255,0.18)] bg-[rgba(0,127,255,0.08)] text-[var(--trust)]",
  success:
    "border-[rgba(46,139,87,0.18)] bg-[rgba(46,139,87,0.10)] text-[var(--success)]",
  accent:
    "border-[rgba(255,127,80,0.18)] bg-[rgba(255,127,80,0.12)] text-[var(--accent)]",
  warning:
    "border-[rgba(183,110,0,0.18)] bg-[rgba(183,110,0,0.08)] text-[#8c5800]",
};

const sizeClasses: Record<StatusPillSize, string> = {
  sm: "px-3 py-1.5 text-[0.72rem] tracking-[0.16em]",
  md: "px-4 py-2 text-xs tracking-[0.18em]",
};

export function StatusPill({
  children,
  icon,
  tone = "neutral",
  size = "md",
  className = "",
}: StatusPillProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border font-semibold uppercase",
        toneClasses[tone],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon}
      {children}
    </span>
  );
}
