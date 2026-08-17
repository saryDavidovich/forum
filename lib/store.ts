import { randomUUID } from "crypto";
import type {
  User, Forum, ForumMember, Thread, Post, Invite, Advertisement,
} from "./types";

// ------------------------------------------------------------------
// שכבת נתונים זמנית בזיכרון - כדי שהמערכת תרוץ מיד בלי הקמת בסיס נתונים.
// כל פונקציה כאן מבודדת בכוונה, כך שהמעבר לבסיס נתונים אמיתי (ראה
// prisma/schema.prisma) הוא בעיקר החלפת הגוף של הפונקציות למטה
// בשאילתות Prisma מקבילות - שאר האפליקציה לא צריכה להשתנות.
// שים לב: מידע כאן נמחק בכל הפעלה מחדש של השרת.
// ------------------------------------------------------------------

interface DB {
  users: User[];
  forums: Forum[];
  members: ForumMember[];
  threads: Thread[];
  posts: Post[];
  invites: Invite[];
  ads: Advertisement[];
  onlineUserIds: Set<string>;
}

const g = globalThis as unknown as { __forumDB?: DB };

function seed(): DB {
  const now = new Date().toISOString();
  const demoUser: User = {
    id: "u_demo",
    name: "משתמש לדוגמה",
    email: "demo@example.com",
    passwordHash: undefined,
    isBlocked: false,
    createdAt: now,
  };
  const forum1: Forum = {
    id: "f_1",
    title: "הלכה ומנהג",
    description: "שאלות ותשובות בענייני הלכה יומיומית",
    ownerId: demoUser.id,
    memberAccess: "VIEW_AND_EDIT",
    visitorAccess: "VIEW_ONLY",
    isBlocked: false,
    createdAt: now,
  };
  const forum2: Forum = {
    id: "f_2",
    title: "עזרה הדדית בקהילה",
    description: "פורום סגור לחברי הקהילה בלבד",
    ownerId: demoUser.id,
    memberAccess: "VIEW_AND_EDIT",
    visitorAccess: "NONE",
    isBlocked: false,
    createdAt: now,
  };
  const thread1: Thread = {
    id: "t_1",
    forumId: forum1.id,
    title: "אלו סוגי כלים אסורים לטלטל משום מוקצה מחמת חסרון כיס?",
    authorId: demoUser.id,
    isBlocked: false,
    createdAt: now,
  };
  const post1: Post = {
    id: "p_1",
    threadId: thread1.id,
    authorId: demoUser.id,
    contentHtml: "<p>לדוגמה: כלים חדים, כלי כתיבה יקרים וכדומה - יש להרחיב בהמשך.</p>",
    isBlurred: false,
    createdAt: now,
  };

  return {
    users: [demoUser],
    forums: [forum1, forum2],
    members: [
      { userId: demoUser.id, forumId: forum1.id, role: "OWNER", notifyOnReply: true, notifyOnMention: true },
      { userId: demoUser.id, forumId: forum2.id, role: "OWNER", notifyOnReply: true, notifyOnMention: true },
    ],
    threads: [thread1],
    posts: [post1],
    invites: [],
    ads: [],
    onlineUserIds: new Set([demoUser.id]),
  };
}

export function db(): DB {
  if (!g.__forumDB) g.__forumDB = seed();
  return g.__forumDB;
}

export const uid = () => randomUUID();

// ---------- Users ----------
export function findUserById(id: string) {
  return db().users.find((u) => u.id === id);
}
export function findUserByGoogleId(googleId: string) {
  return db().users.find((u) => u.googleId === googleId);
}
export function findUserByEmail(email: string) {
  return db().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
export function createUser(u: Omit<User, "id" | "createdAt" | "isBlocked">) {
  const user: User = { ...u, id: uid(), createdAt: new Date().toISOString(), isBlocked: false };
  db().users.push(user);
  return user;
}

// ---------- Forums ----------
export function listForums() {
  return db().forums;
}
export function getForum(id: string) {
  return db().forums.find((f) => f.id === id);
}
export function createForum(f: Omit<Forum, "id" | "createdAt" | "isBlocked">) {
  const forum: Forum = { ...f, id: uid(), createdAt: new Date().toISOString(), isBlocked: false };
  db().forums.push(forum);
  db().members.push({ userId: f.ownerId, forumId: forum.id, role: "OWNER", notifyOnReply: true, notifyOnMention: true });
  return forum;
}
export function forumsForUser(userId: string) {
  const memberForumIds = new Set(db().members.filter((m) => m.userId === userId).map((m) => m.forumId));
  const all = db().forums;
  return {
    owned: all.filter((f) => f.ownerId === userId),
    memberOf: all.filter((f) => memberForumIds.has(f.id) && f.ownerId !== userId),
  };
}
export function isMember(forumId: string, userId: string) {
  return db().members.some((m) => m.forumId === forumId && m.userId === userId);
}

// ---------- Threads / Posts ----------
export function listThreads(forumId: string) {
  return db().threads.filter((t) => t.forumId === forumId);
}
export function createThread(t: Omit<Thread, "id" | "createdAt" | "isBlocked">) {
  const thread: Thread = { ...t, id: uid(), createdAt: new Date().toISOString(), isBlocked: false };
  db().threads.push(thread);
  return thread;
}
export function listPosts(threadId: string) {
  return db().posts.filter((p) => p.threadId === threadId);
}
export function createPost(p: Omit<Post, "id" | "createdAt" | "isBlurred">) {
  const post: Post = { ...p, id: uid(), createdAt: new Date().toISOString(), isBlurred: false };
  db().posts.push(post);
  return post;
}

// ---------- Invites ----------
export function createInvite(forumId: string, email: string, name?: string) {
  const invite: Invite = { id: uid(), forumId, email, name, token: uid(), accepted: false };
  db().invites.push(invite);
  return invite;
}

export function findInviteByToken(token: string) {
  return db().invites.find((i) => i.token === token);
}
export function acceptInvite(token: string, userId: string) {
  const invite = findInviteByToken(token);
  if (!invite) return null;
  if (!isMember(invite.forumId, userId)) {
    db().members.push({
      userId, forumId: invite.forumId, role: "MEMBER",
      notifyOnReply: true, notifyOnMention: true,
    });
  }
  invite.accepted = true;
  return invite;
}

// חברי פורום שביקשו לקבל התראת מייל על תגובה חדשה (לא כולל את הכותב עצמו)
export function notifiableMembers(forumId: string, excludeUserId: string) {
  const memberRows = db().members.filter(
    (m) => m.forumId === forumId && m.notifyOnReply && m.userId !== excludeUserId
  );
  return memberRows
    .map((m) => db().users.find((u) => u.id === m.userId))
    .filter((u): u is User => !!u);
}

// ---------- Ads ----------
export function listAds() {
  return db().ads;
}
export function createAd(a: Omit<Advertisement, "id" | "createdAt" | "status">) {
  const ad: Advertisement = { ...a, id: uid(), createdAt: new Date().toISOString(), status: "PENDING" };
  db().ads.push(ad);
  return ad;
}
export function setAdStatus(id: string, status: Advertisement["status"]) {
  const ad = db().ads.find((a) => a.id === id);
  if (ad) ad.status = status;
  return ad;
}
export function deleteAd(id: string) {
  const arr = db().ads;
  const i = arr.findIndex((a) => a.id === id);
  if (i >= 0) arr.splice(i, 1);
}

// ---------- Admin moderation ----------
export function setUserBlocked(userId: string, blocked: boolean) {
  const u = db().users.find((x) => x.id === userId);
  if (u) u.isBlocked = blocked;
  return u;
}
export function setThreadBlocked(threadId: string, blocked: boolean) {
  const t = db().threads.find((x) => x.id === threadId);
  if (t) t.isBlocked = blocked;
  return t;
}
export function setPostBlurred(postId: string, blurred: boolean) {
  const p = db().posts.find((x) => x.id === postId);
  if (p) p.isBlurred = blurred;
  return p;
}
export function setForumBlocked(forumId: string, blocked: boolean) {
  const f = db().forums.find((x) => x.id === forumId);
  if (f) f.isBlocked = blocked;
  return f;
}

// ---------- Admin stats ----------
export function adminStats() {
  const d = db();
  return {
    totalUsers: d.users.length,
    onlineUsers: d.onlineUserIds.size,
    totalForums: d.forums.length,
    totalGroups: d.members.length, // חברויות פעילות
  };
}
