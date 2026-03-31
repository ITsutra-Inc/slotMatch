import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true, data: admin });
}
