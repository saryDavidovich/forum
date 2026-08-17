import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

// קוד המנהל מוגדר אך ורק במשתנה סביבה - לא מופיע בשום מקום בקוד הצד-לקוח
// ולא נשמר בבסיס הנתונים. הגדר ב-.env.local:
//   ADMIN_CODE=הקוד-הסודי-שלך
//   AUTH_SECRET=מחרוזת-אקראית-ארוכה
const ADMIN_CODE = process.env.ADMIN_CODE || "";
const SECRET = process.env.AUTH_SECRET || "dev-only-secret-change-me";
const ADMIN_COOKIE = "forum_admin";

function sign(value: string) {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

export function checkAdminCode(code: string): boolean {
  if (!ADMIN_CODE) return false; // אם לא הוגדר קוד ב-env, הכניסה לניהול חסומה לגמרי
  const a = Buffer.from(code);
  const b = Buffer.from(ADMIN_CODE);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function makeAdminCookieValue() {
  const sig = sign("admin");
  return `admin.${sig}`;
}

export function isAdminSession(): boolean {
  const c = cookies().get(ADMIN_COOKIE)?.value;
  if (!c) return false;
  const [tag, sig] = c.split(".");
  return tag === "admin" && sig === sign("admin");
}

export const ADMIN_COOKIE_NAME = ADMIN_COOKIE;
