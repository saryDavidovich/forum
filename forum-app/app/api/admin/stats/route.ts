import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/adminSession";
import { adminStats, listForums, listAds } from "@/lib/store";

export async function GET() {
  if (!isAdminSession()) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  return NextResponse.json({
    stats: adminStats(),
    forums: listForums(),
    ads: listAds(),
  });
}
