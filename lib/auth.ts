import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { authConfig } from "@/auth.config";

// Full auth config with DB callbacks. Used in API routes and Server Components only.
// Middleware uses the lightweight authConfig from auth.config.ts to avoid Edge Runtime issues.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return false;
      if (!user.email) return false;

      try {
        await connectToDatabase();

        await User.findOneAndUpdate(
          { email: user.email },
          {
            $setOnInsert: {
              name: user.name ?? "Player",
              email: user.email,
              image: user.image ?? "",
              karmaScore: 70,
              matchesPlayed: 0,
              matchesCompleted: 0,
              noShows: 0,
              isBanned: false,
              banType: null,
              onboardingComplete: false,
            },
          },
          { upsert: true, new: false }
        );
      } catch {
        return false;
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        try {
          await connectToDatabase();
          const dbUser = await User.findOne({ email: user.email }).select("_id").lean();
          if (dbUser) {
            token.userId = String(dbUser._id);
          }
        } catch {
          // Non-fatal: token will be populated on next request
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});
