// קובץ ניסוי מבודד לחלוטין - לא נוגע/מייבא משום קובץ אחר בפרויקט (לא Prisma,
// לא session, לא lib/*), ולא מיובא ע"י שום קובץ אחר. כדי להסיר את הניסוי
// לגמרי - פשוט מוחקים את התיקייה app/api/rec-test/ ולא נשאר שום זכר.
//
// למה זה קיים: בפרויקט "תמלול פון" (phone-transcription) יש באג מתמשך -
// הורדת הקלטה דרך שרת Python/Flask מגיעה קצוצה ללקוח (רק חלק ראשון של
// ההקלטה), גם אחרי ניסיונות מרובים (data: URI, JSON gדול, streaming,
// פיצול לחתיכות). לעומת זאת, בפרויקט הפורומים הזה (Next.js, אותה טכניקת
// data: URI בדיוק - ראו components/RichTextEditor.tsx ו-ForumThreads.tsx)
// הורדת קבצים שהועלו על ידי משתמשים תמיד עבדה בשלמות. הדומיין של הפורומים
// כבר "פתוח"/סומך עליו נטפרי (בניגוד לדומיין Node חדש שלוקח זמן רב
// להיפתח). הניסוי כאן: לבדוק אם דף data: URI זהה, שמוגש מהדומיין הזה
// (שכבר מוכח לא נחסם ולא קוצץ), מצליח להוריד הקלטה אמיתית מימות המשיח
// בשלמות - מה שיבודד את הבעיה (שרת Python/גunicorn/Railway הספציפי מול
// כל דומיין/פלטפורמה אחרים).
//
// שימוש: GET /api/rec-test?url=<כתובת ההקלטה מימות המשיח, מקודדת ב-URL>
// &filename=<שם קובץ רצוי (אופציונלי)>
// כתובת ה-url אמורה להיות rec_url אמיתי (או כתובת DownloadFile עם טוקן)
// שמעתיקים ידנית מלוגים/DB של פרויקט תמלול פון, רק לצורך הניסוי החד-פעמי
// הזה - אין כאן שום חיבור/תלות בין שני הפרויקטים.

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const recUrl = searchParams.get("url");
  const filenameParam = searchParams.get("filename") || "recording.wav";

  if (!recUrl) {
    return new Response("חסר פרמטר url - השתמשו ב-?url=<כתובת ההקלטה מימות המשיח>", { status: 400 });
  }

  // הגנה מינימלית - רק כדי שהניסוי הזה לא יהפוך בטעות ל-proxy פתוח לכל
  // כתובת שמישהו יבחר. מותאם לדומיין של ימות המשיח בלבד.
  let parsed: URL;
  try {
    parsed = new URL(recUrl);
  } catch {
    return new Response("כתובת url לא תקינה", { status: 400 });
  }
  if (!/(^|\.)call2all\.co\.il$/i.test(parsed.hostname)) {
    return new Response(
      `לניסוי הזה מותר להביא רק מכתובות של call2all.co.il (ימות המשיח), התקבל: ${parsed.hostname}`,
      { status: 400 }
    );
  }

  let audioBuffer: ArrayBuffer;
  let contentType = "audio/wav";
  try {
    const upstream = await fetch(recUrl);
    if (!upstream.ok) {
      return new Response(`שליפה מימות נכשלה - סטטוס ${upstream.status}`, { status: 502 });
    }
    contentType = upstream.headers.get("content-type") || contentType;
    audioBuffer = await upstream.arrayBuffer();
  } catch (e: any) {
    return new Response(`שגיאה בשליפה מימות: ${e?.message || e}`, { status: 502 });
  }

  const b64 = Buffer.from(audioBuffer).toString("base64");
  const escapedFilename = filenameParam.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
  ));

  const page = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ניסוי הורדת הקלטה (פורומים)</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; background:#f8fafc; display:flex;
         align-items:center; justify-content:center; min-height:100vh; margin:0; }
  .card { background:#fff; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,.08);
          padding:32px 28px; text-align:center; max-width:420px; }
  h2 { color:#1d4ed8; margin:0 0 8px; }
  p { color:#6b7280; margin:0 0 20px; word-break:break-word; }
  a.btn { display:inline-block; background:#ea580c; color:#fff; font-weight:700;
          padding:12px 28px; border-radius:8px; text-decoration:none; font-size:16px; }
  a.btn:hover { background:#c2410c; }
  .meta { font-size:12px; color:#9ca3af; margin-top:16px; }
</style>
</head>
<body>
<div class="card">
  <h2>ניסוי הורדת הקלטה</h2>
  <p>${escapedFilename}</p>
  <a id="dl" class="btn" href="data:${contentType};base64,${b64}" download="${escapedFilename}">⬇️ להורדה לחצו כאן</a>
  <div class="meta">גודל בפועל: ${audioBuffer.byteLength.toLocaleString()} בייטים</div>
</div>
<script>
  document.getElementById('dl').click();
</script>
</body>
</html>`;

  return new Response(page, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
