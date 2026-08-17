"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import RichTextEditor from "./RichTextEditor";

type Post = { id: string; contentHtml: string; isBlurred: boolean; createdAt: string };
type Thread = { id: string; title: string; isBlocked: boolean; createdAt: string; posts: Post[] };

export default function ForumThreads({ forumId, canWrite, loggedIn }: { forumId: string; canWrite: boolean; loggedIn: boolean }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [openThread, setOpenThread] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  async function load() {
    const data = await fetch(`/api/threads?forumId=${forumId}`).then((r) => r.json());
    setThreads(data);
  }
  useEffect(() => { load(); }, [forumId]);

  async function createThread() {
    if (!title.trim()) return;
    await fetch("/api/threads", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forumId, title, contentHtml: content }),
    });
    setTitle(""); setContent(""); setShowNew(false);
    load();
  }

  async function reply(threadId: string) {
    if (!replyContent.trim()) return;
    await fetch(`/api/threads/${threadId}/posts`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentHtml: replyContent }),
    });
    setReplyContent("");
    load();
  }

  return (
    <div>
      {canWrite && (
        <div style={{ marginBottom: 16 }}>
          {!showNew ? (
            <button className="btn-primary" onClick={() => setShowNew(true)}>+ נושא חדש</button>
          ) : (
            <div className="card" style={{ padding: 14 }}>
              <input placeholder="כותרת הנושא" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", marginBottom: 10 }} />
              <RichTextEditor value={content} onChange={setContent} placeholder="כתוב כאן..." />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="btn-primary" onClick={createThread}>פרסום</button>
                <button onClick={() => setShowNew(false)}>ביטול</button>
              </div>
            </div>
          )}
        </div>
      )}
      {!canWrite && loggedIn && (
        <p style={{ color: "var(--ink-dim)", fontSize: 13, marginBottom: 16 }}>אין לך הרשאת כתיבה בפורום זה - צפייה בלבד.</p>
      )}
      {!loggedIn && (
        <p style={{ color: "var(--ink-dim)", fontSize: 13, marginBottom: 16 }}>
          <Link href="/login" style={{ textDecoration: "underline" }}>התחבר</Link> כדי לכתוב הודעות.
        </p>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {threads.map((t) => (
          <div key={t.id} className="card" style={{ padding: 14 }}>
            {t.isBlocked ? (
              <div style={{ color: "var(--danger)", fontSize: 14 }}>שיחה זו נחסמה על ידי הנהלת המערכת.</div>
            ) : (
              <>
                <div
                  style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}
                  onClick={() => setOpenThread(openThread === t.id ? null : t.id)}
                >
                  <strong>{t.title}</strong>
                  <span className="chip">{t.posts.length} תגובות</span>
                </div>

                {openThread === t.id && (
                  <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                    {t.posts.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          padding: "8px 0", borderBottom: "1px solid var(--paper-dim)",
                          filter: p.isBlurred ? "blur(4px)" : "none",
                        }}
                        dangerouslySetInnerHTML={{ __html: p.contentHtml }}
                      />
                    ))}
                    {canWrite && (
                      <div style={{ marginTop: 10 }}>
                        <RichTextEditor value={replyContent} onChange={setReplyContent} placeholder="הוסף תגובה..." />
                        <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => reply(t.id)}>שליחת תגובה</button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {threads.length === 0 && <p style={{ color: "var(--ink-dim)" }}>עדיין אין נושאים בפורום זה.</p>}
      </div>
    </div>
  );
}
