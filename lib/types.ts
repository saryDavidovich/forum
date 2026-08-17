export type MemberAccess = "VIEW_ONLY" | "VIEW_AND_EDIT";
export type VisitorAccess = "NONE" | "VIEW_ONLY" | "VIEW_AND_COMMENT";
export type MemberRole = "OWNER" | "MEMBER";
export type AdType = "IMAGE" | "VIDEO" | "LINK";
export type AdStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  isBlocked: boolean;
  createdAt: string;
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
  description: string;
  ownerId: string;
  memberAccess: MemberAccess;
  visitorAccess: VisitorAccess;
  isBlocked: boolean;
  createdAt: string;
}

export interface Thread {
  id: string;
  forumId: string;
  title: string;
  authorId: string;
  isBlocked: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  threadId: string;
  authorId: string;
  contentHtml: string;
  isBlurred: boolean;
  createdAt: string;
}

export interface Invite {
  id: string;
  forumId: string;
  email: string;
  name?: string;
  token: string;
  accepted: boolean;
}

export interface Advertisement {
  id: string;
  type: AdType;
  url: string;
  linkUrl?: string;
  status: AdStatus;
  createdAt: string;
}
