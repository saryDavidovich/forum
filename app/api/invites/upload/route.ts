import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createInvite } from "@/lib/store";

// מקבל multipart/form-data עם קובץ אקסל (עמודות: name, email) + forumId
export async function POST(req: Request) {
  const form = await req.formData();
  const forumId = form.get("forumId") as string | null;
  const file = form.get("file") as File | null;
  if (!forumId || !file) {
    return NextResponse.json({ error: "חסר forumId או קובץ" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const created = rows
    .map((r) => ({
      name: (r.name || r["שם"] || "").toString().trim(),
      email: (r.email || r["אימייל"] || r["מייל"] || "").toString().trim(),
    }))
    .filter((r) => r.email)
    .map((r) => createInvite(forumId, r.email, r.name));

  return NextResponse.json({ created: created.length, invites: created });
}
