"use client";
import { useState } from "react";
import { Attachment } from "./RichTextEditor";

export default function JoinRequestButton({ forumId, loggedIn }: { forumId: string; loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function onFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setAttachments((prev) => [...prev, { name: file.name, url: reader.result as string }]);
      reader.readAsDataURL(file);
    });
  }

  async function send() {
    if (!loggedIn) { setError("יש להתחבר קודם כדי לשלוח בקשה"); return; }
    const res = await fetch(`/api/forum/${forumId}/join-requests`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, attachments: attachments.map((a) => JSON.stringify(a)) }),
    });
    if (!res.ok) { setError((await res.json()).error || "שגיאה"); return; }
    setSent(true);
  }

  if (!open) return <button onClick={() => setOpen(true)} style={{ marginBottom: 16 }}>שליחת הודעה למנהל</button>;

  return (
    <div className="card" style={{ padding: 16, marginBottom: 16 }}>
      {sent ? (
        <p>הבקשה נשלחה למנהל הפורום. תקבל עדכון כשהוא יחליט.</p>
      ) : (
        <>
          <h4 style={{ marginBottom: 8 }}>בקשת הצטרפות</h4>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="כתוב הודעה למנהל..." style={{ width: "100%", marginBottom: 8, resize: "vertical" }} />
          <input type="file" accept="image/*,.pdf" multiple onChange={(e) => onFiles(e.target.files)} style={{ marginBottom: 8 }} />
          {attachments.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {attachments.map((a, i) => <span key={i} className="chip">{a.name}</span>)}
            </div>
          )}
          {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 8 }}>{error}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={send}>שליחה</button>
            <button onClick={() => setOpen(false)}>ביטול</button>
          </div>
        </>
      )}
    </div>
  );
}
