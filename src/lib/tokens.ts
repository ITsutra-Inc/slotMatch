import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

interface CandidateTokenPayload {
  windowId: string;
  candidateId: string;
  type: "candidate_access";
}

export function generateCandidateToken(
  windowId: string,
  candidateId: string,
  expiresInDays: number = 14
): string {
  const payload: CandidateTokenPayload = {
    windowId,
    candidateId,
    type: "candidate_access",
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${expiresInDays}d`,
    jwtid: uuidv4(),
  });
}

export function verifyCandidateToken(
  token: string
): CandidateTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as CandidateTokenPayload;
    if (decoded.type !== "candidate_access") return null;
    return decoded;
  } catch {
    return null;
  }
}

interface AdminTokenPayload {
  adminId: string;
  email: string;
  type: "admin_access";
}

export function generateAdminToken(adminId: string, email: string): string {
  const payload: AdminTokenPayload = {
    adminId,
    email,
    type: "admin_access",
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
    if (decoded.type !== "admin_access") return null;
    return decoded;
  } catch {
    return null;
  }
}
