"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "rizzui";
import AuthWrapperFour from '@/app/shared/auth-layout/auth-wrapper-four';
import { routes } from "@/config/routes";
import { messages } from "@/config/messages";

function VerifyEmailContent() {
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [message, setMessage] = useState<string>("");
  const searchParams = useSearchParams();
  const router = useRouter();

  // French translations for auth pages
  const t = (key: string) => {
    const translations: Record<string, string> = {
      "verify-email.verifying": "Vérification de l'email",
      "verify-email.success": "Email vérifié",
      "verify-email.failed": "Échec de la vérification",
      "verify-email.invalid-link": "Lien invalide. Veuillez demander un nouveau lien de vérification.",
      "verify-email.success-msg": "Votre email a été vérifié avec succès !",
      "verify-email.failed-msg": "Échec de la vérification de l'email. Veuillez réessayer.",
      "verify-email.failed-retry": "Échec de la vérification. Veuillez réessayer ou demander un nouveau lien.",
      "verify-email.wait-verifying": "Veuillez patienter pendant la vérification de votre email...",
      "verify-email.welcome-redirect": "Bienvenue ! Vous allez être redirigé vers le tableau de bord.",
      "verify-email.try-new-verification": "Essayez de demander un nouveau lien de vérification.",
      "verify-email.back-sign-up": "Retour à l'inscription",
      "verify-email.try-again": "Réessayer",
      "verify-email.go-dashboard": "Aller au tableau de bord"
    };
    return translations[key] || key;
  };

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      const email = searchParams.get("email");

      if (!token || !email) {
        setStatus("error");
        setMessage(messages["auth.auth-invalid-link"]);
        return;
      }

      try {
        // Use Better Auth's built-in email verification endpoint
        const response = await fetch(`/api/auth/email/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email }),
        });

        if (response.ok) {
          setStatus("success");
          setMessage(messages["auth.auth-email-verified-success"]);

          // Auto-redirect after 3 seconds to dashboard since user is now verified
          setTimeout(() => {
            router.push("/");
          }, 3000);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setStatus("error");
          setMessage(errorData.message || messages["auth.auth-verification-failed-msg"]);
        }
      } catch (error) {
        console.error("Email verification error:", error);
        setStatus("error");
        setMessage(messages["auth.auth-verification-failed-retry"]);
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  const getTitle = () => {
    switch (status) {
      case "verifying":
        return t("verify-email.verifying");
      case "success":
        return t("verify-email.success");
      case "error":
        return t("verify-email.failed");
      default:
        return "Email Verification";
    }
  };

  return (
    <AuthWrapperFour title={getTitle()}>
      <div className="text-center space-y-6">
        {/* Status Icon */}
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
          status === "success"
            ? "bg-green-100"
            : status === "error"
            ? "bg-red-100"
            : "bg-primary/10"
        }`}>
          {status === "verifying" && (
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
          )}
          {status === "success" && (
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status === "error" && (
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {status === "verifying" && (
            <p className="text-gray-600">
              {t("verify-email.wait-verifying")}
            </p>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">{message}</p>
              </div>
              <p className="text-gray-600">
                {t("verify-email.welcome-redirect")}
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium">{message}</p>
              </div>
              <p className="text-gray-600 text-sm">
                {t("verify-email.try-new-verification")}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {status === "success" && (
          <div className="space-y-3 pt-4">
            <Button
              onClick={() => router.push("/")}
              className="w-full"
            >
              {t("verify-email.go-dashboard")}
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3 pt-4">
            <Button
              onClick={() => router.push(routes.auth.signUp)}
              className="w-full"
            >
              {t("verify-email.back-sign-up")}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              {t("verify-email.try-again")}
            </Button>
          </div>
        )}

        {/* Support */}
        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <a
              href="https://www.linkedin.com/in/ayman-allouch-9019b52a0/"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </AuthWrapperFour>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
