import { NextResponse } from "next/server";
import {
  paxiCoverageFacts,
  paxiPointLocatorEmbedUrl,
  paxiMarketplaceNote,
  paxiOfficialLinks,
  paxiServiceWindows,
} from "@/lib/paxi";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    provider: "PAXI",
    serviceWindows: paxiServiceWindows,
    note: paxiMarketplaceNote,
    embedUrl: paxiPointLocatorEmbedUrl,
    coverageFacts: paxiCoverageFacts,
    links: paxiOfficialLinks,
  });
}
