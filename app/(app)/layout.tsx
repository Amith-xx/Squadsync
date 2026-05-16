import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { AppNav } from "@/components/layout/AppNav";
import { UserStoreProvider } from "@/components/providers/UserStoreProvider";
import type { Position, PlayerAttributes, BanType } from "@/types";

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
    .select(
      "name email image position attributes karmaScore matchesPlayed onboardingComplete isBanned banType region",
    )
    .lean();

  if (!user) redirect("/login");
  if (!user.onboardingComplete) redirect("/onboarding");
  if (user.banType === "hard") redirect("/banned");

  return (
    <div className="min-h-screen bg-navy-darkest">
      <AppNav />
      <UserStoreProvider
        userId={session.user.id}
        name={session.user.name}
        email={session.user.email}
        image={session.user.image}
        position={user.position as Position | undefined}
        attributes={user.attributes as PlayerAttributes | undefined}
        karmaScore={user.karmaScore}
        isBanned={user.isBanned}
        banType={user.banType as BanType}
        onboardingComplete={user.onboardingComplete}
        matchesPlayed={user.matchesPlayed}
        region={user.region ?? undefined}
      >
        {children}
      </UserStoreProvider>
    </div>
  );
}
