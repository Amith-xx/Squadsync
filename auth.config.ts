import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Lightweight auth config used by middleware (Edge Runtime — no DB imports allowed).
// Full auth config with DB callbacks lives in lib/auth.ts.
export const authConfig: NextAuthConfig = {
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const pathname = request.nextUrl.pathname;

      const isPublicPath =
        pathname.startsWith("/login") || pathname.startsWith("/api/auth");

      if (isPublicPath) return true;
      return isLoggedIn;
    },
  },
};
