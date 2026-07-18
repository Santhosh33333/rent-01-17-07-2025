import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { env } from "../src/config/env";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminPasswordHash = await bcrypt.hash(env.ADMIN_PASSWORD ?? "300703Ss", env.BCRYPT_SALT_ROUNDS);
  
  const admin = await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL ?? "santhoshkrishna958@gmail.com" },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: env.ADMIN_EMAIL ?? "santhoshkrishna958@gmail.com",
      phone: "+919999999999",
      passwordHash: adminPasswordHash,
      fullName: env.ADMIN_NAME ?? "Super Admin",
      dateOfBirth: new Date("1990-01-01"),
      gender: "OTHER",
      status: "ACTIVE",
      role: "SUPER_ADMIN",
      emailVerified: true,
      mobileVerified: true,
    },
  });

  const userPasswordHash = await bcrypt.hash("user123", env.BCRYPT_SALT_ROUNDS);
  
  const user = await prisma.user.upsert({
    where: { email: "user@rentbuddy.app" },
    update: { passwordHash: userPasswordHash },
    create: {
      email: "user@rentbuddy.app",
      phone: "+919876543210",
      passwordHash: userPasswordHash,
      fullName: "Test User",
      dateOfBirth: new Date("1995-06-15"),
      gender: "MALE",
      status: "ACTIVE",
      role: "USER",
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
  console.log("Admin:", admin.email, "| Role:", admin.role, "| Password:", env.ADMIN_PASSWORD ?? "300703Ss");
  console.log("User:", user.email, "| Password: user123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
