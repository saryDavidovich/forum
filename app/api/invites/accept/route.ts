import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { findInviteByToken, acceptInvite } from "@/lib/store";

export async function POST(req: Request) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "יש להתחבר קודם" }, { status: 401 });

  const { token } = await req.json();
  const invite = findInviteByToken(token);
  if (!invite) return NextResponse.json({ error: "ההזמנה לא נמצאה או שפגה" }, { status: 404 });

  const updated = acceptInvite(token, userId);
  return NextResponse.json({ forumId: updated?.forumId });
}
