"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "rizzui";
import AuthWrapperFour from "@/app/shared/auth-layout/auth-wrapper-four";
import { routes } from "@/config/routes";
import toast from 'react-hot-toast';

function CheckEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>("");
  const [isResetPassword, setIsResetPassword] = useState<boolean>(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const typeParam = searchParams.get("type");
    if (emailParam) {
      setEmail(emailParam);
    }
    if (typeParam === "reset") {
      setIsResetPassword(true);
    }
  }, [searchParams]);

  // French translations for auth pages
  const t = (key: string) => {
    const translations: Record<string, string> = {
      "check-email.title": "Vérifiez votre email",
      "check-email.reset-title": "Email de réinitialisation envoyé !",
      "check-email.verify-title": "Email de vérification envoyé !",
      "check-email.reset-message": "Nous vous avons envoyé un lien de réinitialisation de mot de passe à :",
      "check-email.verify-message": "Nous vous avons envoyé un lien de vérification à :",
      "check-email.reset-instruction": "Veuillez vérifier votre email et cliquer sur le lien de réinitialisation pour créer un nouveau mot de passe.",
      "check-email.verify-instruction": "Veuillez vérifier votre email et cliquer sur le lien de vérification pour activer votre compte.",
      "check-email.cant-find": "Vous ne trouvez pas l'email ?",
      "check-email.spam-tip": "Vérifiez votre dossier spam ou courrier indésirable",
      "check-email.correct-email": "Assurez-vous que votre adresse email est correcte",
      "check-email.delivery-time": "L'email peut prendre quelques minutes pour arriver",
      "check-email.resend-reset": "Renvoyer l'email de réinitialisation",
      "check-email.resend-verify": "Renvoyer l'email de vérification",
      "check-email.sign-in-instead": "Se connecter à la place",
      "check-email.back-sign-up": "Retour à l'inscription",
      "check-email.support": "Vous avez encore des problèmes ?",
      "check-email.contact-support": "Contacter le support",
      "check-email.reset-success": "Email de réinitialisation envoyé avec succès !",
      "check-email.verify-success": "Email de vérification envoyé avec succès !",
      "check-email.reset-failed": "Échec de l'envoi de l'email de réinitialisation. Veuillez réessayer.",
      "check-email.verify-failed": "Échec de l'envoi de l'email de vérification. Veuillez réessayer.",
      "check-email.resend-failed": "Échec de l'envoi de l'email. Veuillez réessayer."
    };
    return translations[key] || key;
  };

  const handleResendEmail = async () => {
    if (!email) return;

    try {
      if (isResetPassword) {
        // Resend password reset email
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (response.ok) {
          toast.success(t("check-email.reset-success"));
        } else {
          toast.error(t("check-email.reset-failed"));
        }
      } else {
        // Resend verification email
        const response = await fetch("/api/auth/email/send-verification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (response.ok) {
          toast.success(t("check-email.verify-success"));
        } else {
          toast.error(t("check-email.verify-failed"));
        }
      }
    } catch (error) {
      console.error("Error resending email:", error);
      toast.error(t("check-email.resend-failed"));
    }
  };

  return (
    <AuthWrapperFour title={t("check-email.title")} className="max-w-lg">
      <div className="text-center space-y-6">
        {/* Email Icon */}
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        {/* Main Message */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {isResetPassword ? t("check-email.reset-title") : t("check-email.verify-title")}
          </h3>
          <div className="space-y-3 text-gray-600">
            <p>
              {isResetPassword ? t("check-email.reset-message") : t("check-email.verify-message")}
            </p>
            {email && (
              <p className="font-medium text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                {email}
              </p>
            )}
            <p className="text-sm">
              {isResetPassword
                ? t("check-email.reset-instruction")
                : t("check-email.verify-instruction")
              }
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
          <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            {t("check-email.cant-find")}
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1 ml-7">
            <li>• {t("check-email.spam-tip")}</li>
            <li>• {t("check-email.correct-email")}</li>
            <li>• {t("check-email.delivery-time")}</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleResendEmail}
            variant="outline"
            className="w-full"
            disabled={!email}
          >
            {isResetPassword ? t("check-email.resend-reset") : t("check-email.resend-verify")}
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(routes.auth.signIn)}
              className="flex-1"
            >
              {t("check-email.sign-in-instead")}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(routes.auth.signUp)}
              className="flex-1"
            >
              {t("check-email.back-sign-up")}
            </Button>
          </div>
        </div>

        {/* Support */}
        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {t("check-email.support")}{" "}
            <a
              href="mailto:allouchayman21@gmail.com"
              className="text-primary hover:text-primary/80 font-medium"
            >
              {t("check-email.contact-support")}
            </a>
          </p>
        </div>
      </div>
    </AuthWrapperFour>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckEmailContent />
    </Suspense>
  );
}
