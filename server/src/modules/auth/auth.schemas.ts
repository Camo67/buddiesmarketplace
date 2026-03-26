export type BotProtectionFields = {
  honeypot?: string;
  startedAt?: string | number;
  turnstileToken?: string;
};

export type SignUpBody = BotProtectionFields & {
  email: string;
  password: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  next?: string;
  botProtection?: BotProtectionFields;
};

export type LoginBody = BotProtectionFields & {
  email: string;
  password: string;
  next?: string;
  botProtection?: BotProtectionFields;
};

const botProtectionProperties = {
  honeypot: { type: "string" },
  startedAt: {
    anyOf: [{ type: "string" }, { type: "number" }],
  },
  turnstileToken: { type: "string" },
} as const;

export const signUpSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    additionalProperties: false,
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 8 },
      displayName: { type: "string", minLength: 1, maxLength: 160 },
      firstName: { type: "string", minLength: 1, maxLength: 120 },
      lastName: { type: "string", minLength: 1, maxLength: 120 },
      phoneNumber: { type: "string", minLength: 7, maxLength: 32 },
      next: { type: "string", minLength: 1, maxLength: 255 },
      ...botProtectionProperties,
      botProtection: {
        type: "object",
        additionalProperties: false,
        properties: botProtectionProperties,
      },
    },
  },
};

export const loginSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    additionalProperties: false,
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 8 },
      next: { type: "string", minLength: 1, maxLength: 255 },
      ...botProtectionProperties,
      botProtection: {
        type: "object",
        additionalProperties: false,
        properties: botProtectionProperties,
      },
    },
  },
};
