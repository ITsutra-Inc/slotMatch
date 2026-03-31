import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes require authentication
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/candidates") || pathname.startsWith("/api-keys") || pathname.startsWith("/notifications")) {
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  // API routes that need admin auth (not external or availability)
  if (
    pathname.startsWith("/api/candidates") ||
    pathname.startsWith("/api/api-keys") ||
    pathname.startsWith("/api/notifications")
  ) {
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/candidates/:path*",
    "/api-keys/:path*",
    "/notifications/:path*",
    "/api/candidates/:path*",
    "/api/api-keys/:path*",
    "/api/notifications/:path*",
  ],
};
