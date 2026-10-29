import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("auth_session")?.value;

  // 1. Allow public access to admin login page
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // 2. Protected areas: Admin panel, dashboards, designer onboarding & profile editor
  const isProtectedPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/designer/onboarding") ||
    pathname.startsWith("/designer/profile") ||
    pathname.startsWith("/choose-journey");

  if (isProtectedPath && !sessionToken) {
    // If attempting to access /admin, redirect to /admin/login
    if (pathname.startsWith("/admin")) {
      const adminLoginUrl = new URL("/admin/login", request.url);
      adminLoginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(adminLoginUrl);
    }

    // Otherwise redirect to general /login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. All other routes are public by default:
  // '/', '/designers', '/designer/:id', '/portfolio', '/enquiry', '/login', '/register', '/api/...'
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/designer/onboarding/:path*",
    "/designer/profile/:path*",
    "/choose-journey/:path*",
  ],
};
