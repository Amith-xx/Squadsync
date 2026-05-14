import { connectToDatabase } from "@/lib/db/connect";
import Lobby from "@/lib/db/models/Lobby";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";

// TODO (Day 2–4): Live lobby view — player slots, ready-up, team grid, chat, turf voting
export default async function LobbyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  await connectToDatabase();
  const lobby = await Lobby.findById(id).lean();

  if (!lobby) notFound();

  return (
    <main className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Lobby</h1>
      <p className="text-muted-foreground text-sm">
        Region: {lobby.region} · Status: {lobby.status}
      </p>
      {/* TODO: PlayerSlot ×10, ReadyUpButton, LobbyChat, TeamGrid, TurfVoting */}
      <p className="mt-4 text-xs text-muted-foreground">
        Logged in as: {session?.user?.name}
      </p>
    </main>
  );
}
