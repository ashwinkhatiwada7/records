import { db } from "@/db";
import * as schema from "@/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
// Origins allowed to call the auth API besides BETTER_AUTH_URL. In development
// the app is opened from a phone on the LAN (http://192.168.x.x:3000), so exact
// private-network IP origins are trusted there only. Production origins come from
// TRUSTED_ORIGINS (comma separated), e.g. https://records.example.com
const extraOrigins =
  process.env.TRUSTED_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? [];
const PRIVATE_LAN_ORIGIN =
  /^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d{1,5})?$/;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: (request) => {
    const origin = request?.headers.get("origin");
    const lan =
      process.env.NODE_ENV !== "production" && origin && PRIVATE_LAN_ORIGIN.test(origin)
        ? [origin]
        : [];
    return [...extraOrigins, ...lan];
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: false,
  },
  plugins: [admin({ defaultRole: "user", adminRoles: ["admin"] })],
});
