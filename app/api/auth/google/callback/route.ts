import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findUserByGoogleId, findUserByEmail, createUser } from "@/lib/store";
import { makeSessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";

// שלב 2 מתוך 2: גוגל מפנה לכאן עם code. מחליפים אותו בטוקן, שולפים את
// פרטי המשתמש, ומאתרים/יוצרים משתמש מקומי תואם - בדיוק כמו בהרשמה רגילה.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = cookies().get("google_oauth_state")?.value;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  const failRedirect = (msg: string) =>
    NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(msg)}`);

  if (!code || !state || state !== savedState) {
    return failRedirect("אימות Google נכשל, נסה שוב");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return failRedirect("התחברות עם גוגל לא מוגדרת בשרת");
  }

  // החלפת code בטוקנים
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${appUrl}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return failRedirect("שגיאה בקבלת אישור מגוגל");
  const tokens = await tokenRes.json();

  // שליפת פרטי הפרופיל
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) return failRedirect("שגיאה בקבלת פרטי המשתמש מגוגל");
  const profile = await profileRes.json();
  // profile: { sub, email, name, picture, ... }

  let user = (await findUserByGoogleId(profile.sub)) || (await findUserByEmail(profile.email));
  if (!user) {
    user = await createUser({ name: profile.name || profile.email, email: profile.email, googleId: profile.sub });
  }
  if (user.isBlocked) return failRedirect("החשבון חסום");

  const res = NextResponse.redirect(`${appUrl}${cookies().get("google_oauth_next")?.value || "/profile"}`);
  res.cookies.set(SESSION_COOKIE_NAME, makeSessionCookieValue(user.id), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  res.cookies.set("google_oauth_state", "", { path: "/", maxAge: 0 });
  res.cookies.set("google_oauth_next", "", { path: "/", maxAge: 0 });
  return res;
}
