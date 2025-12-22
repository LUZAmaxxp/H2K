"use client";

import { Link } from "@/hooks/use-navigation";
import toast from "react-hot-toast";
import { useState } from "react";
import { SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button, Input } from "rizzui";
import { useMedia } from "@core/hooks/use-media";
import { Form } from "@core/ui/form";
import { routes } from "@/config/routes";
import {
  forgetPasswordSchema,
  ForgetPasswordSchema,
} from "@/validators/forget-password.schema";
import { useTranslation } from "@/lib/i18n-context";
import { authClient } from "@/lib/auth-client";

const initialValues = {
  email: "",
};

export default function ForgetPasswordForm() {
  const { t } = useTranslation();
  const isMedium = useMedia("(max-width: 1200px)", false);
  const router = useRouter();
  const [reset, setReset] = useState<ForgetPasswordSchema>(initialValues);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit: SubmitHandler<ForgetPasswordSchema> = async (data) => {
    setIsLoading(true);

    try {
      const { error } = await authClient.forgetPassword({
        email: data.email,
      });

      if (error) {
        console.error("Forgot password error:", error);
        toast.error(
          error.message || "Failed to send reset email. Please try again."
        );
      } else {
        toast.success("Password reset email sent! Please check your email.");
        setReset(initialValues);
        // Redirect to check-email page with email parameter and type=reset
        router.push(`/auth/check-email?email=${encodeURIComponent(data.email)}&type=reset`);
      }
    } catch (error) {
      console.error("Forgot password error:", JSON.stringify(error, null, 2));
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Form<ForgetPasswordSchema>
        validationSchema={forgetPasswordSchema()}
        resetValues={reset}
        onSubmit={onSubmit}
        useFormProps={{
          defaultValues: initialValues,
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
            />
            <Button
              className="w-full bg-primary hover:bg-primary-dark focus:bg-primary-dark"
              type="submit"
              size={isMedium ? "lg" : "xl"}
              isLoading={isLoading}
            >
              {t("auth.auth-reset-password")}
            </Button>
          </div>
        )}
      </Form>
      <p className="mt-6 text-center text-[15px] leading-loose text-gray-500 md:mt-7 lg:mt-9 lg:text-base">
        {t("auth.auth-dont-want-to-reset")}{" "}
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
