import { prisma } from "./prisma";
import { hashPassword } from "./auth";

const ADMIN_EMAIL = "admin@slotmatch.com";
const ADMIN_PASSWORD = "admin123!";
const ADMIN_NAME = "Admin";

export async function ensureAdminExists() {
  try {
    const existing = await prisma.admin.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (!existing) {
      const passwordHash = await hashPassword(ADMIN_PASSWORD);
      await prisma.admin.create({
        data: {
          email: ADMIN_EMAIL,
          name: ADMIN_NAME,
          passwordHash,
        },
      });
      console.log(`Admin user created: ${ADMIN_EMAIL}`);
    }

    // Remove any non-predefined admin accounts
    const deleted = await prisma.admin.deleteMany({
      where: { email: { not: ADMIN_EMAIL } },
    });
    if (deleted.count > 0) {
      console.log(`Removed ${deleted.count} non-predefined admin account(s)`);
    }
  } catch (error) {
    console.error("Failed to seed admin user:", error);
  }
}
