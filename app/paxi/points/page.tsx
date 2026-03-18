import Link from "next/link";
import { ChevronLeft, ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import {
  paxiCoverageFacts,
  paxiOfficialLinks,
  paxiPointLocatorEmbedUrl,
} from "@/lib/paxi";

export default function PaxiPointsPage() {
  return (
    <main className="pb-16 pt-4">
      <section className="page-shell">
        <div className="glass-panel rounded-[2.4rem] px-5 py-6 md:px-8 md:py-8">
          <Link
            href="/paxi"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-soft)]"
          >
            <ChevronLeft size={16} />
            Back to PAXI tools
          </Link>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <div className="dark-panel rounded-[2.2rem] px-6 py-7 text-white md:px-8 md:py-8">
                <p className="section-kicker text-[#ffc980]">PAXI point locator</p>
                <h1 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
                  Live South Africa map for PAXI drop-off and pickup points.
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-white/82">
                  This is Buddies using PAXI&apos;s live locator, so buyers and sellers can check
                  real point locations before they agree on delivery.
                </p>
              </div>

              <div className="mt-6 overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white shadow-[0_24px_70px_rgba(7,32,23,0.12)]">
                <iframe
                  title="PAXI South Africa point locator"
                  src={paxiPointLocatorEmbedUrl}
                  className="h-[70vh] min-h-[560px] w-full border-0"
                  allow="geolocation"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="soft-card rounded-[1.8rem] p-5">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-2)]">
                    <MapPin size={16} />
                    Search smarter
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                    Search by area, suburb, town, or a known PAXI point code like `P4455`.
                  </p>
                </div>
                <div className="soft-card rounded-[1.8rem] p-5">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-2)]">
                    <ShieldCheck size={16} />
                    Use in chat
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                    Agree the exact point code in writing so both sides know the chosen drop-off
                    or pickup location.
                  </p>
                </div>
                <div className="soft-card rounded-[1.8rem] p-5">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-2)]">
                    <ExternalLink size={16} />
                    Official fallback
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                    If the embedded map has trouble loading, open the official PAXI locator in a
                    new tab.
                  </p>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="soft-card rounded-[2rem] p-6">
                <p className="section-kicker">Network Notes</p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--ink-soft)]">
                  {paxiCoverageFacts.map((fact) => (
                    <div
                      key={fact}
                      className="rounded-[1.2rem] border border-[var(--line)] bg-white/75 px-4 py-3"
                    >
                      {fact}
                    </div>
                  ))}
                </div>
              </div>

              <div className="soft-card rounded-[2rem] p-6">
                <p className="section-kicker">Next Steps</p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--ink-soft)]">
                  <p>1. Search for the closest point to the buyer or seller.</p>
                  <p>2. Share the point code in your Buddies conversation.</p>
                  <p>3. Confirm payment and the selected delivery speed before sending.</p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={paxiOfficialLinks.pointLocator}
                    className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-bold text-white"
                  >
                    Open official locator
                  </Link>
                  <Link
                    href="/paxi/bulk-upload"
                    className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold"
                  >
                    Open ops bulk upload
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
