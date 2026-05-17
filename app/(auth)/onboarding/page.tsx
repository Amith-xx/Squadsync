import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import type { Position, OutfieldAttributes, GKAttributes } from "@/types";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const isEdit = params.edit === "true";

  await connectToDatabase();
  const user = await User.findById(session.user.id)
    .select("onboardingComplete position attributes region")
    .lean();

  if (user?.onboardingComplete && !isEdit) {
    redirect("/dashboard");
  }

  const initial = {
    position: user?.position as Position | undefined,
    attributes: user?.attributes as (Partial<OutfieldAttributes> & Partial<GKAttributes>) | undefined,
    region: user?.region ?? undefined,
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-navy-darkest pitch-grid">
      {/* Glow backdrop */}
      <div
        className="pointer-events-none absolute inset-0 flex items-start justify-center pt-20"
        aria-hidden="true"
      >
        <div className="h-[400px] w-[600px] rounded-full bg-neon-green/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <OnboardingForm initial={initial} isEdit={isEdit} />
      </div>
    </main>
  );
}
