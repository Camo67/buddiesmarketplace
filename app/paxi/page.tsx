import Link from "next/link";
import { ArrowRight, ChevronLeft, MapPinned, PackageCheck } from "lucide-react";
import { paxiCoverageFacts, paxiOfficialLinks } from "@/lib/paxi";

export default function PaxiHubPage() {
  return (
    <main className="pb-16 pt-4">
      <section className="page-shell">
        <div className="glass-panel rounded-[2.4rem] px-5 py-6 md:px-8 md:py-8">
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-soft)]"
          >
            <ChevronLeft size={16} />
            Back to listings
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className="hero-panel relative overflow-hidden rounded-[2.2rem] px-6 py-8 text-white md:px-8 md:py-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(242,140,40,0.26),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(96,193,130,0.18),transparent_30%)]" />
              <div className="relative">
                <p className="section-kicker text-[#ffc980]">PAXI in South Africa</p>
                <h1 className="mt-4 font-serif text-4xl leading-none md:text-6xl">
                  Live drop-off and pickup tools for Buddies deliveries.
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/82 md:text-base">
                  Split the PAXI flow into public point discovery and internal operations. Buyers
                  and sellers can use the live locator map, while the bulk workbook flow stays
                  separate for staging parcel batches.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <Link
                    href="/paxi/points"
                    className="rounded-[1.8rem] border border-white/12 bg-white/10 p-5 backdrop-blur transition hover:bg-white/14"
                  >
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-[#9fe1b8]">
                      <MapPinned size={16} />
                      Public tool
                    </div>
                    <h2 className="mt-4 text-2xl font-bold">Find PAXI points</h2>
                    <p className="mt-3 text-sm leading-7 text-white/80">
                      Open the live South Africa point locator map and search by place or PAXI
                      point code.
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#ffc980]">
                      Open map
                      <ArrowRight size={16} />
                    </span>
                  </Link>

                  <Link
                    href="/paxi/bulk-upload"
                    className="rounded-[1.8rem] border border-white/12 bg-white/10 p-5 backdrop-blur transition hover:bg-white/14"
                  >
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-[#9fe1b8]">
                      <PackageCheck size={16} />
                      Ops tool
                    </div>
                    <h2 className="mt-4 text-2xl font-bold">Bulk upload staging</h2>
                    <p className="mt-3 text-sm leading-7 text-white/80">
                      Use the official workbook to stage parcel rows for review before operational
                      handoff.
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#ffc980]">
                      Open staging
                      <ArrowRight size={16} />
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="soft-card rounded-[2rem] p-6">
                <p className="section-kicker">Coverage Facts</p>
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
                <p className="section-kicker">Official Links</p>
                <div className="mt-4 space-y-3 text-sm font-semibold text-[var(--accent)]">
                  <Link href="/paxi/points" className="block">
                    Open Buddies point locator
                  </Link>
                  <Link href={paxiOfficialLinks.pointLocator} className="block">
                    Open PAXI locator directly
                  </Link>
                  <Link href={paxiOfficialLinks.business} className="block">
                    PAXI business tools
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
