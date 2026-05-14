import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { redirect } from "next/navigation";

// Shown to hard-banned users. Shadow-banned users are not redirected here.
export default async function BannedPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();
  const user = await User.findById(session.user.id).select("banType karmaScore").lean();

  if (!user || user.banType !== "hard") {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-2">Account Banned</h1>
        <p className="text-muted-foreground mb-4">
          Your Karma score ({user.karmaScore}) has dropped below the minimum threshold.
          You have been banned from matchmaking.
        </p>
        <p className="text-sm text-muted-foreground">
          To appeal, contact support. Karma threshold for reinstatement: 21+.
        </p>
      </div>
    </main>
  );
}
