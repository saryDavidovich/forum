export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { threadFeed } from "@/lib/store";

export async function GET() {
  const threads = await threadFeed();
  return NextResponse.json(
    threads.map((t) => ({
      id: t.id,
      title: t.title,
      tags: t.tags,
      updatedAt: t.updatedAt,
      postCount: t.posts.length,
      forum: { id: t.forum.id, title: t.forum.title, visitorAccess: t.forum.visitorAccess, visitorTitleVisible: t.forum.visitorTitleVisible },
      author: { displayName: t.author.displayName, name: t.author.name },
    }))
  );
}
