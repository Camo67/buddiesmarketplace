"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BotProtectionFields } from "@/components/bot-protection-fields";
import {
  botProtectionHoneypotFieldName,
  botProtectionResponseFieldName,
  botProtectionStartedAtFieldName,
} from "@/lib/bot-protection-fields";
import type { MarketplaceUser } from "@/lib/users-store";

type VerificationDocsFormProps = {
  user: MarketplaceUser;
  botProtection: {
    enabled: boolean;
    siteKey: string | null;
  };
};

export function VerificationDocsForm({ user, botProtection }: VerificationDocsFormProps) {
  const router = useRouter();
  const [phone, setPhone] = useState(user.verificationPhone ?? "");
  const [idType, setIdType] = useState(user.verificationIdType ?? "South African ID");
  const [idReference, setIdReference] = useState(user.verificationIdReference ?? "");
  const [idDocumentUrl, setIdDocumentUrl] = useState(user.verificationIdDocumentUrl ?? "");
  const [addressDocumentUrl, setAddressDocumentUrl] = useState(
    user.verificationAddressDocumentUrl ?? "",
  );
  const [addressText, setAddressText] = useState(user.verificationAddressText ?? "");
  const [submissionNote, setSubmissionNote] = useState(user.verificationSubmissionNote ?? "");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [botToken, setBotToken] = useState("");
  const [botResetCounter, setBotResetCounter] = useState(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFeedback("");
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/account/verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          idType,
          idReference,
          idDocumentUrl,
          addressDocumentUrl,
          addressText,
          submissionNote,
          botProtection: {
            [botProtectionHoneypotFieldName]: formData.get(botProtectionHoneypotFieldName),
            [botProtectionStartedAtFieldName]: formData.get(botProtectionStartedAtFieldName),
            [botProtectionResponseFieldName]: formData.get(botProtectionResponseFieldName),
          },
        }),
      });

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Could not submit your verification documents.");
        setBotResetCounter((count) => count + 1);
        return;
      }

      setFeedback("Verification documents submitted. A moderator can review them now.");
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Could not reach the verification service. Please try again.");
      setBotResetCounter((count) => count + 1);
    } finally {
      setIsSaving(false);
    }
  }

  const isDisabled = isSaving || isPending || (botProtection.enabled && !botToken);

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Phone number
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="rounded-[1.1rem] border border-[var(--line)] bg-[var(--background-alt)] px-4 py-3 outline-none"
            placeholder="+27 71 234 5678"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Government ID type
          <select
            value={idType}
            onChange={(event) => setIdType(event.target.value)}
            className="rounded-[1.1rem] border border-[var(--line)] bg-[var(--background-alt)] px-4 py-3 outline-none"
          >
            <option>South African ID</option>
            <option>Driver&apos;s license</option>
            <option>Passport</option>
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        ID number or reference
        <input
          value={idReference}
          onChange={(event) => setIdReference(event.target.value)}
          className="rounded-[1.1rem] border border-[var(--line)] bg-[var(--background-alt)] px-4 py-3 outline-none"
          placeholder="Use a masked value if you prefer, for example 900101••••08"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        ID document link
        <input
          value={idDocumentUrl}
          onChange={(event) => setIdDocumentUrl(event.target.value)}
          className="rounded-[1.1rem] border border-[var(--line)] bg-[var(--background-alt)] px-4 py-3 outline-none"
          placeholder="https://..."
        />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Proof of address link
        <input
          value={addressDocumentUrl}
          onChange={(event) => setAddressDocumentUrl(event.target.value)}
          className="rounded-[1.1rem] border border-[var(--line)] bg-[var(--background-alt)] px-4 py-3 outline-none"
          placeholder="https://..."
        />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Residential address
        <textarea
          value={addressText}
          onChange={(event) => setAddressText(event.target.value)}
          className="min-h-28 rounded-[1.1rem] border border-[var(--line)] bg-[var(--background-alt)] px-4 py-3 outline-none"
          placeholder="Street, suburb, city, province, postal code"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Extra note for the review team
        <textarea
          value={submissionNote}
          onChange={(event) => setSubmissionNote(event.target.value)}
          className="min-h-28 rounded-[1.1rem] border border-[var(--line)] bg-[var(--background-alt)] px-4 py-3 outline-none"
          placeholder="Optional context, for example which document shows the matching address"
        />
      </label>

      <BotProtectionFields
        enabled={botProtection.enabled}
        siteKey={botProtection.siteKey}
        action="verify_account"
        resetCounter={botResetCounter}
        onTokenChange={setBotToken}
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isDisabled}
          className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(255,127,80,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving || isPending
            ? "Submitting..."
            : user.verificationStatus === "submitted"
              ? "Update verification submission"
              : "Submit verification docs"}
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
    </form>
  );
}
