import React from "react";
import { getCurrentUser } from "@/lib/auth/session";

// Les pages protégées dépendent de la session (cookies/headers) : on force
// le rendu dynamique pour éviter le prerendering qui casse `headers()`.
export const dynamic = "force-dynamic";
import { getUserWalletByUserId, initializeUserWallet } from "@/actions/wallets";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  if (user.id) {
    try {
      // Vérifier si le wallet existe, sinon le créer
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
