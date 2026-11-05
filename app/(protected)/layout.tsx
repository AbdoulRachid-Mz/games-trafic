import React, { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserWalletByUserId, initializeUserWallet } from "@/actions/wallets";
import { redirect } from "next/navigation";

async function AuthCheck({ children }: { children: React.ReactNode }) {
  // Opt-in au rendu dynamique : la session dépend de la requête entrante.
  await connection();

  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  if (user.id) {
    try {
      const wallet = await getUserWalletByUserId(user.id);
      if (!wallet) {
        console.log(`Initialisation auto du wallet pour l'utilisateur ${user.id}`);
        await initializeUserWallet(user.id);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification/initialisation du wallet:", error);
    }
  }

  return <>{children}</>;
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center" />}>
      <AuthCheck>{children}</AuthCheck>
    </Suspense>
  );
}