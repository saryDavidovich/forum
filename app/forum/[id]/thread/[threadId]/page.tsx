import { notFound } from "next/navigation";
import Link from "next/link";
import { getForum, getThread, listPosts, isMember, getForumRole, incrementThreadViews } from "@/lib/store";
import { getSessionUserId } from "@/lib/session";
import ThreadView from "@/components/ThreadView";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: { params: { id: string; threadId: string } }) {
  const forum = await getForum(params.id);
  if (!forum) notFound();
  const thread = await getThread(params.threadId);
  if (!thread || thread.forumId !== forum.id) notFound();

  const userId = getSessionUserId();
  const member = userId ? await isMember(forum.id, userId) : false;
  const role = userId ? await getForumRole(forum.id, userId) : null;
  const isAdmin = role === "OWNER" || role === "ADMIN";

  const canView = forum.visitorAccess !== "NONE" || member;
  const canWrite = member
    ? forum.memberAccess === "VIEW_AND_EDIT"
    : forum.visitorAccess === "VIEW_AND_COMMENT";
  const titleHidden = !member && !forum.visitorTitleVisible;

  if (forum.isBlocked && !isAdmin) {
    return <p style={{ color: "var(--danger)" }}>הפורום הזה חסום כרגע על ידי הנהלת המערכת.</p>;
  }
  if (thread.isBlocked && !isAdmin) {
    return <p style={{ color: "var(--danger)" }}>אשכול זה נחסם על ידי הנהלת המערכת.</p>;
  }

  if (canView) await incrementThreadViews(thread.id);

  const posts = await listPosts(thread.id);
  const postsData = posts.map((p) => ({
    id: p.id, contentHtml: p.contentHtml, isBlurred: p.isBlurred, createdAt: p.createdAt.toISOString(),
    replyToPostId: p.replyToPostId, attachments: p.attachments,
    author: {
      id: p.author.id, name: p.author.name, displayName: p.author.displayName,
      avatarUrl: p.author.avatarUrl, avatarColor: p.author.avatarColor, bio: p.author.bio,
    },
  }));

  return (
    <div>
      <div style={{ fontSize: 13, color: "var(--ink-dim)", marginBottom: 10, display: "flex", gap: 6, alignItems: "center" }}>
        <Link href="/" style={{ color: "var(--navy-800)" }}>בית</Link>
        <span>›</span>
        <Link href={`/forum/${forum.id}`} style={{ color: "var(--navy-800)", filter: titleHidden ? "blur(4px)" : "none" }}>{forum.title}</Link>
      </div>
      <h2 style={{ marginBottom: 16, filter: titleHidden ? "blur(6px)" : "none" }}>{thread.title}</h2>

      <ThreadView
        threadId={thread.id}
        forumId={forum.id}
        initialPosts={postsData}
        canWrite={canWrite}
        loggedIn={!!userId}
        blurred={!canView}
      />
    </div>
  );
}
