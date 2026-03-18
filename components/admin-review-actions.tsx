"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { listingStatusLabels, reviewQueueStatuses, type ListingStatus } from "@/lib/moderation";

type AdminReviewActionsProps = {
  listingId: string;
  currentStatus: ListingStatus;
  currentNote: string | null;
  currentModerator: string | null;
};

export function AdminReviewActions({
  listingId,
  currentStatus,
  currentNote,
  currentModerator,
}: AdminReviewActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ListingStatus>(currentStatus);
  const [moderationNote, setModerationNote] = useState(currentNote ?? "");
  const [moderatedBy, setModeratedBy] = useState(currentModerator ?? "Local Moderator");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function saveChanges() {
    setFeedback("");
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/listings/${listingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          moderationNote,
          moderatedBy,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Could not update moderation status.");
        return;
      }

      setFeedback("Moderation status updated.");
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Could not reach the moderation API. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    setStatus(event.target.value as ListingStatus);
  }

  return (
    <div className="soft-card rounded-[2rem] p-6">
      <p className="section-kicker">Moderator Actions</p>
      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-medium">
          Status
          <select
            value={status}
            onChange={handleStatusChange}
            className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 outline-none"
          >
            {reviewQueueStatuses.map((item) => (
              <option key={item} value={item}>
                {listingStatusLabels[item]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Moderator name
          <input
            value={moderatedBy}
            onChange={(event) => setModeratedBy(event.target.value)}
            className="rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 outline-none"
            placeholder="Local Moderator"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Moderation note
          <textarea
            value={moderationNote}
            onChange={(event) => setModerationNote(event.target.value)}
            className="min-h-32 rounded-[1.1rem] border border-[var(--line)] bg-white/85 px-4 py-3 outline-none"
            placeholder="Add context for approval, rejection, or requested changes"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isPending || isSaving}
            onClick={saveChanges}
            className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending || isSaving ? "Saving..." : "Save moderation decision"}
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
