// פלטת צבעים צבעונית לעיגולי הפרופיל - נבחר אקראית עבור מי שלא מעלה תמונה,
// בהשראת הגוונים הרב-צבעוניים של עיגולי המשתמשים בפורום המקור
export const AVATAR_COLORS = [
  "#b82e2e", "#2577b1", "#6b3fa0", "#2e7d46",
  "#c2660c", "#a52e73", "#1e6e6e", "#6d4a1f",
];

export function pickAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export function formatIsraelTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// טקסט רגיל בלי HTML, לתצוגת ציטוט קצר (2 שורות ראשונות)
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
