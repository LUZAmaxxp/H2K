'use client';

import { Calendar, Settings, User, LogOut, Shield, Menu, X, Home, Users, BarChart, Languages } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n-context';

interface SidebarMenuProps {
  activeSection?: string;
}

export default function SidebarMenu({ activeSection }: SidebarMenuProps) {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const session = await authClient.getSession();
        if (session) {
          const profileResponse = await fetch('/api/user-profile');
          if (profileResponse.ok) {
            const profile = await profileResponse.json();
            const roles: string[] = Array.isArray(profile.roles) ? profile.roles : [];
            const isAdmin = profile.role === 'admin' || roles.includes('admin');
            setIsAdmin(isAdmin);
          }
        }
      } catch (error) {
        console.error('Failed to check admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  const handleLogout = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push('/');
          },
        },
      });
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/');
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'fr' : 'en';
    setLocale(newLocale);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-card border border-border rounded-lg shadow-lg hover:bg-muted transition-colors"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-muted-foreground" />
          ) : (
            <Menu className="w-6 h-6 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-16 lg:w-16 bg-card border-r border-border shadow-lg
        flex flex-col items-center py-8 space-y-6
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:translate-x-0
      `}>
        {/* Close button for mobile */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden self-end mr-2 p-1 hover:bg-muted rounded"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Dashboard/Home */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
            onClick={() => handleNavigation('/dashboard/therapist')}
            title={t('navigation.dashboard')}
          >
            <Home className="w-6 h-6 text-white" />
          </div>
          {isAdmin && (
            <div
              className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors"
              onClick={() => handleNavigation('/dashboard/admin')}
              title={t('admin.dashboard')}
            >
              <Shield className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Appointments */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-green-700 transition-colors"
            onClick={() => handleNavigation('/appointments/new')}
            title={t('navigation.newIntervention')}
          >
            <Calendar className="w-6 h-6 text-white" />
          </div>
          {isAdmin && (
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                activeSection === 'appointments' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              onClick={() => handleNavigation('/dashboard/admin?tab=appointments')}
              title={t('navigation.appointments')}
            >
              <Calendar className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Admin Icons */}
        {isAdmin && (
          <>
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                activeSection === 'users' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              onClick={() => handleNavigation('/dashboard/admin?tab=users')}
              title={t('navigation.users')}
            >
              <Users className="w-6 h-6" />
            </div>

            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                activeSection === 'analytics' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              onClick={() => handleNavigation('/dashboard/admin?tab=analytics')}
              title={t('navigation.analytics')}
            >
              <BarChart className="w-6 h-6" />
            </div>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1"></div>

         {/* Language Switcher */}
        <div
          className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors relative group"
          onClick={toggleLanguage}
          title={locale === 'en' ? 'Switch to French' : 'Passer en Anglais'}
        >
          <Languages className="w-6 h-6 text-muted-foreground" />
          <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold px-1 rounded-full">
            {locale.toUpperCase()}
          </span>
        </div>

        {/* Profile Icon */}
        <div
          className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
          onClick={() => handleNavigation('/profile')}
          title={t('navigation.profile')}
        >
          <User className="w-6 h-6 text-muted-foreground" />
        </div>

        {/* Settings Icon */}
        <div
          className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
          onClick={() => handleNavigation('/settings')}
          title={t('navigation.settings')}
        >
          <Settings className="w-6 h-6 text-muted-foreground" />
        </div>

        {/* Logout Icon */}
        <div
          className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors"
          onClick={handleLogout}
          title={t('navigation.logout')}
        >
          <LogOut className="w-6 h-6 text-white" />
        </div>
      </div>
    </>
  );
}
