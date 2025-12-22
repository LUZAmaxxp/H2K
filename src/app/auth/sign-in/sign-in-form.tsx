"use client";
import { Link } from "@/hooks/use-navigation";
import { useState, useEffect } from "react";
import { SubmitHandler } from "react-hook-form";
import { Password, Checkbox, Button, Input } from "rizzui";
import { useMedia } from "@core/hooks/use-media";
import { Form } from "@core/ui/form";
import { routes } from "@/config/routes";
import { loginSchema, LoginSchema } from "@/validators/login.schema";
import { useTranslation } from '@/lib/i18n-context';
import { storeAuthToken, getAuthToken } from "@/utils/auth-storage";
import { authClient } from "@/lib/auth-client";
import toast from "react-hot-toast";

const initialValues: LoginSchema = {
  email: "",
  password: "",
  rememberMe: false,
};

export default function SignInForm() {
  const { t } = useTranslation();
  const isMedium = useMedia("(max-width: 1200px)", false);
  const [isLoading, setIsLoading] = useState(false);
  const [reset, setReset] = useState<LoginSchema>(initialValues);

  // Force reset form to ensure rememberMe is unchecked by default
  useEffect(() => {
    setReset({ ...initialValues });
  }, []);

  const onSubmit: SubmitHandler<LoginSchema> = async (data) => {
    setIsLoading(true);

    try {
      const { data: result, error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      if (error) {
        let errorMessage = "Failed to sign in. Please try again.";

        if (
          error.message?.includes("Invalid") ||
          error.message?.includes("not found")
        ) {
          errorMessage =
            "Invalid email or password. Please check your credentials and try again.";
        } else if (error.message?.includes("not verified")) {
          errorMessage = error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
      } else {
        console.log("Sign-in successful:", result);
        toast.success("Signed in successfully!");

        // Handle remember me functionality
        if (data.rememberMe) {
          const token = getAuthToken();
          if (token) {
            console.log(
              "📁 Storing auth token with remember me:",
              data.rememberMe
            );
            storeAuthToken(token, data.rememberMe);
          }
        }

        // Redirect to dashboard or home
        window.location.href = "/";
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Form<LoginSchema>
        validationSchema={loginSchema}
        resetValues={reset}
        onSubmit={onSubmit}
        useFormProps={{
          mode: "onChange",
          defaultValues: initialValues,
        }}
      >
        {({ register, formState: { errors } }) => (
          <div className="space-y-5 lg:space-y-6">
            <Input
              type="email"
              size={isMedium ? "lg" : "xl"}
              label={t("form.form-email")}
              placeholder={t("form.form-email-placeholder")}
              className="[&>label>span]:font-medium [&>label>span]:text-black [&>div>input]:h-14"
              {...register("email")}
              error={errors.email?.message}
            />
            <Password
              label={t("form.form-password")}
              placeholder={t("form.form-password-placeholder")}
              size={isMedium ? "lg" : "xl"}
              className="[&>label>span]:font-medium [&>label>span]:text-black [&>div>input]:h-14"
              {...register("password")}
              error={errors.password?.message}
            />
            <div className="flex items-center justify-between pb-1">
              <Checkbox
                {...register("rememberMe")}
                label={t("auth.auth-remember-me")}
                className="[&>label>span]:font-medium [&>label>span]:text-black"
                defaultChecked={false}
              />
              <Link
                href={routes.auth.forgotPassword}
                className="h-auto p-0 text-sm font-semibold text-gray-700 underline transition-colors hover:text-primary hover:no-underline"
              >
                {t("auth.auth-forgot-password")}
              </Link>
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary-dark focus:bg-primary-dark"
              type="submit"
              size={isMedium ? "lg" : "xl"}
              isLoading={isLoading}
            >
              {t("auth.auth-sign-in")}
            </Button>
          </div>
        )}
      </Form>
      <p className="mt-6 text-center text-[15px] leading-loose text-gray-500 md:mt-7 lg:mt-9 lg:text-base">
        {t("auth.auth-dont-have-account")}{" "}
        <Link
          href={routes.auth.signUp}
          className="font-semibold text-gray-700 transition-colors hover:text-primary"
        >
          {t("auth.auth-sign-up")}
        </Link>
      </p>
    </>
  );
}
