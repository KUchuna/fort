import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(process.env.MYSPACE_PASSWORD);

export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/myspace")) {
    
    const cookie = req.cookies.get("myspace_session");

    if (!cookie) {
      return NextResponse.next();
    }

    try {
      await jwtVerify(cookie.value, SECRET_KEY);
      
      return NextResponse.next();
      
    } catch (error) {
      const response = NextResponse.next();
      response.cookies.delete("myspace_session");
      return response;
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: "/myspace/:path*",
};