// ניסוי 3 - מבודד לחלוטין, לא נוגע/מייבא משום קובץ אחר בפרויקט. כדי להסיר
// את כל הניסוי הזה - מוחקים את התיקייה app/api/rec-test3/ (כולל תת-התיקייה
// [filename]) ולא נשאר שום זכר.
//
// ההבדל מניסוי 1 ו-2 (app/api/rec-test, app/api/rec-test2): בשניהם התוצאה
// הסופית שהמשתמש "מוריד" היא תמיד HTML עם קובץ מוטמע בפנים כ-data: URI
// (גם אם ה-HTML עצמו הובא בניווט ישיר או ב-fetch מדף טעון) - וזה יצא קצוץ
// אצל הלקוח בשני המקרים, על אף שאותה טכניקת data: URI עובדת תמיד לקבצים
// מצורפים אמיתיים בפרויקט הזה.
//
// ההיפותזה החדשה (מהמשתמש): נטפרי כבר מאפשר בכל אתר אחר הורדת קישורי קובץ
// אודיו רגילים בלי שום בעיה - הבעיה כאן היא כנראה ספציפית לצורה של הדף
// (HTML עם base64 מוטמע), לא לתוכן עצמו. אז ניסוי זה בודק צורה שלישית,
// שונה מבחינה מהותית: לא HTML בכלל, לא data: URI - אלא תגובת HTTP בינארית
// אמיתית עם Content-Type: audio/wav (או סוג התוכן שהתקבל בפועל), בלי
// Content-Disposition: attachment (בלי כותרת הורדה כפויה) - בדיוק כמו
// קישור רגיל לקובץ אודיו באתר אחר כלשהו. גם כתובת ה-URL עצמה נבנתה כך
// שתיראה כמו קובץ רגיל (מסתיימת בשם קובץ, כגון .../test.wav) - למקרה
// שנטפרי גם מסתכל על סיומת הכתובת ולא רק על Content-Type.
//
// שימוש: GET /api/rec-test3/<שם קובץ, לדוגמה recording.wav>?url=<כתובת ההקלטה
// המקורית של ימות המשיח, מקודדת ב-URL>
// (שם הקובץ בנתיב הוא לתצוגה/לסיומת בלבד - התוכן עצמו נשלף תמיד מ-?url=)

export async function GET(
  req: Request,
  { params }: { params: { filename: string } }
) {
  const { searchParams } = new URL(req.url);
  const recUrl = searchParams.get("url");
  const filenameParam = params?.filename || "recording.wav";

  if (!recUrl) {
    return new Response("חסר פרמטר url - השתמשו ב-?url=<כתובת ההקלטה>", {
      status: 400,
    });
  }
  try {
    new URL(recUrl);
  } catch {
    return new Response("כתובת url לא תקינה", { status: 400 });
  }

  let audioBuffer: ArrayBuffer;
  let contentType = "audio/wav";
  let finalUrl = recUrl;
  try {
    const upstream = await fetch(recUrl, { redirect: "follow" });
    finalUrl = upstream.url || recUrl; // הכתובת בפועל אחרי כל ה-redirect-ים
    if (!upstream.ok) {
      return new Response(
        `שליפה נכשלה - סטטוס ${upstream.status} (כתובת סופית: ${finalUrl})`,
        { status: 502 }
      );
    }
    // אותה הגנה כמו בניסוי 1/2 - נבדקת על הכתובת הסופית (אחרי redirect),
    // לא לפני, כי קישורי מעטפת (כגון SendGrid) לא חושפים את היעד האמיתי
    // לפני השליפה עצמה.
    const finalHost = new URL(finalUrl).hostname;
    if (!/(^|\.)call2all\.co\.il$/i.test(finalHost)) {
      return new Response(
        `לניסוי הזה מותר רק תוכן שמגיע בסוף מ-call2all.co.il (ימות המשיח). ` +
          `הכתובת הזו הובילה בפועל אל: ${finalHost}`,
        { status: 400 }
      );
    }
    contentType = upstream.headers.get("content-type") || contentType;
    audioBuffer = await upstream.arrayBuffer();
  } catch (e: any) {
    return new Response(`שגיאה בשליפה: ${e?.message || e}`, { status: 502 });
  }

  // ההבדל המהותי מניסוי 1/2: אין HTML, אין data: URI, ואין
  // Content-Disposition: attachment. זו תגובת HTTP בינארית ישירה - בדיוק
  // כמו קישור רגיל לקובץ אודיו. "inline" (לא "attachment") הוא בכוונה -
  // זו הצורה שאמורה להיראות לנטפרי בדיוק כמו כל קישור אודיו רגיל אחר.
  const escapedFilename = filenameParam.replace(/"/g, "");
  return new Response(audioBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${escapedFilename}"`,
      "Content-Length": String(audioBuffer.byteLength),
      "Cache-Control": "no-store",
      "X-Debug-Final-Url": finalUrl,
      "X-Debug-Byte-Length": String(audioBuffer.byteLength),
    },
  });
}
