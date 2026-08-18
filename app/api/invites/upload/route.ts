import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createInvite, getForum } from "@/lib/store";
import { sendEmail, inviteEmailHtml } from "@/lib/email";

// מקבל multipart/form-data עם קובץ אקסל (עמודות: name, email) + forumId
// ושולח מייל הזמנה מעוצב לכל שורה.
export async function POST(req: Request) {
  const form = await req.formData();
  const forumId = form.get("forumId") as string | null;
  const file = form.get("file") as File | null;
  if (!forumId || !file) {
    return NextResponse.json({ error: "חסר forumId או קובץ" }, { status: 400 });
  }

  const forum = await getForum(forumId);
  if (!forum) return NextResponse.json({ error: "פורום לא נמצא" }, { status: 404 });

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

  const entries = rows
    .map((r) => ({
      name: (r.name || r["שם"] || "").toString().trim(),
      email: (r.email || r["אימייל"] || r["מייל"] || "").toString().trim(),
    }))
    .filter((r) => r.email);

  const created = await Promise.all(
    entries.map(async (r) => {
      const invite = await createInvite(forumId, r.email, r.name);
      const joinUrl = `${appUrl}/join?token=${invite.token}`;
      await sendEmail({
        to: r.email,
        subject: `הוזמנת להצטרף לפורום "${forum.title}"`,
        html: inviteEmailHtml({ forumTitle: forum.title, inviteeName: r.name, joinUrl, appUrl }),
      });
      return invite;
    })
  );

  return NextResponse.json({ created: created.length, invites: created });
}
