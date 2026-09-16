"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import RichTextEditor, { Attachment } from "./RichTextEditor";
import { AVAILABLE_TAGS } from "@/lib/tags";
import { formatIsraelTime } from "@/lib/display";

type Author = { id: string; name: string; displayName?: string | null; avatarUrl?: string | null; avatarColor?: string | null };
type Thread = {
  id: string; title: string; isBlocked: boolean; createdAt: string; updatedAt: string;
  tags: string[]; views: number; posts: { id: string }[]; author: Author;
};

export function ThreadAvatar({ name, url, color, size = 38 }: { name: string; url?: string | null; color?: string | null; size?: number }) {
  return (
    <div className="avatar-circle" style={{ width: size, height: size, fontSize: Math.round(size * 0.4), background: url ? "transparent" : (color || "var(--navy-800)") }}>
      {url ? <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : name.slice(0, 1)}
    </div>
  );
}

export default function ForumThreads({
  forumId, canWrite, loggedIn, blurred = false,
}: { forumId: string; canWrite: boolean; loggedIn: boolean; blurred?: boolean }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [newAttachments, setNewAttachments] = useState<Attachment[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  async function load() {
    const data = await fetch(`/api/threads?forumId=${forumId}`).then((r) => r.json());
    setThreads(data);
  }
  useEffect(() => { load(); }, [forumId]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function createThread() {
    if (!title.trim()) return;
    await fetch("/api/threads", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        forumId, title, contentHtml: content, tags: selectedTags,
        attachments: newAttachments.map((a) => JSON.stringify(a)),
      }),
    });
    setTitle(""); setContent(""); setSelectedTags([]); setNewAttachments([]); setShowNew(false);
    load();
  }

  return (
    <div style={blurred ? { filter: "blur(7px)", pointerEvents: "none", userSelect: "none" } : undefined}>
      {canWrite && (
        <div style={{ marginBottom: 16 }}>
          {!showNew ? (
            <button className="btn-primary" onClick={() => setShowNew(true)}>+ אשכול חדש</button>
          ) : (
            <div className="card" style={{ padding: 14 }}>
              <input placeholder="כותרת האשכול" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag} type="button"
                    className={selectedTags.includes(tag) ? "btn-primary" : "btn"}
                    style={{ fontSize: 12, padding: "4px 10px" }}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <RichTextEditor
                value={content} onChange={setContent} placeholder="כתוב כאן..."
                attachments={newAttachments} onAttachmentsChange={setNewAttachments}
              />
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

      <div className="card" style={{ overflow: "hidden" }}>
        {threads.map((t, i) => (
          <Link
            key={t.id}
            href={`/forum/${forumId}/thread/${t.id}`}
            style={{
              display: "flex", gap: 12, padding: "14px 16px", alignItems: "flex-start",
              borderTop: i === 0 ? "none" : "1px solid var(--line)",
            }}
            className="thread-row"
          >
            <ThreadAvatar name={t.author.displayName || t.author.name} url={t.author.avatarUrl} color={t.author.avatarColor} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {t.isBlocked ? (
                <div style={{ color: "var(--danger)", fontSize: 14 }}>אשכול זה נחסם על ידי הנהלת המערכת.</div>
              ) : (
                <>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "var(--navy-800)" }}>{t.title}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4, alignItems: "center" }}>
                    {t.tags.map((tag) => <span key={tag} className="chip" style={{ fontSize: 11 }}>{tag}</span>)}
                    <span style={{ fontSize: 12, color: "var(--ink-dim)" }}>
                      {t.author.displayName || t.author.name} · עודכן {formatIsraelTime(t.updatedAt)}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 18, flexShrink: 0, textAlign: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{Math.max(0, t.posts.length - 1)}</div>
                <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>תגובות</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{t.views}</div>
                <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>צפיות</div>
              </div>
            </div>
          </Link>
        ))}
        {threads.length === 0 && <p style={{ color: "var(--ink-dim)", padding: 16 }}>עדיין אין אשכולות בפורום זה.</p>}
      </div>
    </div>
  );
}
