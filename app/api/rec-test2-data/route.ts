// חלק מ"ניסוי 2" - ראו הסבר מלא ב-app/api/rec-test2/route.ts (הדף הקליל
// שקורא לנקודת קצה זו). כדי להסיר את כל הניסוי - מוחקים את שתי התיקיות
// יחד: app/api/rec-test2/ וגם app/api/rec-test2-data/ (התיקייה הזו).
// שום קובץ אחר בפרויקט לא נוגע/מייבא מכאן.
//
// נקודת קצה שמחזירה JSON בלבד (לא HTML, לא attachment) - בדיוק כמו ש-
// GET /api/threads בפרויקט הזה מחזירה JSON גדול (כולל data: URI מוטמע של
// קבצים מצורפים) והדפדפן מביא אותה דרך fetch() מתוך דף שכבר טעון, לא
// כניווט ישיר. זה ההבדל היחיד שעדיין לא בודד בניסוי 1 (app/api/rec-test),
// שם הדף עצמו (עם הקובץ מוטמע בפנים) הוגש כתגובה לניווט ישיר וגם הוא יצא
// קצוץ - אז עכשיו בודקים אם ה"צורה" של fetch מתוך דף טעון (ולא ניווט)
// עושה הבדל, על אותה תשתית בדיוק שכבר הוכחה כמצליחה למקרה הזה (הפורומים).

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const recUrl = searchParams.get("url");
  const filenameParam = searchParams.get("filename") || "recording.wav";

  if (!recUrl) {
    return Response.json({ error: "חסר פרמטר url" }, { status: 400 });
  }
  try {
    new URL(recUrl);
  } catch {
    return Response.json({ error: "כתובת url לא תקינה" }, { status: 400 });
  }

  let audioBuffer: ArrayBuffer;
  let contentType = "audio/wav";
  let finalUrl = recUrl;
  try {
    const upstream = await fetch(recUrl, { redirect: "follow" });
    finalUrl = upstream.url || recUrl;
    if (!upstream.ok) {
      return Response.json(
        { error: `שליפה נכשלה - סטטוס ${upstream.status}`, finalUrl },
        { status: 502 }
      );
    }
    const finalHost = new URL(finalUrl).hostname;
    if (!/(^|\.)call2all\.co\.il$/i.test(finalHost)) {
      return Response.json(
        { error: `הכתובת הובילה בפועל אל ${finalHost}, לא call2all.co.il` },
        { status: 400 }
      );
    }
    contentType = upstream.headers.get("content-type") || contentType;
    audioBuffer = await upstream.arrayBuffer();
  } catch (e: any) {
    return Response.json({ error: `שגיאה בשליפה: ${e?.message || e}` }, { status: 502 });
  }

  return Response.json({
    filename: filenameParam,
    mimetype: contentType,
    finalUrl,
    byteLength: audioBuffer.byteLength,
    b64: Buffer.from(audioBuffer).toString("base64"),
  });
}
