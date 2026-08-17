import { cookies } from "next/headers";
import { createHmac } from "crypto";

// אימות בסיסי עם עוגיה חתומה. עובד מיד בלי אף שירות חיצוני.
// כדי להוסיף "התחברות עם גוגל": התקן next-auth, הגדר GOOGLE_CLIENT_ID /
// GOOGLE_CLIENT_SECRET במשתני סביבה, והוסף GoogleProvider - שאר האפליקציה
// (getCurrentUser וכו') יכולה להישאר כמעט זהה.

const SECRET = process.env.AUTH_SECRET || "dev-only-secret-change-me";
const COOKIE_NAME = "forum_session";

function sign(value: string) {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

export function makeSessionCookieValue(userId: string) {
  const sig = sign(userId);
  return `${userId}.${sig}`;
}

export function verifySessionCookieValue(value: string | undefined): string | null {
  if (!value) return null;
  const [userId, sig] = value.split(".");
  if (!userId || !sig) return null;
  if (sign(userId) !== sig) return null;
  return userId;
}

export function getSessionUserId(): string | null {
  const c = cookies().get(COOKIE_NAME)?.value;
  return verifySessionCookieValue(c);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
