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
      ? "This Supabase account is signed in, but it is not allowed to open the moderation tools."
      : error === "invalid_credentials"
        ? "Those moderator credentials were not accepted."
        : error === "email_not_confirmed"
          ? "Confirm the account email before trying to open the moderator queue."
          : error === "missing_credentials"
            ? "Enter both the moderator email and password."
            : error === "login_failed"
              ? "The Supabase admin sign-in could not be completed. Check the Supabase auth settings and try again."
              : error === "auth_unavailable"
                ? "Supabase auth is not configured yet for this app."
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
                The moderation routes now use Supabase sign-in plus required admin access, so
                review tools and status changes stay behind real identity checks.
              </p>

              {isConfigured ? (
                <form
                  action={`/api/auth/admin/login?next=${encodeURIComponent(nextPath)}`}
                  method="post"
                  className="mt-8 grid max-w-xl gap-4"
                >
                  <label className="grid gap-2 text-sm font-semibold text-[var(--foreground)]">
                    Admin email
                    <input
                      type="email"
                      name="email"
                      required
                      autoComplete="email"
                      className="rounded-[1.2rem] border border-[var(--line)] bg-white/80 px-4 py-3 font-medium outline-none"
                      placeholder="moderator@buddiesworldwide.online"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-[var(--foreground)]">
                    Password
                    <input
                      type="password"
                      name="password"
                      required
                      autoComplete="current-password"
                      className="rounded-[1.2rem] border border-[var(--line)] bg-white/80 px-4 py-3 font-medium outline-none"
                      placeholder="Enter your password"
                    />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex w-fit rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-bold text-white"
                  >
                    Sign in with Supabase
                  </button>
                </form>
              ) : (
                <div className="mt-8 rounded-[1.4rem] border border-[rgba(242,140,40,0.2)] bg-[rgba(242,140,40,0.08)] px-4 py-4 text-sm leading-7 text-[var(--foreground)]">
                  Set `APP_SESSION_SECRET`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` before
                  opening the review queue in production.
                </div>
              )}

              {configured === "0" ? (
                <p className="mt-4 text-sm text-[var(--ink-soft)]">
                  Access was blocked because the Supabase admin auth settings were not configured yet.
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
                <p>Admin API writes now require the same Supabase-backed session as the review screens.</p>
                <p>Unapproved listings stay out of public listing detail pages.</p>
                <p>Allow moderator accounts through `SUPABASE_ADMIN_EMAILS` or Supabase role metadata.</p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
