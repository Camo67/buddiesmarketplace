"use client";

import { useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Upload } from "lucide-react";

type ImportedShipment = {
  id: string;
  batchId: string;
  receiverName: string;
  receiverMobile: string;
  destinationStore: string;
  trackingNumber: string | null;
  status: string;
};

type UploadResponse = {
  error?: string;
  errors?: string[];
  batchId?: string | null;
  importedCount?: number;
  shipments?: ImportedShipment[];
};

export function PaxiBulkUploadPanel() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [, startTransition] = useTransition();

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSubmitError("");
    setValidationErrors([]);
    setResult(null);
    setSelectedFile(event.target.files?.[0] ?? null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setValidationErrors([]);
    setResult(null);

    if (!selectedFile) {
      setSubmitError("Choose the PAXI bulk upload workbook before submitting.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/paxi/bulk-upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as UploadResponse;

      if (!response.ok) {
        setSubmitError(data.error ?? "Could not import the workbook.");
        setValidationErrors(data.errors ?? []);
        return;
      }

      setResult(data);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setSubmitError("Could not reach the PAXI bulk upload API. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.04fr)_380px]">
      <div className="soft-card rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="section-kicker">PAXI Bulk Upload</p>
            <h2 className="mt-3 font-serif text-3xl leading-none sm:text-4xl md:text-5xl">
              Upload the official workbook and stage parcels in one pass.
            </h2>
          </div>
          <div className="w-fit rounded-full bg-[rgba(46,139,87,0.1)] px-3 py-2 text-sm font-semibold text-[var(--accent-2)]">
            XLSX only
          </div>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
          This tool expects the official PAXI template layout with the header row on row 12 and
          parcel data from row 13 onward. Valid rows are staged locally for ops review.
        </p>

        <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium">
            Workbook
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 outline-none"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isUploading}
              className="rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? "Uploading..." : "Upload workbook"}
            </button>
            <Link
              href="/templates/paxi-bulk-upload-template.xlsx"
              className="text-sm font-semibold text-[var(--accent)]"
            >
              Download template
            </Link>
            {selectedFile ? (
              <span className="text-sm text-[var(--ink-soft)]">{selectedFile.name}</span>
            ) : null}
          </div>

          {submitError ? (
            <div className="rounded-[1.4rem] border border-[rgba(242,140,40,0.18)] bg-[rgba(242,140,40,0.08)] px-4 py-3 text-sm text-[var(--foreground)]">
              {submitError}
            </div>
          ) : null}

          {validationErrors.length > 0 ? (
            <div className="rounded-[1.4rem] border border-[rgba(214,156,40,0.18)] bg-[rgba(214,156,40,0.08)] px-4 py-4 text-sm text-[var(--foreground)]">
              <p className="font-semibold text-[#9a6915]">Fix these workbook issues first:</p>
              <div className="mt-3 space-y-2 text-[var(--ink-soft)]">
                {validationErrors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            </div>
          ) : null}

          {result?.shipments?.length ? (
            <div className="rounded-[1.4rem] border border-[rgba(46,139,87,0.18)] bg-[rgba(46,139,87,0.08)] px-4 py-4 text-sm text-[var(--foreground)]">
              <p className="font-semibold text-[var(--accent-2)]">
                Batch imported successfully.
              </p>
              <p className="mt-2 text-[var(--ink-soft)]">
                Imported {result.importedCount} parcel rows into local staging batch {result.batchId}.
              </p>
              <div className="mt-4 space-y-2 text-[var(--ink-soft)]">
                {result.shipments.slice(0, 8).map((shipment) => (
                  <p key={shipment.id}>
                    {shipment.receiverName} · {shipment.receiverMobile} · {shipment.destinationStore}
                    {shipment.trackingNumber ? ` · ${shipment.trackingNumber}` : ""}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </form>
      </div>

      <div className="space-y-6">
        <div className="dark-panel rounded-[2rem] p-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-[#ffc980]">
            <FileSpreadsheet size={16} />
            Template rules
          </div>
          <div className="mt-5 space-y-3 text-sm leading-7 text-white/82">
            <p>Keep the official header row on row 12 exactly as supplied.</p>
            <p>Start parcel data from row 13 and leave the intro instructions untouched.</p>
            <p>Receiver mobile numbers are validated to 9 or 10 digits.</p>
            <p>Destination stores must look like PAXI point codes such as `P4455`.</p>
          </div>
        </div>

        <div className="soft-card rounded-[2rem] p-6">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
            <Upload size={16} />
            Flow
          </div>
          <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--ink-soft)]">
            <p>1. Download the template.</p>
            <p>2. Fill parcel rows from line 13 onward.</p>
            <p>3. Upload the workbook here.</p>
            <p>4. Buddies stages the valid parcel rows for ops review.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
