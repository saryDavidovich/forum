import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/adminSession";
import { listContactMessages } from "@/lib/store";

export async function GET() {
  if (!isAdminSession()) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  return NextResponse.json(await listContactMessages());
}
