// components/admin/RouteProtection.tsx
"use client";

import React from "react";
// import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { AlertCircle } from "lucide-react";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

interface RouteProtectionProps {
  children: React.ReactNode;
  requiredLevel?: "A" | "B" | "C";
  requiredPermission?: string;
  showLoading?: boolean;
  redirectPath?: string;
}

export function RouteProtection({
  children,
  requiredLevel = "C",
  requiredPermission,
  showLoading = true,
  redirectPath = "/admin",
}: RouteProtectionProps) {
  const permissions = useAdminPermissions();
  const router = useRouter();
  const { user } = useAuthContext();

  // Afficher un loading pendant la vérification
  if (showLoading && !user) {
    return <PageSkeleton type="dashboard" />;
  }

  // Vérifier si l'utilisateur est admin
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <Typography variant="h3" className="mb-2">
            Accès refusé
          </Typography>
          <Typography variant="body-base" theme="muted" className="mb-6">
            Vous devez être administrateur pour accéder à cette page.
          </Typography>
          <Button onClick={() => router.push("/login")}>Se connecter</Button>
        </div>
      </div>
    );
  }

  // Vérifier le niveau requis
  const levelWeights = { A: 3, B: 2, C: 1 };
  const userLevel = user.level || "C";
  const requiredWeight = levelWeights[requiredLevel];
  const userWeight = levelWeights[userLevel];

  if (userWeight < requiredWeight) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto text-warning mb-4" />
          <Typography variant="h3" className="mb-2">
            Permissions insuffisantes
          </Typography>
          <Typography variant="body-base" theme="muted" className="mb-4">
            Cette page nécessite un niveau d'administrateur {requiredLevel}.
            Votre niveau actuel est {userLevel}.
          </Typography>
          <div className="space-y-2">
            <Button onClick={() => router.push(redirectPath)}>
              Retour au dashboard
            </Button>
            {userLevel === "C" && (
              <Typography variant="body-sm" theme="muted">
                Contactez un administrateur de niveau supérieur pour obtenir
                plus de permissions.
              </Typography>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vérifier la permission spécifique si nécessaire
  if (
    requiredPermission &&
    !permissions[requiredPermission as keyof typeof permissions]
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto text-warning mb-4" />
          <Typography variant="h3" className="mb-2">
            Permission requise
          </Typography>
          <Typography variant="body-base" theme="muted" className="mb-6">
            Vous n'avez pas la permission "{requiredPermission}" nécessaire pour
            accéder à cette page.
          </Typography>
          <Button onClick={() => router.push(redirectPath)}>
            Retour au dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Tout est bon, afficher le contenu
  return <>{children}</>;
}
