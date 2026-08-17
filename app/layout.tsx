import "./globals.css";
import Link from "next/link";
import { getSessionUserId } from "@/lib/session";
import { findUserById } from "@/lib/store";
import AdminGate from "@/components/AdminGate";
import LogoutButton from "@/components/LogoutButton";

export const metadata = {
  title: "פורומים",
  description: "מערכת פורומים קהילתית",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const userId = getSessionUserId();
  const user = userId ? findUserById(userId) : null;

  return (
    <html lang="he" dir="rtl">
      <body>
        <header className="topbar" style={{ padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" className="display" style={{ fontSize: 22, color: "#f3e6c8" }}>
            הפורומים שלנו
          </Link>
          <nav style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {user ? (
              <>
                <Link href="/profile" className="btn" style={{ background: "transparent", color: "#f3e6c8", borderColor: "#f3e6c8" }}>
                  {user.name}
                </Link>
                <LogoutButton />
              </>
            ) : (
              <Link href="/login" className="btn-gold btn">התחברות / הרשמה</Link>
            )}
          </nav>
        </header>
        <main style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 20px 80px" }}>
          {children}
        </main>
        {/* F8 פותח תיבת קוד מנהל חבויה - לא מופיע שום דבר בממשק עד שלוחצים F8 */}
        <AdminGate />
      </body>
    </html>
  );
}
