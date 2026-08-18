"use client";
import { useEffect, useState } from "react";

type Member = { userId: string; role: string; name: string; email: string };
type JoinReq = { id: string; message: string; attachments: string[]; status: string; createdAt: string; fromName: string; fromEmail: string };

export default function ForumAdminPanel({
  forumId, initialSettings,
}: {
  forumId: string;
  initialSettings: { memberAccess: string; visitorAccess: string; visitorTitleVisible: boolean; allowJoinRequests: boolean };
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"members" | "settings" | "requests">("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinReq[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [settings, setSettings] = useState(initialSettings);
  const [msg, setMsg] = useState("");

  async function loadMembers() {
    const data = await fetch(`/api/forum/${forumId}/members`).then((r) => r.json());
    setMembers(data);
  }
  async function loadRequests() {
    const data = await fetch(`/api/forum/${forumId}/join-requests`).then((r) => r.json());
    setJoinRequests(data);
  }
  useEffect(() => { if (open) { loadMembers(); loadRequests(); } }, [open]);

  async function addMember() {
    if (!newEmail) return;
    const res = await fetch(`/api/forum/${forumId}/members`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: newEmail }),
    });
    setMsg(res.ok ? "החבר נוסף" : "לא נמצא משתמש עם המייל הזה (עליו להיות רשום כבר במערכת)");
    setNewEmail("");
    loadMembers();
  }

  async function setRole(userId: string, role: "ADMIN" | "MEMBER") {
    await fetch(`/api/forum/${forumId}/members`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, role }),
    });
    loadMembers();
  }

  async function removeMember(userId: string) {
    await fetch(`/api/forum/${forumId}/members`, {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }),
    });
    loadMembers();
  }

  async function saveSettings() {
    await fetch(`/api/forum/${forumId}/settings`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings),
    });
    setMsg("ההגדרות נשמרו");
  }

  async function respondRequest(id: string, status: "ACCEPTED" | "REJECTED") {
    await fetch(`/api/forum/${forumId}/join-requests`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }),
    });
    loadRequests();
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} style={{ marginBottom: 16 }}>⚙️ ניהול הפורום</button>;
  }

  return (
    <div className="card" style={{ padding: 16, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={tab === "members" ? "btn-primary" : "btn"} onClick={() => setTab("members")}>חברים</button>
          <button className={tab === "settings" ? "btn-primary" : "btn"} onClick={() => setTab("settings")}>הגדרות</button>
          <button className={tab === "requests" ? "btn-primary" : "btn"} onClick={() => setTab("requests")}>
            בקשות הצטרפות {joinRequests.filter((r) => r.status === "PENDING").length > 0 && `(${joinRequests.filter((r) => r.status === "PENDING").length})`}
          </button>
        </div>
        <button onClick={() => setOpen(false)}>סגירה</button>
      </div>

      {tab === "members" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input placeholder="אימייל של משתמש רשום" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={{ flex: 1 }} />
            <button className="btn-primary" onClick={addMember}>הוספת חבר</button>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {members.map((m) => (
              <div key={m.userId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--paper-dim)" }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{m.name}</span> <span style={{ color: "var(--ink-dim)", fontSize: 12 }}>{m.email}</span>
                  <span className="chip" style={{ marginRight: 8, fontSize: 11 }}>{m.role === "OWNER" ? "מנהל ראשי" : m.role === "ADMIN" ? "מנהל" : "חבר"}</span>
                </div>
                {m.role !== "OWNER" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    {m.role === "MEMBER"
                      ? <button style={{ fontSize: 12 }} onClick={() => setRole(m.userId, "ADMIN")}>הפוך למנהל</button>
                      : <button style={{ fontSize: 12 }} onClick={() => setRole(m.userId, "MEMBER")}>הסר ניהול</button>}
                    <button className="btn-danger" style={{ fontSize: 12 }} onClick={() => removeMember(m.userId)}>הסרה</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--ink-dim)", marginBottom: 6 }}>הרשאת חברים</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className={settings.memberAccess === "VIEW_AND_EDIT" ? "btn-primary" : "btn"} onClick={() => setSettings({ ...settings, memberAccess: "VIEW_AND_EDIT" })}>צפייה ועריכה</button>
              <button className={settings.memberAccess === "VIEW_ONLY" ? "btn-primary" : "btn"} onClick={() => setSettings({ ...settings, memberAccess: "VIEW_ONLY" })}>צפייה בלבד</button>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: "var(--ink-dim)", marginBottom: 6 }}>הרשאת מבקרים</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className={settings.visitorAccess === "NONE" ? "btn-primary" : "btn"} onClick={() => setSettings({ ...settings, visitorAccess: "NONE" })}>ללא גישה</button>
              <button className={settings.visitorAccess === "VIEW_ONLY" ? "btn-primary" : "btn"} onClick={() => setSettings({ ...settings, visitorAccess: "VIEW_ONLY" })}>צפייה בלבד</button>
              <button className={settings.visitorAccess === "VIEW_AND_COMMENT" ? "btn-primary" : "btn"} onClick={() => setSettings({ ...settings, visitorAccess: "VIEW_AND_COMMENT" })}>צפייה ותגובה</button>
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={settings.visitorTitleVisible} onChange={(e) => setSettings({ ...settings, visitorTitleVisible: e.target.checked })} />
            מבקרים שאינם חברים רואים את כותרות האשכולות (אם כבוי - הכותרות יטושטשו)
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={settings.allowJoinRequests} onChange={(e) => setSettings({ ...settings, allowJoinRequests: e.target.checked })} />
            אפשר למבקרים לשלוח בקשת הצטרפות
          </label>
          <button className="btn-primary" onClick={saveSettings} style={{ width: "fit-content" }}>שמירת הגדרות</button>
        </div>
      )}

      {tab === "requests" && (
        <div style={{ display: "grid", gap: 10 }}>
          {joinRequests.length === 0 && <p style={{ color: "var(--ink-dim)" }}>אין בקשות הצטרפות.</p>}
          {joinRequests.map((r) => (
            <div key={r.id} className="card" style={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{r.fromName}</strong>
                <span className="chip">{r.status === "PENDING" ? "ממתין" : r.status === "ACCEPTED" ? "אושר" : "נדחה"}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-dim)" }}>{r.fromEmail}</div>
              <p style={{ marginTop: 6 }}>{r.message}</p>
              {r.status === "PENDING" && (
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button className="btn-primary" onClick={() => respondRequest(r.id, "ACCEPTED")}>אישור הצטרפות</button>
                  <button className="btn-danger" onClick={() => respondRequest(r.id, "REJECTED")}>דחייה</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {msg && <div style={{ fontSize: 12, color: "var(--ok)", marginTop: 10 }}>{msg}</div>}
    </div>
  );
}
