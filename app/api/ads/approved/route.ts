export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listApprovedAds, getSiteSettings } from "@/lib/store";

export async function GET() {
  const settings = await getSiteSettings();
  if (!settings.classifiedsEnabled) return NextResponse.json([]);
  return NextResponse.json(await listApprovedAds());
}
