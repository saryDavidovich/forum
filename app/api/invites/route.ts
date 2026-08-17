import { NextResponse } from "next/server";
import { createInvite, getForum } from "@/lib/store";
import { sendEmail, inviteEmailHtml } from "@/lib/email";

// POST { forumId, invites: [{name, email}, ...] }
// יוצר הזמנה לכל אדם ושולח מייל מעוצב עם קישור ישיר להצטרפות.
export async function POST(req: Request) {
  const { forumId, invites } = await req.json();
  if (!forumId || !Array.isArray(invites) || invites.length === 0) {
    return NextResponse.json({ error: "נתונים חסרים" }, { status: 400 });
  }

  const forum = getForum(forumId);
  if (!forum) return NextResponse.json({ error: "פורום לא נמצא" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

  const created = await Promise.all(
    invites.map(async (i: { name?: string; email: string }) => {
      const invite = createInvite(forumId, i.email, i.name);
      const joinUrl = `${appUrl}/join?token=${invite.token}`;
      await sendEmail({
        to: i.email,
        subject: `הוזמנת להצטרף לפורום "${forum.title}"`,
        html: inviteEmailHtml({ forumTitle: forum.title, inviteeName: i.name, joinUrl, appUrl }),
      });
      return invite;
    })
  );

  return NextResponse.json({ created: created.length, invites: created });
}
