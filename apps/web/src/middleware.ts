import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read auth from cookie (set by client after login)
  const authCookie = request.cookies.get('twp-auth')?.value;
  let role: string | null = null;
  let isAuthenticated = false;

  if (authCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(authCookie));
      if (parsed?.state?.isAuthenticated && parsed?.state?.token) {
        isAuthenticated = true;
        role = parsed?.state?.user?.role || null;
      }
    } catch {}
  }

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password');

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthPage) {
    const dest = role === 'PARTNER' ? '/partners/dashboard' : '/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Protect individual dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) return NextResponse.redirect(new URL('/login', request.url));
    if (role === 'PARTNER') return NextResponse.redirect(new URL('/partners/dashboard', request.url));
  }

  // Protect partner dashboard
  if (pathname.startsWith('/partners/dashboard')) {
    if (!isAuthenticated) return NextResponse.redirect(new URL('/login', request.url));
    if (role === 'USER') return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect broker dashboard (any authenticated user)
  if (pathname.startsWith('/broker/dashboard')) {
    if (!isAuthenticated) return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/partners/dashboard/:path*', '/broker/dashboard/:path*', '/login', '/signup', '/forgot-password', '/reset-password'],
};
