import Link from "next/link";
import { ChevronLeft, MapPinned } from "lucide-react";
import { PaxiBulkUploadPanel } from "@/components/paxi-bulk-upload-panel";
import { readRecentPaxiBulkShipments } from "@/lib/paxi-bulk-store";

export const dynamic = "force-dynamic";

export default async function PaxiBulkUploadPage() {
  const recentShipments = await readRecentPaxiBulkShipments(20);

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

          <div className="mt-6 max-w-3xl">
            <p className="section-kicker">Operations</p>
            <h1 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
              PAXI bulk upload staging
            </h1>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
              This route is split away from the public PAXI map. Use the official workbook template
              here to stage parcel rows inside Buddies before they are handled operationally.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/paxi/points" className="text-sm font-semibold text-[var(--accent)]">
              Open live PAXI points map
            </Link>
            <Link href="/paxi" className="text-sm font-semibold text-[var(--accent)]">
              Back to PAXI hub
            </Link>
          </div>

          <div className="mt-8">
            <PaxiBulkUploadPanel />
          </div>

          <div className="mt-8 soft-card rounded-[2rem] p-6">
            <p className="section-kicker">Recent Staged Rows</p>
            {recentShipments.length === 0 ? (
              <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                No PAXI bulk shipment rows have been staged yet.
              </p>
            ) : (
              <div className="mt-4 grid gap-3">
                {recentShipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className="rounded-[1.2rem] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm text-[var(--ink-soft)]"
                  >
                    <span className="font-semibold text-[var(--foreground)]">
                      {shipment.receiverName}
                    </span>{" "}
                    · {shipment.receiverMobile} · {shipment.destinationStore}
                    {shipment.trackingNumber ? ` · ${shipment.trackingNumber}` : ""}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 soft-card rounded-[2rem] p-6">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-2)]">
              <MapPinned size={16} />
              Public lookup stays separate
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
              Buyers and sellers should use the public PAXI points page for live location lookup.
              This screen is for internal staging only.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
