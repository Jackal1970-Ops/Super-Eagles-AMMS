import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();
  const demoSwitchEnabled = process.env.ENABLE_DEMO_ROLE_SWITCH === "true";
  if (!user) {
    return NextResponse.json({ user: null, demoSwitchEnabled });
  }
  return NextResponse.json({ user, demoSwitchEnabled });
}
