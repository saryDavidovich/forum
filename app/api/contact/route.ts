import { NextResponse } from "next/server";
import { createContactMessage } from "@/lib/store";

export async function POST(req: Request) {
  const { name, email, message, attachments } = await req.json();
  if (!name || !email || !message) {
    return NextResponse.json({ error: "נא למלא שם, אימייל, והודעה" }, { status: 400 });
  }
  const cm = await createContactMessage({ name, email, message, attachments: attachments || [] });
  return NextResponse.json(cm);
}
