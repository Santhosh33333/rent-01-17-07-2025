import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { env } from "../src/config/env";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD ?? "ChangeMe123!", env.BCRYPT_SALT_ROUNDS);
  
  const admin = await prisma.admin.upsert({
    where: { email: env.ADMIN_EMAIL ?? "admin@rentbuddy.app" },
    update: {},
    create: {
      email: env.ADMIN_EMAIL ?? "admin@rentbuddy.app",
      name: env.ADMIN_NAME ?? "Admin",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  const userPasswordHash = await bcrypt.hash("user123", env.BCRYPT_SALT_ROUNDS);
  
  const user = await prisma.user.upsert({
    where: { email: "user@rentbuddy.app" },
    update: {},
    create: {
      email: "user@rentbuddy.app",
      phone: "+919876543210",
      passwordHash: userPasswordHash,
      fullName: "Test User",
      dateOfBirth: new Date("1995-06-15"),
      gender: "MALE",
      status: "ACTIVE",
      emailVerified: true,
      mobileVerified: true,
    },
  });

  await prisma.verification.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      status: "VERIFIED",
      selfieUrl: "https://example.com/selfie.jpg",
      govIdUrl: "https://example.com/govid.jpg",
      govIdType: "AADHAAR",
      addressProofUrl: "https://example.com/address.jpg",
      emergencyContactName: "Emergency Contact",
      emergencyContactPhone: "+919999999999",
      emergencyContactRelation: "Family",
    },
  });

  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      balance: 1500.0,
      currency: "INR",
    },
  });

  await prisma.trustScore.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      score: 85,
    },
  });

  console.log("Seed complete.");
  console.log("Admin:", admin.email);
  console.log("User:", user.email, "/ user123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
