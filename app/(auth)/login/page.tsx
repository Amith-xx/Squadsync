import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { GoogleSignInButton } from "@/components/auth/SignInButton";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-darkest pitch-grid">
      {/* Radial glow behind the card */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="h-[500px] w-[500px] rounded-full bg-neon-green/5 blur-[120px]" />
      </div>

      {/* Corner accent lines */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-64 w-64 border-l-2 border-t-2 border-neon-green/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 border-b-2 border-r-2 border-neon-green/10"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md px-4 py-12 sm:px-0 animate-fade-in-up">
        {/* Logo / branding */}
        <div className="mb-10 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            {/* Ball icon using CSS */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-neon-green bg-neon-green/10 shadow-[0_0_20px_rgba(0,230,115,0.3)]">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-neon-green"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l3 3" />
                <path d="M6.6 6.6l1.4 1.4M17.4 6.6l-1.4 1.4M12 2v2M12 20v2M2 12h2M20 12h2" />
              </svg>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">
              Squad<span className="text-neon-green text-glow">Sync</span>
            </h1>
          </div>
          <p className="text-base text-muted-foreground">
            Real-time 5v5 football matchmaking
          </p>
        </div>

        {/* Sign-in card */}
        <div className="rounded-2xl border border-navy-border bg-navy-dark p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-white">Welcome to the pitch</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to find your squad and get matched.
            </p>
          </div>

          <GoogleSignInButton />

          <p className="mt-5 text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <span className="text-neon-green/80 hover:text-neon-green cursor-pointer">
              Terms
            </span>{" "}
            and{" "}
            <span className="text-neon-green/80 hover:text-neon-green cursor-pointer">
              Privacy Policy
            </span>
            .
          </p>
        </div>

        {/* Features hint */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            {
              label: "Smart Matchmaking",
              icon: (
                <svg viewBox="0 0 24 24" className="mx-auto h-5 w-5 text-neon-green" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              ),
            },
            {
              label: "Karma System",
              icon: (
                <svg viewBox="0 0 24 24" className="mx-auto h-5 w-5 text-neon-green" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ),
            },
            {
              label: "Live Lobbies",
              icon: (
                <svg viewBox="0 0 24 24" className="mx-auto h-5 w-5 text-neon-green" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
              ),
            },
          ].map(({ label, icon }) => (
            <div
              key={label}
              className="rounded-xl border border-navy-border bg-navy-dark/60 px-3 py-4"
            >
              {icon}
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
