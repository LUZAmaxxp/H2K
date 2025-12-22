"use client";

import AuthWrapperFour from '@/app/shared/auth-layout/auth-wrapper-four';
import ForgetPasswordForm from './forgot-password-form';
import { useTranslations } from '@/hooks/use-translations';

export default function ForgotPasswordPage() {
  const { t } = useTranslations();

  return (
    <AuthWrapperFour
      title={
        <>
          {t('auth.auth-forgot-password-4-trouble-signing-in')} <br className="hidden sm:inline-block" />{' '}
          {t('auth.auth-forgot-password-4-reset-password')}
        </>
      }
    >
      <ForgetPasswordForm />
    </AuthWrapperFour>
  );
}
