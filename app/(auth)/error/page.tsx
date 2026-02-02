"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { AuthErrorHandler } from "@/lib/auth/errors";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  const getErrorMessage = (errorCode: string | null) => {
    if (!errorCode)
      return "Une erreur s'est produite lors de l'authentification.";

    // Si un message spécifique est passé, l'utiliser sinon traduire le code
    if (message) return decodeURIComponent(message);

    const { message: translatedMessage } = AuthErrorHandler.handleAuthError(
      errorCode,
      { operation: "error_page", timestamp: new Date() }
    );
    return translatedMessage;
  };

  const isCriticalError = error === "SERVER_ERROR" || error === "ECONNRESET";

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md shadow-lg border-destructive/20">
        <CardContent className="pt-8 pb-8 px-6">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-destructive/10 p-4 rounded-full">
                <span className="text-destructive text-4xl">⚠️</span>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Oups ! Une erreur est survenue
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                {getErrorMessage(error)}
              </p>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <Link href="/sign-in" className="w-full text-white">
                <Button className="w-full h-11 font-medium">
                  Retour à la connexion
                </Button>
              </Link>

              <Link href="/" className="w-full">
                <Button variant="outline" className="w-full h-11">
                  Retour à l'accueil
                </Button>
              </Link>

              {isCriticalError && (
                <Button
                  variant="ghost"
                  className="text-muted-foreground text-xs"
                  onClick={() =>
                    (window.location.href = "mailto:support@games-trafics.com")
                  }
                >
                  Signaler ce problème au support
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
