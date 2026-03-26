import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const deletionSteps = [
  "Email cameron@ourcommunityinunity.org from the address linked to your Buddies Worldwide account and use the subject line 'Data Deletion Request'.",
  "Include your account email, display name, and any details needed to identify the account or listing history you want removed.",
  "We will verify the request, confirm whether any records must be retained for fraud prevention, payment disputes, moderation, or legal compliance, and then process the deletion request for eligible data.",
  "Where full deletion is not possible, we will explain what must be retained and why.",
];

export default function DataDeletionPage() {
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
              <p className="section-kicker text-[#9fe1b8]">User Data Deletion</p>
              <h1 className="mt-3 font-serif text-4xl leading-none">
                How to request deletion of Buddies Worldwide account data.
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/82">
                This page explains how Buddies Worldwide handles requests to delete account,
                listing, verification, and related marketplace data.
              </p>
              <div className="mt-6 rounded-[1.5rem] bg-white/10 px-4 py-4 text-sm leading-6 text-white/84">
                Some records may need to be kept where fraud prevention, moderation, payment
                disputes, or legal compliance require retention.
              </div>
            </aside>

            <div className="soft-card rounded-[2rem] p-6 md:p-8">
              <p className="section-kicker">Deletion Instructions</p>
              <h2 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
                Send a verified request and we will handle eligible data removal.
              </h2>

              <div className="mt-8 space-y-4">
                {deletionSteps.map((step, index) => (
                  <article
                    key={step}
                    className="rounded-[1.6rem] border border-[var(--line)] bg-white/75 p-5"
                  >
                    <h3 className="text-xl font-bold tracking-tight">Step {index + 1}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{step}</p>
                  </article>
                ))}
              </div>

              <div className="mt-8 rounded-[1.6rem] border border-[var(--line)] bg-white/70 p-5">
                <h3 className="text-xl font-bold tracking-tight">Contact</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                  Email{" "}
                  <a
                    href="mailto:cameron@ourcommunityinunity.org"
                    className="font-semibold text-[var(--accent)]"
                  >
                    cameron@ourcommunityinunity.org
                  </a>{" "}
                  for privacy and deletion requests.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/privacy"
                  className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-bold text-white"
                >
                  Read privacy policy
                </Link>
                <Link
                  href="/terms"
                  className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold"
                >
                  Read terms
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
