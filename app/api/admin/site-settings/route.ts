import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/adminSession";
import { getSiteSettings, setClassifiedsEnabled } from "@/lib/store";

export async function GET() {
  if (!isAdminSession()) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  return NextResponse.json(await getSiteSettings());
}

export async function PATCH(req: Request) {
  if (!isAdminSession()) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  const { classifiedsEnabled } = await req.json();
  return NextResponse.json(await setClassifiedsEnabled(classifiedsEnabled));
}
