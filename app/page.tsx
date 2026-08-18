import { getSessionUserId } from "@/lib/session";
import { listForums, threadFeed, forumsForUser } from "@/lib/store";
import HomeContent from "@/components/HomeContent";

export const dynamic = "force-dynamic";


export default async function HomePage() {
  const userId = getSessionUserId();
  const [forums, threads] = await Promise.all([listForums(), threadFeed()]);

  let myForumIds = new Set<string>();
  if (userId) {
    const { owned, memberOf } = await forumsForUser(userId);
    myForumIds = new Set([...owned, ...memberOf].map((f) => f.id));
  }

  function accessLabel(forum: { id: string; visitorAccess: string; ownerId: string }) {
    if (userId && (myForumIds.has(forum.id) || forum.ownerId === userId)) return "אתה חבר";
    if (forum.visitorAccess === "NONE") return "סגור";
    if (forum.visitorAccess === "VIEW_ONLY") return "צפייה בלבד";
    return "פתוח לתגובות";
  }

  const forumsData = forums
    .filter((f) => !f.isBlocked)
    .map((f) => ({ id: f.id, title: f.title, description: f.description || "", access: accessLabel(f) }));

  const threadsData = threads.map((t) => ({
    id: t.id,
    title: t.title,
    tags: t.tags,
    updatedAt: t.updatedAt.toISOString(),
    postCount: t.posts.length,
    forumId: t.forum.id,
    forumTitle: t.forum.title,
    titleHidden: !(userId && myForumIds.has(t.forum.id)) && !t.forum.visitorTitleVisible,
    access: accessLabel(t.forum),
    authorName: t.author.displayName || t.author.name,
  }));

  return <HomeContent forums={forumsData} threads={threadsData} />;
}
