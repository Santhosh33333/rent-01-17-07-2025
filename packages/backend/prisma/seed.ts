import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { env } from "../src/config/env";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD ?? "ChangeMe123!", env.BCRYPT_SALT_ROUNDS);
  await prisma.admin.upsert({
    where: { email: env.ADMIN_EMAIL ?? "admin@rentbuddy.app" },
    update: {},
    create: {
      email: env.ADMIN_EMAIL ?? "admin@rentbuddy.app",
      name: "System Admin",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
