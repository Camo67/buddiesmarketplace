import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const sections = [
  {
    title: "1. Eligibility",
    body:
      "You may use Buddies Worldwide only in line with these terms and any age rules that apply to specific sections. The Personals section is restricted to users aged 18 or older and may require additional confirmation before access is granted.",
  },
  {
    title: "2. Account Registration",
    body:
      "You must provide accurate personal details when signing up, keep your login secure, and avoid creating duplicate or misleading accounts. Impersonation, false identity claims and fake business representation are prohibited.",
  },
  {
    title: "3. Terms Acceptance",
    body:
      "By creating an account you agree to these Terms and Conditions, the platform safety rules, and any future policy updates that are reasonably communicated to users.",
  },
  {
    title: "4. Listings and Conduct",
    body:
      "You may not post scams, stolen goods, deceptive pricing, illegal services, counterfeit products, harassment, hate speech or content that misrepresents the item or service being offered.",
  },
  {
    title: "5. Personals Section",
    body:
      "The Personals area is strictly for adults. Buddies Worldwide may impose additional moderation, category restrictions, reporting controls and removals in this section to protect users and reduce abuse.",
  },
  {
    title: "6. Enforcement",
    body:
      "We may remove listings, limit visibility, request verification, suspend selling privileges, or terminate accounts where safety, fraud prevention or legal compliance requires it.",
  },
  {
    title: "7. Data and Privacy",
    body:
      "Buddies Worldwide may use personal information to operate the marketplace, prevent fraud and improve the service. If we ever want to sell, license or otherwise monetize personal data beyond normal service operations, we will ask for separate, explicit consent in a clear privacy flow rather than burying that consent in these terms.",
  },
];

export default function TermsPage() {
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

          <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="dark-panel rounded-[2rem] p-6 text-white">
              <p className="section-kicker text-[#9fe1b8]">Terms &amp; Conditions</p>
              <h1 className="mt-3 font-serif text-4xl leading-none">
                Clear rules before account creation.
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/82">
                These are product-facing starter terms for the frontend. They set the tone for age
                gating around Personals, fraud prevention and marketplace conduct while the full
                legal draft is still being prepared.
              </p>
              <div className="mt-6 rounded-[1.5rem] bg-white/10 px-4 py-4 text-sm leading-6 text-white/84">
                Most important rule: the Personals section is locked to users aged 18 or above.
              </div>
            </aside>

            <div className="soft-card rounded-[2rem] p-6 md:p-8">
              <p className="section-kicker">Buddies Worldwide Rules</p>
              <h2 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
                Marketplace use is conditional on honest accounts, acceptance of these terms and
                18+ eligibility for Personals access.
              </h2>

              <div className="mt-8 space-y-4">
                {sections.map((section) => (
                  <article
                    key={section.title}
                    className="rounded-[1.6rem] border border-[var(--line)] bg-white/75 p-5"
                  >
                    <h3 className="text-xl font-bold tracking-tight">{section.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                      {section.body}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-bold text-white"
                >
                  Accept and sign up
                </Link>
                <Link
                  href="/"
                  className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold"
                >
                  Return home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
