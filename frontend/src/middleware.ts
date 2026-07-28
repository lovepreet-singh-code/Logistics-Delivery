import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;
  
  console.log(`[Middleware] Path: ${pathname} | Token exists: ${!!token}`);

  // Explicitly skip static files, Next.js internals, images, and API routes
  // This prevents infinite redirect loops on static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const isAuthPage = pathname === '/';
  const isProtectedRoute = 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/customer') || 
    pathname.startsWith('/track') || 
    pathname.startsWith('/manifest') || 
    pathname.startsWith('/dashboard');
  
  // 1. If user is NOT on the login page, lacks a token, and tries to access a protected route
  if (!token && isProtectedRoute) {
    console.log(`[Middleware] Redirecting to login. Reason: Unauthenticated access to ${pathname}`);
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // 2. If user IS on the login page, but already has a valid token
  if (token && isAuthPage) {
    console.log(`[Middleware] Redirecting to dashboard. Reason: Authenticated user accessing login page`);
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  // Broad matcher that catches all routes but skips common static files
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
