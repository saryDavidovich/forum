import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import {
  createThread, listThreads, createPost, listPosts, getForum, isMember,
} from "@/lib/store";

// GET /api/threads?forumId=...  -> רשימת שרשורים בפורום
export async function GET(req: Request) {
  const forumId = new URL(req.url).searchParams.get("forumId");
  if (!forumId) return NextResponse.json({ error: "forumId חסר" }, { status: 400 });
  const threads = await listThreads(forumId);
  const withPosts = await Promise.all(threads.map(async (t) => ({ ...t, posts: await listPosts(t.id) })));
  return NextResponse.json(withPosts);
}

// POST /api/threads  { forumId, title, contentHtml } -> יוצר שרשור + הודעה ראשונה
export async function POST(req: Request) {
  const userId = getSessionUserId();
  const { forumId, title, contentHtml } = await req.json();
  const forum = await getForum(forumId);
  if (!forum) return NextResponse.json({ error: "פורום לא נמצא" }, { status: 404 });

  const member = userId ? await isMember(forumId, userId) : false;
  const canWrite = member
    ? forum.memberAccess === "VIEW_AND_EDIT"
    : forum.visitorAccess === "VIEW_AND_COMMENT";
  if (!userId || !canWrite) {
    return NextResponse.json({ error: "אין לך הרשאה לכתוב בפורום זה" }, { status: 403 });
  }

  const thread = await createThread({ forumId, title, authorId: userId });
  const post = await createPost({ threadId: thread.id, authorId: userId, contentHtml });
  return NextResponse.json({ ...thread, posts: [post] });
}
