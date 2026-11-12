"use client";

import { useEffect } from "react";
import { useAuthContext } from "@/contexts/auth-context";
import { DashboardShell } from "./dashboard-shell";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  // La redirection est un effet de bord : jamais pendant le rendu, et
  // uniquement une fois la session chargée (sinon on éjecte un utilisateur
  // valide pendant le chargement initial).
  useEffect(() => {
    if (!loading && !user) {
      router.replace(
        "/unauthorized?redirectTo=/sign-in&msg=Vous n'avez pas la permission d'accéder à cette page",
      );
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
