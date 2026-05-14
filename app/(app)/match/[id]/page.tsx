import { connectToDatabase } from "@/lib/db/connect";
import Match from "@/lib/db/models/Match";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";

// TODO (Day 5): Post-match flow — score report, peer ratings, attendance confirm
export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  await connectToDatabase();
  const match = await Match.findById(id).lean();

  if (!match) notFound();

  return (
    <main className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Match</h1>
      <p className="text-muted-foreground text-sm">Status: {match.status}</p>
      {/* TODO: ScoreReportForm (captains only), PlayerRatingCard ×9, AttendanceButton */}
      <p className="mt-4 text-xs text-muted-foreground">
        Logged in as: {session?.user?.name}
      </p>
    </main>
  );
}
