import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/adminSession";
import { listAds, createAd, setAdStatus, deleteAd } from "@/lib/store";

export async function GET() {
  if (!isAdminSession()) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  return NextResponse.json(listAds());
}

// יצירת פרסומת חדשה (ממתינה לאישור). url יכול להיות קישור לקובץ שהועלה
// לשירות אחסון (S3 / Cloudinary וכו') או קישור חיצוני ישיר.
export async function POST(req: Request) {
  if (!isAdminSession()) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  const { type, url, linkUrl } = await req.json();
  if (!type || !url) return NextResponse.json({ error: "נתונים חסרים" }, { status: 400 });
  return NextResponse.json(createAd({ type, url, linkUrl }));
}

export async function PATCH(req: Request) {
  if (!isAdminSession()) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  const { id, status } = await req.json();
  return NextResponse.json(setAdStatus(id, status));
}

export async function DELETE(req: Request) {
  if (!isAdminSession()) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  const { id } = await req.json();
  deleteAd(id);
  return NextResponse.json({ ok: true });
}
