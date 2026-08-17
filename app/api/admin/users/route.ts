import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/adminSession";
import { db } from "@/lib/store";

export async function GET() {
  if (!isAdminSession()) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  const users = db().users.map((u) => ({ id: u.id, name: u.name, email: u.email, isBlocked: u.isBlocked }));
  return NextResponse.json(users);
}
