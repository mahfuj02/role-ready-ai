import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

function getDriverConnectionString(databaseUrl: string): string {
  if (!databaseUrl.startsWith("prisma+postgres://")) {
    return databaseUrl;
  }

  const parsed = new URL(databaseUrl);
  const apiKey = parsed.searchParams.get("api_key");

  if (!apiKey) {
    throw new Error("DATABASE_URL is missing api_key query param.");
  }

  const payloadBase64 = apiKey.includes(".") ? apiKey.split(".")[1] : apiKey;

  const payloadJson = Buffer.from(payloadBase64, "base64url").toString("utf8");
  const payload = JSON.parse(payloadJson) as { databaseUrl?: string };

  if (!payload.databaseUrl) {
    throw new Error("DATABASE_URL api_key payload did not include databaseUrl.");
  }

  return payload.databaseUrl;
}

const rawDatabaseUrl = process.env.DATABASE_URL;

if (!rawDatabaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({ connectionString: getDriverConnectionString(rawDatabaseUrl) });

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
