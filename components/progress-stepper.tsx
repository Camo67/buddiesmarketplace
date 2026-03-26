import { Check } from "lucide-react";

export type ProgressStep = {
  label: string;
  description: string;
  status: "complete" | "current" | "upcoming";
};

type ProgressStepperProps = {
  steps: ProgressStep[];
  className?: string;
};

function getStepClasses(status: ProgressStep["status"]) {
  if (status === "complete") {
    return {
      marker:
        "border-[rgba(46,139,87,0.22)] bg-[var(--success)] text-white shadow-[0_12px_24px_rgba(46,139,87,0.24)]",
      card: "border-[rgba(46,139,87,0.18)] bg-[rgba(46,139,87,0.08)]",
      text: "text-[var(--success)]",
    };
  }

  if (status === "current") {
    return {
      marker:
        "border-[rgba(255,127,80,0.2)] bg-[var(--accent)] text-white shadow-[0_12px_24px_rgba(255,127,80,0.24)]",
      card: "border-[rgba(255,127,80,0.18)] bg-[rgba(255,127,80,0.09)]",
      text: "text-[var(--accent)]",
    };
  }

  return {
    marker: "border-[var(--line)] bg-white text-[var(--muted)]",
    card: "border-[var(--line)] bg-white/82",
    text: "text-[var(--muted)]",
  };
}

export function ProgressStepper({ steps, className = "" }: ProgressStepperProps) {
  const columnsClass =
    steps.length <= 1
      ? "md:grid-cols-1"
      : steps.length === 2
        ? "md:grid-cols-2"
        : steps.length === 3
          ? "md:grid-cols-3"
          : "md:grid-cols-2 xl:grid-cols-4";

  return (
    <ol
      className={[
        "grid gap-3",
        columnsClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {steps.map((step, index) => {
        const styles = getStepClasses(step.status);

        return (
          <li
            key={step.label}
            className={`rounded-[1.5rem] border p-4 ${styles.card}`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${styles.marker}`}
              >
                {step.status === "complete" ? <Check size={18} /> : index + 1}
              </span>
              <div className="min-w-0">
                <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.text}`}>
                  {step.status === "complete"
                    ? "Complete"
                    : step.status === "current"
                      ? "Current Step"
                      : "Upcoming"}
                </p>
                <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">
                  {step.label}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                  {step.description}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
