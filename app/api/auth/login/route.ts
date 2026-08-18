import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/store";
import { makeSessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = await findUserByEmail(email || "");
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "אימייל או סיסמה שגויים" }, { status: 401 });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "אימייל או סיסמה שגויים" }, { status: 401 });
  if (user.isBlocked) return NextResponse.json({ error: "החשבון חסום" }, { status: 403 });

  const res = NextResponse.json({ id: user.id, name: user.name, email: user.email });
  res.cookies.set(SESSION_COOKIE_NAME, makeSessionCookieValue(user.id), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
