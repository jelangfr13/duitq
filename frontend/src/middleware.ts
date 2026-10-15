import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Baca token autentikasi dari HttpOnly cookie (AUTH-03 & AUTH-05)
  const token =
    request.cookies.get('accessToken')?.value ||
    request.cookies.get('token')?.value;

  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  const isPrivateRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/wallets') ||
    pathname.startsWith('/spaces') ||
    pathname.startsWith('/receivables') ||
    pathname.startsWith('/settings');

  // Jika mengakses root '/', alihkan ke dashboard (atau login via middleware rule di bawah)
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = token ? '/dashboard' : '/login';
    return NextResponse.redirect(url);
  }

  // AUTH-05: Alihkan pengguna yang belum login dari rute privat ke /login
  if (isPrivateRoute && !token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Jika sudah memiliki token aktif dan mencoba membuka rute autentikasi publik, alihkan ke /dashboard
  if (isAuthRoute && token) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/dashboard/:path*',
    '/wallets/:path*',
    '/spaces/:path*',
    '/receivables/:path*',
    '/settings/:path*',
  ],
};
