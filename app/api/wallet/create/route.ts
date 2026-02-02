import { NextRequest, NextResponse } from "next/server";
import { createWalletServer } from "@/actions/wallets";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { pin } = await request.json();

    if (!pin) {
      return NextResponse.json(
        { error: "PIN requis" },
        { status: 400 }
      );
    }

    // Créer le wallet
    const result = await createWalletServer(session.id, pin);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Erreur création" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Wallet créé avec succès",
      data: {
        walletId: result.wallet!.id,
        balance: result.wallet!.balance,
        isActive: result.wallet!.isActive,
      },
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// export async function POST(request: NextRequest) {
//   try {
//     const session = await getCurrentUser();
//     if (!session) {
//       return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
//     }

//     const data = await request.json();
//     const { pin, enableBiometrics, enableNotifications, currency } = data;

//     // Validation
//     if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
//       return NextResponse.json(
//         { error: "PIN invalide. Doit être 4 chiffres" },
//         { status: 400 }
//       );
//     }

//     // Hasher le PIN
//     const saltRounds = 10;
//     const pinHash = await hash(pin, saltRounds);

//     // Générer un numéro de carte (simulé)
//     const generateCardNumber = () => {
//       const parts = [];
//       for (let i = 0; i < 4; i++) {
//         parts.push(Math.floor(1000 + Math.random() * 9000).toString());
//       }
//       return parts.join("");
//     };

//     // Données du wallet
//     const walletData = {
//       userId: session.id,
//       pinHash,
//       balance: "0.00",
//       isActive: true,
//       isLocked: false,
//       verificationStatus: "PENDING",
//       currency: currency || "GTC",
//       cardNumberHash: generateCardNumber(),
//       settings: {
//         enableBiometrics,
//         enableNotifications,
//         currency,
//         theme: "default",
//         language: "fr",
//       },
//     };

//     // Créer le wallet
//     const wallet = await createUserWallet(walletData);

//     // Créer une transaction de bienvenue (optionnel)
//     // await createTransaction({
//     //   walletId: wallet.id,
//     //   amount: "10.00",
//     //   type: "BONUS",
//     //   status: "COMPLETED",
//     //   description: "Bonus de bienvenue",
//     // });

//     return NextResponse.json({
//       success: true,
//       message: "Wallet créé avec succès",
//       data: {
//         walletId: wallet.id,
//         cardNumber: walletData.cardNumberHash,
//         balance: wallet.balance,
//       },
//     });
//   } catch (error: any) {
//     console.error("Error creating wallet:", error);
    
//     // Gérer les erreurs spécifiques
//     if (error.message === "User already has a wallet") {
//       return NextResponse.json(
//         { error: "Vous avez déjà un wallet" },
//         { status: 400 }
//       );
//     }

//     return NextResponse.json(
//       { error: "Erreur lors de la création du wallet" },
//       { status: 500 }
//     );
//   }
// }