import { NextResponse } from "next/server";
import { checkAdminCode, makeAdminCookieValue, ADMIN_COOKIE_NAME } from "@/lib/adminSession";

// חשוב: התשובה תמיד זהה במבנה שלה בין הצלחה לכישלון (רק ok: true/false),
// כדי לא לחשוף מידע על קיום/אי-קיום הקוד למי שמתעסק בכלי פיתוח.
export async function POST(req: Request) {
  const { code } = await req.json();
  const ok = typeof code === "string" && checkAdminCode(code);
  const res = NextResponse.json({ ok });
  if (ok) {
    res.cookies.set(ADMIN_COOKIE_NAME, makeAdminCookieValue(), {
      httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 4,
    });
  }
  return res;
}
