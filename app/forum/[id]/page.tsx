import { notFound } from "next/navigation";
import { getForum, isMember, getForumRole } from "@/lib/store";
import { getSessionUserId } from "@/lib/session";
import ForumThreads from "@/components/ForumThreads";
import ForumAdminPanel from "@/components/ForumAdminPanel";
import JoinRequestButton from "@/components/JoinRequestButton";
import ClassifiedsSidebar from "@/components/ClassifiedsSidebar";

export default async function ForumPage({ params }: { params: { id: string } }) {
  const forum = await getForum(params.id);
  if (!forum) notFound();

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

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{ filter: titleHidden ? "blur(6px)" : "none" }}>{forum.title}</h2>
        <p style={{ color: "var(--ink-dim)", marginBottom: 20, filter: titleHidden ? "blur(6px)" : "none" }}>{forum.description}</p>

        {isAdmin && (
          <ForumAdminPanel
            forumId={forum.id}
            initialSettings={{
              memberAccess: forum.memberAccess, visitorAccess: forum.visitorAccess,
              visitorTitleVisible: forum.visitorTitleVisible, allowJoinRequests: forum.allowJoinRequests,
            }}
          />
        )}

        {!member && forum.allowJoinRequests && <JoinRequestButton forumId={forum.id} loggedIn={!!userId} />}

        <ForumThreads forumId={forum.id} canWrite={canWrite} loggedIn={!!userId} blurred={!canView} />
      </div>
      <ClassifiedsSidebar />
    </div>
  );
}
