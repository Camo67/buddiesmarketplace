import { createClient, type User } from "@supabase/supabase-js";

export type SupabaseIdentity = {
  authUserId: string;
  email: string | null;
  preferredUsername: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
};

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readMetadataString(
  metadata: Record<string, unknown> | undefined,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = stringValue(metadata?.[key]);

    if (value) {
      return value;
    }
  }

  return null;
}

function readMetadataStringArray(
  metadata: Record<string, unknown> | undefined,
  key: string,
) {
  const value = metadata?.[key];

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

export function getSupabaseUrl() {
  const url =
    stringValue(process.env.SUPABASE_URL) ??
    stringValue(process.env.NEXT_PUBLIC_SUPABASE_URL);

  if (!url) {
    throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.");
  }

  return url;
}

export function getSupabaseAnonKey() {
  const key =
    stringValue(process.env.SUPABASE_PUBLISHABLE_KEY) ??
    stringValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
    stringValue(process.env.SUPABASE_ANON_KEY) ??
    stringValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!key) {
    throw new Error(
      "Missing a Supabase public key. Set SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_ANON_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return key;
}

export function isSupabaseAuthConfigured() {
  return Boolean(
    stringValue(process.env.APP_SESSION_SECRET) &&
      (stringValue(process.env.SUPABASE_URL) || stringValue(process.env.NEXT_PUBLIC_SUPABASE_URL)) &&
      (stringValue(process.env.SUPABASE_PUBLISHABLE_KEY) ||
        stringValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
        stringValue(process.env.SUPABASE_ANON_KEY) ||
        stringValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)),
  );
}

export function createSupabaseAuthClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabaseAdminRole() {
  return stringValue(process.env.SUPABASE_ADMIN_ROLE) ?? "buddies-admin";
}

export function getSupabaseAdminEmails() {
  const configured =
    stringValue(process.env.SUPABASE_ADMIN_EMAILS) ??
    stringValue(process.env.APP_ADMIN_EMAILS);

  if (!configured) {
    return [];
  }

  return configured
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

export function getSupabaseUserIdentity(user: User): SupabaseIdentity {
  const preferredUsername =
    readMetadataString(user.user_metadata, "preferred_username", "username", "user_name") ??
    (user.email?.includes("@") ? user.email.split("@")[0] : null);
  const firstName = readMetadataString(user.user_metadata, "first_name", "given_name");
  const lastName = readMetadataString(user.user_metadata, "last_name", "family_name");
  const derivedName = [firstName, lastName].filter(Boolean).join(" ");
  const name =
    readMetadataString(user.user_metadata, "display_name", "full_name", "name") ??
    (derivedName || preferredUsername);

  return {
    authUserId: user.id,
    email: user.email ?? null,
    preferredUsername,
    name: name || null,
    firstName,
    lastName,
  };
}

export function getSupabaseUserRoles(user: User) {
  const roles = new Set<string>();

  for (const role of readMetadataStringArray(user.app_metadata, "roles")) {
    roles.add(role);
  }

  for (const role of readMetadataStringArray(user.user_metadata, "roles")) {
    roles.add(role);
  }

  const email = user.email?.trim().toLowerCase();

  if (email && getSupabaseAdminEmails().includes(email)) {
    roles.add(getSupabaseAdminRole());
  }

  return [...roles];
}

export function hasSupabaseAdminAccess(user: User) {
  return getSupabaseUserRoles(user).includes(getSupabaseAdminRole());
}
