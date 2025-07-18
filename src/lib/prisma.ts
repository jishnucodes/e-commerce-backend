import { PrismaClient } from "../prisma/client";

// Extend globalThis to include a typed prisma client
declare global {
  var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}
