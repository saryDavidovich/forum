"use client";
import { useState } from "react";
import Link from "next/link";
import CreateForumModal from "@/components/CreateForumModal";
import { formatIsraelTime } from "@/lib/display";

type ForumItem = { id: string; title: string; description: string; access: string };
type ThreadItem = {
  id: string; title: string; tags: string[]; updatedAt: string; postCount: number;
  forumId: string; forumTitle: string; titleHidden: boolean; access: string; authorName: string;
};

function AccessChip({ access }: { access: string }) {
  const color = access === "אתה חבר" ? "var(--ok)" : access === "סגור" ? "var(--danger)" : "var(--ink-dim)";
  return <span className="chip" style={{ color }}>{access}</span>;
}

export default function HomeContent({ forums, threads }: { forums: ForumItem[]; threads: ThreadItem[] }) {
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSent, setContactSent] = useState(false);

  const filteredThreads = threads.filter((t) => t.title.includes(query) || t.forumTitle.includes(query));

  async function sendContact() {
    await fetch("/api/contact", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: contactName, email: contactEmail, message: contactMessage }),
    });
    setContactSent(true);
  }

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <input
            placeholder="חיפוש באשכולות..." value={query} onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <button className="btn-primary" onClick={() => setShowCreate(true)}>+ פורום חדש</button>
          <button onClick={() => setShowContact(true)}>יצירת קשר</button>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {filteredThreads.map((t) => (
            <Link key={t.id} href={`/forum/${t.forumId}`} className="card" style={{ display: "block", padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                <h3 style={{ fontSize: 17, filter: t.titleHidden ? "blur(5px)" : "none" }}>{t.title}</h3>
                <AccessChip access={t.access} />
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
                <span className="chip">{t.forumTitle}</span>
                {t.tags.map((tag) => <span key={tag} className="chip" style={{ fontSize: 11 }}>{tag}</span>)}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-dim)", marginTop: 8 }}>
                {t.authorName} · {t.postCount} תגובות · עודכן {formatIsraelTime(t.updatedAt)}
              </div>
            </Link>
          ))}
          {filteredThreads.length === 0 && <div style={{ color: "var(--ink-dim)" }}>לא נמצאו אשכולות תואמים.</div>}
        </div>
      </div>

      <aside style={{ width: 240, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--ink-dim)" }}>רשימת הפורומים</div>
        <div style={{ display: "grid", gap: 8 }}>
          {forums.map((f) => (
            <Link key={f.id} href={`/forum/${f.id}`} className="card" style={{ display: "block", padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{f.title}</span>
              </div>
              <AccessChip access={f.access} />
            </Link>
          ))}
        </div>
      </aside>

      {showCreate && <CreateForumModal onClose={() => setShowCreate(false)} />}
      {showContact && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,27,48,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500 }} onClick={() => setShowContact(false)}>
          <div className="card" style={{ padding: 24, width: 380 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 10 }}>יצירת קשר</h3>
            {contactSent ? (
              <p>הפנייה נשלחה, תודה!</p>
            ) : (
              <>
                <input placeholder="שם" value={contactName} onChange={(e) => setContactName(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
                <input placeholder="אימייל" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
                <textarea placeholder="הודעה" value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} rows={4} style={{ width: "100%", marginBottom: 10, resize: "vertical" }} />
                <button className="btn-primary" onClick={sendContact}>שליחה</button>
              </>
            )}
            <button onClick={() => setShowContact(false)} style={{ marginTop: 10, marginRight: 8 }}>סגירה</button>
          </div>
        </div>
      )}
    </div>
  );
}
