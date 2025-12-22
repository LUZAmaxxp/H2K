'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bell, Shield, Palette, Globe } from 'lucide-react';
import SidebarMenu from '@/components/sidebar-menu';
import { useSettingsStore } from '@/lib/settings-store';
import { useI18n, useTranslation } from '@/lib/i18n-context';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { t } = useTranslation();
  const { setLocale } = useI18n();
  const router = useRouter();

  const {
    notifications,
    appearance,
    language,
    timezone,
    setNotifications,
    setAppearance,
    setLanguage,
    setTimezone,
    loadSettings,
    saveSettings,
  } = useSettingsStore();

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleToggleNotification = async (key: keyof typeof notifications) => {
    const newValue = !notifications[key];
    setNotifications({ [key]: newValue });

    try {
      await saveSettings();
      toast.success(t('settings.messages.settingEnabled', { setting: key.replace(/([A-Z])/g, ' $1').toLowerCase() }));
    } catch {
      setNotifications({ [key]: !newValue });
      toast.error(t('settings.messages.saveError', { setting: 'notification' }));
    }
  };

  const handleToggleAppearance = async (key: keyof typeof appearance) => {
    const newValue = !appearance[key];
    console.log(`Toggling ${key} from ${appearance[key]} to ${newValue}`);
    setAppearance({ [key]: newValue });
    console.log('Appearance state after set:', { ...appearance, [key]: newValue });

    try {
      await saveSettings();
      const action = newValue ? 'enabled' : 'disabled';
      toast.success(t(`settings.messages.setting${action.charAt(0).toUpperCase() + action.slice(1)}`, { setting: key.replace(/([A-Z])/g, ' $1').toLowerCase() }));
    } catch {
      // Revert on error
      setAppearance({ [key]: !newValue });
      toast.error(t('settings.messages.saveError', { setting: 'appearance' }));
    }
  };

  const handleLanguageChange = async () => {
    // Cycle through supported locales
    const locales = ['fr', 'en', 'es', 'ar'] as const;
    const currentIndex = locales.indexOf(language as typeof locales[number]);
    const nextIndex = (currentIndex + 1) % locales.length;
    const newLanguage = locales[nextIndex];

    setLanguage(newLanguage);
    setLocale(newLanguage); // Update i18n context

    try {
      await saveSettings();
      toast.success(t('settings.messages.languageChanged', { language: newLanguage.toUpperCase() }));
    } catch {
      // Revert on error
      setLanguage(language);
      setLocale(language as typeof locales[number]);
      toast.error(t('settings.messages.saveError', { setting: 'language' }));
    }
  };

  const handleTimezoneChange = async () => {
    // For demo, cycle through timezones
    const timezones = ['UTC-5', 'UTC+0', 'UTC+1', 'UTC+2'];
    const currentIndex = timezones.indexOf(timezone);
    const nextIndex = (currentIndex + 1) % timezones.length;
    const newTimezone = timezones[nextIndex];

    setTimezone(newTimezone);

    try {
      await saveSettings();
      toast.success(t('settings.messages.timezoneChanged', { timezone: newTimezone }));
    } catch {
      // Revert on error
      setTimezone(timezone);
      toast.error(t('settings.messages.saveError', { setting: 'timezone' }));
    }
  };



  const handleLogoutAllSessions = async () => {
    setIsLogoutDialogOpen(true);
  };

  const confirmLogoutAllSessions = async () => {
    setIsLogoutDialogOpen(false);
    setIsLoading(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success(t('settings.security.logoutAllSuccess'));
            router.push('/');
          },
          onError: () => {
            toast.error(t('settings.security.logoutAllError'));
          },
        },
      });
    } catch {
      toast.error(t('settings.security.logoutAllError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/export');
      if (response.ok) {
        // Trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Records_Export.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(t('settings.messages.exportSuccess'));
      } else {
        throw new Error('Export failed');
      }
    } catch  {
      toast.error(t('settings.messages.exportError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = async () => {
    setIsDeleteDialogOpen(false);
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/delete-account', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success(t('settings.messages.deleteSuccess'));
        // Redirect to home or logout
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        throw new Error('Account deletion failed');
      }
    } catch  {
      toast.error(t('settings.messages.deleteError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex">
      <SidebarMenu />
      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('settings.subtitle')}</p>
          </div>

          <div className="space-y-6">
            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  {t('settings.notifications.title')}
                </CardTitle>
                <CardDescription>
                  {t('settings.notifications.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('settings.notifications.emailNotifications')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.notifications.emailNotificationsDesc')}</p>
                  </div>
                  <div
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                      notifications.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    onClick={() => handleToggleNotification('emailNotifications')}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                        notifications.emailNotifications ? 'right-0.5' : 'left-0.5'
                      }`}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('settings.notifications.pushNotifications')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.notifications.pushNotificationsDesc')}</p>
                  </div>
                  <div
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                      notifications.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    onClick={() => handleToggleNotification('pushNotifications')}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                        notifications.pushNotifications ? 'right-0.5' : 'left-0.5'
                      }`}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('settings.notifications.weeklyReports')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.notifications.weeklyReportsDesc')}</p>
                  </div>
                  <div
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                      notifications.weeklyReports ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    onClick={() => handleToggleNotification('weeklyReports')}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                        notifications.weeklyReports ? 'right-0.5' : 'left-0.5'
                      }`}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  {t('settings.appearance.title')}
                </CardTitle>
                <CardDescription>
                  {t('settings.appearance.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('settings.appearance.darkMode')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.appearance.darkModeDesc')}</p>
                  </div>
                  <div
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                      appearance.darkMode ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    onClick={() => handleToggleAppearance('darkMode')}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                        appearance.darkMode ? 'right-0.5' : 'left-0.5'
                      }`}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {t('settings.security.title')}
                </CardTitle>
                <CardDescription>
                  {t('settings.security.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/auth/forgot-password')}
                >
                  {t('settings.security.changePassword')}
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleLogoutAllSessions}
                  disabled={isLoading}
                >
                  {isLoading ? t('settings.security.loggingOut') : t('settings.security.loginSessions')}
                </Button>
              </CardContent>
            </Card>

            {/* Language & Region */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  {t('settings.language.title')}
                </CardTitle>
                <CardDescription>
                  {t('settings.language.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('settings.language.language')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.language.english')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLanguageChange}>
                    {t('settings.language.change')}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('settings.language.timezone')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.language.timezoneDesc')}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleTimezoneChange}>
                    {t('settings.language.change')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.account.title')}</CardTitle>
                <CardDescription>
                  {t('settings.account.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={handleExportData}
                  disabled={isLoading}
                >
                  {isLoading ? t('settings.account.exporting') : t('settings.account.exportData')}
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                >
                  {isLoading ? t('settings.account.deleting') : t('settings.account.deleteAccount')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* Logout Dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.security.confirmLogoutAll')}</DialogTitle>
            <DialogDescription>
              {t('settings.security.confirmLogoutAllDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmLogoutAllSessions}>
              {t('settings.security.logoutAll')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.account.confirmDelete')}</DialogTitle>
            <DialogDescription>
              {t('settings.account.confirmDeleteDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAccount}>
              {t('settings.account.deleteAccount')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
