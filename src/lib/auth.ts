import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { verifyAdminToken } from "./tokens";
import { prisma } from "./prisma";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getAuthenticatedAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) return null;

  const payload = verifyAdminToken(token);
  if (!payload) return null;

  const admin = await prisma.admin.findUnique({
    where: { id: payload.adminId },
    select: { id: true, email: true, name: true },
  });

  return admin;
}
