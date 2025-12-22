"use client";

import { Link } from "@/hooks/use-navigation";
import toast from "react-hot-toast";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SubmitHandler } from "react-hook-form";
import { Button, Input, Password } from "rizzui";
import { useMedia } from "@core/hooks/use-media";
import { Form } from "@core/ui/form";
import { routes } from "@/config/routes";
import {
  resetPasswordSchema,
  ResetPasswordSchema,
} from "@/validators/reset-password.schema";
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n-context";

function ResetPasswordFormContent() {
  const { t } = useTranslation();
  const isMedium = useMedia("(max-width: 1200px)", false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const emailParam = searchParams.get("email") || "";
    const tokenParam = searchParams.get("token") || "";

    if (!emailParam || !tokenParam) {
      toast.error("Invalid reset link. Please request a new password reset.");
      router.push(routes.auth.forgotPassword);
      return;
    }

    setEmail(emailParam);
    setToken(tokenParam);
  }, [searchParams, router]);

  const initialValues: ResetPasswordSchema = {
    email: email,
    password: "",
    confirmPassword: "",
  };

  const onSubmit: SubmitHandler<ResetPasswordSchema> = async (data) => {
    setIsLoading(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: data.password,
        token: token,
      });

      if (error) {
        console.error("Reset password error:", error);
        toast.error(
          error.message || "Failed to reset password. Please try again."
        );
      } else {
        toast.success(
          "Password reset successfully! Please sign in with your new password."
        );
        router.push("/");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <div className="text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Form<ResetPasswordSchema>
        validationSchema={resetPasswordSchema(t)}
        onSubmit={onSubmit}
        useFormProps={{
          defaultValues: { ...initialValues, email },
        }}
      >
        {({ register, formState: { errors } }) => (
          <div className="space-y-6">
            <Input
              type="email"
              size={isMedium ? "lg" : "xl"}
              label={t("form.form-email")}
              placeholder={t("form.form-email-placeholder")}
              className="[&>label>span]:font-medium [&>div>input]:h-14"
              {...register("email")}
              error={errors.email?.message}
              disabled
              value={email}
            />
            <Password
              label={t("form.form-new-password-label")}
              placeholder={t("form.form-new-password")}
              size={isMedium ? "lg" : "xl"}
              className="[&>label>span]:font-medium [&>div>input]:h-14"
              {...register("password")}
              error={errors.password?.message}
            />
            <Password
              label={t("form.form-confirm-password-label")}
              placeholder={t("form.form-confirm-password")}
              size={isMedium ? "lg" : "xl"}
              className="[&>label>span]:font-medium [&>div>input]:h-14"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />
            <Button
              className="w-full bg-primary hover:bg-primary-dark focus:bg-primary-dark"
              type="submit"
              size={isMedium ? "lg" : "xl"}
              isLoading={isLoading}
            >
              {t("auth.auth-reset-password-label")}
            </Button>
          </div>
        )}
      </Form>
      <p className="mt-6 text-center text-[15px] leading-loose text-gray-500 md:mt-7 lg:mt-9 lg:text-base">
        {t("auth.auth-remember-password")}{" "}
        <Link
          href={routes.auth.signIn}
          className="font-semibold text-gray-700 transition-colors hover:text-primary"
        >
          {t("auth.auth-sign-in")}
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordFormContent />
    </Suspense>
  );
}
