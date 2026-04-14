import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config — no Prisma, no Node.js-only modules.
// Used by middleware only. Full config (with Prisma adapter) lives in auth.ts.
export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
