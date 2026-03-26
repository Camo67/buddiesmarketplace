"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  botProtectionHoneypotFieldName,
  botProtectionResponseFieldName,
  botProtectionStartedAtFieldName,
} from "@/lib/bot-protection-fields";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove?: (widgetId?: string) => void;
    };
  }
}

type BotProtectionFieldsProps = {
  enabled: boolean;
  siteKey: string | null;
  action: string;
  resetCounter?: number;
  formIds?: string[];
  onTokenChange?: (token: string) => void;
};

export function BotProtectionFields({
  enabled,
  siteKey,
  action,
  resetCounter = 0,
  formIds,
  onTokenChange,
}: BotProtectionFieldsProps) {
  const widgetContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const componentId = useId().replace(/:/g, "");
  const [token, setToken] = useState("");
  const [startedAt] = useState(() => Date.now().toString());
  const targets = useMemo(() => (formIds && formIds.length > 0 ? formIds : [undefined]), [formIds]);

  function handleTokenChange(nextToken: string) {
    setToken(nextToken);
    onTokenChange?.(nextToken);
  }

  useEffect(() => {
    if (!enabled || !siteKey) {
      return;
    }

    let cancelled = false;

    const renderWidget = () => {
      if (cancelled || !widgetContainerRef.current || !window.turnstile || widgetIdRef.current) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(widgetContainerRef.current, {
        sitekey: siteKey,
        action,
        callback: (nextToken) => {
          handleTokenChange(nextToken);
        },
        "expired-callback": () => {
          handleTokenChange("");
        },
        "error-callback": () => {
          handleTokenChange("");
        },
      });
    };

    const waitForTurnstile = () => {
      if (cancelled) {
        return;
      }

      if (window.turnstile) {
        renderWidget();
        return;
      }

      window.setTimeout(waitForTurnstile, 150);
    };

    waitForTurnstile();

    return () => {
      cancelled = true;

      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }

      widgetIdRef.current = null;
    };
  }, [action, enabled, siteKey]);

  useEffect(() => {
    if (!enabled || !siteKey || !widgetIdRef.current || !window.turnstile) {
      return;
    }

    handleTokenChange("");
    window.turnstile.reset(widgetIdRef.current);
  }, [enabled, resetCounter, siteKey]);

  return (
    <div className="grid gap-3">
      {targets.map((formId, index) => (
        <div
          key={formId ?? `inline-${index}`}
          aria-hidden="true"
          className="absolute left-[-100vw] top-auto h-px w-px overflow-hidden"
        >
          <label>
            Leave this field empty
            <input
              type="text"
              name={botProtectionHoneypotFieldName}
              autoComplete="off"
              tabIndex={-1}
              form={formId}
            />
          </label>
          <input
            type="hidden"
            name={botProtectionStartedAtFieldName}
            value={startedAt}
            form={formId}
            readOnly
          />
          <input
            type="hidden"
            name={botProtectionResponseFieldName}
            value={token}
            form={formId}
            readOnly
          />
        </div>
      ))}

      {enabled && siteKey ? (
        <div className="rounded-[1.3rem] border border-[var(--line)] bg-[var(--background-alt)] p-3">
          <div ref={widgetContainerRef} id={`turnstile-${componentId}`} />
        </div>
      ) : null}
    </div>
  );
}
