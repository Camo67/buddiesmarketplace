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
    mode?: string;
    check_email?: string;
    confirmed?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { next, error, mode, check_email: checkEmail, confirmed } = await searchParams;
  const nextPath = sanitizeUserRedirectPath(next);
  const cookieStore = await cookies();
  const userSession = await readUserSession(cookieStore.get(userSessionCookieName)?.value);

  if (userSession) {
    redirect(nextPath);
  }

  const errorMessage =
    error === "missing_credentials"
      ? "Enter both an email address and password to continue."
      : error === "invalid_credentials"
        ? "That email and password combination was not accepted."
        : error === "email_not_confirmed"
          ? "Confirm your email first, then sign in."
          : error === "account_exists"
            ? "An account with that email already exists. Sign in instead."
            : error === "sign_up_failed"
              ? "Supabase could not finish creating your account. Check the auth settings and try again."
              : error === "sign_in_failed"
                ? "Supabase could not sign you in just now. Try again in a moment."
          : null;
  const showSigninCard = mode === "signin";

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
                  This page now routes sign-up and sign-in through Supabase Auth, then creates a
                  marketplace user profile in the marketplace database after sign-in succeeds.
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
                {errorMessage ? (
                  <div className="rounded-[1.4rem] border border-[rgba(242,140,40,0.2)] bg-[rgba(242,140,40,0.08)] px-4 py-3 text-sm text-[var(--foreground)]">
                    {errorMessage}
                  </div>
                ) : null}

                {checkEmail === "1" ? (
                  <div className="rounded-[1.4rem] border border-[rgba(46,139,87,0.18)] bg-[rgba(46,139,87,0.08)] px-4 py-3 text-sm text-[var(--foreground)]">
                    Check your inbox for the Supabase confirmation email, then come back here and
                    sign in.
                  </div>
                ) : null}

                {confirmed === "1" ? (
                  <div className="rounded-[1.4rem] border border-[rgba(46,139,87,0.18)] bg-[rgba(46,139,87,0.08)] px-4 py-3 text-sm text-[var(--foreground)]">
                    Your email has been confirmed. You can sign in now.
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
                    By continuing through Supabase Auth, users still need to follow the Buddies
                    terms, age-gated category rules, and anti-scam marketplace standards shown on
                    this page.
                  </p>
                </fieldset>

                <div className="grid gap-4 lg:grid-cols-2">
                  <form
                    action={`/api/auth/login?mode=register&next=${encodeURIComponent(nextPath)}`}
                    method="post"
                    className={`grid gap-3 rounded-[1.6rem] border p-4 ${
                      showSigninCard
                        ? "border-[var(--line)] bg-white/72"
                        : "border-[rgba(46,139,87,0.18)] bg-[rgba(46,139,87,0.08)]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[var(--foreground)]">Create account</p>
                    <input
                      type="text"
                      name="displayName"
                      autoComplete="name"
                      placeholder="Display name"
                      className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 text-sm outline-none"
                    />
                    <input
                      type="email"
                      name="email"
                      required
                      autoComplete="email"
                      placeholder="Email address"
                      className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 text-sm outline-none"
                    />
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Create a password"
                      className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 text-sm outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-bold text-white"
                    >
                      Create account
                    </button>
                    <p className="text-sm text-[var(--ink-soft)]">
                      If email confirmation is enabled in Supabase, we’ll ask you to verify before
                      the first sign-in.
                    </p>
                  </form>

                  <form
                    action={`/api/auth/login?mode=signin&next=${encodeURIComponent(nextPath)}`}
                    method="post"
                    className={`grid gap-3 rounded-[1.6rem] border p-4 ${
                      showSigninCard
                        ? "border-[rgba(46,139,87,0.18)] bg-[rgba(46,139,87,0.08)]"
                        : "border-[var(--line)] bg-white/72"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[var(--foreground)]">I already have an account</p>
                    <input
                      type="email"
                      name="email"
                      required
                      autoComplete="email"
                      placeholder="Email address"
                      className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 text-sm outline-none"
                    />
                    <input
                      type="password"
                      name="password"
                      required
                      autoComplete="current-password"
                      placeholder="Password"
                      className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 text-sm outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-full border border-[var(--line)] bg-white px-6 py-3 text-sm font-semibold"
                    >
                      Sign in
                    </button>
                    <p className="text-sm text-[var(--ink-soft)]">
                      After sign-in, Buddies creates or refreshes your marketplace profile automatically.
                    </p>
                  </form>
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
