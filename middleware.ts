import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { UserProfile } from '@/lib/models';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected routes
  const protectedRoutes = [
    '/dashboard',
    '/appointments',
    '/profile',
    '/settings',
  ];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    try {
      // Get session from better-auth
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        // Redirect to sign-in page with return URL
        const signInUrl = new URL('/auth/sign-in', request.url);
        signInUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(signInUrl);
      }

      // Check user profile and approval status for protected routes
      // Skip this check for API routes to avoid performance issues
      if (!pathname.startsWith('/api')) {
        try {
          await dbConnect();
          const userProfile = await UserProfile.findOne({ userId: session.user.id });
          
          if (userProfile) {
            const isTherapist = userProfile.role === 'therapist' || userProfile.roles?.includes('therapist');
            // If therapist is pending approval, redirect to pending approval page
            if (isTherapist && userProfile.status === 'pending') {
              const pendingUrl = new URL('/auth/pending-approval', request.url);
              return NextResponse.redirect(pendingUrl);
            }
            
            // If therapist is rejected, redirect to sign-in with message
            if (isTherapist && userProfile.status === 'rejected') {
              const signInUrl = new URL('/auth/sign-in', request.url);
              signInUrl.searchParams.set('error', 'account_rejected');
              return NextResponse.redirect(signInUrl);
            }
            
            // If therapist is inactive, redirect to sign-in
            if (isTherapist && userProfile.status === 'inactive') {
              const signInUrl = new URL('/auth/sign-in', request.url);
              signInUrl.searchParams.set('error', 'account_inactive');
              return NextResponse.redirect(signInUrl);
            }
          } else if (pathname.startsWith('/dashboard') || pathname.startsWith('/appointments')) {
            // If profile doesn't exist and trying to access dashboard/appointments, redirect to sign-up
            const signUpUrl = new URL('/auth/sign-up', request.url);
            return NextResponse.redirect(signUpUrl);
          }
        } catch (profileError) {
          // If profile check fails, allow through (will be handled by page-level checks)
          console.error('Profile check error in middleware:', profileError);
        }
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      // On error, redirect to sign-in
      const signInUrl = new URL('/auth/sign-in', request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
