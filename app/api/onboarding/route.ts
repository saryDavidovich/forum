import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { updateUserProfile, isDisplayNameTaken } from "@/lib/store";
import { pickAvatarColor } from "@/lib/display";

export async function POST(req: Request) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "יש להתחבר קודם" }, { status: 401 });

  const { displayName, avatarUrl, bio } = await req.json();
  if (!displayName || !displayName.trim()) {
    return NextResponse.json({ error: "שם תצוגה הוא שדה חובה" }, { status: 400 });
  }
  if (bio && bio.length > 40) {
    return NextResponse.json({ error: "התיאור הקצר מוגבל ל-40 תווים" }, { status: 400 });
  }
  if (await isDisplayNameTaken(displayName.trim(), userId)) {
    return NextResponse.json({ error: "השם הזה כבר תפוס, נסה שם אחר" }, { status: 409 });
  }

  const user = await updateUserProfile(userId, {
    displayName: displayName.trim(),
    avatarUrl: avatarUrl || null,
    avatarColor: avatarUrl ? null : pickAvatarColor(),
    bio: bio?.trim() || null,
    onboarded: true,
  });
  return NextResponse.json(user);
}
