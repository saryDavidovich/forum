import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/adminSession";
import { setUserBlocked, setThreadBlocked, setPostBlurred, setForumBlocked } from "@/lib/store";

// POST { action: "blockUser"|"blockThread"|"blurPost"|"blockForum", id: string, value: boolean }
export async function POST(req: Request) {
  if (!isAdminSession()) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  const { action, id, value } = await req.json();

  switch (action) {
    case "blockUser": return NextResponse.json(setUserBlocked(id, value));
    case "blockThread": return NextResponse.json(setThreadBlocked(id, value));
    case "blurPost": return NextResponse.json(setPostBlurred(id, value));
    case "blockForum": return NextResponse.json(setForumBlocked(id, value));
    default: return NextResponse.json({ error: "פעולה לא מוכרת" }, { status: 400 });
  }
}
