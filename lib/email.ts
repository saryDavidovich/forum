// שליחת מייל דרך SendGrid (REST API ישיר - בלי תלות ב-npm package נוספת).
// דורש SENDGRID_API_KEY ו-EMAIL_FROM במשתני הסביבה.

function parseFrom(): { email: string; name?: string } {
  const raw = process.env.EMAIL_FROM || "forum@sheasystem.com";
  const match = raw.match(/^(.*)<(.+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { email: raw.trim() };
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn("SENDGRID_API_KEY לא מוגדר - דילוג על שליחת מייל אל", to);
    return { skipped: true };
  }
  const from = parseFrom();

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from,
      // ל-forum@ אין תיבה שמקבלת - אין טעם שישיבו אליה
      reply_to: from,
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("שליחת מייל נכשלה:", res.status, errText);
    return { ok: false };
  }
  return { ok: true };
}

// --- תבנית עיצוב בסיסית, בהתאמה לצבעי הממשק (כחול-חצות + זהב) ---
function baseTemplate(bodyHtml: string, appUrl: string) {
  return `
  <div style="background:#ece8dd;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;direction:rtl;">
    <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#f6f4ef;border:1px solid #d8d2c2;">
      <tr>
        <td style="background:#0f1b30;border-bottom:3px solid #c79a34;padding:18px 24px;">
          <span style="color:#f3e6c8;font-size:20px;font-weight:bold;">הפורומים שלנו</span>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 24px;color:#1c1a15;font-size:15px;line-height:1.7;">
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;border-top:1px solid #d8d2c2;color:#565148;font-size:12px;">
          נשלח אוטומטית ממערכת הפורומים · <a href="${appUrl}" style="color:#a5771f;">${appUrl.replace(/^https?:\/\//, "")}</a>
        </td>
      </tr>
    </table>
  </div>`;
}

function button(label: string, url: string) {
  return `<a href="${url}" style="display:inline-block;margin-top:18px;padding:12px 28px;background:#0f1b30;color:#f3e6c8;text-decoration:none;font-weight:bold;font-size:14px;border:1px solid #0f1b30;">${label}</a>`;
}

export function inviteEmailHtml({
  forumTitle, inviteeName, joinUrl, appUrl,
}: { forumTitle: string; inviteeName?: string; joinUrl: string; appUrl: string }) {
  const greeting = inviteeName ? `שלום ${inviteeName},` : "שלום,";
  const body = `
    <p style="margin:0 0 6px;font-size:16px;">${greeting}</p>
    <p style="margin:0 0 4px;">הוזמנת להצטרף לפורום:</p>
    <p style="margin:0 0 4px;font-size:19px;font-weight:bold;color:#0f1b30;">${forumTitle}</p>
    <p style="margin:16px 0 0;color:#565148;">לחיצה על הכפתור תיקח אותך ישירות להצטרפות לפורום.</p>
    ${button("הצטרפות לפורום", joinUrl)}
  `;
  return baseTemplate(body, appUrl);
}

export function newReplyEmailHtml({
  forumTitle, threadTitle, forumUrl, appUrl,
}: { forumTitle: string; threadTitle: string; forumUrl: string; appUrl: string }) {
  const body = `
    <p style="margin:0 0 4px;">התקבלה תגובה חדשה בפורום <strong>${forumTitle}</strong>:</p>
    <p style="margin:0 0 4px;font-size:17px;font-weight:bold;color:#0f1b30;">${threadTitle}</p>
    ${button("צפייה בפורום", forumUrl)}
    <p style="margin:18px 0 0;color:#565148;font-size:12px;">
      ניתן לכבות התראות אלה מתוך הגדרות הפורום בפרופיל האישי שלך.
    </p>
  `;
  return baseTemplate(body, appUrl);
}
