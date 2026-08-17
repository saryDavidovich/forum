import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

// שלב 1 מתוך 2 בהתחברות עם גוגל: בונה קישור לדף ההסכמה של גוגל ומפנה אליו.
// דורש GOOGLE_CLIENT_ID + NEXT_PUBLIC_APP_URL במשתני הסביבה.
export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const next = new URL(req.url).searchParams.get("next") || "/profile";

  if (!clientId || !appUrl) {
    return NextResponse.json(
      { error: "התחברות עם גוגל לא הוגדרה עדיין (חסר GOOGLE_CLIENT_ID או NEXT_PUBLIC_APP_URL)" },
      { status: 500 }
    );
  }

  const state = randomUUID();
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
  // עוגיית state קצרת-חיים למניעת CSRF - נבדקת שוב ב-callback
  res.cookies.set("google_oauth_state", state, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 10,
  });
  res.cookies.set("google_oauth_next", next, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 10,
  });
  return res;
}
