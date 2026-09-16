"use client";
import { useState } from "react";
import Link from "next/link";
import RichTextEditor, { Attachment } from "./RichTextEditor";
import { ThreadAvatar } from "./ForumThreads";
import { formatIsraelTime, stripHtml } from "@/lib/display";

type Author = { id: string; name: string; displayName?: string | null; avatarUrl?: string | null; avatarColor?: string | null; bio?: string | null };
type Post = {
  id: string; contentHtml: string; isBlurred: boolean; createdAt: string;
  replyToPostId?: string | null; attachments: string[]; author: Author;
};

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

export default function ThreadView({
  threadId, forumId, initialPosts, canWrite, loggedIn, blurred = false,
}: { threadId: string; forumId: string; initialPosts: Post[]; canWrite: boolean; loggedIn: boolean; blurred?: boolean }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [replyContent, setReplyContent] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);
  const [replyTo, setReplyTo] = useState<Post | null>(null);
  const [sending, setSending] = useState(false);

  function findPost(id: string) {
    return posts.find((p) => p.id === id);
  }

  async function reply() {
    if (!replyContent.trim()) return;
    setSending(true);
    const res = await fetch(`/api/threads/${threadId}/posts`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentHtml: replyContent, replyToPostId: replyTo?.id || null,
        attachments: replyAttachments.map((a) => JSON.stringify(a)),
      }),
    });
    setSending(false);
    if (!res.ok) return;
    const data = await res.json();
    setPosts(data.allPosts);
    setReplyContent(""); setReplyAttachments([]); setReplyTo(null);
  }

  return (
    <div style={blurred ? { filter: "blur(7px)", pointerEvents: "none", userSelect: "none" } : undefined}>
      <div className="card" style={{ overflow: "hidden", marginBottom: 16 }}>
        {posts.map((p, i) => {
          const original = p.replyToPostId ? findPost(p.replyToPostId) : null;
          return (
            <div key={p.id} className="post-row">
              <ThreadAvatar name={p.author.displayName || p.author.name} url={p.author.avatarUrl} color={p.author.avatarColor} size={40} />
              <div style={{ flex: 1, minWidth: 0, filter: p.isBlurred ? "blur(4px)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{p.author.displayName || p.author.name}</span>
                  <span className="post-num">#{i + 1} · {formatIsraelTime(p.createdAt)}</span>
                </div>
                {original && (
                  <div
                    title={stripHtml(original.contentHtml)}
                    style={{ fontSize: 12, color: "var(--ink-dim)", borderRight: "3px solid var(--navy-700)", paddingRight: 8, margin: "8px 0", cursor: "help" }}
                  >
                    בתגובה ל{original.author.displayName || original.author.name}: {stripHtml(original.contentHtml).split(/(?<=[.!?])\s|\n/).slice(0, 2).join(" ").slice(0, 140)}
                  </div>
                )}
                <div style={{ marginTop: 6 }} dangerouslySetInnerHTML={{ __html: p.contentHtml }} />
                <AttachmentList attachments={p.attachments} />
                {canWrite && (
                  <button
                    style={{ fontSize: 12, marginTop: 8, padding: "3px 10px" }}
                    onClick={() => { setReplyTo(p); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }}
                  >
                    השב
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {posts.length === 0 && <p style={{ color: "var(--ink-dim)", padding: 16 }}>אין עדיין הודעות באשכול זה.</p>}
      </div>

      {canWrite && (
        <div className="card" style={{ padding: 14 }}>
          {replyTo && (
            <div style={{ fontSize: 12, color: "var(--ink-dim)", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              <span>משיב ל{replyTo.author.displayName || replyTo.author.name}</span>
              <button onClick={() => setReplyTo(null)} style={{ padding: "0 6px", fontSize: 11 }}>ביטול</button>
            </div>
          )}
          <RichTextEditor
            value={replyContent} onChange={setReplyContent} placeholder="הוסף תגובה..."
            attachments={replyAttachments} onAttachmentsChange={setReplyAttachments}
          />
          <button className="btn-primary" style={{ marginTop: 10 }} onClick={reply} disabled={sending}>
            {sending ? "שולח..." : "שליחת תגובה"}
          </button>
        </div>
      )}
      {!canWrite && loggedIn && (
        <p style={{ color: "var(--ink-dim)", fontSize: 13 }}>אין לך הרשאת כתיבה בפורום זה - צפייה בלבד.</p>
      )}
      {!loggedIn && (
        <p style={{ color: "var(--ink-dim)", fontSize: 13 }}>
          <Link href="/login" style={{ textDecoration: "underline" }}>התחבר</Link> כדי לכתוב הודעות.
        </p>
      )}
    </div>
  );
}
