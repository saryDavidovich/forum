import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "@/lib/store";
import { makeSessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "נא למלא שם, אימייל וסיסמה" }, { status: 400 });
  }
  if (findUserByEmail(email)) {
    return NextResponse.json({ error: "כתובת המייל כבר רשומה" }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUser({ name, email, passwordHash });

  const res = NextResponse.json({ id: user.id, name: user.name, email: user.email });
  res.cookies.set(SESSION_COOKIE_NAME, makeSessionCookieValue(user.id), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
