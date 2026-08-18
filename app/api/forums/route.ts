import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { createForum, listForums } from "@/lib/store";

export async function GET() {
  return NextResponse.json(await listForums());
}

export async function POST(req: Request) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "יש להתחבר כדי ליצור פורום" }, { status: 401 });

  const { title, description, memberAccess, visitorAccess } = await req.json();
  if (!title) return NextResponse.json({ error: "נא להזין כותרת לפורום" }, { status: 400 });

  const forum = await createForum({
    title,
    description: description || "",
    ownerId: userId,
    memberAccess: memberAccess || "VIEW_AND_EDIT",
    visitorAccess: visitorAccess || "VIEW_ONLY",
  });
  return NextResponse.json(forum);
}
