"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateForumModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [memberAccess, setMemberAccess] = useState<"VIEW_ONLY" | "VIEW_AND_EDIT">("VIEW_AND_EDIT");
  const [visitorAccess, setVisitorAccess] = useState<"NONE" | "VIEW_ONLY" | "VIEW_AND_COMMENT">("VIEW_ONLY");
  const [visitorTitleVisible, setVisitorTitleVisible] = useState(true);
  const [allowJoinRequests, setAllowJoinRequests] = useState(false);
  const [memberEmails, setMemberEmails] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("נא להזין כותרת"); return; }
    setSaving(true);
    const res = await fetch("/api/forums", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, memberAccess, visitorAccess, visitorTitleVisible, allowJoinRequests }),
    });
    if (!res.ok) { setSaving(false); setError((await res.json()).error || "שגיאה"); return; }
    const forum = await res.json();

    const emails = memberEmails.split(/[\n,]/).map((e) => e.trim()).filter(Boolean);
    if (emails.length > 0) {
      await fetch("/api/invites", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forumId: forum.id, invites: emails.map((email) => ({ email })) }),
      });
    }

    setSaving(false);
    onClose();
    router.push(`/forum/${forum.id}`);
    router.refresh();
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(15,27,48,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, overflow: "auto", padding: 20 }}
      onClick={onClose}
    >
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="card" style={{ padding: 24, width: 460, maxWidth: "90vw" }}>
        <h3 style={{ marginBottom: 16 }}>יצירת פורום חדש</h3>

        <label style={{ fontSize: 13, color: "var(--ink-dim)" }}>כותרת הפורום</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", marginTop: 4, marginBottom: 12 }} />

        <label style={{ fontSize: 13, color: "var(--ink-dim)" }}>תיאור קצר</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ width: "100%", marginTop: 4, marginBottom: 16, resize: "vertical" }} />

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "var(--ink-dim)", marginBottom: 6 }}>רמת הרשאה לחברי הפורום</div>
          <div style={{ display: "flex", gap: 10 }}>
            <RadioBtn checked={memberAccess === "VIEW_AND_EDIT"} onClick={() => setMemberAccess("VIEW_AND_EDIT")} label="צפייה ועריכה" />
            <RadioBtn checked={memberAccess === "VIEW_ONLY"} onClick={() => setMemberAccess("VIEW_ONLY")} label="צפייה בלבד" />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "var(--ink-dim)", marginBottom: 6 }}>רמת הרשאה למבקרים (שאינם חברים)</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <RadioBtn checked={visitorAccess === "NONE"} onClick={() => setVisitorAccess("NONE")} label="ללא גישה כלל" />
            <RadioBtn checked={visitorAccess === "VIEW_ONLY"} onClick={() => setVisitorAccess("VIEW_ONLY")} label="צפייה בלבד" />
            <RadioBtn checked={visitorAccess === "VIEW_AND_COMMENT"} onClick={() => setVisitorAccess("VIEW_AND_COMMENT")} label="צפייה ותגובה" />
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 13 }}>
          <input type="checkbox" checked={visitorTitleVisible} onChange={(e) => setVisitorTitleVisible(e.target.checked)} />
          מבקרים שאינם חברים רואים את כותרות האשכולות (אם כבוי - יטושטש)
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13 }}>
          <input type="checkbox" checked={allowJoinRequests} onChange={(e) => setAllowJoinRequests(e.target.checked)} />
          אפשר למבקרים לשלוח בקשת הצטרפות למנהל
        </label>

        <label style={{ fontSize: 13, color: "var(--ink-dim)" }}>הוספת חברים כבר עכשיו (רשות)</label>
        <textarea
          value={memberEmails} onChange={(e) => setMemberEmails(e.target.value)} rows={2}
          placeholder="כתובות מייל, מופרדות בפסיק או בשורה חדשה"
          style={{ width: "100%", marginTop: 4, marginBottom: 16, resize: "vertical" }}
        />

        {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 10 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-start" }}>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? "יוצר..." : "יצירת פורום"}</button>
          <button type="button" onClick={onClose}>ביטול</button>
        </div>
      </form>
    </div>
  );
}

function RadioBtn({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className={checked ? "btn-primary" : "btn"} style={{ fontSize: 13 }}>
      {label}
    </button>
  );
}
