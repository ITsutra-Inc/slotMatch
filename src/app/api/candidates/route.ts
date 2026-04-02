import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createCandidateSchema } from "@/lib/validations";
import { ensureAvailabilityWindow } from "@/lib/windows";

export async function GET(request: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where = {
    adminId: admin.id,
    ...(status ? { status: status as "ACTIVE" | "PAUSED" | "ARCHIVED" } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
          ],
        }
      : {}),
  };

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      include: {
        availabilityWindows: {
          orderBy: { weekStart: "desc" },
          take: 1,
          include: {
            timeSlots: { orderBy: { date: "asc" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.candidate.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: candidates,
    total,
    page,
    limit,
  });
}

export async function POST(request: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createCandidateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, phone, name } = parsed.data;

    // Check for existing candidate under this admin
    const existing = await prisma.candidate.findUnique({
      where: { email_adminId: { email, adminId: admin.id } },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Candidate with this email already exists" },
        { status: 409 }
      );
    }

    const candidate = await prisma.candidate.create({
      data: {
        email,
        phone,
        name,
        adminId: admin.id,
      },
    });

    // Create availability window (admin will send request manually)
    await ensureAvailabilityWindow(candidate.id);

    return NextResponse.json(
      { success: true, data: candidate },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create candidate error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
