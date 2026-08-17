import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUserId } from "@/lib/session";
import { findUserById, forumsForUser } from "@/lib/store";
import InvitePanel from "@/components/InvitePanel";

export default function ProfilePage() {
  const userId = getSessionUserId();
  if (!userId) redirect("/login");
  const user = findUserById(userId)!;
  const { owned, memberOf } = forumsForUser(userId);

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>הפרופיל שלי</h2>
      <p style={{ color: "var(--ink-dim)", marginBottom: 24 }}>{user.name} · {user.email}</p>

      <section style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 10 }}>הפורומים שיצרתי</h3>
        {owned.length === 0 && <p style={{ color: "var(--ink-dim)", fontSize: 14 }}>עדיין לא יצרת פורום.</p>}
        <div style={{ display: "grid", gap: 10 }}>
          {owned.map((f) => (
            <div key={f.id} className="card" style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link href={`/forum/${f.id}`} style={{ fontWeight: 600 }}>{f.title}</Link>
                <span className="chip">בעלים</span>
              </div>
              <InvitePanel forumId={f.id} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 style={{ marginBottom: 10 }}>פורומים שאני חבר בהם</h3>
        {memberOf.length === 0 && <p style={{ color: "var(--ink-dim)", fontSize: 14 }}>עדיין לא הצטרפת לפורום.</p>}
        <div style={{ display: "grid", gap: 10 }}>
          {memberOf.map((f) => (
            <Link key={f.id} href={`/forum/${f.id}`} className="card" style={{ display: "block", padding: 14 }}>
              {f.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
