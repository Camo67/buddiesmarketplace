import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ChevronLeft, ShieldCheck, Sparkles } from "lucide-react";
import { BotProtectionFields } from "@/components/bot-protection-fields";
import { ProgressStepper } from "@/components/progress-stepper";
import { StatusPill } from "@/components/status-pill";
import { TurnstileScript } from "@/components/turnstile-script";
import { getBotProtectionPublicConfig } from "@/lib/bot-protection";
import { readUserSession, sanitizeUserRedirectPath, userSessionCookieName } from "@/lib/user-auth";

const safetyChecklist = [
  "Email sign-up keeps onboarding fast without exposing trading tools too early.",
  "Verification review is required before posting or higher-trust marketplace actions unlock.",
  "Buddies may restrict accounts linked to fraud, impersonation, or abusive behavior.",
];

const reassurancePoints = [
  "Browse first, verify when you are ready to trade.",
  "Use one account for sign-in, verification status, and future seller tools.",
  "Document review protects both buyers and sellers from low-accountability trading.",
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
  const botProtection = getBotProtectionPublicConfig();
  const cookieStore = await cookies();
  const userSession = await readUserSession(cookieStore.get(userSessionCookieName)?.value);

  if (userSession) {
    redirect(nextPath);
  }

  const errorMessage = error
    ? {
        missing_credentials: "Enter both an email address and password to continue.",
        invalid_credentials: "That email and password combination was not accepted.",
        email_not_confirmed: "Confirm your email first, then sign in.",
        account_exists: "An account with that email already exists. Sign in instead.",
        sign_up_failed:
          "Supabase could not finish creating your account. Check the auth settings and try again.",
        sign_in_failed: "Supabase could not sign you in just now. Try again in a moment.",
        bot_protection_failed: "Please complete the anti-bot check and try again.",
      }[error] ?? null
    : null;
  const showSigninCard = mode === "signin";

  return (
    <main className="page-safe-bottom pt-4">
      {botProtection.enabled ? <TurnstileScript /> : null}
      <section className="page-shell">
        <div className="glass-panel rounded-[2.4rem] px-5 py-5 md:px-8 md:py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-soft)]"
          >
            <ChevronLeft size={16} />
            Back to marketplace
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
            <aside className="dark-panel rounded-[2rem] p-6 text-white">
              <StatusPill tone="info" className="border-white/12 bg-white/10 text-white">
                Marketplace onboarding
              </StatusPill>
              <h1 className="mt-4 font-serif text-4xl leading-none tracking-[-0.05em] md:text-5xl">
                Start simple. Unlock trust as you go.
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/80">
                Buddies Worldwide keeps account creation lightweight, then adds verification before
                higher-trust actions open. That balance keeps browsing accessible while protecting
                the marketplace from anonymous trading behavior.
              </p>

              <div className="mt-6">
                <ProgressStepper
                  steps={[
                    {
                      label: "Create account",
                      description: "Email and password create the identity used across the marketplace.",
                      status: "current",
                    },
                    {
                      label: "Submit verification",
                      description: "Identity and address review unlock selling and future trust-gated actions.",
                      status: "upcoming",
                    },
                    {
                      label: "Trade with confidence",
                      description: "Approved accounts move into a calmer, more accountable trade flow.",
                      status: "upcoming",
                    },
                  ]}
                />
              </div>

              <div className="mt-6 rounded-[1.7rem] border border-white/12 bg-white/10 p-5">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                  <ShieldCheck size={16} />
                  Safety checklist
                </div>
                <div className="mt-4 space-y-3 text-sm leading-7 text-white/82">
                  {safetyChecklist.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.2rem] border border-white/10 bg-[rgba(255,255,255,0.08)] px-4 py-3"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <div className="space-y-6">
              <div className="soft-card rounded-[2rem] p-6 md:p-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="section-kicker">Create Account</p>
                    <h2 className="mt-3 font-serif text-4xl leading-none tracking-[-0.05em] md:text-5xl">
                      Join with email, then build trust.
                    </h2>
                  </div>
                  <div className="flex gap-4 text-sm font-semibold text-[var(--accent)]">
                    <Link href="/privacy">Privacy</Link>
                    <Link href="/terms">Terms</Link>
                  </div>
                </div>

                <div className="mt-8 grid gap-4">
                  {errorMessage ? (
                    <div className="rounded-[1.4rem] border border-[rgba(255,127,80,0.2)] bg-[rgba(255,127,80,0.08)] px-4 py-3 text-sm text-[var(--foreground)]">
                      {errorMessage}
                    </div>
                  ) : null}

                  {checkEmail === "1" ? (
                    <div className="rounded-[1.4rem] border border-[rgba(46,139,87,0.18)] bg-[rgba(46,139,87,0.08)] px-4 py-3 text-sm text-[var(--foreground)]">
                      Check your inbox for the Supabase confirmation email, then come back to sign
                      in.
                    </div>
                  ) : null}

                  {confirmed === "1" ? (
                    <div className="rounded-[1.4rem] border border-[rgba(46,139,87,0.18)] bg-[rgba(46,139,87,0.08)] px-4 py-3 text-sm text-[var(--foreground)]">
                      Your email has been confirmed. You can sign in now.
                    </div>
                  ) : null}

                  <BotProtectionFields
                    enabled={botProtection.enabled}
                    siteKey={botProtection.siteKey}
                    action="account_auth"
                    formIds={["signup-register-form", "signup-signin-form"]}
                  />

                  <div className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--background-alt)] p-4">
                    <p className="text-sm leading-7 text-[var(--ink-soft)]">
                      Browsing is immediate after sign-in. Selling and other higher-trust actions
                      stay locked until your verification documents are reviewed.
                    </p>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <form
                      id="signup-register-form"
                      action={`/api/auth/login?mode=register&next=${encodeURIComponent(nextPath)}`}
                      method="post"
                      className={`grid gap-3 rounded-[1.7rem] border p-5 ${
                        showSigninCard
                          ? "border-[var(--line)] bg-white/76"
                          : "border-[rgba(255,127,80,0.18)] bg-[rgba(255,127,80,0.06)]"
                      }`}
                    >
                      <p className="text-sm font-semibold text-[var(--foreground)]">Create account</p>
                      <input
                        type="text"
                        name="displayName"
                        autoComplete="name"
                        placeholder="Display name"
                        className="rounded-[1.1rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                      />
                      <input
                        type="email"
                        name="email"
                        required
                        autoComplete="email"
                        placeholder="Email address"
                        className="rounded-[1.1rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                      />
                      <input
                        type="password"
                        name="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="Create a password"
                        className="rounded-[1.1rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                      />
                      <button
                        type="submit"
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(255,127,80,0.22)]"
                      >
                        Create account
                      </button>
                      <p className="text-sm leading-6 text-[var(--ink-soft)]">
                        If Supabase email confirmation is enabled, verify your inbox before the
                        first sign-in.
                      </p>
                    </form>

                    <form
                      id="signup-signin-form"
                      action={`/api/auth/login?mode=signin&next=${encodeURIComponent(nextPath)}`}
                      method="post"
                      className={`grid gap-3 rounded-[1.7rem] border p-5 ${
                        showSigninCard
                          ? "border-[rgba(255,127,80,0.18)] bg-[rgba(255,127,80,0.06)]"
                          : "border-[var(--line)] bg-white/76"
                      }`}
                    >
                      <p className="text-sm font-semibold text-[var(--foreground)]">I already have an account</p>
                      <input
                        type="email"
                        name="email"
                        required
                        autoComplete="email"
                        placeholder="Email address"
                        className="rounded-[1.1rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                      />
                      <input
                        type="password"
                        name="password"
                        required
                        autoComplete="current-password"
                        placeholder="Password"
                        className="rounded-[1.1rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                      />
                      <button
                        type="submit"
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-6 py-3 text-sm font-semibold text-[var(--foreground)]"
                      >
                        Sign in
                      </button>
                      <p className="text-sm leading-6 text-[var(--ink-soft)]">
                        After sign-in, Buddies creates or refreshes your marketplace profile
                        automatically.
                      </p>
                    </form>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="soft-card rounded-[1.8rem] p-5">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--trust)]">
                    <Sparkles size={16} />
                    Why this flow works
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--ink-soft)]">
                    {reassurancePoints.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </div>

                <div className="soft-card rounded-[1.8rem] p-5">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--success)]">
                    <ShieldCheck size={16} />
                    What happens next
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                    Once your account is active, the next step is verification. That is where
                    Buddies turns sign-up into a more accountable trading identity.
                  </p>
                  <Link
                    href="/verify"
                    className="mt-5 inline-flex min-h-11 items-center rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
                  >
                    View verification flow
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
