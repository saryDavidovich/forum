import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isForumAdmin, listJoinRequestsForForum, createJoinRequest, updateJoinRequestStatus, getForum } from "@/lib/store";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const userId = getSessionUserId();
  if (!userId || !(await isForumAdmin(params.id, userId))) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  const rows = await listJoinRequestsForForum(params.id);
  return NextResponse.json(rows.map((r) => ({
    id: r.id, message: r.message, attachments: r.attachments, status: r.status,
    createdAt: r.createdAt, fromName: r.user.displayName || r.user.name, fromEmail: r.user.email,
  })));
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "יש להתחבר כדי לשלוח בקשה" }, { status: 401 });
  const forum = await getForum(params.id);
  if (!forum || !forum.allowJoinRequests) {
    return NextResponse.json({ error: "פורום זה לא מאפשר בקשות הצטרפות" }, { status: 400 });
  }
  const { message, attachments } = await req.json();
  const jr = await createJoinRequest(params.id, userId, message || "", attachments || []);
  return NextResponse.json(jr);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = getSessionUserId();
  if (!userId || !(await isForumAdmin(params.id, userId))) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  const { id, status } = await req.json();
  const jr = await updateJoinRequestStatus(id, status);
  return NextResponse.json(jr);
}
