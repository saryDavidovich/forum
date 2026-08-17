import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/adminSession";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// שים לב: זהו פתרון העלאה מקומי לצורך פיתוח/דמו בלבד - הקבצים נשמרים
// בתיקיית public/uploads על השרת עצמו. לפריסה אמיתית (Vercel וכד') מומלץ
// לחבר שירות אחסון קבצים (S3, Cloudinary, Vercel Blob) במקום זה.
export async function POST(req: Request) {
  if (!isAdminSession()) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "לא נשלח קובץ" }, { status: 400 });

  const ext = path.extname(file.name) || "";
  const filename = `${randomUUID()}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(process.cwd(), "public", "uploads", filename), bytes);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
