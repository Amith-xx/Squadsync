import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Landing page: redirect authenticated users to dashboard, unauthenticated to login
export default async function RootPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  redirect("/login");
}
