import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/practice/:path*",
    "/gap-analysis/:path*",
    "/jobs/:path*",
    "/session/:path*",
    "/settings/:path*",
  ],
};
