import  bcrypt  from "bcrypt";
import { db } from "./prisma";

async function main() {
  const hashedNewPassword = await bcrypt.hash("Admin123456789", 10);
  const user = await db.user.upsert({
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
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
