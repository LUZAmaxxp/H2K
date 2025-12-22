"use client";

import AuthWrapperFour from '@/app/shared/auth-layout/auth-wrapper-four';
import ResetPasswordForm from './reset-password-form';

export default function ResetPasswordPage() {
  return (
    <AuthWrapperFour
      title={
        <>
          Set New Password <br className="hidden sm:inline-block" />{' '}
          Secure Your Account
        </>
      }
    >
      <ResetPasswordForm />
    </AuthWrapperFour>
  );
}
