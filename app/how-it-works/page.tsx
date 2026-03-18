import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  FileCheck2,
  ShieldAlert,
  Truck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How BuddiesWorldwide Works",
  description:
    "Three easy steps for selling on BuddiesWorldwide, including identity checks, PAXI delivery, and fraud enforcement.",
};

const signupDetails = [
  'Hit "Join Now"',
  "Enter: real name, phone number, email, city, full physical address (street, suburb, postal code).",
  "Why? So if you scam, SAPS knows your front door.",
];

const verificationItems = [
  "Upload TWO things:",
  "1. Clear pic of your SA ID, driver's license, or passport.",
  "2. Proof of residence - bank statement or utility letter, not older than three months.",
  "We check both in under 24 hours. No fakes.",
  "Green-lit? You post. (Personals? Extra age proof - big red lock.)",
];

const postingItems = [
  "Add pics, price, description - be straight about condition.",
  "Ads reviewed - day max.",
  "Buyer pays? Funds held seven days.",
  `Item fucked up or not as described? Buyer reports, we refund - no questions. You wait till they say "cool."`,
];

export default function HowItWorksPage() {
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

          <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="dark-panel rounded-[2rem] p-6 text-white">
              <p className="section-kicker text-[#ffb36c]">How BuddiesWorldwide Works</p>
              <h1 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
                Three Easy Steps - No Bullshit
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/82">
                BuddiesWorldwide is built to make selling in South Africa feel harder to scam and
                easier to track. That means real identity checks, real address proof, and a clear
                PAXI parcel flow for nationwide delivery.
              </p>

              <div className="mt-6 rounded-[1.7rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,255,255,0.12)] px-3 py-2 text-sm font-semibold text-[#ffc980]">
                  <Truck size={16} />
                  Nationwide Delivery
                </div>
                <p className="mt-4 text-sm leading-7 text-white/84">
                  Sell anywhere in SA - PAXI handles parcels. Shipping's on you - add it to your
                  price or eat it.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/signup?next=/listings/new-service"
                    className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[var(--foreground)]"
                  >
                    Join Now
                  </Link>
                  <Link
                    href="/paxi"
                    className="inline-flex items-center gap-2 rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-white/92"
                  >
                    Open PAXI tools
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <div className="mt-6 rounded-[1.7rem] border border-[rgba(255,107,107,0.24)] bg-[rgba(143,22,28,0.34)] p-5">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#ffb3b3]">
                  <ShieldAlert size={16} />
                  The Deal
                </div>
                <p className="mt-3 text-sm leading-7 text-white/88">
                  We log it all. Scam? Your name, ID, proof of address, phone, ad shots - straight
                  to cops. No mercy.
                </p>
              </div>
            </aside>

            <div className="space-y-6">
              <div className="soft-card rounded-[2rem] p-6 md:p-8">
                <p className="section-kicker">Selling Flow</p>
                <h2 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
                  Do the checks once. Sell with less drama after that.
                </h2>

                <div className="mt-8 grid gap-4">
                  <article className="rounded-[1.7rem] border border-[var(--line)] bg-white/78 p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-[rgba(46,139,87,0.12)] px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent-2)]">
                        Step 1
                      </span>
                      <h3 className="text-2xl font-bold tracking-tight">Sign Up</h3>
                    </div>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--ink-soft)]">
                      {signupDetails.map((item) => (
                        <li
                          key={item}
                          className="rounded-[1.2rem] border border-[var(--line)] bg-white/72 px-4 py-3"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>

                  <article className="rounded-[1.7rem] border border-[var(--line)] bg-white/78 p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-[rgba(242,140,40,0.12)] px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent)]">
                        Step 2
                      </span>
                      <h3 className="text-2xl font-bold tracking-tight">Verify Yourself</h3>
                    </div>
                    <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--ink-soft)]">
                      {verificationItems.map((item, index) => (
                        <div
                          key={item}
                          className="rounded-[1.2rem] border border-[var(--line)] bg-white/72 px-4 py-3"
                        >
                          {index === 0 ? <strong className="text-[var(--foreground)]">{item}</strong> : item}
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="rounded-[1.7rem] border border-[var(--line)] bg-white/78 p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-[rgba(125,30,30,0.12)] px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#962a2a]">
                        Step 3
                      </span>
                      <h3 className="text-2xl font-bold tracking-tight">Post &amp; Sell</h3>
                    </div>
                    <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--ink-soft)]">
                      {postingItems.map((item) => (
                        <div
                          key={item}
                          className="rounded-[1.2rem] border border-[var(--line)] bg-white/72 px-4 py-3"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
              </div>

              <div className="soft-card rounded-[2rem] p-6 md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-3xl">
                    <p className="section-kicker">Nationwide Delivery</p>
                    <h2 className="mt-3 font-serif text-3xl leading-none md:text-4xl">
                      PAXI covers the parcel side. You still own the shipping cost.
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                      Use BuddiesWorldwide to sell across South Africa, then use PAXI points for
                      parcel movement and pickup planning. If you want to charge shipping, build it
                      into the listing price. If not, that cost sits with you.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/70 px-4 py-4 text-sm leading-6 text-[var(--ink-soft)] md:max-w-xs">
                    Public buyer and seller tools already live in the PAXI hub, including point
                    lookup and route access.
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/paxi/points"
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-bold text-white"
                  >
                    Find PAXI points
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/signup?next=/listings/new-service"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold"
                  >
                    <FileCheck2 size={16} />
                    Join and start verification
                  </Link>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[rgba(125,30,30,0.24)] bg-[linear-gradient(135deg,#7d1e1e_0%,#aa2d2d_100%)] px-6 py-6 text-white shadow-[0_24px_60px_rgba(125,30,30,0.22)]">
                <p className="text-sm font-black uppercase tracking-[0.28em] text-[#ffd6d6]">
                  Bottom Banner
                </p>
                <p className="mt-3 text-2xl font-black leading-tight md:text-3xl">
                  "Scammers: ID + address filed. Funds frozen. Door&apos;s next."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
