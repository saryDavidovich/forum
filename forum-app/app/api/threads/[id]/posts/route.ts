import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { createPost, listPosts } from "@/lib/store";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "יש להתחבר כדי להגיב" }, { status: 401 });
  const { contentHtml } = await req.json();
  if (!contentHtml?.trim()) return NextResponse.json({ error: "התוכן ריק" }, { status: 400 });

  const post = createPost({ threadId: params.id, authorId: userId, contentHtml });

  // TODO: כאן המקום לשלוח מייל התראה לחברי הפורום שסימנו notifyOnReply,
  // וכן מייל ייעודי אם מדובר בתגובה ישירה למישהו (notifyOnMention).
  // דורש שירות שליחת מיילים (SendGrid / Resend / SES) עם API key ב-env.

  return NextResponse.json({ post, allPosts: listPosts(params.id) });
}
