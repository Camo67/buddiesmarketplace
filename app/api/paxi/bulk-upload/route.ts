import { NextResponse } from "next/server";
import { parsePaxiBulkWorkbook } from "@/lib/paxi-bulk";
import { createPaxiBulkShipmentBatch } from "@/lib/paxi-bulk-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = (
      formData as unknown as { get(name: string): FormDataEntryValue | null }
    ).get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Attach a .xlsx file before uploading." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json(
        { error: "Only .xlsx workbooks are supported for the PAXI bulk upload flow." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parsePaxiBulkWorkbook(buffer);

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        {
          error: "The workbook has validation errors.",
          errors: parsed.errors,
          shipments: parsed.shipments,
        },
        { status: 400 },
      );
    }

    const shipments = await createPaxiBulkShipmentBatch(parsed.shipments, file.name);

    return NextResponse.json({
      batchId: shipments[0]?.batchId ?? null,
      importedCount: shipments.length,
      shipments,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not process the PAXI bulk upload workbook.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
