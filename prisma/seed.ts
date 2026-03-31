import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL!;
console.log("Connecting to:", connectionString.replace(/\/\/.*@/, "//***@"));

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create admin
  const passwordHash = await bcrypt.hash("admin123!", 12);

  const admin = await prisma.admin.upsert({
    where: { email: "admin@slotmatch.com" },
    update: {},
    create: {
      email: "admin@slotmatch.com",
      name: "Demo Admin",
      passwordHash,
    },
  });

  console.log(`Created admin: ${admin.email}`);

  // Create sample candidates
  const candidates = [
    { email: "jane@example.com", phone: "+15551234567", name: "Jane Smith" },
    { email: "john@example.com", phone: "+15559876543", name: "John Doe" },
    { email: "sarah@example.com", phone: "+15555551234", name: "Sarah Johnson" },
  ];

  for (const c of candidates) {
    const candidate = await prisma.candidate.upsert({
      where: { email_adminId: { email: c.email, adminId: admin.id } },
      update: {},
      create: {
        email: c.email,
        phone: c.phone,
        name: c.name,
        adminId: admin.id,
      },
    });
    console.log(`Created candidate: ${candidate.email}`);
  }

  console.log("\nSeed complete!");
  console.log("Login with: admin@slotmatch.com / admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
