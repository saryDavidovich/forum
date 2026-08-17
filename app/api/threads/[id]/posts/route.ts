import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { createPost, listPosts, getForum, notifiableMembers, db } from "@/lib/store";
import { sendEmail, newReplyEmailHtml } from "@/lib/email";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "יש להתחבר כדי להגיב" }, { status: 401 });
  const { contentHtml } = await req.json();
  if (!contentHtml?.trim()) return NextResponse.json({ error: "התוכן ריק" }, { status: 400 });

  const post = createPost({ threadId: params.id, authorId: userId, contentHtml });

  // שליחת התראת מייל לחברי הפורום שביקשו לקבל עדכון על תגובה חדשה
  const thread = db().threads.find((t) => t.id === params.id);
  if (thread) {
    const forum = getForum(thread.forumId);
    if (forum) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
      const forumUrl = `${appUrl}/forum/${forum.id}`;
      const recipients = notifiableMembers(forum.id, userId);
      await Promise.all(
        recipients.map((u) =>
          sendEmail({
            to: u.email,
            subject: `תגובה חדשה בפורום "${forum.title}"`,
            html: newReplyEmailHtml({ forumTitle: forum.title, threadTitle: thread.title, forumUrl, appUrl }),
          })
        )
      );
    }
  }

  return NextResponse.json({ post, allPosts: listPosts(params.id) });
}
