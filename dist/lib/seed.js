"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("./prisma");
async function main() {
    const hashedNewPassword = await bcrypt_1.default.hash("Admin123456789", 10);
    const user = await prisma_1.db.user.upsert({
        where: { email: "admin@ecommerce.com" },
        update: {},
        create: {
            email: "admin@ecommerce.com",
            userName: "Admin",
            hashedPassword: hashedNewPassword,
            userType: "ADMIN", // Default user type
            role: "ADMIN", // Default role
        },
    });
    console.log("Admin user created or updated:", user);
}
main()
    .then(async () => {
    await prisma_1.db.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma_1.db.$disconnect();
    process.exit(1);
});
