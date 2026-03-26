export const botProtectionHoneypotFieldName = "company_website";
export const botProtectionStartedAtFieldName = "form_started_at";
export const botProtectionResponseFieldName = "cf-turnstile-response";

export type BotProtectionPayload = {
  honeypot?: unknown;
  startedAt?: unknown;
  turnstileToken?: unknown;
};
