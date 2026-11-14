import "dotenv/config";
import { db } from "@/lib/db";
import { users, guides, guideSteps, services } from "@/database/schema";
import { eq, and } from "drizzle-orm";

interface GuideStepSeed {
  order: number;
  title: string;
  content: string;
}

interface GuideSeed {
  title: string;
  category: string;
  description: string;
  steps: GuideStepSeed[];
}

interface ServiceSeed {
  title: string;
  description: string;
  icon: string;
}

const SEED_GUIDES: GuideSeed[] = [
  {
    title: "Bien démarrer sur Games-Trafics",
    category: "débutant",
    description: "Guide étape par étape pour configurer votre compte, votre profil de joueur et découvrir les fonctionnalités essentielles de la plateforme.",
    steps: [
      {
        order: 1,
        title: "Création et personnalisation de votre profil",
        content: "Inscrivez-vous via email ou Passkey biométrique. Rendez-vous dans les paramètres de votre profil pour ajouter votre pseudo de jeu officiel, votre pays de résidence et vos identifiants gaming (PlayStation, Xbox, Riot, Steam).",
      },
      {
        order: 2,
        title: "Activation du Wallet GTC & Code PIN",
        content: "Votre Wallet GTC est automatiquement initialisé. Définissez votre code PIN secret à 4 ou 6 chiffres. Ce code sera obligatoirement demandé pour valider vos transferts de fonds et vos retraits.",
      },
      {
        order: 3,
        title: "Découverte des tournois et du catalogue de jeux",
        content: "Explorez les tournois ouverts aux inscriptions pour tester votre niveau, ou visitez le catalogue de jeux pour obtenir des pièces, skins et passes de combat officiels.",
      },
    ],
  },
  {
    title: "Gérer son Wallet GTC en toute sécurité",
    category: "transaction",
    description: "Tout comprendre sur l'alimentation de votre portefeuille, les transferts P2P entre joueurs et la sécurisation par code PIN.",
    steps: [
      {
        order: 1,
        title: "Alimenter son solde par dépôt",
        content: "Accédez à la section Wallet > Dépôt. Choisissez votre moyen de paiement (Mobile Money, carte bancaire). Dès confirmation bancaire, votre solde disponible en GTC est immédiatement crédité.",
      },
      {
        order: 2,
        title: "Effectuer un transfert sécurisé vers un autre joueur",
        content: "Sélectionnez Transfert, indiquez le pseudo ou scannez le QR code du destinataire. Saisissez le montant et confirmez l'opération avec votre code PIN personnel pour garantir l'absence de transaction non autorisée.",
      },
      {
        order: 3,
        title: "Demander un retrait vers son compte personnel",
        content: "Pour retirer vos gains de tournois ou vos recettes de ventes, faites une demande de retrait vers votre compte bancaire ou Mobile Money vérifié. Le traitement s'effectue sous 24 à 48 heures ouvrées.",
      },
    ],
  },
  {
    title: "Participer et Gagner des Tournois E-Sport",
    category: "tournoi",
    description: "Inscrivez-vous à une compétition, suivez l'arbre de match en direct, déclarez vos scores et empochez votre Prize Pool.",
    steps: [
      {
        order: 1,
        title: "Choisir un tournoi et valider son inscription",
        content: "Parcourez la liste des compétitions disponibles. Vérifiez le format (Round-Robin, Arbre simple ou double élimination), le jeu et réglez les frais d'entrée via votre Wallet GTC si requis.",
      },
      {
        order: 2,
        title: "Consulter le bracket et disputer sa rencontre",
        content: "Dès que l'organisateur lance la phase, consultez votre adversaire et l'heure du match dans le bracket interactif. Jouez votre partie selon les règles officielles du tournoi.",
      },
      {
        order: 3,
        title: "Reporter le résultat et recevoir sa récompense",
        content: "Renseignez le score final dans la feuille de match et joignez une capture d'écran de fin de partie. Une fois le résultat validé, les gains de Prize Pool sont automatiquement versés sur votre Wallet GTC.",
      },
    ],
  },
  {
    title: "Créer et Gérer sa Boutique Certifiée",
    category: "boutique",
    description: "Guide complet pour les vendeurs : validation KYC, mise en ligne de produits gaming et gestion des commandes sous protection séquestre.",
    steps: [
      {
        order: 1,
        title: "Demander l'ouverture d'une boutique vendeur",
        content: "Remplissez le formulaire de candidature vendeur avec vos informations d'identité (KYC). Notre équipe valide votre dossier sous 48 heures pour activer votre espace boutique.",
      },
      {
        order: 2,
        title: "Publier vos premiers articles et gérer les stocks",
        content: "Ajoutez vos fiches produits avec photos, descriptions précises, quantités en stock et prix en GTC. Les articles apparaissent instantanément sur la Marketplace Games-Trafics.",
      },
      {
        order: 3,
        title: "Livraison de commande et encaissement sécurisé",
        content: "Lorsqu'un client commande, le montant est conservé en compte séquestre (Escrow). Livrez l'article au client. Dès que la livraison est confirmée, les fonds sont libérés sur votre Wallet vendeur.",
      },
    ],
  },
  {
    title: "Acheter des Game Items & Monnaies de Jeu",
    category: "débutant",
    description: "Comment obtenir des eFootball Coins, FC Points, COD Points ou diamants en toute sécurité avec livraison sur votre identifiant joueur.",
    steps: [
      {
        order: 1,
        title: "Sélectionner le jeu et l'article souhaité",
        content: "Dans l'onglet Jeux, filtrez par titre (eFootball, FC 25, PUBG, Free Fire) et choisissez le pack de monnaies, skins ou passe de combat souhaité.",
      },
      {
        order: 2,
        title: "Renseigner précisément votre Player ID",
        content: "Indiquez votre identifiant joueur (UID, Riot ID, Tag). Vérifiez attentivement chaque caractère pour éviter tout retard ou attribution sur un mauvais compte.",
      },
      {
        order: 3,
        title: "Règlement via Wallet GTC et réception",
        content: "Validez la commande par débit de votre solde GTC. La recharge est opérée directement sur votre compte de jeu dans le délai affiché sur la fiche de l'article.",
      },
    ],
  },
];

const SEED_SERVICES: ServiceSeed[] = [
  {
    title: "Assistance à l'Organisation de Tournois E-Sport",
    description: "Accompagnement personnalisé pour la configuration de vos tournois : choix du format d'arbre (Round-Robin, Single/Double Elimination), gestion des poules, arbitrage des litiges et supervision de la distribution des cashprizes.",
    icon: "🏆",
  },
  {
    title: "Accompagnement Création & Certification de Boutique",
    description: "Conseils techniques et accompagnement pour configurer votre catalogue de produits gaming, paramétrer vos stocks et finaliser votre certification vendeur officiel sur la Marketplace Games-Trafics.",
    icon: "🛍️",
  },
  {
    title: "Sécurisation de Compte & Intégration Wallet GTC",
    description: "Assistance dédiée pour la sécurisation de votre compte : audit d'accès, activation des Passkeys biométriques, configuration optimale de votre code PIN Wallet et conseils de prévention anti-fraude.",
    icon: "🛡️",
  },
  {
    title: "Support Technique Événementiel Gaming",
    description: "Présence d'un référent technique dédié pour superviser le bon déroulement de vos compétitions en direct, gérer les urgences et assurer la fluidité des déclarations de résultats en temps réel.",
    icon: "⚡",
  },
];

async function seedGuidesAndServices() {
  console.log("🌱 Début du seed Guides & Services (idempotent)...");

  // 1. Trouver un administrateur réel pour être le créateur officiel
  const adminUser = await db.query.users.findFirst({
    where: eq(users.role, "ADMIN"),
  });

  const fallbackUser = adminUser || (await db.query.users.findFirst());

  if (!fallbackUser) {
    console.warn("⚠️ Aucun utilisateur trouvé dans la base de données. Veuillez créer au moins un compte avant de lancer ce seed.");
    return;
  }

  const creatorId = fallbackUser.id;
  console.log(`👤 Utilisation du compte admin/créateur : ${fallbackUser.username || fallbackUser.id} (${creatorId})`);

  // 2. Insérer les Guides et leurs Étapes de manière idempotente
  console.log("\n📚 Traitement des Guides interactifs...");
  for (const guideData of SEED_GUIDES) {
    const existingGuide = await db.query.guides.findFirst({
      where: and(
        eq(guides.title, guideData.title),
        eq(guides.isDeleted, false)
      ),
    });

    let targetGuideId = existingGuide?.id;

    if (!existingGuide) {
      const [inserted] = await db
        .insert(guides)
        .values({
          title: guideData.title,
          category: guideData.category,
          description: guideData.description,
          adminId: creatorId,
          isActive: true,
          isDeleted: false,
        })
        .returning({ id: guides.id });
      targetGuideId = inserted.id;
      console.log(`  ➕ Guide créé : "${guideData.title}" (ID: ${targetGuideId})`);
    } else {
      console.log(`  ℹ️ Guide existant conservé : "${guideData.title}" (ID: ${targetGuideId})`);
    }

    if (targetGuideId) {
      // Pour chaque étape, vérifier si elle existe déjà pour ce guide et cet ordre
      for (const stepData of guideData.steps) {
        const existingStep = await db.query.guideSteps.findFirst({
          where: and(
            eq(guideSteps.guideId, targetGuideId),
            eq(guideSteps.order, stepData.order)
          ),
        });

        if (!existingStep) {
          await db.insert(guideSteps).values({
            guideId: targetGuideId,
            order: stepData.order,
            title: stepData.title,
            content: stepData.content,
          });
          console.log(`     ➕ Étape ${stepData.order} ajoutée : "${stepData.title}"`);
        } else {
          console.log(`     ℹ️ Étape ${stepData.order} déjà présente`);
        }
      }
    }
  }

  // 3. Insérer les Services de manière idempotente
  console.log("\n✨ Traitement des Services officiels...");
  for (const serviceData of SEED_SERVICES) {
    const existingService = await db.query.services.findFirst({
      where: and(
        eq(services.title, serviceData.title),
        eq(services.isDeleted, false)
      ),
    });

    if (!existingService) {
      const [inserted] = await db
        .insert(services)
        .values({
          title: serviceData.title,
          description: serviceData.description,
          icon: serviceData.icon,
          adminId: creatorId,
          isActive: true,
          isDeleted: false,
        })
        .returning({ id: services.id });
      console.log(`  ➕ Service créé : "${serviceData.title}" (ID: ${inserted.id})`);
    } else {
      console.log(`  ℹ️ Service existant conservé : "${serviceData.title}" (ID: ${existingService.id})`);
    }
  }

  console.log("\n✅ Seed Guides & Services terminé avec succès et sans écrasement !");
}

seedGuidesAndServices()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Erreur lors du seed Guides & Services :", err);
    process.exit(1);
  });
