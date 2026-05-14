import { auth } from "@/lib/auth";

// TODO (Day 1 + Day 2): Find Game button, active lobby list, karma badge, user stats
export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="text-muted-foreground">Welcome, {session?.user?.name}</p>
      {/* TODO: FindGameButton, ActiveLobbiesList, KarmaBadge */}
    </main>
  );
}
