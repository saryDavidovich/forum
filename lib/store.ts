import { randomUUID } from "crypto";
import { prisma } from "./prisma";
import type {
  User, Forum, ForumMember, Thread, Post, Invite, Advertisement,
} from "./types";

// ------------------------------------------------------------------
// שכבת גישה לנתונים - עכשיו מגובה על ידי Postgres אמיתי דרך Prisma.
// כל הפונקציות כאן async והשמות/החתימות תואמים למה שהיה בגרסת הפיתוח
// עם המערך בזיכרון, כדי שקוד קורא ישאר קריא - רק נוסף await בקריאות.
// ------------------------------------------------------------------

// ---------- Users ----------
export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } }) as unknown as Promise<User | null>;
}
export async function findUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  }) as unknown as Promise<User | null>;
}
export async function findUserByGoogleId(googleId: string) {
  return prisma.user.findUnique({ where: { googleId } }) as unknown as Promise<User | null>;
}
export async function createUser(u: Omit<User, "id" | "createdAt" | "isBlocked">) {
  return prisma.user.create({ data: { ...u } }) as unknown as Promise<User>;
}
export async function listAllUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: "desc" } }) as unknown as Promise<User[]>;
}

// ---------- Forums ----------
export async function listForums() {
  return prisma.forum.findMany({ orderBy: { createdAt: "desc" } }) as unknown as Promise<Forum[]>;
}
export async function getForum(id: string) {
  return prisma.forum.findUnique({ where: { id } }) as unknown as Promise<Forum | null>;
}
export async function createForum(f: Omit<Forum, "id" | "createdAt" | "isBlocked">) {
  const forum = await prisma.forum.create({ data: { ...f } });
  await prisma.forumMember.create({
    data: { forumId: forum.id, userId: f.ownerId, role: "OWNER", notifyOnReply: true, notifyOnMention: true },
  });
  return forum as Forum;
}
export async function forumsForUser(userId: string) {
  const [owned, memberships] = await Promise.all([
    prisma.forum.findMany({ where: { ownerId: userId } }),
    prisma.forumMember.findMany({ where: { userId }, include: { forum: true } }),
  ]);
  const memberOf = memberships.map((m) => m.forum).filter((f) => f.ownerId !== userId);
  return { owned: owned as Forum[], memberOf: memberOf as Forum[] };
}
export async function isMember(forumId: string, userId: string) {
  const row = await prisma.forumMember.findUnique({
    where: { forumId_userId: { forumId, userId } },
  });
  return !!row;
}

// ---------- Threads / Posts ----------
export async function listThreads(forumId: string) {
  return prisma.thread.findMany({ where: { forumId }, orderBy: { createdAt: "asc" } }) as unknown as Promise<Thread[]>;
}
export async function createThread(t: Omit<Thread, "id" | "createdAt" | "isBlocked">) {
  return prisma.thread.create({ data: { ...t } }) as unknown as Promise<Thread>;
}
export async function listPosts(threadId: string) {
  return prisma.post.findMany({ where: { threadId }, orderBy: { createdAt: "asc" } }) as unknown as Promise<Post[]>;
}
export async function createPost(p: Omit<Post, "id" | "createdAt" | "isBlurred">) {
  return prisma.post.create({ data: { ...p } }) as unknown as Promise<Post>;
}
export async function getThread(id: string) {
  return prisma.thread.findUnique({ where: { id } }) as unknown as Promise<Thread | null>;
}

// ---------- Invites ----------
export async function createInvite(forumId: string, email: string, name?: string) {
  return prisma.invite.create({
    data: { forumId, email, name, token: randomUUID() },
  }) as unknown as Promise<Invite>;
}
export async function findInviteByToken(token: string) {
  return prisma.invite.findUnique({ where: { token } }) as unknown as Promise<Invite | null>;
}
export async function acceptInvite(token: string, userId: string) {
  const invite = await findInviteByToken(token);
  if (!invite) return null;
  const already = await isMember(invite.forumId, userId);
  if (!already) {
    await prisma.forumMember.create({
      data: { forumId: invite.forumId, userId, role: "MEMBER", notifyOnReply: true, notifyOnMention: true },
    });
  }
  await prisma.invite.update({ where: { token }, data: { accepted: true } });
  return invite;
}

// חברי פורום שביקשו לקבל התראת מייל על תגובה חדשה (לא כולל את הכותב עצמו)
export async function notifiableMembers(forumId: string, excludeUserId: string) {
  const rows = await prisma.forumMember.findMany({
    where: { forumId, notifyOnReply: true, userId: { not: excludeUserId } },
    include: { user: true },
  });
  return rows.map((r) => r.user) as User[];
}

// ---------- Ads ----------
export async function listAds() {
  return prisma.advertisement.findMany({ orderBy: { createdAt: "desc" } }) as unknown as Promise<Advertisement[]>;
}
export async function createAd(a: Omit<Advertisement, "id" | "createdAt" | "status">) {
  return prisma.advertisement.create({ data: { ...a, status: "PENDING" } }) as unknown as Promise<Advertisement>;
}
export async function setAdStatus(id: string, status: Advertisement["status"]) {
  return prisma.advertisement.update({ where: { id }, data: { status } }) as unknown as Promise<Advertisement>;
}
export async function deleteAd(id: string) {
  await prisma.advertisement.delete({ where: { id } });
}

// ---------- Admin moderation ----------
export async function setUserBlocked(userId: string, blocked: boolean) {
  return prisma.user.update({ where: { id: userId }, data: { isBlocked: blocked } });
}
export async function setThreadBlocked(threadId: string, blocked: boolean) {
  return prisma.thread.update({ where: { id: threadId }, data: { isBlocked: blocked } });
}
export async function setPostBlurred(postId: string, blurred: boolean) {
  return prisma.post.update({ where: { id: postId }, data: { isBlurred: blurred } });
}
export async function setForumBlocked(forumId: string, blocked: boolean) {
  return prisma.forum.update({ where: { id: forumId }, data: { isBlocked: blocked } });
}

// ---------- Presence (מי מחובר עכשיו) ----------
// לא צריך להישמר בבסיס הנתונים - זה מידע רגעי בלבד, נשמר בזיכרון התהליך
// עם תפוגה של 5 דקות. מתעדכן בכל טעינת עמוד (ראה app/layout.tsx).
const presence = new Map<string, number>();
const PRESENCE_TTL_MS = 5 * 60 * 1000;

export function touchPresence(userId: string) {
  presence.set(userId, Date.now());
}
function countOnline() {
  const now = Date.now();
  let count = 0;
  for (const [, ts] of presence) if (now - ts < PRESENCE_TTL_MS) count++;
  return count;
}

// ---------- Admin stats ----------
export async function adminStats() {
  const [totalUsers, totalForums, totalGroups] = await Promise.all([
    prisma.user.count(),
    prisma.forum.count(),
    prisma.forumMember.count(),
  ]);
  return { totalUsers, onlineUsers: countOnline(), totalForums, totalGroups };
}
