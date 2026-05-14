import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { notFound } from "next/navigation";

// TODO (Day 5): Karma score, badge, match history, attribute radar, stats
export default async function ProfilePage() {
  const session = await auth();

  await connectToDatabase();
  const user = await User.findById(session?.user?.id).lean();

  if (!user) notFound();

  return (
    <main className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <p className="text-muted-foreground">
        Karma: {user.karmaScore} · Matches: {user.matchesPlayed}
      </p>
      {/* TODO: KarmaBadge, AttributeRadar, MatchHistoryList */}
    </main>
  );
}
