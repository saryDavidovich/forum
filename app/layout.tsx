import "./globals.css";
import Link from "next/link";
import { getSessionUserId } from "@/lib/session";
import { findUserById, touchPresence } from "@/lib/store";
import AdminGate from "@/components/AdminGate";
import LogoutButton from "@/components/LogoutButton";

export const metadata = {
  title: "פורומים",
  description: "מערכת פורומים קהילתית",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const userId = getSessionUserId();
  const user = userId ? await findUserById(userId) : null;
  if (userId) touchPresence(userId);

  return (
    <html lang="he" dir="rtl">
      <body>
        <div className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="site-logo">
              🖋️ הפורומים שלנו
            </Link>
          </div>
        </div>
        <header className="topbar">
          <nav className="site-nav-inner">
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <Link href="/">בית</Link>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {user ? (
                <>
                  <Link href="/profile" className="btn" style={{ background: "transparent" }}>
                    {user.name}
                  </Link>
                  <LogoutButton />
                </>
              ) : (
                <Link href="/login" className="btn-gold btn">התחברות / הרשמה</Link>
              )}
            </div>
          </nav>
        </header>
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 20px 80px" }}>
          {children}
        </main>
        {/* F8 פותח תיבת קוד מנהל חבויה - לא מופיע שום דבר בממשק עד שלוחצים F8 */}
        <AdminGate />
      </body>
    </html>
  );
}
