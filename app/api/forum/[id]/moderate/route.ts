import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isForumAdmin, setThreadBlocked, setPostBlurred } from "@/lib/store";

// POST { action: "blockThread" | "blurPost", id, value }
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  if (!(await isForumAdmin(params.id, userId))) {
    return NextResponse.json({ error: "אין הרשאת ניהול לפורום זה" }, { status: 403 });
  }
  const { action, id, value } = await req.json();
  if (action === "blockThread") return NextResponse.json(await setThreadBlocked(id, value));
  if (action === "blurPost") return NextResponse.json(await setPostBlurred(id, value));
  return NextResponse.json({ error: "פעולה לא מוכרת" }, { status: 400 });
}
