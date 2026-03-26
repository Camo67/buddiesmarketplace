import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const sections = [
  {
    title: "1. Information we collect",
    body:
      "Buddies Worldwide collects the details you submit when creating an account, contacting support, listing an item or service, making a purchase, submitting moderation reports, or sending verification documents. This may include your name, email address, phone number, listing content, transaction details, uploaded documents, and basic technical information such as device, browser, IP address, and usage logs.",
  },
  {
    title: "2. Why we use it",
    body:
      "We use personal information to operate the marketplace, authenticate users, review verification documents, prevent fraud, moderate listings, process payments, support delivery and pickup flows, respond to abuse reports, and improve the service.",
  },
  {
    title: "3. Verification and safety checks",
    body:
      "If you want to advertise, buy, or sell through protected marketplace flows, Buddies Worldwide may ask for identity or address documents. Those documents are used only for verification, safety enforcement, fraud prevention, and compliance obligations.",
  },
  {
    title: "4. Sharing with service providers",
    body:
      "We may share limited information with service providers that help us run the platform, such as hosting, authentication, payments, communications, analytics, moderation, or delivery partners. We do not sell personal information as a standalone product.",
  },
  {
    title: "5. Messaging, payments, and external platforms",
    body:
      "If you interact with Buddies Worldwide through Meta products, payment providers, shipping providers, or linked authentication systems, those services may process data according to their own terms and privacy policies in addition to ours.",
  },
  {
    title: "6. Retention",
    body:
      "We keep information for as long as reasonably necessary to operate the marketplace, resolve disputes, investigate fraud, comply with legal requirements, and maintain safety records. Verification records and moderation logs may be retained longer where risk, abuse prevention, or legal compliance requires it.",
  },
  {
    title: "7. Your choices",
    body:
      "You can ask to access, correct, or delete personal information we control, subject to any records we must retain for security, fraud prevention, transactions, or legal obligations. If you delete your account, some marketplace records may still be retained where required for enforcement or compliance.",
  },
  {
    title: "8. Contact",
    body:
      "For privacy questions or data requests, contact Buddies Worldwide at cameron@ourcommunityinunity.org.",
  },
];

export default function PrivacyPage() {
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
              <p className="section-kicker text-[#9fe1b8]">Privacy Policy</p>
              <h1 className="mt-3 font-serif text-4xl leading-none">
                Clear data rules for a trust-first marketplace.
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/82">
                This privacy policy explains what Buddies Worldwide collects, why it is collected,
                and how the platform uses verification, payment, and moderation data to keep the
                marketplace safer.
              </p>
              <div className="mt-6 rounded-[1.5rem] bg-white/10 px-4 py-4 text-sm leading-6 text-white/84">
                Trading features may require document review before buying, selling, or
                advertising is unlocked.
              </div>
            </aside>

            <div className="soft-card rounded-[2rem] p-6 md:p-8">
              <p className="section-kicker">Buddies Worldwide Privacy Policy</p>
              <h2 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
                We use personal data to run the service, prevent fraud, and protect users.
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
                  Create account
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
