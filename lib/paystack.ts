import { createHmac } from "node:crypto";

export const marketplaceFeeConfig = {
  flatFeeSubunit: 500,
  percentageRateBasisPoints: 50,
  percentageThresholdSubunit: 50_000,
} as const;

type PaystackInitializeTransactionInput = {
  amountSubunit: number;
  email: string;
  reference: string;
  callbackUrl: string;
  cancelUrl: string;
  currency?: string;
  metadata?: Record<string, unknown>;
};

type PaystackInitializeTransactionResult = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

export type PaystackVerifiedTransaction = {
  id: string;
  reference: string;
  status: string;
  amountSubunit: number;
  currency: string;
  paidAt: string | null;
  customerEmail: string | null;
  metadata: Record<string, unknown>;
};

type PaystackApiResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

type PaystackInitializeTransactionResponse = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

type PaystackVerifyTransactionResponse = {
  id: number | string;
  reference: string;
  status: string;
  amount: number;
  currency: string;
  paid_at?: string | null;
  customer?: {
    email?: string | null;
  } | null;
  metadata?: Record<string, unknown> | null;
};

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function isPaystackConfigured() {
  return Boolean(stringValue(process.env.PAYSTACK_SECRET_KEY));
}

function getPaystackSecretKey() {
  const secretKey = stringValue(process.env.PAYSTACK_SECRET_KEY);

  if (!secretKey) {
    throw new Error("Missing PAYSTACK_SECRET_KEY.");
  }

  return secretKey;
}

function getPaystackApiBaseUrl() {
  return "https://api.paystack.co";
}

function getDefaultCurrency() {
  return stringValue(process.env.PAYSTACK_CURRENCY)?.toUpperCase() ?? "ZAR";
}

export function calculateMarketplaceFee(itemAmountSubunit: number) {
  const flatFeeSubunit = marketplaceFeeConfig.flatFeeSubunit;
  const percentageFeeSubunit =
    itemAmountSubunit > marketplaceFeeConfig.percentageThresholdSubunit
      ? Math.round(
          (itemAmountSubunit * marketplaceFeeConfig.percentageRateBasisPoints) / 10_000,
        )
      : 0;
  const platformFeeSubunit = flatFeeSubunit + percentageFeeSubunit;

  return {
    itemAmountSubunit,
    flatFeeSubunit,
    percentageFeeSubunit,
    platformFeeSubunit,
    buyerTotalSubunit: itemAmountSubunit + platformFeeSubunit,
    sellerNetAmountSubunit: itemAmountSubunit,
  };
}

async function paystackRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${getPaystackApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as PaystackApiResponse<T> & {
    message?: string;
  };

  if (!response.ok || !payload.status) {
    throw new Error(payload.message || "Paystack request failed.");
  }

  return payload.data;
}

export async function initializePaystackTransaction(
  input: PaystackInitializeTransactionInput,
) {
  const data = await paystackRequest<PaystackInitializeTransactionResponse>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        amount: String(input.amountSubunit),
        email: input.email,
        reference: input.reference,
        currency: input.currency?.toUpperCase() ?? getDefaultCurrency(),
        callback_url: input.callbackUrl,
        metadata: {
          ...(input.metadata ?? {}),
          cancel_action: input.cancelUrl,
        },
      }),
    },
  );

  return {
    authorizationUrl: data.authorization_url,
    accessCode: data.access_code,
    reference: data.reference,
  } satisfies PaystackInitializeTransactionResult;
}

export async function verifyPaystackTransaction(reference: string) {
  const data = await paystackRequest<PaystackVerifyTransactionResponse>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
    },
  );

  return {
    id: String(data.id),
    reference: data.reference,
    status: data.status,
    amountSubunit: Number(data.amount),
    currency: data.currency,
    paidAt: stringValue(data.paid_at),
    customerEmail: stringValue(data.customer?.email),
    metadata:
      data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
        ? data.metadata
        : {},
  } satisfies PaystackVerifiedTransaction;
}

export function verifyPaystackWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) {
    return false;
  }

  const digest = createHmac("sha512", getPaystackSecretKey())
    .update(rawBody)
    .digest("hex");

  return digest === signature;
}

export function formatCurrencyFromSubunit(amountSubunit: number, currency = "ZAR") {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountSubunit / 100);
}
