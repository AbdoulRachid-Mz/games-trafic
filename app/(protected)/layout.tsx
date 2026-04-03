import React from "react";
import { AuthService } from "@/lib/auth/service";
import { getUserWalletByUserId, initializeUserWallet } from "@/actions/wallets";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await AuthService.getSession();
  if (!session) {
    return window.location.href = "/unauthorized?redirectTo=/sign-in&msg=Vous n'avez pas la permission d'accéder à cette page";
  }

  if (session?.user?.id) {
    try {
      // Vérifier si le wallet existe, sinon le créer
      const wallet = await getUserWalletByUserId(session.user.id);
      if (!wallet) {
        console.log(`Initialisation auto du wallet pour l'utilisateur ${session.user.id}`);
        await initializeUserWallet(session.user.id);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification/initialisation du wallet:", error);
    }
  }

  return <>{children}</>;
}
