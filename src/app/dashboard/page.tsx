'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const session = await authClient.getSession();
        if (!session) {
          router.push('/auth/sign-in');
          return;
        }

        // Check user role and redirect accordingly
        try {
          const profileResponse = await fetch('/api/user-profile');
          if (profileResponse.ok) {
            const profile = await profileResponse.json();

            if (profile.status === 'pending') {
              router.push('/auth/pending-approval');
              return;
            }

            if (profile.role === 'therapist') {
              router.push('/dashboard/therapist');
              return;
            } else if (profile.role === 'admin') {
              router.push('/dashboard/admin');
              return;
            }
          } else if (profileResponse.status === 404) {
            // Profile doesn't exist - the API will handle admin check and auto-creation
            // For promoted admin users, profile will be created as therapist
            // Just redirect to sign-up for non-admin users
            router.push('/auth/sign-up');
            return;
          }
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);
          // If profile doesn't exist, redirect to sign-up
          router.push('/auth/sign-up');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/sign-in');
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
}
