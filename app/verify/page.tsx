import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ChevronLeft,
  CircleCheck,
  FileCheck2,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { ProgressStepper } from "@/components/progress-stepper";
import { StatusPill } from "@/components/status-pill";
import { TurnstileScript } from "@/components/turnstile-script";
import { VerificationDocsForm } from "@/components/verification-docs-form";
import { getBotProtectionPublicConfig } from "@/lib/bot-protection";
import { getMarketplaceUserById } from "@/lib/users-store";
import {
  canMarketplaceUserTrade,
  verificationStatusLabels,
} from "@/lib/user-verification";
import {
  readUserSession,
  sanitizeUserRedirectPath,
  userSessionCookieName,
} from "@/lib/user-auth";

type VerifyPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildProgress(status: string) {
  if (status === "verified") {
    return [
      {
        label: "Account ready",
        description: "Your marketplace identity is active and linked to this session.",
        status: "complete" as const,
      },
      {
        label: "Documents submitted",
        description: "Identity and address documents are on record.",
        status: "complete" as const,
      },
      {
        label: "Review approved",
        description: "Moderation has confirmed your verification package.",
        status: "complete" as const,
      },
      {
        label: "Trade unlocked",
        description: "Selling and other higher-trust actions are now available.",
        status: "complete" as const,
      },
    ];
  }

  if (status === "submitted") {
    return [
      {
        label: "Account ready",
        description: "Your marketplace identity is active and linked to this session.",
        status: "complete" as const,
      },
      {
        label: "Documents submitted",
        description: "Your identity and address documents are waiting in the review queue.",
        status: "complete" as const,
      },
      {
        label: "Review in progress",
        description: "Moderators are reviewing your package before trust-gated actions unlock.",
        status: "current" as const,
      },
      {
        label: "Trade unlocked",
        description: "Verified status will unlock selling and future buyer-side trust actions.",
        status: "upcoming" as const,
      },
    ];
  }

  if (status === "changes_requested") {
    return [
      {
        label: "Account ready",
        description: "Your marketplace identity is active and linked to this session.",
        status: "complete" as const,
      },
      {
        label: "Update documents",
        description: "A moderator asked for changes before verification can be approved.",
        status: "current" as const,
      },
      {
        label: "Review again",
        description: "Resubmitting your documents returns the package to moderation review.",
        status: "upcoming" as const,
      },
      {
        label: "Trade unlocked",
        description: "Verified status will unlock higher-trust marketplace actions.",
        status: "upcoming" as const,
      },
    ];
  }

  return [
    {
      label: "Account ready",
      description: "Your marketplace identity is active and linked to this session.",
      status: "complete" as const,
    },
    {
      label: "Submit documents",
      description: "Share your identity and address documents to begin the trust review.",
      status: "current" as const,
    },
    {
      label: "Review in progress",
      description: "Moderators review your documents before selling tools unlock.",
      status: "upcoming" as const,
    },
    {
      label: "Trade unlocked",
      description: "Verified status clears your account for higher-trust marketplace actions.",
      status: "upcoming" as const,
    },
  ];
}

export const dynamic = "force-dynamic";

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const { next } = await searchParams;
  const nextPath = sanitizeUserRedirectPath(next);
  const cookieStore = await cookies();
  const userSession = await readUserSession(cookieStore.get(userSessionCookieName)?.value);

  if (!userSession) {
    redirect(`/signup?next=${encodeURIComponent(`/verify?next=${nextPath}`)}`);
  }

  const marketplaceUser = await getMarketplaceUserById(userSession.marketplaceUserId);

  if (!marketplaceUser) {
    redirect(`/signup?next=${encodeURIComponent(nextPath)}`);
  }

  const isVerified = canMarketplaceUserTrade(marketplaceUser.verificationStatus);
  const botProtection = getBotProtectionPublicConfig();
  const statusTone =
    marketplaceUser.verificationStatus === "verified"
      ? "success"
      : marketplaceUser.verificationStatus === "changes_requested"
        ? "accent"
        : "info";

  return (
    <main className="page-safe-bottom pt-4">
      {botProtection.enabled ? <TurnstileScript /> : null}
      <section className="page-shell">
        <div className="glass-panel rounded-[2.4rem] px-5 py-6 md:px-8 md:py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-soft)]"
          >
            <ChevronLeft size={16} />
            Back to marketplace
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="dark-panel rounded-[2rem] p-6 text-white">
              <StatusPill tone="info" className="border-white/12 bg-white/10 text-white">
                Verification journey
              </StatusPill>
              <h1 className="mt-4 font-serif text-4xl leading-none tracking-[-0.05em] md:text-5xl">
                Clear identity review for safer trade.
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/80">
                Verification is the trust bridge between simple sign-up and higher-accountability
                trading. It keeps the marketplace more credible without making browsing feel heavy.
              </p>

              <div className="mt-6 space-y-3 text-sm leading-7 text-white/84">
                <div className="rounded-[1.3rem] border border-white/10 bg-white/8 px-4 py-3">
                  Submit one identity document and one proof-of-address document.
                </div>
                <div className="rounded-[1.3rem] border border-white/10 bg-white/8 px-4 py-3">
                  Moderators review the package before selling and future trust-gated actions open.
                </div>
                <div className="rounded-[1.3rem] border border-white/10 bg-white/8 px-4 py-3">
                  If anything needs correction, Buddies returns clear feedback instead of silently
                  blocking the account.
                </div>
              </div>
            </aside>

            <div className="space-y-6">
              <div className="soft-card rounded-[2rem] p-6 md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="section-kicker">Account Status</p>
                    <h2 className="mt-3 font-serif text-4xl leading-none tracking-[-0.05em] md:text-5xl">
                      {verificationStatusLabels[marketplaceUser.verificationStatus]}
                    </h2>
                  </div>
                  <StatusPill tone={statusTone} icon={<ShieldCheck size={14} />}>
                    {marketplaceUser.verificationStatus.replace("_", " ")}
                  </StatusPill>
                </div>

                <div className="mt-6">
                  <ProgressStepper steps={buildProgress(marketplaceUser.verificationStatus)} />
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--background-alt)] px-4 py-4 text-sm leading-7 text-[var(--ink-soft)]">
                    <div className="inline-flex items-center gap-2 font-semibold text-[var(--foreground)]">
                      <UserCheck size={16} />
                      Identity on file
                    </div>
                    <p className="mt-2">
                      Signed in as{" "}
                      {marketplaceUser.displayName ?? marketplaceUser.email ?? "Marketplace member"}.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--background-alt)] px-4 py-4 text-sm leading-7 text-[var(--ink-soft)]">
                    <div className="inline-flex items-center gap-2 font-semibold text-[var(--foreground)]">
                      <FileCheck2 size={16} />
                      Review timeline
                    </div>
                    <p className="mt-2">
                      Submitted: {formatDate(marketplaceUser.verificationSubmittedAt) ?? "Not yet"}
                    </p>
                    <p>Reviewed: {formatDate(marketplaceUser.verificationReviewedAt) ?? "Not yet"}</p>
                  </div>
                </div>

                {marketplaceUser.verificationReviewNote ? (
                  <div className="mt-4 rounded-[1.5rem] border border-[rgba(255,127,80,0.2)] bg-[rgba(255,127,80,0.08)] px-4 py-4 text-sm leading-7 text-[var(--foreground)]">
                    <p className="font-semibold">Moderator note</p>
                    <p className="mt-2">{marketplaceUser.verificationReviewNote}</p>
                  </div>
                ) : null}

                <div className="mt-6 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                  <div className="rounded-[1.7rem] border border-[var(--line)] bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--trust)]">
                      Required documents
                    </p>
                    <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--ink-soft)]">
                      <div className="rounded-[1.2rem] border border-[var(--line)] bg-[var(--background-alt)] px-4 py-3">
                        Government ID, passport, or driver&apos;s license
                      </div>
                      <div className="rounded-[1.2rem] border border-[var(--line)] bg-[var(--background-alt)] px-4 py-3">
                        Proof of address with a clear and readable residential detail
                      </div>
                      <div className="rounded-[1.2rem] border border-[var(--line)] bg-[var(--background-alt)] px-4 py-3">
                        A short note only if the moderator needs extra context
                      </div>
                    </div>
                  </div>

                  {isVerified ? (
                    <div className="rounded-[1.8rem] border border-[rgba(46,139,87,0.18)] bg-[rgba(46,139,87,0.08)] px-5 py-5 text-sm leading-7 text-[var(--foreground)]">
                      <div className="inline-flex items-center gap-2 font-semibold text-[var(--success)]">
                        <CircleCheck size={16} />
                        You are cleared to trade
                      </div>
                      <p className="mt-3 text-[var(--ink-soft)]">
                        Your account now has the trust state needed for selling and future
                        higher-accountability marketplace actions.
                      </p>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                          href={nextPath === "/listings" ? "/listings/new-service" : nextPath}
                          className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(255,127,80,0.22)]"
                        >
                          Continue
                        </Link>
                        <Link
                          href="/listings/new-service"
                          className="inline-flex min-h-11 items-center rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
                        >
                          Post listing
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[1.8rem] border border-[var(--line)] bg-white p-5">
                      <VerificationDocsForm user={marketplaceUser} botProtection={botProtection} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
