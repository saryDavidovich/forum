// ניסוי 2 - מבודד לחלוטין, לא נוגע/מייבא משום קובץ אחר בפרויקט. כדי
// להסיר את כל הניסוי - מוחקים את שתי התיקיות: app/api/rec-test2/ (זו)
// וגם app/api/rec-test2-data/.
//
// ההבדל מניסוי 1 (app/api/rec-test): שם הדף שהוגש כתגובה לניווט ישיר כבר
// הכיל את הקובץ מוטמע בפנים (data: URI) - וגם זה יצא קצוץ אצל הלקוח, אף
// שזו אותה תשתית (הפורומים) שבה קבצים מצורפים אמיתיים תמיד ירדו בשלמות.
// ההבדל היחיד שנשאר לבודד: איך הקבצים המצורפים האמיתיים בפרויקט הזה באמת
// עובדים - הם *לא* מגיעים כניווט ישיר לדף עם קובץ בפנים. הם מגיעים כ-JSON
// גדול (GET /api/threads, כולל data: URI מוטמע) שה-JavaScript של דף שכבר
// טעון מביא בעצמו דרך fetch(), ורק אז בונה את קישור ההורדה בדף (DOM כבר
// קיים) - בלי בקשת ניווט נוספת. כאן משחזרים בדיוק את הצורה הזו: דף קטן
// וקליל נטען קודם (בלי שום קובץ בפנים בכלל), וה-JavaScript שלו מביא את
// הקובץ בנפרד מ-/api/rec-test2-data ובונה ממנו קישור הורדה (data: URI)
// בדיוק כמו ForumThreads.tsx.
//
// שימוש: GET /rec-test2 -> נשתמש בנתיב /api/rec-test2 (לא page.tsx, כדי
// לא לגעת בעץ ה-app/ הרגיל של הפרויקט) עם אותם פרמטרים כמו ניסוי 1:
// ?url=<כתובת, מקודדת ב-URL>&filename=<שם קובץ>

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const recUrl = searchParams.get("url") || "";
  const filenameParam = searchParams.get("filename") || "recording.wav";

  if (!recUrl) {
    return new Response("חסר פרמטר url", { status: 400 });
  }

  const dataUrl = `/api/rec-test2-data?url=${encodeURIComponent(recUrl)}&filename=${encodeURIComponent(filenameParam)}`;
  // JSON.stringify (לא HTML-escaping!) כדי להטמיע את המחרוזת בתוך <script>
  // בצורה תקינה כ-JS string literal - זה תוך תגית script, לא תוך attribute
  // HTML, אז &amp; וכו' היו נשארים מילוליים ושוברים את ה-query string
  // (זו הייתה טעות אמיתית שתפסתי בבדיקה - filename נבלע בשקט לברירת המחדל).
  const dataUrlJs = JSON.stringify(dataUrl);

  const page = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ניסוי 2 - fetch מדף טעון</title>
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
  .meta { font-size:12px; color:#9ca3af; margin-top:16px; word-break:break-all; }
  #err { color:#dc2626; display:none; }
</style>
</head>
<body>
<div class="card">
  <h2>ניסוי 2</h2>
  <p id="status">מביא את ההקלטה (fetch, לא ניווט)...</p>
  <p id="err"></p>
</div>
<script>
(function() {
  var statusEl = document.getElementById('status');
  var errEl = document.getElementById('err');
  fetch(${dataUrlJs})
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) { throw new Error(data.error); }
      var a = document.createElement('a');
      a.id = 'dl';
      a.className = 'btn';
      a.href = 'data:' + data.mimetype + ';base64,' + data.b64;
      a.download = data.filename;
      a.textContent = '⬇️ להורדה לחצו כאן';
      document.querySelector('.card').appendChild(a);
      var meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = 'גודל בפועל: ' + data.byteLength.toLocaleString() + ' בייטים | כתובת סופית: ' + data.finalUrl;
      document.querySelector('.card').appendChild(meta);
      statusEl.textContent = 'ההקלטה התקבלה (' + data.byteLength.toLocaleString() + ' בייטים) - מפעילים הורדה...';
      a.click();
    })
    .catch(function(e) {
      statusEl.style.display = 'none';
      errEl.style.display = 'block';
      errEl.textContent = 'שגיאה: ' + e.message;
    });
})();
</script>
</body>
</html>`;

  return new Response(page, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
