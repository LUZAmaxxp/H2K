"use client";

import { Link } from "@/hooks/use-navigation";
import { routes } from "@/config/routes";
import cn from "@core/utils/class-names";
import { usePathname } from "next/navigation";
import { Title, Button } from "rizzui";
import { PiArrowLineRight, PiUserCirclePlus } from "react-icons/pi";
import { FcGoogle } from "react-icons/fc";
import OrSeparation from "./or-separation";
import { useTranslations } from "@/hooks/use-translations";
import { authClient } from "@/lib/auth-client";

function AuthNavLink({
  href,
  children,
}: React.PropsWithChildren<{
  href: string;
}>) {
  const pathname = usePathname();
  function isActive(href: string) {
    if (pathname === href) {
      return true;
    }
    return false;
  }

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-x-1 rounded-3xl p-2 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 md:px-4 md:py-2.5 [&>svg]:w-4 [&>svg]:text-gray-500",
        isActive(href) ? "bg-gray-100 text-gray-900 [&>svg]:text-gray-900" : " "
      )}
    >
      {children}
    </Link>
  );
}

export default function AuthWrapperFour({
  children,
  title,
  isSocialLoginActive = false,
  isSignIn = false,
  className = "",
}: {
  children: React.ReactNode;
  title: React.ReactNode;
  isSocialLoginActive?: boolean;
  isSignIn?: boolean;
  className?: string;
}) {
  const { t } = useTranslations();

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col justify-between">
      <AuthHeader />

      <div className="flex w-full flex-col justify-center px-5">
        <div
          className={cn(
            "mx-auto w-full max-w-md py-12 md:max-w-lg lg:max-w-xl 2xl:pb-8 2xl:pt-2",
            className
          )}
        >
          <div className="flex flex-col items-center">
            <Title
              as="h2"
              className="mb-7 text-center text-[28px] font-bold leading-snug md:text-3xl md:!leading-normal lg:mb-10 lg:text-4xl text-black"
            >
              {title}
            </Title>
          </div>
          {isSocialLoginActive && (
            <>
              <div className="flex flex-col gap-4 pb-6 md:gap-6 xl:pb-7">
                <Button className="h-11 w-full" onClick={handleGoogleSignIn}>
                  <FcGoogle className="me-2 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {t("auth.auth-sign-in-with-google")}
                  </span>
                </Button>
              </div>
              <OrSeparation
                title={`${t("auth.auth-or")}, ${
                  isSignIn ? t("auth.auth-sign-in") : t("auth.auth-sign-up")
                } ${t("auth.auth-with-your-email")}`}
                isCenter
                className="mb-5 2xl:mb-7"
              />
            </>
          )}

          {children}
        </div>
      </div>

      <AuthFooter />
    </div>
  );
}

function AuthHeader() {
  const { t } = useTranslations();
  return (
    <header className="flex items-center justify-end p-4 lg:px-16 lg:py-6 2xl:px-24">
      <div className="flex items-center space-x-2 md:space-x-4">
        <AuthNavLink href={routes.auth.signIn}>
          <PiArrowLineRight className="h-4 w-4" />
          <span>{t("auth.auth-login")}</span>
        </AuthNavLink>
        <AuthNavLink href={routes.auth.signUp}>
          <PiUserCirclePlus className="h-4 w-4" />
          <span>{t("auth.auth-sign-up")}</span>
        </AuthNavLink>
      </div>
    </header>
  );
}

function AuthFooter() {
  const { t } = useTranslations();

  return (
    <footer className="flex flex-col-reverse items-center justify-between px-4 py-5 lg:flex-row lg:px-16 lg:py-6 2xl:px-24 2xl:py-10">
      <div className="text-center leading-relaxed text-gray-500 lg:text-start">
        {t("auth.auth-copyright")}{" "}
        <Link
          href="https://safedetect.com/"
          className="font-medium transition-colors hover:text-primary"
        >
         Sociéte Régionale Multiservices SOUSS MASSA
        </Link>
        , {t("auth.auth-all-rights-reserved")}
      </div>
    </footer>
  );
}
