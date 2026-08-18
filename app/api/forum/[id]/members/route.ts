import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isForumAdmin, listForumMembersWithUsers, addForumMemberByEmail, setForumMemberRole, removeForumMember } from "@/lib/store";

async function requireAdmin(forumId: string) {
  const userId = getSessionUserId();
  if (!userId) return { ok: false as const, res: NextResponse.json({ error: "יש להתחבר" }, { status: 401 }) };
  if (!(await isForumAdmin(forumId, userId))) {
    return { ok: false as const, res: NextResponse.json({ error: "אין הרשאת ניהול לפורום זה" }, { status: 403 }) };
  }
  return { ok: true as const, userId };
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const check = await requireAdmin(params.id);
  if (!check.ok) return check.res;
  const rows = await listForumMembersWithUsers(params.id);
  return NextResponse.json(rows.map((r) => ({
    userId: r.userId, role: r.role, name: r.user.displayName || r.user.name, email: r.user.email,
  })));
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const check = await requireAdmin(params.id);
  if (!check.ok) return check.res;
  const { email } = await req.json();
  const added = await addForumMemberByEmail(params.id, email);
  if (!added) return NextResponse.json({ error: "המשתמש לא נמצא, כבר חבר, או שגיאה אחרת" }, { status: 400 });
  return NextResponse.json(added);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const check = await requireAdmin(params.id);
  if (!check.ok) return check.res;
  const { userId, role } = await req.json();
  const updated = await setForumMemberRole(params.id, userId, role);
  if (!updated) return NextResponse.json({ error: "לא ניתן לשנות הרשאה זו" }, { status: 400 });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const check = await requireAdmin(params.id);
  if (!check.ok) return check.res;
  const { userId } = await req.json();
  const ok = await removeForumMember(params.id, userId);
  if (!ok) return NextResponse.json({ error: "לא ניתן להסיר חבר זה" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
