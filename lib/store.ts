import { randomUUID } from "crypto";
import { prisma } from "./prisma";

// ------------------------------------------------------------------
// שכבת גישה לנתונים - Postgres דרך Prisma. כל הפונקציות async.
// ------------------------------------------------------------------

// ---------- Users ----------
export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}
export async function findUserByEmail(email: string) {
  return prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
}
export async function findUserByGoogleId(googleId: string) {
  return prisma.user.findUnique({ where: { googleId } });
}
export async function createUser(u: { name: string; email: string; passwordHash?: string; googleId?: string }) {
  return prisma.user.create({ data: { ...u } });
}
export async function listAllUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
}
export async function isDisplayNameTaken(displayName: string, excludeUserId?: string) {
  const row = await prisma.user.findFirst({
    where: { displayName: { equals: displayName, mode: "insensitive" }, NOT: excludeUserId ? { id: excludeUserId } : undefined },
  });
  return !!row;
}
export async function updateUserProfile(userId: string, data: {
  displayName?: string; avatarUrl?: string | null; avatarColor?: string | null; bio?: string | null; onboarded?: boolean;
}) {
  return prisma.user.update({ where: { id: userId }, data });
}

// ---------- Forums ----------
export async function listForums() {
  return prisma.forum.findMany({ orderBy: { createdAt: "desc" } });
}
export async function getForum(id: string) {
  return prisma.forum.findUnique({ where: { id } });
}
export async function createForum(f: {
  title: string; description?: string; ownerId: string;
  memberAccess: string; visitorAccess: string;
  visitorTitleVisible?: boolean; allowJoinRequests?: boolean;
}) {
  const forum = await prisma.forum.create({ data: { ...f } });
  await prisma.forumMember.create({
    data: { forumId: forum.id, userId: f.ownerId, role: "OWNER", notifyOnReply: true, notifyOnMention: true },
  });
  return forum;
}
export async function updateForumSettings(forumId: string, data: {
  memberAccess?: string; visitorAccess?: string; visitorTitleVisible?: boolean; allowJoinRequests?: boolean;
}) {
  return prisma.forum.update({ where: { id: forumId }, data });
}
export async function forumsForUser(userId: string) {
  const [owned, memberships] = await Promise.all([
    prisma.forum.findMany({ where: { ownerId: userId } }),
    prisma.forumMember.findMany({ where: { userId }, include: { forum: true } }),
  ]);
  const memberOf = memberships.map((m) => m.forum).filter((f) => f.ownerId !== userId);
  return { owned, memberOf };
}
export async function isMember(forumId: string, userId: string) {
  const row = await prisma.forumMember.findUnique({ where: { forumId_userId: { forumId, userId } } });
  return !!row;
}
export async function getForumRole(forumId: string, userId: string): Promise<string | null> {
  const row = await prisma.forumMember.findUnique({ where: { forumId_userId: { forumId, userId } } });
  return row?.role || null;
}
export async function isForumAdmin(forumId: string, userId: string) {
  const role = await getForumRole(forumId, userId);
  return role === "OWNER" || role === "ADMIN";
}
export async function listForumMembersWithUsers(forumId: string) {
  const rows = await prisma.forumMember.findMany({ where: { forumId }, include: { user: true }, orderBy: { joinedAt: "asc" } });
  return rows;
}
export async function addForumMemberByEmail(forumId: string, email: string) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const existing = await isMember(forumId, user.id);
  if (existing) return null;
  return prisma.forumMember.create({
    data: { forumId, userId: user.id, role: "MEMBER", notifyOnReply: true, notifyOnMention: true },
  });
}
export async function setForumMemberRole(forumId: string, userId: string, role: "ADMIN" | "MEMBER") {
  const row = await prisma.forumMember.findUnique({ where: { forumId_userId: { forumId, userId } } });
  if (!row || row.role === "OWNER") return null; // אי אפשר להוריד/לשנות את המנהל הראשי
  return prisma.forumMember.update({ where: { forumId_userId: { forumId, userId } }, data: { role } });
}
export async function removeForumMember(forumId: string, userId: string) {
  const row = await prisma.forumMember.findUnique({ where: { forumId_userId: { forumId, userId } } });
  if (!row || row.role === "OWNER") return null;
  await prisma.forumMember.delete({ where: { forumId_userId: { forumId, userId } } });
  return true;
}

// ---------- Threads / Posts ----------
export async function listThreads(forumId: string) {
  return prisma.thread.findMany({ where: { forumId }, orderBy: { updatedAt: "desc" } });
}
export async function createThread(t: { forumId: string; title: string; authorId: string; tags?: string[] }) {
  return prisma.thread.create({ data: { ...t, tags: t.tags || [] } });
}
export async function getThread(id: string) {
  return prisma.thread.findUnique({ where: { id } });
}
export async function touchThread(threadId: string) {
  await prisma.thread.update({ where: { id: threadId }, data: {} });
}
export async function listPosts(threadId: string) {
  return prisma.post.findMany({ where: { threadId }, orderBy: { createdAt: "asc" }, include: { author: true } });
}
export async function getPost(id: string) {
  return prisma.post.findUnique({ where: { id }, include: { author: true } });
}
export async function createPost(p: {
  threadId: string; authorId: string; contentHtml: string; replyToPostId?: string | null; attachments?: string[];
}) {
  const post = await prisma.post.create({ data: { ...p, attachments: p.attachments || [] }, include: { author: true } });
  await touchThread(p.threadId);
  return post;
}

// עדכון "אשכולות" גלובלי לעמוד הבית - כל האשכולות מכל הפורומים הפעילים
export async function threadFeed() {
  return prisma.thread.findMany({
    where: { isBlocked: false, forum: { isBlocked: false } },
    include: { forum: true, author: true, posts: { select: { id: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

// ---------- Invites ----------
export async function createInvite(forumId: string, email: string, name?: string) {
  return prisma.invite.create({ data: { forumId, email, name, token: randomUUID() } });
}
export async function findInviteByToken(token: string) {
  return prisma.invite.findUnique({ where: { token } });
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
export async function notifiableMembers(forumId: string, excludeUserId: string) {
  const rows = await prisma.forumMember.findMany({
    where: { forumId, notifyOnReply: true, userId: { not: excludeUserId } },
    include: { user: true },
  });
  return rows.map((r) => r.user);
}

// ---------- Join requests (בקשת הצטרפות למנהל) ----------
export async function createJoinRequest(forumId: string, userId: string, message: string, attachments: string[] = []) {
  return prisma.joinRequest.create({ data: { forumId, userId, message, attachments } });
}
export async function listJoinRequestsForForum(forumId: string) {
  return prisma.joinRequest.findMany({ where: { forumId }, include: { user: true }, orderBy: { createdAt: "desc" } });
}
export async function updateJoinRequestStatus(id: string, status: "ACCEPTED" | "REJECTED") {
  const jr = await prisma.joinRequest.update({ where: { id }, data: { status } });
  if (status === "ACCEPTED") {
    const already = await isMember(jr.forumId, jr.userId);
    if (!already) {
      await prisma.forumMember.create({
        data: { forumId: jr.forumId, userId: jr.userId, role: "MEMBER", notifyOnReply: true, notifyOnMention: true },
      });
    }
  }
  return jr;
}

// ---------- Contact messages (כפתור "יצירת קשר") ----------
export async function createContactMessage(data: { name: string; email: string; message: string; attachments?: string[] }) {
  return prisma.contactMessage.create({ data: { ...data, attachments: data.attachments || [] } });
}
export async function listContactMessages() {
  return prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
}

// ---------- Site settings ----------
export async function getSiteSettings() {
  const existing = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.siteSettings.create({ data: { id: 1, classifiedsEnabled: true } });
}
export async function setClassifiedsEnabled(enabled: boolean) {
  await getSiteSettings();
  return prisma.siteSettings.update({ where: { id: 1 }, data: { classifiedsEnabled: enabled } });
}

// ---------- Ads ----------
export async function listAds() {
  return prisma.advertisement.findMany({ orderBy: { createdAt: "desc" } });
}
export async function createAd(a: { type: string; url: string; linkUrl?: string }) {
  return prisma.advertisement.create({ data: { ...a, status: "PENDING" } });
}
export async function listApprovedAds() {
  return prisma.advertisement.findMany({ where: { status: "APPROVED" }, orderBy: { createdAt: "desc" } });
}
export async function setAdStatus(id: string, status: string) {
  return prisma.advertisement.update({ where: { id }, data: { status } });
}
export async function deleteAd(id: string) {
  await prisma.advertisement.delete({ where: { id } });
}

// ---------- Admin moderation (F8 - מנהל-על) ----------
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
