import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/db/models/User";

// Shared layout for authenticated app routes. Guards onboarding gate.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();
  const user = await User.findById(session.user.id)
    .select("onboardingComplete isBanned banType")
    .lean();

  if (!user?.onboardingComplete) {
    redirect("/onboarding");
  }

  if (user.banType === "hard") {
    // Hard-banned users are blocked from all app routes
    redirect("/banned");
  }

  return <>{children}</>;
}
