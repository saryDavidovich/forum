import { NextResponse } from "next/server";
import { createInvite } from "@/lib/store";

// POST { forumId, invites: [{name, email}, ...] }
// שולח (בפועל: היה שולח) מייל הזמנה עם קישור לכל אחד.
// שליחת המייל בפועל מסומנת למטה כ-TODO - צריך שירות מייל אמיתי עם API key.
export async function POST(req: Request) {
  const { forumId, invites } = await req.json();
  if (!forumId || !Array.isArray(invites) || invites.length === 0) {
    return NextResponse.json({ error: "נתונים חסרים" }, { status: 400 });
  }

  const created = invites.map((i: { name?: string; email: string }) =>
    createInvite(forumId, i.email, i.name)
  );

  // TODO: לכל invite בהמשך - לשלוח מייל עם קישור:
  //   https://<your-domain>/join?token=<invite.token>
  // באמצעות שירות כמו Resend: https://resend.com/docs
  // דוגמה לקוד שליחה מופיעה בהערה בתחתית הקובץ.

  return NextResponse.json({ created: created.length, invites: created });
}

/*
דוגמה לשליחת מייל בפועל עם Resend (npm i resend), לאחר שיש RESEND_API_KEY ב-env:

import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: "פורומים <invites@yourdomain.com>",
  to: invite.email,
  subject: "הוזמנת להצטרף לפורום",
  html: `<p>הוזמנת להצטרף לפורום. <a href="https://yourdomain.com/join?token=${invite.token}">לחץ כאן להצטרפות</a></p>`,
});
*/
