import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { UserManualClientView } from "@/components/manual/UserManualClientView";

export const dynamic = "force-dynamic";

export default async function UserManualPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <UserManualClientView userRole={user.role} userName={user.name} />;
}
