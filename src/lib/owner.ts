// Anonymous per-browser identity. Each visitor gets a random UUID stored in an
// httpOnly cookie. Reviews are saved with that id and every read or delete is
// filtered by it, so one visitor never sees another visitor's history.

import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";

export const OWNER_COOKIE = "acr_owner";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidOwnerId(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function newOwnerId(): string {
  return randomUUID();
}

/** The visitor's id from the request cookie, or null if missing or invalid. */
export function getOwnerId(req: NextRequest): string | null {
  const value = req.cookies.get(OWNER_COOKIE)?.value;
  return isValidOwnerId(value) ? value : null;
}

export function ownerCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // one year
  };
}