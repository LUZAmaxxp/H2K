"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/hooks/use-navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface UserProfile {
  firstName: string;
  lastName: string;
  licenseNumber: string;
  specialization: string;
  status: string;
}

export default function PendingApprovalPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const session = await authClient.getSession();
        if (!session) {
          router.push('/auth/sign-in');
          return;
        }

        const response = await fetch('/api/user-profile');
        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);

          // If approved, redirect to dashboard
          if (profile.status === 'approved' || profile.status === 'active') {
            router.push('/dashboard');
          }
        } else if (response.status === 404) {
          // Profile doesn't exist yet - redirect to sign-up to complete registration
          const errorData = await response.json();
          if (errorData.needsCreation) {
            router.push('/auth/sign-up');
            return;
          }
          // If profile not found and not a new user, show error
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
          <CardDescription>
            Your registration is being reviewed by an administrator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>What happens next?</strong>
            </p>
            <ul className="mt-2 text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>An administrator will review your professional credentials</li>
              <li>You&apos;ll receive an email notification once your account is approved</li>
              <li>This page will automatically update when your status changes</li>
            </ul>
          </div>

          {userProfile && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{userProfile.firstName} {userProfile.lastName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">License Number:</span>
                <span className="font-medium">{userProfile.licenseNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Specialization:</span>
                <span className="font-medium">{userProfile.specialization}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  userProfile.status === 'pending' ? 'text-yellow-600' :
                  userProfile.status === 'approved' ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  {userProfile.status.charAt(0).toUpperCase() + userProfile.status.slice(1)}
                </span>
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                authClient.signOut();
                router.push('/auth/sign-in');
              }}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

