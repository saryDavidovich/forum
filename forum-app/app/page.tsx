"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import CreateForumModal from "@/components/CreateForumModal";

type Forum = { id: string; title: string; description: string; visitorAccess: string; isBlocked: boolean };

export default function HomePage() {
  const [forums, setForums] = useState<Forum[]>([]);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    fetch("/api/forums").then((r) => r.json()).then(setForums);
  }, []);

  const filtered = forums.filter(
    (f) => !f.isBlocked && (f.title.includes(query) || f.description?.includes(query))
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          placeholder="חיפוש בפורומים..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ פורום חדש</button>
        <button className="btn-gold">לוח מודעות</button>
        <button onClick={() => setShowContact(true)}>יצירת קשר</button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map((f) => (
          <Link key={f.id} href={`/forum/${f.id}`} className="card" style={{ display: "block", padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h3 style={{ fontSize: 19 }}>{f.title}</h3>
              <span className="chip">
                {f.visitorAccess === "NONE" ? "פורום סגור" : f.visitorAccess === "VIEW_ONLY" ? "צפייה חופשית" : "פתוח לתגובות"}
              </span>
            </div>
            <p style={{ color: "var(--ink-dim)", marginTop: 6, fontSize: 14 }}>{f.description}</p>
          </Link>
        ))}
        {filtered.length === 0 && <div style={{ color: "var(--ink-dim)" }}>לא נמצאו פורומים תואמים.</div>}
      </div>

      {showCreate && <CreateForumModal onClose={() => setShowCreate(false)} />}
      {showContact && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,27,48,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500 }} onClick={() => setShowContact(false)}>
          <div className="card" style={{ padding: 24, width: 360 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 10 }}>יצירת קשר</h3>
            <p style={{ fontSize: 14, color: "var(--ink-dim)" }}>
              ניתן ליצור קשר בכתובת התמיכה שתוגדר עבור המערכת (placeholder - יש לחבר טופס אמיתי / כתובת מייל).
            </p>
            <button onClick={() => setShowContact(false)} style={{ marginTop: 14 }}>סגירה</button>
          </div>
        </div>
      )}
    </div>
  );
}
