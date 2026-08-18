import { notFound } from "next/navigation";
import { getForum, isMember } from "@/lib/store";
import { getSessionUserId } from "@/lib/session";
import ForumThreads from "@/components/ForumThreads";

export default async function ForumPage({ params }: { params: { id: string } }) {
  const forum = await getForum(params.id);
  if (!forum) notFound();

  const userId = getSessionUserId();
  const member = userId ? await isMember(forum.id, userId) : false;

  const canView =
    forum.visitorAccess !== "NONE" || member || forum.ownerId === userId;
  const canWrite = member
    ? forum.memberAccess === "VIEW_AND_EDIT"
    : forum.visitorAccess === "VIEW_AND_COMMENT";

  if (forum.isBlocked && forum.ownerId !== userId) {
    return <p style={{ color: "var(--danger)" }}>הפורום הזה חסום כרגע על ידי הנהלת המערכת.</p>;
  }

  if (!canView) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <h3>פורום סגור</h3>
        <p style={{ color: "var(--ink-dim)", marginTop: 8 }}>
          הפורום הזה מיועד לחברים בלבד. אם קיבלת הזמנה, היכנס דרך הקישור שנשלח אליך במייל.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>{forum.title}</h2>
      <p style={{ color: "var(--ink-dim)", marginBottom: 20 }}>{forum.description}</p>
      <ForumThreads forumId={forum.id} canWrite={canWrite} loggedIn={!!userId} />
    </div>
  );
}
