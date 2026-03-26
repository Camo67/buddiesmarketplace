"use client";

import Script from "next/script";

export function TurnstileScript() {
  return (
    <Script
      id="cloudflare-turnstile-api"
      src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      strategy="afterInteractive"
    />
  );
}
