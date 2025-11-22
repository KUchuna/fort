import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession, verifyChatAccess } from '@/lib/auth';
export async function proxy(request: NextRequest) {
  
  // 1. Protect /myspace (Admin Only)
  if (request.nextUrl.pathname.startsWith('/myspace')) {
    const isAdmin = await verifySession();
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (request.nextUrl.pathname.startsWith('/chatroom')) {
    // Skip the login page itself, otherwise infinite loop!
    if (request.nextUrl.pathname === '/chatroom/login') {
        return NextResponse.next();
    }

    const hasAccess = await verifyChatAccess();
    if (!hasAccess) {
      return NextResponse.redirect(new URL('/chatroom/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/myspace/:path*', '/chatroom/:path*'],
};