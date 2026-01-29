import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export type Level = "beginner" | "intermediate" | "advanced";

export type Profile = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  level: Level;
  target_languages: string[];
  native_language: string;
  bio: string;
  profile_picture_url: string | null;
  created_at: string; // ISO-8601
  updated_at: string; // ISO-8601
};

type ErrorBody = {
  error: string;
  details?: unknown;
};

export function jsonError(status: number, error: string, details?: unknown) {
  const body: ErrorBody = details === undefined ? { error } : { error, details };
  return NextResponse.json(body, { status });
}

export function getSupabaseOrError():
  | { ok: true; client: typeof supabase }
  | { ok: false; response: NextResponse } {
  // supabaseClient.ts throws when missing env (module load phase)
  try {
    return { ok: true, client: supabase };
  } catch (err) {
    return {
      ok: false,
      response: jsonError(500, "Server not configured", {
        message: err instanceof Error ? err.message : String(err),
      }),
    };
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((v) => typeof v === "string") &&
    value.every((v) => v.trim().length > 0)
  );
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isNonEmptyString(value);
}

function isLevel(value: unknown): value is Level {
  return value === "beginner" || value === "intermediate" || value === "advanced";
}

function normalizeUserId(raw: string): string {
  return raw.trim();
}

function normalizeStringArray(values: string[]): string[] {
  return values.map((s) => s.trim());
}

export type CreateProfileInput = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  level: Level;
  target_languages: string[];
  native_language: string;
  bio: string;
};

export function parseCreateProfileInput(body: unknown):
  | { ok: true; value: CreateProfileInput }
  | { ok: false; details: unknown } {
  if (!isPlainObject(body)) {
    return { ok: false, details: "Body must be a JSON object" };
  }

  const allowedKeys = new Set([
    "user_id",
    "email",
    "first_name",
    "last_name",
    "level",
    "target_languages",
    "native_language",
    "bio",
  ]);

  const unknownKeys = Object.keys(body).filter((k) => !allowedKeys.has(k));
  if (unknownKeys.length > 0) {
    return { ok: false, details: { unknown_keys: unknownKeys } };
  }

  const user_id = body["user_id"];
  const email = body["email"];
  const first_name = body["first_name"];
  const last_name = body["last_name"];
  const level = body["level"];
  const target_languages = body["target_languages"];
  const native_language = body["native_language"];
  const bio = body["bio"];

  const errors: Record<string, string> = {};
  if (!isNonEmptyString(user_id)) errors.user_id = "user_id must be a non-empty string";
  if (!isNonEmptyString(email)) errors.email = "email must be a non-empty string";
  if (!isNonEmptyString(first_name)) errors.first_name = "first_name must be a non-empty string";
  if (!isNonEmptyString(last_name)) errors.last_name = "last_name must be a non-empty string";
  if (!isLevel(level)) errors.level = "level must be one of: beginner, intermediate, advanced";
  if (!isStringArray(target_languages)) {
    errors.target_languages = "target_languages must be an array of non-empty strings";
  }
  if (!isNonEmptyString(native_language)) errors.native_language = "native_language must be a non-empty string";
  if (typeof bio !== "string") errors.bio = "bio must be a string";

  if (Object.keys(errors).length > 0) {
    return { ok: false, details: errors };
  }

  return {
    ok: true,
    value: {
      user_id: normalizeUserId(user_id as string),
      email: (email as string).trim(),
      first_name: (first_name as string).trim(),
      last_name: (last_name as string).trim(),
      level: level as Level,
      target_languages: normalizeStringArray(target_languages as string[]),
      native_language: (native_language as string).trim(),
      bio: bio as string,
    },
  };
}

export type PatchProfileInput = Partial<
  Pick<
    Profile,
    | "email"
    | "first_name"
    | "last_name"
    | "level"
    | "target_languages"
    | "native_language"
    | "bio"
    | "profile_picture_url"
  >
>;

export function parsePatchProfileInput(body: unknown):
  | { ok: true; value: PatchProfileInput }
  | { ok: false; details: unknown } {
  if (!isPlainObject(body)) {
    return { ok: false, details: "Body must be a JSON object" };
  }

  const allowedKeys = new Set([
    "email",
    "first_name",
    "last_name",
    "level",
    "target_languages",
    "native_language",
    "bio",
    "profile_picture_url",
  ]);

  const unknownKeys = Object.keys(body).filter((k) => !allowedKeys.has(k));
  if (unknownKeys.length > 0) {
    return { ok: false, details: { unknown_keys: unknownKeys } };
  }

  const patch: PatchProfileInput = {};
  const errors: Record<string, string> = {};

  if ("email" in body) {
    const raw = body["email"];
    if (!isNonEmptyString(raw)) errors.email = "email must be a non-empty string";
    else patch.email = raw.trim();
  }

  if ("first_name" in body) {
    const raw = body["first_name"];
    if (!isNonEmptyString(raw)) errors.first_name = "first_name must be a non-empty string";
    else patch.first_name = raw.trim();
  }

  if ("last_name" in body) {
    const raw = body["last_name"];
    if (!isNonEmptyString(raw)) errors.last_name = "last_name must be a non-empty string";
    else patch.last_name = raw.trim();
  }

  if ("level" in body) {
    const raw = body["level"];
    if (!isLevel(raw)) errors.level = "level must be one of: beginner, intermediate, advanced";
    else patch.level = raw;
  }

  if ("target_languages" in body) {
    const raw = body["target_languages"];
    if (!isStringArray(raw)) errors.target_languages = "target_languages must be an array of non-empty strings";
    else patch.target_languages = normalizeStringArray(raw);
  }

  if ("native_language" in body) {
    const raw = body["native_language"];
    if (!isNonEmptyString(raw)) errors.native_language = "native_language must be a non-empty string";
    else patch.native_language = raw.trim();
  }

  if ("bio" in body) {
    const raw = body["bio"];
    if (typeof raw !== "string") errors.bio = "bio must be a string";
    else patch.bio = raw;
  }

  if ("profile_picture_url" in body) {
    const raw = body["profile_picture_url"];
    if (!isNullableString(raw)) {
      errors.profile_picture_url = "profile_picture_url must be a non-empty string or null";
    } else {
      patch.profile_picture_url = raw === null ? null : raw.trim();
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, details: errors };
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, details: "At least one updatable field is required" };
  }

  return { ok: true, value: patch };
}

/**
 * profiles + profile_target_languages(language)
 */
export function coerceProfileRow(row: unknown): Profile {
  const obj = isPlainObject(row) ? row : {};

  const tl = Array.isArray(obj["profile_target_languages"])
    ? (obj["profile_target_languages"] as unknown[])
    : [];

  const target_languages = tl
    .map((r) => (isPlainObject(r) ? String(r["language"] ?? "") : ""))
    .filter((s) => s.length > 0);

  return {
    user_id: String(obj["user_id"] ?? ""),
    email: String(obj["email"] ?? ""),
    first_name: String(obj["first_name"] ?? ""),
    last_name: String(obj["last_name"] ?? ""),
    level: (obj["level"] as Level) ?? "beginner",
    target_languages,
    native_language: String(obj["native_language"] ?? ""),
    bio: String(obj["bio"] ?? ""),
    profile_picture_url:
      obj["profile_picture_url"] === null
        ? null
        : (obj["profile_picture_url"] as string | null) ?? null,
    created_at: String(obj["created_at"] ?? ""),
    updated_at: String(obj["updated_at"] ?? ""),
  };
}
