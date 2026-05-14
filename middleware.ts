import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Uses the lightweight auth config (no DB imports) to stay Edge Runtime compatible.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
