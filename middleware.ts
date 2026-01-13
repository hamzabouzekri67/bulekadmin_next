import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token");

  const url = request.nextUrl.clone();

  if (token && url.pathname === "/login") {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (!token && url.pathname.startsWith("/dashboard")) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login","/store/:path*"],
};
