import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.admin.findUnique({
    where: { email: "santhoshkrishna958@gmail.com" }
  });
  console.log("Admin found:", !!admin);
  if (admin) {
    console.log("Hash:", admin.passwordHash);
    const match = await bcrypt.compare("300703S#s", admin.passwordHash);
    console.log("Password match:", match);
  }
  await prisma.$disconnect();
}

main();
