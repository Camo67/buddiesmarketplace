import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import {
  adminSessionCookieName,
  hasRequiredAdminRole,
  isAdminProtectionConfigured,
  readAdminSession,
  sanitizeAdminRedirectPath,
} from "@/lib/admin-auth";

type AdminLoginPageProps = {
  searchParams: Promise<{
    next?: string;
    configured?: string;
    error?: string;
    logged_out?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const { next, configured, error, logged_out: loggedOut } = await searchParams;
  const nextPath = sanitizeAdminRedirectPath(next);
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(adminSessionCookieName)?.value;
  const session = await readAdminSession(sessionValue);

  if (hasRequiredAdminRole(session)) {
    redirect(nextPath);
  }

  const isConfigured = isAdminProtectionConfigured();
  const errorMessage =
    error === "missing_role"
      ? "You signed in through Keycloak, but this account does not have the required admin role."
      : error === "login_cancelled"
        ? "The Keycloak login was cancelled before it finished."
        : error === "missing_callback"
          ? "The Keycloak callback was missing required parameters."
        : error === "callback_failed"
            ? "The Keycloak login could not be completed. Check the realm, client, and role setup."
          : error === "auth_unavailable"
            ? "Keycloak is reachable, but the configured buddies realm or client is not available yet."
            : null;

  return (
    <main className="pb-16 pt-4">
      <section className="page-shell">
        <div className="glass-panel rounded-[2.4rem] px-5 py-6 md:px-8 md:py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-soft)]"
          >
            <ChevronLeft size={16} />
            Back to marketplace
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="soft-card rounded-[2rem] p-6 md:p-8">
              <p className="section-kicker">Admin Review</p>
              <h1 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
                Protected moderator access
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-soft)]">
                The moderation routes now use Keycloak login plus a required admin role, so review
                tools and status changes stay behind real identity checks.
              </p>

              {isConfigured ? (
                <div className="mt-8">
                  <Link
                    href={`/api/auth/keycloak/login?next=${encodeURIComponent(nextPath)}`}
                    className="inline-flex rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-bold text-white"
                  >
                    Continue with Keycloak
                  </Link>
                </div>
              ) : (
                <div className="mt-8 rounded-[1.4rem] border border-[rgba(242,140,40,0.2)] bg-[rgba(242,140,40,0.08)] px-4 py-4 text-sm leading-7 text-[var(--foreground)]">
                  Set `APP_SESSION_SECRET` and `KEYCLOAK_CLIENT_SECRET` in `.env` before opening
                  the review queue.
                </div>
              )}

              {configured === "0" ? (
                <p className="mt-4 text-sm text-[var(--ink-soft)]">
                  Access was blocked because the Keycloak admin auth settings were not configured yet.
                </p>
              ) : null}

              {errorMessage ? (
                <div className="mt-4 rounded-[1.4rem] border border-[rgba(242,140,40,0.2)] bg-[rgba(242,140,40,0.08)] px-4 py-4 text-sm leading-7 text-[var(--foreground)]">
                  {errorMessage}
                </div>
              ) : null}

              {loggedOut === "1" ? (
                <p className="mt-4 text-sm text-[var(--ink-soft)]">
                  Your Buddies admin session has been signed out.
                </p>
              ) : null}
            </div>

            <aside className="dark-panel rounded-[2rem] p-6 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-[#ffc980]">
                <ShieldCheck size={16} />
                Trust fix
              </div>
              <div className="mt-5 space-y-3 text-sm leading-7 text-white/82">
                <p>Admin pages no longer sit open on the public web surface.</p>
                <p>Admin API writes now require the same Keycloak-backed session as the review screens.</p>
                <p>Unapproved listings stay out of public listing detail pages.</p>
                <p>Local dev realm import includes user `moderator` with password `moderator123`.</p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
