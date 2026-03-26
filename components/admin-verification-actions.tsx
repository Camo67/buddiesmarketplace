"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  verificationStatusLabels,
  type VerificationStatus,
} from "@/lib/user-verification";

type AdminVerificationActionsProps = {
  userId: string;
  currentStatus: VerificationStatus;
  currentReviewNote: string | null;
  currentReviewedBy: string | null;
};

const moderationStatuses: VerificationStatus[] = [
  "submitted",
  "verified",
  "changes_requested",
];

export function AdminVerificationActions({
  userId,
  currentStatus,
  currentReviewNote,
  currentReviewedBy,
}: AdminVerificationActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<VerificationStatus>(currentStatus);
  const [reviewNote, setReviewNote] = useState(currentReviewNote ?? "");
  const [reviewedBy, setReviewedBy] = useState(currentReviewedBy ?? "Local Moderator");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function saveChanges() {
    setFeedback("");
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/verification`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          reviewNote,
          reviewedBy,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Could not update verification status.");
        return;
      }

      setFeedback("Verification review saved.");
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Could not reach the verification review API. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    setStatus(event.target.value as VerificationStatus);
  }

  return (
    <div className="soft-card rounded-[2rem] p-6">
      <p className="section-kicker">Verification Review</p>
      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-medium">
          Status
          <select
            value={status}
            onChange={handleStatusChange}
            className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 outline-none"
          >
            {moderationStatuses.map((item) => (
              <option key={item} value={item}>
                {verificationStatusLabels[item]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Reviewed by
          <input
            value={reviewedBy}
            onChange={(event) => setReviewedBy(event.target.value)}
            className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 outline-none"
            placeholder="Local Moderator"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Review note
          <textarea
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            className="min-h-28 rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 outline-none"
            placeholder="Add approval context or explain what needs to be fixed"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isPending || isSaving}
            onClick={saveChanges}
            className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending || isSaving ? "Saving..." : "Save verification review"}
          </button>
        </div>

        {feedback ? (
          <p className="rounded-[1.3rem] border border-[rgba(34,139,85,0.18)] bg-[rgba(34,139,85,0.08)] px-4 py-3 text-sm text-[#217a4d]">
            {feedback}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-[1.3rem] border border-[rgba(242,140,40,0.18)] bg-[rgba(242,140,40,0.08)] px-4 py-3 text-sm text-[#b96a1e]">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
