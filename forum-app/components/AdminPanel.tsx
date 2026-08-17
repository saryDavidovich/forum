"use client";
import { useEffect, useState } from "react";

type Stats = { totalUsers: number; onlineUsers: number; totalForums: number; totalGroups: number };
type Forum = { id: string; title: string; isBlocked: boolean; visitorAccess: string; memberAccess: string };
type Ad = { id: string; type: string; url: string; linkUrl?: string; status: string };
type Usr = { id: string; name: string; email: string; isBlocked: boolean };

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"stats" | "forums" | "users" | "ads">("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [forums, setForums] = useState<Forum[]>([]);
  const [users, setUsers] = useState<Usr[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [newAdUrl, setNewAdUrl] = useState("");
  const [newAdType, setNewAdType] = useState<"IMAGE" | "VIDEO" | "LINK">("IMAGE");
  const [uploading, setUploading] = useState(false);

  async function loadAll() {
    const s = await fetch("/api/admin/stats").then((r) => r.json());
    setStats(s.stats);
    setForums(s.forums);
    setAds(s.ads);
    const u = await fetch("/api/admin/users").then((r) => r.json());
    setUsers(u);
  }
  useEffect(() => { loadAll(); }, []);

  async function moderate(action: string, id: string, value: boolean) {
    await fetch("/api/admin/moderate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id, value }),
    });
    loadAll();
  }

  async function uploadAdFile(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/ads/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.url) setNewAdUrl(data.url);
  }

  async function createAd() {
    if (!newAdUrl) return;
    await fetch("/api/ads", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: newAdType, url: newAdUrl }),
    });
    setNewAdUrl("");
    loadAll();
  }

  async function setAdStatus(id: string, status: string) {
    await fetch("/api/ads", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    loadAll();
  }

  async function removeAd(id: string) {
    await fetch("/api/ads", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadAll();
  }

  const tabs: { key: typeof tab; label: string }[] = [
    { key: "stats", label: "סטטיסטיקה" },
    { key: "forums", label: "פורומים" },
    { key: "users", label: "משתמשים" },
    { key: "ads", label: "פרסומות" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--paper)", zIndex: 9998, overflow: "auto" }}>
      <div className="topbar" style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: "#f3e6c8" }}>ממשק ניהול</h2>
        <button onClick={onClose} style={{ background: "transparent", color: "#f3e6c8", borderColor: "#f3e6c8" }}>סגירה (Esc)</button>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "16px 24px" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? "btn-primary" : "btn"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 24px 60px" }}>
        {tab === "stats" && stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <StatCard label="משתמשים רשומים" value={stats.totalUsers} />
            <StatCard label="מחוברים כרגע" value={stats.onlineUsers} />
            <StatCard label="פורומים" value={stats.totalForums} />
            <StatCard label="חברויות בקבוצות" value={stats.totalGroups} />
          </div>
        )}

        {tab === "forums" && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "right", borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: 8 }}>כותרת</th>
                <th>גישת חברים</th>
                <th>גישת מבקרים</th>
                <th>סטטוס</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {forums.map((f) => (
                <tr key={f.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: 8 }}>{f.title}</td>
                  <td>{f.memberAccess === "VIEW_AND_EDIT" ? "צפייה ועריכה" : "צפייה בלבד"}</td>
                  <td>{f.visitorAccess === "NONE" ? "ללא גישה" : f.visitorAccess === "VIEW_ONLY" ? "צפייה בלבד" : "צפייה ותגובה"}</td>
                  <td>{f.isBlocked ? <span className="chip" style={{ color: "var(--danger)" }}>חסום</span> : <span className="chip">פעיל</span>}</td>
                  <td>
                    <button className={f.isBlocked ? "btn" : "btn-danger"} onClick={() => moderate("blockForum", f.id, !f.isBlocked)}>
                      {f.isBlocked ? "בטל חסימה" : "חסום פורום"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "users" && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "right", borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: 8 }}>שם</th>
                <th>אימייל</th>
                <th>סטטוס</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: 8 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.isBlocked ? <span className="chip" style={{ color: "var(--danger)" }}>חסום</span> : <span className="chip">פעיל</span>}</td>
                  <td>
                    <button className={u.isBlocked ? "btn" : "btn-danger"} onClick={() => moderate("blockUser", u.id, !u.isBlocked)}>
                      {u.isBlocked ? "בטל חסימה" : "חסום משתמש"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "ads" && (
          <div>
            <div className="card" style={{ padding: 16, marginBottom: 20 }}>
              <h3 style={{ marginBottom: 10 }}>הוספת פרסומת חדשה</h3>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <select value={newAdType} onChange={(e) => setNewAdType(e.target.value as any)}>
                  <option value="IMAGE">תמונה</option>
                  <option value="VIDEO">וידאו</option>
                  <option value="LINK">קישור בלבד</option>
                </select>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => e.target.files?.[0] && uploadAdFile(e.target.files[0])}
                />
                <input
                  placeholder="או הדבק כתובת URL"
                  value={newAdUrl}
                  onChange={(e) => setNewAdUrl(e.target.value)}
                  style={{ flex: 1, minWidth: 200 }}
                />
                <button className="btn-primary" disabled={uploading} onClick={createAd}>
                  {uploading ? "מעלה..." : "הוסף"}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
              {ads.map((ad) => (
                <div key={ad.id} className="card" style={{ padding: 12 }}>
                  {ad.type === "IMAGE" && <img src={ad.url} alt="" style={{ width: "100%", height: 120, objectFit: "cover" }} />}
                  {ad.type === "VIDEO" && <video src={ad.url} controls style={{ width: "100%", height: 120, objectFit: "cover" }} />}
                  {ad.type === "LINK" && <div style={{ padding: 20, textAlign: "center", background: "var(--paper-dim)" }}>{ad.url}</div>}
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="chip">
                      {ad.status === "PENDING" ? "ממתין לאישור" : ad.status === "APPROVED" ? "מאושר" : "נדחה"}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {ad.status !== "APPROVED" && <button onClick={() => setAdStatus(ad.id, "APPROVED")}>אשר</button>}
                      {ad.status !== "REJECTED" && <button onClick={() => setAdStatus(ad.id, "REJECTED")}>דחה</button>}
                      <button className="btn-danger" onClick={() => removeAd(ad.id)}>הסר</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card" style={{ padding: 16, textAlign: "center" }}>
      <div className="display" style={{ fontSize: 30 }}>{value}</div>
      <div style={{ color: "var(--ink-dim)", fontSize: 13, marginTop: 4 }}>{label}</div>
    </div>
  );
}
