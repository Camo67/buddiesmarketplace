import { NextResponse } from "next/server";
import {
  getMetaWebhookVerifyToken,
  type MetaWebhookPayload,
  verifyMetaWebhookSignature,
} from "@/lib/meta-webhook";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expectedToken = getMetaWebhookVerifyToken();

  if (!expectedToken) {
    return jsonError(
      "META_WEBHOOK_VERIFY_TOKEN is not configured on the server.",
      500,
    );
  }

  if (mode !== "subscribe" || token !== expectedToken || !challenge) {
    return jsonError("Webhook verification failed.", 403);
  }

  return new Response(challenge, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyMetaWebhookSignature(rawBody, signature)) {
    return jsonError(
      "Invalid Meta webhook signature. Check META_APP_SECRET and retry.",
      401,
    );
  }

  let payload: MetaWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as MetaWebhookPayload;
  } catch {
    return jsonError("Invalid webhook payload.", 400);
  }

  const entries = payload.entry ?? [];
  const messageEvents = entries.flatMap((entry) =>
    (entry.changes ?? [])
      .filter((change) => change.field === "messages")
      .map((change) => ({
        object: payload.object ?? "unknown",
        field: change.field ?? "unknown",
        messageCount: Array.isArray(change.value?.messages) ? change.value.messages.length : 0,
        statusCount: Array.isArray(change.value?.statuses) ? change.value.statuses.length : 0,
        messagingProduct:
          typeof change.value?.messaging_product === "string"
            ? change.value.messaging_product
            : null,
      })),
  );

  console.log("[meta-webhook] received", {
    object: payload.object ?? "unknown",
    entryCount: entries.length,
    messageEvents,
  });

  return NextResponse.json({ received: true });
}
