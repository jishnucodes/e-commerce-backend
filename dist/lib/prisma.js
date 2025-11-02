"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const client_1 = require("../prisma/client");
exports.db = globalThis.prisma ?? new client_1.PrismaClient({
    transactionOptions: {
        maxWait: 10000, // Wait up to 10s for a transaction slot
        timeout: 60000, // Allow transactions to run up to 60s
        isolationLevel: 'ReadCommitted',
    },
});
if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = exports.db;
}
