import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isForumAdmin, updateForumSettings } from "@/lib/store";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  if (!(await isForumAdmin(params.id, userId))) {
    return NextResponse.json({ error: "אין הרשאת ניהול לפורום זה" }, { status: 403 });
  }
  const body = await req.json();
  const updated = await updateForumSettings(params.id, {
    memberAccess: body.memberAccess,
    visitorAccess: body.visitorAccess,
    visitorTitleVisible: body.visitorTitleVisible,
    allowJoinRequests: body.allowJoinRequests,
  });
  return NextResponse.json(updated);
}
