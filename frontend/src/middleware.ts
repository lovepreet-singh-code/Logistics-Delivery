import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve token and role from cookies
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;

  const isAuthPage = pathname === '/';
  
  // Define protected routes
  const isAdminRoute = pathname.startsWith('/admin');
  const isAgentRoute = pathname.startsWith('/agent');
  const isCustomerRoute = pathname.startsWith('/customer');
  
  const isProtectedRoute = isAdminRoute || isAgentRoute || isCustomerRoute;

  // Redirect to login if accessing a protected route without a token
  if (isProtectedRoute && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('error', 'Please login to access this page.');
    return NextResponse.redirect(url);
  }

  // If logged in, restrict access to the login page
  if (isAuthPage && token && role) {
    const url = request.nextUrl.clone();
    
    if (role === 'ADMIN') {
      url.pathname = '/admin';
    } else if (role === 'AGENT' || role === 'DRIVER') {
      url.pathname = '/agent';
    } else if (role === 'CUSTOMER') {
      url.pathname = '/customer';
    } else {
       return NextResponse.next();
    }
    
    return NextResponse.redirect(url);
  }

  // Optional: Strict Role-based access control for protected routes
  if (isProtectedRoute && token && role) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    
    if (isAdminRoute && role !== 'ADMIN') {
      url.searchParams.set('error', 'Unauthorized access.');
      return NextResponse.redirect(url);
    }
    
    if (isAgentRoute && role !== 'AGENT' && role !== 'DRIVER') {
      url.searchParams.set('error', 'Unauthorized access.');
      return NextResponse.redirect(url);
    }
    
    if (isCustomerRoute && role !== 'CUSTOMER') {
      url.searchParams.set('error', 'Unauthorized access.');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except api, _next/static, _next/image, and favicon
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
};
