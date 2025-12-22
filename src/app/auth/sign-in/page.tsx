"use client";
import AuthWrapperFour from '@/app/shared/auth-layout/auth-wrapper-four';
import { useTranslations } from '@/hooks/use-translations';
import { useState } from 'react';
import SignInForm from './sign-in-form';
import MagicLinkForm from './magic-link-form';

export default function SignInPage() {
  const { t, isLoading } = useTranslations();
  const [useMagicLink, setUseMagicLink] = useState(true); // Default to magic link

  // Wait for translations to load to avoid showing translation keys
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <AuthWrapperFour
      title={`${t('auth.auth-sign-in-4-welcome-back')} ${t('auth.auth-sign-in-4-subtitle')}`}
      isSignIn
      isSocialLoginActive={false}
    >
        <div className="space-y-6">
          {/* Show the appropriate form - Magic Link by default */}
          {useMagicLink ? <MagicLinkForm /> : <SignInForm />}

        {/* Alternative sign-in option at the bottom */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">{t('auth.auth-or')}</span>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setUseMagicLink(!useMagicLink)}
            className="text-sm text-gray-600 hover:text-primary transition-colors underline"
          >
            {useMagicLink
              ? t('auth.auth-sign-in-with-password')
              : t('auth.auth-sign-in-with-magic-link')}
          </button>
        </div>
      </div>
    </AuthWrapperFour>
  );
}
