"use client";
import { useState } from "react";

export default function InvitePanel({ forumId }: { forumId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function inviteOne() {
    if (!email) return;
    setBusy(true);
    const res = await fetch("/api/invites", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forumId, invites: [{ name, email }] }),
    });
    setBusy(false);
    setMsg(res.ok ? "ההזמנה נשלחה" : "שגיאה בשליחת ההזמנה");
    setName(""); setEmail("");
  }

  async function uploadExcel(file: File) {
    setBusy(true);
    const fd = new FormData();
    fd.append("forumId", forumId);
    fd.append("file", file);
    const res = await fetch("/api/invites/upload", { method: "POST", body: fd });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? `נוספו ${data.created} הזמנות מהקובץ` : "שגיאה בהעלאת הקובץ");
  }

  if (!open) {
    return (
      <button style={{ marginTop: 10, fontSize: 13 }} onClick={() => setOpen(true)}>
        + הזמנת חברים
      </button>
    );
  }

  return (
    <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <input placeholder="שם" value={name} onChange={(e) => setName(e.target.value)} style={{ width: 130 }} />
        <input placeholder="אימייל" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
        <button className="btn-primary" onClick={inviteOne} disabled={busy}>הוספה ושליחת הזמנה</button>
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-dim)", marginBottom: 6 }}>או העלאת קובץ אקסל (עמודות name, email):</div>
      <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => e.target.files?.[0] && uploadExcel(e.target.files[0])} />
      {msg && <div style={{ fontSize: 13, marginTop: 8, color: "var(--ok)" }}>{msg}</div>}
      <div style={{ fontSize: 12, color: "var(--ink-dim)", marginTop: 6 }}>
        * שליחת המייל בפועל דורשת חיבור שירות מייל (ראו README) - כרגע ההזמנה נוצרת במערכת בלבד.
      </div>
    </div>
  );
}
