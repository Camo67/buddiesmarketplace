import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ChevronRight, ShieldAlert } from "lucide-react";
import { AdminSessionPanel } from "@/components/admin-session-panel";
import { AdminVerificationActions } from "@/components/admin-verification-actions";
import {
  adminSessionCookieName,
  hasRequiredAdminRole,
  readAdminSession,
} from "@/lib/admin-auth";
import { readMarketplaceUsers, type MarketplaceUser } from "@/lib/users-store";
import {
  verificationStatusLabels,
  type VerificationStatus,
} from "@/lib/user-verification";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verification Review | Buddies Worldwide",
  description: "Moderator queue for identity document submissions on Buddies Worldwide.",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function VerificationCard({ user }: { user: MarketplaceUser }) {
  return (
    <div className="soft-card rounded-[1.8rem] p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            {verificationStatusLabels[user.verificationStatus]}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            {user.displayName ?? user.email ?? "Marketplace member"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            {user.email ?? "No email on file"}
          </p>
        </div>
        <div className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">
          {user.verificationIdType ?? "No ID type"} / {user.verificationIdReference ?? "No reference"}
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm leading-7 text-[var(--ink-soft)] md:grid-cols-2">
        <div className="rounded-[1.2rem] border border-[var(--line)] bg-white/72 px-4 py-3">
          <p>
            <span className="font-semibold text-[var(--foreground)]">Phone:</span>{" "}
            {user.verificationPhone ?? "Not supplied"}
          </p>
          <p>
            <span className="font-semibold text-[var(--foreground)]">Submitted:</span>{" "}
            {formatDate(user.verificationSubmittedAt)}
          </p>
          <p>
            <span className="font-semibold text-[var(--foreground)]">Reviewed:</span>{" "}
            {formatDate(user.verificationReviewedAt)}
          </p>
        </div>

        <div className="rounded-[1.2rem] border border-[var(--line)] bg-white/72 px-4 py-3">
          <p className="font-semibold text-[var(--foreground)]">Address</p>
          <p className="mt-2">{user.verificationAddressText ?? "Not supplied"}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {user.verificationIdDocumentUrl ? (
          <a
            href={user.verificationIdDocumentUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-[1.2rem] border border-[var(--line)] bg-white/72 px-4 py-3 text-sm font-semibold text-[var(--accent)]"
          >
            Open ID document
          </a>
        ) : (
          <div className="rounded-[1.2rem] border border-[var(--line)] bg-white/72 px-4 py-3 text-sm text-[var(--ink-soft)]">
            No ID document link supplied
          </div>
        )}
        {user.verificationAddressDocumentUrl ? (
          <a
            href={user.verificationAddressDocumentUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-[1.2rem] border border-[var(--line)] bg-white/72 px-4 py-3 text-sm font-semibold text-[var(--accent)]"
          >
            Open proof of address
          </a>
        ) : (
          <div className="rounded-[1.2rem] border border-[var(--line)] bg-white/72 px-4 py-3 text-sm text-[var(--ink-soft)]">
            No proof of address link supplied
          </div>
        )}
      </div>

      {user.verificationSubmissionNote ? (
        <div className="mt-4 rounded-[1.2rem] border border-[var(--line)] bg-white/72 px-4 py-3 text-sm leading-7 text-[var(--ink-soft)]">
          <p className="font-semibold text-[var(--foreground)]">Applicant note</p>
          <p className="mt-1">{user.verificationSubmissionNote}</p>
        </div>
      ) : null}

      <div className="mt-5">
        <AdminVerificationActions
          userId={user.id}
          currentStatus={user.verificationStatus}
          currentReviewNote={user.verificationReviewNote}
          currentReviewedBy={user.verificationReviewedBy}
        />
      </div>
    </div>
  );
}

export default async function AdminVerificationsPage() {
  const cookieStore = await cookies();
  const session = await readAdminSession(cookieStore.get(adminSessionCookieName)?.value);

  if (!hasRequiredAdminRole(session)) {
    redirect("/admin/login?next=%2Fadmin%2Fverifications");
  }

  const users = await readMarketplaceUsers();
  const queueUsers = users.filter((user) =>
    ["submitted", "changes_requested"].includes(user.verificationStatus),
  );
  const completedUsers = users.filter((user) => user.verificationStatus === "verified");
  const counts = users.reduce<Record<VerificationStatus, number>>(
    (accumulator, user) => {
      accumulator[user.verificationStatus] += 1;
      return accumulator;
    },
    {
      unsubmitted: 0,
      submitted: 0,
      verified: 0,
      changes_requested: 0,
    },
  );

  return (
    <main className="pb-16 pt-4">
      <section className="page-shell">
        <div className="glass-panel rounded-[2.4rem] px-5 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-kicker">Verification Review</p>
              <h1 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
                Identity document queue
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
                Fast sign-up is fine, but every buyer and seller still needs reviewed verification
                before marketplace trading unlocks. This screen is where moderators decide that.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/admin/reviews" className="text-sm font-semibold text-[var(--accent)]">
                Open listing queue
              </Link>
              <Link href="/verify" className="text-sm font-semibold text-[var(--accent)]">
                Open member verification form
              </Link>
            </div>
          </div>

          <div className="mt-8 rounded-[1.8rem] border border-[rgba(198,145,37,0.22)] bg-[rgba(198,145,37,0.08)] px-5 py-4 text-sm leading-7 text-[var(--foreground)]">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-1 shrink-0 text-[#9a6915]" size={18} />
              <div>
                <p className="font-semibold text-[#9a6915]">Protected admin notice</p>
                <p className="mt-1 text-[var(--ink-soft)]">
                  Verified status now controls who can create ads and who can start secure buyer
                  checkout.
                </p>
              </div>
            </div>
          </div>

          {session ? (
            <div className="mt-6">
              <AdminSessionPanel session={session} />
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(Object.keys(counts) as VerificationStatus[]).map((status) => (
              <div key={status} className="soft-card rounded-[1.7rem] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  {verificationStatusLabels[status]}
                </p>
                <p className="mt-3 text-4xl font-bold tracking-tight">
                  {counts[status].toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="section-kicker">Needs Attention</p>
                  <h2 className="mt-3 font-serif text-3xl leading-none md:text-4xl">
                    Submitted and resubmission requests
                  </h2>
                </div>
                <div className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">
                  {queueUsers.length} active
                </div>
              </div>

              {queueUsers.length === 0 ? (
                <div className="soft-card rounded-[1.8rem] p-6 text-sm leading-7 text-[var(--ink-soft)]">
                  No verification packages are waiting for a moderator right now.
                </div>
              ) : (
                <div className="grid gap-4">
                  {queueUsers.map((user) => (
                    <VerificationCard key={user.id} user={user} />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="section-kicker">Approved Traders</p>
                  <h2 className="mt-3 font-serif text-3xl leading-none md:text-4xl">
                    Verified accounts
                  </h2>
                </div>
                <ChevronRight className="text-[var(--accent)]" size={20} />
              </div>

              {completedUsers.length === 0 ? (
                <div className="soft-card rounded-[1.8rem] p-6 text-sm leading-7 text-[var(--ink-soft)]">
                  No accounts have been marked as verified yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {completedUsers.map((user) => (
                    <VerificationCard key={user.id} user={user} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
