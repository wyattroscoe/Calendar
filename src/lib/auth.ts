import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OWNER_ID } from "./owner";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./session";

/** Names of required settings that are missing, so the login page can say what to fix. */
export function missingConfig(): string[] {
  const missing: string[] = [];
  if (!process.env.APP_PASSWORD) missing.push("APP_PASSWORD");
  if ((process.env.SESSION_SECRET ?? "").length < 32) missing.push("SESSION_SECRET (32+ characters)");
  return missing;
}

export function passwordMatches(input: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) throw new Error("APP_PASSWORD must be set.");
  const hash = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(hash(input), hash(expected));
}

export async function startSession(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, await signSession(OWNER_ID), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The signed-in user's ID. Redirects to /login if there's no valid session. */
export async function requireUser(): Promise<string> {
  const userId = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!userId) redirect("/login");
  return userId;
}
