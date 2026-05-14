import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// TODO (Day 1): Build login UI with Google OAuth sign-in button
export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">SquadSync</h1>
        <p className="text-muted-foreground mb-8">Real-time 5v5 football matchmaking</p>
        {/* TODO: Replace with SignInButton component */}
        <p className="text-sm text-muted-foreground">Login UI — Day 1</p>
      </div>
    </main>
  );
}
