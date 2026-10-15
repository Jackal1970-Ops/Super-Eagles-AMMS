import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PaymentsClientView } from "@/components/payments/PaymentsClientView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Membership Payments & Dues | Super Eagles AMMS",
  description: "Annual membership renewal cycle, payment reconciliation, and arrears tracking for Super Eagles Athletics Club.",
};

export default async function PaymentsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PaymentsClientView />
    </div>
  );
}
