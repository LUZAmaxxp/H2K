'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, Shield } from 'lucide-react';
import SidebarMenu from '@/components/sidebar-menu';
import { useTranslation } from '@/lib/i18n-context';
import { authClient } from '@/lib/auth-client';

export default function ProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, isPending: loading } = authClient.useSession();
  const authenticated = !!session;
  const user = session?.user;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!authenticated || !user) {
    return null; // Router will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SidebarMenu />
      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{t('profile.title')}</h1>
            <p className="mt-2 text-gray-600">{t('profile.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Overview */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {t('profile.sections.profileInfo')}
                  </CardTitle>
                  <CardDescription>
                    {t('profile.sections.profileInfoDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{user.name || 'User'}</h3>
                      <Badge variant="secondary" className="mt-1">
                        <Shield className="w-3 h-3 mr-1" />
                        {'User'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">{t('profile.labels.email')}</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">{t('profile.labels.memberSince')}</p>
                        <p className="font-medium">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>{t('profile.sections.quickActions')}</CardTitle>
                  <CardDescription>
                    {t('profile.sections.quickActionsDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button
                    onClick={() => router.push('/settings')}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{t('profile.labels.editProfile')}</div>
                    <div className="text-sm text-gray-500">{t('profile.labels.editProfileDesc')}</div>
                  </button>

                  <button
                    onClick={() => router.push('/settings')}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{t('profile.labels.changePassword')}</div>
                    <div className="text-sm text-gray-500">{t('profile.labels.changePasswordDesc')}</div>
                  </button>

                  <button
                    onClick={() => router.push('/settings')}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{t('profile.labels.notificationSettings')}</div>
                    <div className="text-sm text-gray-500">{t('profile.labels.notificationSettingsDesc')}</div>
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
