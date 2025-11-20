import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/myspace")) {
    const cookie = req.cookies.get("myspace_auth");

    if (!cookie) {
      return NextResponse.next(); // modal will appear
    }
  }
}

export const config = {
  matcher: "/myspace/:path*",
};
