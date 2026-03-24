import type { AdminSession } from "@/lib/admin-auth";

type AdminSessionPanelProps = {
  session: AdminSession;
};

export function AdminSessionPanel({ session }: AdminSessionPanelProps) {
  const identity =
    session.name ?? session.preferredUsername ?? session.email ?? "Authorized moderator";

  return (
    <div className="soft-card rounded-[1.8rem] p-5 text-sm text-[var(--ink-soft)]">
      <p className="section-kicker">Admin Session</p>
      <p className="mt-3 font-semibold text-[var(--foreground)]">{identity}</p>
      {session.email ? <p className="mt-1">{session.email}</p> : null}
      <p className="mt-3">Role check passed for `{session.roles.join(", ")}`.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href="/api/auth/admin/logout?next=/admin/login?logged_out=1"
          className="font-semibold text-[var(--accent)]"
        >
          Sign out
        </a>
      </div>
    </div>
  );
}
