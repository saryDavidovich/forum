// פלטת צבעים בסגנון עיגולי הפרופיל של גוגל - נבחר אקראית עבור מי שלא מעלה תמונה
export const AVATAR_COLORS = [
  "#0f1b30", "#a5771f", "#2f6b3e", "#8c2f2f",
  "#3a5a8c", "#6b4a8c", "#8c5a2f", "#2f6b6b",
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
