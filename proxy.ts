import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Define paths to protect
  const isMySpace = pathname.startsWith("/myspace");
  const isChatRoom = pathname.startsWith("/chatroom");

  if (isMySpace || isChatRoom) {
    // 3. Fetch Session from Better Auth API
    // We pass the cookie header so the server knows who we are
    const response = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });

    const session = await response.json();

    // 4. Redirect if not logged in
    if (!session) {
      // Redirect to your main login page (from previous steps)
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // 5. Specific Check: MySpace requires ADMIN
    if (isMySpace) {
      if (session.user.role !== "admin") {
        // Logged in, but not admin -> Redirect to Home or Error
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // 6. Specific Check: Chatroom requires LOGIN (and maybe verification)
    if (isChatRoom) {
      // Example: If you enabled email verification, check it here
      if (session.user.emailVerified === false) {
         return NextResponse.redirect(new URL("/verify-email", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  // Update matchers to include the routes you want to protect
  matcher: ["/myspace/:path*", "/chatroom/:path*"],
};