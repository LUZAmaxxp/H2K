"use client";
import AuthWrapperFour from '@/app/shared/auth-layout/auth-wrapper-four';
import SignUpForm from './sign-up-form';
import { useTranslations } from '@/hooks/use-translations';

export default function SignUpPage() {
  const { t } = useTranslations();

  return (
    <AuthWrapperFour
      title={t('auth.auth-sign-up-4-welcome-message')}
      isSocialLoginActive={false}
    >
      <SignUpForm />
    </AuthWrapperFour>
  );
}
