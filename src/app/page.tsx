import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  } else if (user.role === "ATHLETE") {
    redirect(user.athleteId ? `/athletes/${user.athleteId}` : "/athletes");
  } else {
    redirect("/dashboard");
  }
}
