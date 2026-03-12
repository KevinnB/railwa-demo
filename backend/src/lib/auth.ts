import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";
import { prisma } from "./prisma.js";

function resolveBaseURL(): string | undefined {
  const raw = process.env.BETTER_AUTH_URL;
  if (!raw) return undefined;
  return raw.startsWith("http") ? raw : `https://${raw}`;
}

export const auth = betterAuth({
  baseURL: resolveBaseURL(),
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [bearer()],
  trustedOrigins: process.env.CLIENT_ORIGIN
    ? [process.env.CLIENT_ORIGIN]
    : [],
});
