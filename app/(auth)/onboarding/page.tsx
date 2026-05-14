import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/db/models/User";

// TODO (Day 1): Build onboarding flow — position picker + attribute sliders (40–100)
export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();
  const user = await User.findById(session.user.id).select("onboardingComplete").lean();

  if (user?.onboardingComplete) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Set Up Your Match Profile</h1>
        <p className="text-muted-foreground">
          Choose your position and rate your attributes to get matched fairly.
        </p>
        {/* TODO: OnboardingForm component */}
      </div>
    </main>
  );
}
