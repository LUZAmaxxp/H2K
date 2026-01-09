"use client";

import { Link, useRouter } from "@/hooks/use-navigation";
import { useState } from "react";
import { SubmitHandler } from "react-hook-form";
import { Password, Checkbox, Button, Input } from "rizzui";
import { useMedia } from "@core/hooks/use-media";
import { Form } from "@core/ui/form";
import { routes } from "@/config/routes";
import { signUpSchema, SignUpSchema } from "@/validators/signup.schema";
import { Modal } from "@core/modal-views/modal";
import { authClient } from "@/lib/auth-client";
import toast from "react-hot-toast";
import { useTranslation } from "@/lib/i18n-context";

const initialValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  licenseNumber: "",
  specialization: "",
  phoneNumber: "",
  isAgreed: false,
};

export default function SignUpForm() {
  const isMedium = useMedia("(max-width: 1200px)", false);
  const [reset, setReset] = useState<SignUpSchema>(initialValues);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserExistsDialog, setShowUserExistsDialog] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  

  const onSubmit: SubmitHandler<SignUpSchema> = async (data) => {
    setIsLoading(true);

    try {
      const { data: result, error } = await authClient.signUp.email({
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        password: data.password,
      
      });

      if (error) {
        console.error("Sign-up error:", error);

        if (
          error.message?.includes("already exists") ||
          error.message?.includes("USER_EXISTS")
        ) {
          setShowUserExistsDialog(true);
        } else {
          toast.error(
            error.message || t("sign-up.failed")
          );
        }
      } else {
        console.log("Sign-up successful:", result);
        
        // Create user profile with therapist professional details
        try {
          const profileResponse = await fetch('/api/user-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firstName: data.firstName,
              lastName: data.lastName,
              licenseNumber: data.licenseNumber,
              specialization: data.specialization,
              phoneNumber: data.phoneNumber,
              role: 'therapist'
            }),
          });

          if (!profileResponse.ok) {
            const profileError = await profileResponse.json();
            throw new Error(profileError.error || 'Failed to create user profile');
          }

          toast.success(
            "Registration successful! Your account is pending admin approval."
          );
          // Redirect to pending approval page
          router.push('/auth/pending-approval');
        } catch (profileError: unknown) {
          console.error("Profile creation error:", profileError);
          toast.error((profileError as Error).message || "Account created but profile setup failed. Please contact support.");
          router.push(
            `${routes.auth.checkEmail}?email=${encodeURIComponent(data.email)}`
          );
        }
      }
    } catch (error) {
      console.error("Sign-up error:", error);
      toast.error(t("sign-up.failed"));
    } finally {
      setIsLoading(false);
      setReset({ ...initialValues, isAgreed: false });
    }
  };

  return (
    <>
      <Form<SignUpSchema>
        validationSchema={signUpSchema()}
        resetValues={reset}
        onSubmit={onSubmit}
        useFormProps={{
          defaultValues: initialValues,
        }}
      >
        {({ register, formState: { errors } }) => (
          <div className="space-y-5 lg:space-y-6">
            <div className="flex gap-4">
              <Input
                type="text"
                size={isMedium ? "lg" : "xl"}
                label={t("form.form-first-name")}
                placeholder={t("form.form-first-name-placeholder")}
                className="[&>label>span]:font-medium [&>label>span]:text-black [&>div>input]:h-14"
                {...register("firstName")}
                error={errors.firstName?.message}
              />
              <Input
                type="text"
                size={isMedium ? "lg" : "xl"}
                label={t("form.form-last-name")}
                placeholder={t("form.form-last-name-placeholder")}
                className="[&>label>span]:font-medium [&>label>span]:text-black [&>div>input]:h-14"
                {...register("lastName")}
                error={errors.lastName?.message}
              />
            </div>
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
              {...register("password")}
              className="[&>label>span]:font-medium [&>label>span]:text-black [&>div>input]:h-14"
              error={errors.password?.message}
            />
            <Password
              label={t("form.form-confirm-password")}
              placeholder={t("form.form-confirm-password-placeholder")}
              size={isMedium ? "lg" : "xl"}
              {...register("confirmPassword")}
              className="[&>label>span]:font-medium [&>label>span]:text-black [&>div>input]:h-14"
              error={errors.confirmPassword?.message}
            />
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
              <Input
                type="text"
                size={isMedium ? "lg" : "xl"}
                label="License Number"
                placeholder="Enter your professional license number"
                className="[&>label>span]:font-medium [&>label>span]:text-black [&>div>input]:h-14"
                {...register("licenseNumber")}
                error={errors.licenseNumber?.message}
              />
              <Input
                type="text"
                size={isMedium ? "lg" : "xl"}
                label="Specialization"
                placeholder="e.g., Orthopedic, Neurological, Sports"
                className="[&>label>span]:font-medium [&>label>span]:text-black [&>div>input]:h-14 mt-4"
                {...register("specialization")}
                error={errors.specialization?.message}
              />
              <Input
                type="tel"
                size={isMedium ? "lg" : "xl"}
                label="Phone Number (Optional)"
                placeholder="+212 6XX XXX XXX"
                className="[&>label>span]:font-medium [&>label>span]:text-black [&>div>input]:h-14 mt-4"
                {...register("phoneNumber")}
                error={errors.phoneNumber?.message}
              />
            </div>
            <div className="col-span-2 flex items-start text-gray-700">
              <Checkbox
                {...register("isAgreed")}
                className="[&>label.items-center]:items-start [&>label>div.leading-none]:mt-0.5 [&>label>div.leading-none]:sm:mt-0 [&>label>span]:font-medium [&>label>span]:text-black"
                label={
                  <span className="ps-1 text-gray-500">
                    I agree to the{" "}
                    <Link
                      href="/"
                      className="font-semibold text-gray-700 transition-colors hover:text-primary"
                    >
                      Terms
                    </Link>{" "}
                    &{" "}
                    <Link
                      href="/"
                      className="font-semibold text-gray-700 transition-colors hover:text-primary"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                }
              />
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary-dark focus:bg-primary-dark"
              type="submit"
              size={isMedium ? "lg" : "xl"}
              isLoading={isLoading}
            >
              {t("sign-up.create-account")}
            </Button>
          </div>
        )}
      </Form>
      <p className="mt-6 text-center text-[15px] leading-loose text-gray-500 md:mt-7 lg:mt-9 lg:text-base">
        {t("sign-up.already-have-account")}{" "}
        <Link
          href={routes.auth.signIn}
          className="font-semibold text-gray-700 transition-colors hover:text-primary"
        >
          {t("sign-up.sign-in")}
        </Link>
      </p>

      {/* User Exists Dialog */}
      <Modal
        isOpen={showUserExistsDialog}
        onClose={() => setShowUserExistsDialog(false)}
        size="sm"
      >
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("sign-up.account-exists")}
          </h3>
          <p className="text-gray-600 mb-6">
            {t("sign-up.account-exists-desc")}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => setShowUserExistsDialog(false)}
              className="px-4 py-2"
            >
              {t("sign-up.cancel")}
            </Button>
            <Button
              onClick={() => {
                setShowUserExistsDialog(false);
                router.push(routes.auth.signIn);
              }}
              className="px-4 py-2"
            >
              {t("sign-up.sign-in")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
