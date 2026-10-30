import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("auth_session")?.value;

  // 1. Allow public access to admin login page
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // 2. Protected paths requiring authentication
  const isProtectedPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/customer") ||
    pathname.startsWith("/designer/dashboard") ||
    pathname.startsWith("/designer/onboarding") ||
    pathname.startsWith("/designer/profile") ||
    pathname.startsWith("/designer/portfolio") ||
    pathname.startsWith("/dashboard");

  if (isProtectedPath && !sessionToken) {
    if (pathname.startsWith("/admin")) {
      const adminLoginUrl = new URL("/admin/login", request.url);
      adminLoginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(adminLoginUrl);
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Public paths: '/', '/designers', '/designer/:id', '/portfolio', '/enquiry', '/login', '/register'
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/customer/:path*",
    "/designer/dashboard/:path*",
    "/designer/onboarding/:path*",
    "/designer/profile/:path*",
    "/designer/portfolio/:path*",
    "/dashboard/:path*",
  ],
};
