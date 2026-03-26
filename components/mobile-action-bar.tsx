import Link from "next/link";
import type { ReactNode } from "react";

type MobileAction = {
  href: string;
  label: string;
  icon?: ReactNode;
  kind?: "primary" | "secondary";
};

type MobileActionBarProps = {
  actions: MobileAction[];
};

export function MobileActionBar({ actions }: MobileActionBarProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 z-40 px-4 md:hidden bottom-[calc(5.4rem+env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto max-w-md rounded-[1.6rem] border border-[var(--line-strong)] bg-[rgba(255,255,255,0.94)] p-2 shadow-[0_20px_48px_rgba(0,35,102,0.16)] backdrop-blur-xl">
        <div className={`grid gap-2 ${actions.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {actions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={
                action.kind === "primary"
                  ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-[1.1rem] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(255,127,80,0.22)]"
                  : "inline-flex min-h-11 items-center justify-center gap-2 rounded-[1.1rem] border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
              }
            >
              {action.icon}
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
