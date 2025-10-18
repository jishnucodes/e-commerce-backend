import { PrismaClient } from "../prisma/client";

// Extend globalThis to include a typed prisma client
declare global {
  var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma ?? new PrismaClient({
  transactionOptions: {
    maxWait: 10000,       // Wait up to 10s for a transaction slot
    timeout: 60000,       // Allow transactions to run up to 60s
    isolationLevel: 'ReadCommitted',
  },
});

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}
