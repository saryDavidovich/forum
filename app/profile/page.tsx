import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUserId } from "@/lib/session";
import { findUserById, forumsForUser } from "@/lib/store";
import InvitePanel from "@/components/InvitePanel";

export default async function ProfilePage() {
  const userId = getSessionUserId();
  if (!userId) redirect("/login");
  const user = await findUserById(userId);
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");
  const { owned, memberOf } = await forumsForUser(userId);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
          background: user.avatarUrl ? "transparent" : (user.avatarColor || "var(--navy-800)"),
          display: "flex", alignItems: "center", justifyContent: "center", color: "#f3e6c8", fontSize: 20,
        }}>
          {user.avatarUrl
            ? <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (user.displayName || user.name).slice(0, 1)}
        </div>
        <div>
          <h2 style={{ marginBottom: 2 }}>{user.displayName || user.name}</h2>
          <p style={{ color: "var(--ink-dim)", fontSize: 13 }}>{user.email}{user.bio ? ` · ${user.bio}` : ""}</p>
        </div>
      </div>

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
