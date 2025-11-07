import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/projects',
  '/settings',
  '/profile',
  '/api/projects',
  '/api/videos',
  '/api/user',
];

// List of public routes that don't require authentication
// const publicRoutes = [
//   '/',
//   '/auth/login',
//   '/auth/signup',
//   '/auth/reset-password',
//   '/api/auth',
//   '/api/firebase-test',
//   '/api/firebase-admin-test',
//   '/api/s3/presigned-url',
//   '/test-firebase',
// ];

// List of static files and Next.js internal routes to ignore
const ignoredRoutes = [
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/images',
  '/fonts',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (ignoredRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Check if the route is public
  // const isPublicRoute = publicRoutes.some(route =>
  //   route === '/' ? pathname === '/' : pathname.startsWith(route)
  // );

  // Get the session token from cookies
  // Firebase Auth stores the token in a cookie named '__session' or we can use a custom name
  const sessionCookie = request.cookies.get('__session')?.value ||
                       request.cookies.get('authToken')?.value;

  // If it's a protected route and no session cookie exists, redirect to login
  if (isProtectedRoute && !sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';

    // Add the return URL as a query parameter so we can redirect back after login
    if (pathname !== '/auth/login') {
      url.searchParams.set('returnUrl', pathname);
    }

    return NextResponse.redirect(url);
  }

  // If user is logged in and tries to access auth pages, redirect to dashboard
  if (sessionCookie && (pathname === '/auth/login' || pathname === '/auth/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // For API routes, return 401 if not authenticated
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth') && !sessionCookie) {
    // Skip auth check for test endpoints
    if (pathname.includes('firebase-test') ||
        pathname.includes('firebase-admin-test') ||
        pathname.includes('s3/presigned-url')) {
      return NextResponse.next();
    }

    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};