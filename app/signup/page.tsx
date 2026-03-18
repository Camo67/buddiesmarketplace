import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ChevronLeft, CircleCheck, ShieldAlert } from "lucide-react";
import { readUserSession, sanitizeUserRedirectPath, userSessionCookieName } from "@/lib/user-auth";

const ruleItems = [
  "You must accept the Terms and Conditions before your account is created.",
  "Personals listings and interactions are restricted to adults and reviewed more strictly.",
  "Buddies Worldwide may suspend accounts involved in scams, impersonation or abusive conduct.",
  "General marketplace browsing, listings and messaging follow platform safety rules for all users.",
];

const trustChecks = [
  "Email verification during onboarding",
  "Optional seller verification before listing access expands",
  "Reporting tools for suspicious listings and user behavior",
];

type SignupPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { next, error } = await searchParams;
  const nextPath = sanitizeUserRedirectPath(next);
  const cookieStore = await cookies();
  const userSession = await readUserSession(cookieStore.get(userSessionCookieName)?.value);

  if (userSession) {
    redirect(nextPath);
  }

  const errorMessage =
    error === "login_cancelled"
      ? "The Keycloak sign-in was cancelled before it finished."
      : error === "missing_callback"
        ? "The Keycloak callback was missing required parameters."
        : error === "callback_failed"
          ? "The Keycloak sign-in could not be completed. Check your Keycloak settings and try again."
          : error === "auth_unavailable"
            ? "Keycloak is not ready for marketplace login yet. Check that the buddies realm exists and try again."
          : null;

  return (
    <main className="pb-16 pt-4">
      <section className="page-shell">
        <div className="glass-panel rounded-[2.4rem] px-5 py-5 md:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-soft)]"
          >
            <ChevronLeft size={16} />
            Back to marketplace
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="dark-panel rounded-[2rem] p-6 text-white">
              <p className="section-kicker text-[#ffc980]">Sign Up</p>
              <h1 className="mt-3 font-serif text-4xl leading-none">
                Join Buddies Worldwide.
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/80">
                The first version of signup should make the key rules impossible to miss: terms
                required, stronger trust checks for safer trading, and a locked Personals section
                for verified adults only.
              </p>

              <div className="mt-6 space-y-3">
                {ruleItems.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.3rem] border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/84"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.5rem] bg-white px-5 py-4 text-[var(--foreground)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Live auth step
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                  This page now routes sign-up and sign-in through Keycloak, then creates a
                  marketplace user profile in MySQL after the callback succeeds.
                </p>
              </div>
            </aside>

            <div className="soft-card rounded-[2rem] p-6 md:p-8">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="section-kicker">Create Account</p>
                  <h2 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
                    Buyers today, sellers tomorrow.
                  </h2>
                </div>
                <Link
                  href="/terms"
                  className="text-sm font-semibold text-[var(--accent)]"
                >
                  Read full terms
                </Link>
              </div>

              <div className="mt-8 grid gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/api/auth/login?mode=register&next=${encodeURIComponent(nextPath)}`}
                    className="rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-bold text-white"
                  >
                    Create account with Keycloak
                  </Link>
                  <Link
                    href={`/api/auth/login?next=${encodeURIComponent(nextPath)}`}
                    className="rounded-full border border-[var(--line)] px-6 py-3 text-sm font-semibold"
                  >
                    I already have an account
                  </Link>
                </div>

                {errorMessage ? (
                  <div className="rounded-[1.4rem] border border-[rgba(242,140,40,0.2)] bg-[rgba(242,140,40,0.08)] px-4 py-3 text-sm text-[var(--foreground)]">
                    {errorMessage}
                  </div>
                ) : null}

                <fieldset className="grid gap-3 rounded-[1.5rem] border border-[var(--line)] bg-white/65 p-4">
                  <legend className="px-2 text-sm font-semibold text-[var(--foreground)]">
                    Account intent
                  </legend>
                  <p className="text-sm leading-6 text-[var(--ink-soft)]">
                    Create the account first, browse immediately, then open the service-listing flow
                    once you are signed in.
                  </p>
                </fieldset>
                <fieldset className="grid gap-3 rounded-[1.5rem] border border-[rgba(242,140,40,0.18)] bg-[rgba(242,140,40,0.06)] p-4">
                  <legend className="px-2 text-sm font-semibold text-[var(--foreground)]">
                    Required confirmations
                  </legend>
                  <p className="text-sm leading-6 text-[var(--foreground)]">
                    By continuing through Keycloak, users still need to follow the Buddies terms,
                    age-gated category rules, and anti-scam marketplace standards shown on this
                    page.
                  </p>
                </fieldset>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/api/auth/login?mode=register&next=${encodeURIComponent(nextPath)}`}
                    className="rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-bold text-white"
                  >
                    Continue to registration
                  </Link>
                  <span className="text-sm text-[var(--ink-soft)]">
                    After login, Buddies creates your marketplace user profile automatically.
                  </span>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.6rem] border border-[var(--line)] bg-white/70 p-5">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-2)]">
                    <CircleCheck size={16} />
                    Trust checks
                  </div>
                  <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--ink-soft)]">
                    {trustChecks.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-[var(--line)] bg-white/70 p-5">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
                    <ShieldAlert size={16} />
                    Why Personals is locked
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
                    It lets the broader marketplace stay accessible while adding a stricter trust
                    layer around adult-only interactions and higher-risk misuse patterns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
