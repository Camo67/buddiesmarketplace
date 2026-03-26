import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  readBotProtectionFromBody,
  verifyBotProtectedRequest,
} from "@/lib/bot-protection";
import {
  getMarketplaceUserById,
  submitMarketplaceUserVerification,
} from "@/lib/users-store";
import { readUserSession, userSessionCookieName } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

function readRequiredString(value: unknown, fieldLabel: string) {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    throw new Error(`${fieldLabel} is required.`);
  }

  return normalized;
}

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function assertValidHttpUrl(value: string, fieldLabel: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${fieldLabel} must be a valid URL.`);
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`${fieldLabel} must start with http:// or https://.`);
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userSession = await readUserSession(cookieStore.get(userSessionCookieName)?.value);

    if (!userSession) {
      return NextResponse.json(
        { error: "Sign in before submitting verification documents." },
        { status: 401 },
      );
    }

    const marketplaceUser = await getMarketplaceUserById(userSession.marketplaceUserId);

    if (!marketplaceUser) {
      return NextResponse.json({ error: "Marketplace profile not found." }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const botProtection = await verifyBotProtectedRequest({
      request,
      action: "verify_account",
      botProtection: readBotProtectionFromBody(body),
    });

    if (!botProtection.ok) {
      return NextResponse.json({ error: botProtection.message }, { status: 400 });
    }

    const phone = readRequiredString(body.phone, "Phone number");
    const idType = readRequiredString(body.idType, "ID type");
    const idReference = readRequiredString(body.idReference, "ID reference");
    const idDocumentUrl = readRequiredString(body.idDocumentUrl, "ID document link");
    const addressDocumentUrl = readRequiredString(
      body.addressDocumentUrl,
      "Proof of address link",
    );
    const addressText = readRequiredString(body.addressText, "Residential address");
    const submissionNote = readOptionalString(body.submissionNote);

    assertValidHttpUrl(idDocumentUrl, "ID document link");
    assertValidHttpUrl(addressDocumentUrl, "Proof of address link");

    const updatedUser = await submitMarketplaceUserVerification({
      userId: marketplaceUser.id,
      phone,
      idType,
      idReference,
      idDocumentUrl,
      addressDocumentUrl,
      addressText,
      submissionNote,
    });

    return NextResponse.json({ user: updatedUser }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not submit verification documents.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
