"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import RichTextEditor, { Attachment } from "./RichTextEditor";
import { AVAILABLE_TAGS } from "@/lib/tags";
import { formatIsraelTime, stripHtml } from "@/lib/display";

type Author = { id: string; name: string; displayName?: string | null; avatarUrl?: string | null; avatarColor?: string | null; bio?: string | null };
type Post = {
  id: string; contentHtml: string; isBlurred: boolean; createdAt: string;
  replyToPostId?: string | null; attachments: string[]; author: Author;
};
type Thread = { id: string; title: string; isBlocked: boolean; createdAt: string; updatedAt: string; tags: string[]; posts: Post[] };

function AuthorBadge({ author }: { author: Author }) {
  const label = author.displayName || author.name;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
        background: author.avatarUrl ? "transparent" : (author.avatarColor || "var(--navy-800)"),
        display: "flex", alignItems: "center", justifyContent: "center", color: "#f3e6c8", fontSize: 14,
      }}>
        {author.avatarUrl ? <img src={author.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : label.slice(0, 1)}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
        {author.bio && <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>{author.bio}</div>}
      </div>
    </div>
  );
}

function AttachmentList({ attachments }: { attachments: string[] }) {
  if (!attachments?.length) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
      {attachments.map((a, i) => {
        let parsed: Attachment;
        try { parsed = JSON.parse(a); } catch { return null; }
        const isImage = parsed.url.startsWith("data:image/");
        return isImage ? (
          <a key={i} href={parsed.url} download={parsed.name}>
            <img src={parsed.url} alt={parsed.name} style={{ maxWidth: 140, maxHeight: 140, border: "1px solid var(--line)" }} />
          </a>
        ) : (
          <a key={i} href={parsed.url} download={parsed.name} className="chip">📄 {parsed.name}</a>
        );
      })}
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
  const [openThread, setOpenThread] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);
  const [replyTo, setReplyTo] = useState<Post | null>(null);

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

  async function reply(threadId: string) {
    if (!replyContent.trim()) return;
    await fetch(`/api/threads/${threadId}/posts`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentHtml: replyContent, replyToPostId: replyTo?.id || null,
        attachments: replyAttachments.map((a) => JSON.stringify(a)),
      }),
    });
    setReplyContent(""); setReplyAttachments([]); setReplyTo(null);
    load();
  }

  function findPost(threadPosts: Post[], id: string) {
    return threadPosts.find((p) => p.id === id);
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

      <div style={{ display: "grid", gap: 10 }}>
        {threads.map((t) => (
          <div key={t.id} className="card" style={{ padding: 14 }}>
            {t.isBlocked ? (
              <div style={{ color: "var(--danger)", fontSize: 14 }}>אשכול זה נחסם על ידי הנהלת המערכת.</div>
            ) : (
              <>
                <div
                  style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}
                  onClick={() => setOpenThread(openThread === t.id ? null : t.id)}
                >
                  <div>
                    <strong>{t.title}</strong>
                    {t.tags?.length > 0 && (
                      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                        {t.tags.map((tag) => <span key={tag} className="chip" style={{ fontSize: 11 }}>{tag}</span>)}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <span className="chip">{t.posts.length} תגובות</span>
                    <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 4 }}>עודכן: {formatIsraelTime(t.updatedAt)}</div>
                  </div>
                </div>

                {openThread === t.id && (
                  <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                    {t.posts.map((p) => {
                      const original = p.replyToPostId ? findPost(t.posts, p.replyToPostId) : null;
                      return (
                        <div key={p.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--paper-dim)" }}>
                          <div style={{ flex: 1, filter: p.isBlurred ? "blur(4px)" : "none" }}>
                            <div style={{ fontSize: 11, color: "var(--ink-dim)", marginBottom: 4 }}>{formatIsraelTime(p.createdAt)}</div>
                            {original && (
                              <div
                                title={stripHtml(original.contentHtml)}
                                style={{ fontSize: 12, color: "var(--ink-dim)", borderRight: "3px solid var(--gold-500)", paddingRight: 8, marginBottom: 6, cursor: "help" }}
                              >
                                בתגובה ל{original.author.displayName || original.author.name}: {stripHtml(original.contentHtml).split(/(?<=[.!?])\s|\n/).slice(0, 2).join(" ").slice(0, 140)}
                              </div>
                            )}
                            <div dangerouslySetInnerHTML={{ __html: p.contentHtml }} />
                            <AttachmentList attachments={p.attachments} />
                            {canWrite && (
                              <button
                                style={{ fontSize: 12, marginTop: 6, padding: "3px 10px" }}
                                onClick={() => { setReplyTo(p); setOpenThread(t.id); }}
                              >
                                השב
                              </button>
                            )}
                          </div>
                          <AuthorBadge author={p.author} />
                        </div>
                      );
                    })}
                    {canWrite && (
                      <div style={{ marginTop: 10 }}>
                        {replyTo && (
                          <div style={{ fontSize: 12, color: "var(--ink-dim)", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                            <span>משיב ל{replyTo.author.displayName || replyTo.author.name}</span>
                            <button onClick={() => setReplyTo(null)} style={{ padding: "0 6px", fontSize: 11 }}>ביטול</button>
                          </div>
                        )}
                        <RichTextEditor
                          value={replyContent} onChange={setReplyContent} placeholder="הוסף תגובה..."
                          attachments={replyAttachments} onAttachmentsChange={setReplyAttachments}
                        />
                        <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => reply(t.id)}>שליחת תגובה</button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {threads.length === 0 && <p style={{ color: "var(--ink-dim)" }}>עדיין אין אשכולות בפורום זה.</p>}
      </div>
    </div>
  );
}
