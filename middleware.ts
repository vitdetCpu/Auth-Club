import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — no auth required
  if (
    pathname === "/" ||
    pathname.startsWith("/handler") ||
    pathname.startsWith("/arena") ||
    pathname === "/api/stream" ||
    pathname === "/api/admin/start"
  ) {
    return NextResponse.next();
  }

  // Protected routes — require authenticated user
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/handler/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
