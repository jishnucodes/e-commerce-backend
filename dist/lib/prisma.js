"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const client_1 = require("../prisma/client");
exports.db = (_a = globalThis.prisma) !== null && _a !== void 0 ? _a : new client_1.PrismaClient({
    transactionOptions: {
        maxWait: 10000,
        timeout: 60000,
        isolationLevel: 'ReadCommitted',
    },
});
if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = exports.db;
}
//# sourceMappingURL=prisma.js.map