export type MemberAccess = "VIEW_ONLY" | "VIEW_AND_EDIT";
export type VisitorAccess = "NONE" | "VIEW_ONLY" | "VIEW_AND_COMMENT";
export type MemberRole = "OWNER" | "MEMBER";
export type AdType = "IMAGE" | "VIDEO" | "LINK";
export type AdStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string | null;
  googleId?: string | null;
  isBlocked: boolean;
  createdAt: string | Date;
}

export interface ForumMember {
  userId: string;
  forumId: string;
  role: MemberRole;
  notifyOnReply: boolean;
  notifyOnMention: boolean;
}

export interface Forum {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  memberAccess: MemberAccess;
  visitorAccess: VisitorAccess;
  isBlocked: boolean;
  createdAt: string | Date;
}

export interface Thread {
  id: string;
  forumId: string;
  title: string;
  authorId: string;
  isBlocked: boolean;
  createdAt: string | Date;
}

export interface Post {
  id: string;
  threadId: string;
  authorId: string;
  contentHtml: string;
  isBlurred: boolean;
  createdAt: string | Date;
}

export interface Invite {
  id: string;
  forumId: string;
  email: string;
  name?: string | null;
  token: string;
  accepted: boolean;
}

export interface Advertisement {
  id: string;
  type: AdType;
  url: string;
  linkUrl?: string | null;
  status: AdStatus;
  createdAt: string | Date;
}
