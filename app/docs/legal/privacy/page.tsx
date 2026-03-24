// @/docs/legal/privacy/page.tsx

"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Subsection = {
  id: string;
  title: string;
  badges?: string[];
  content: string;
};

type Section = {
  id: string;
  title: string;
  content?: string;
  subsections?: Subsection[];
};

const sections: Section[] = [
  {
    id: "introduction",
    title: "1. Introduction",
    content: `Games Trafic ("nous", "notre", "nos") s'engage à protéger votre vie privée et vos données personnelles. Cette politique de confidentialité décrit en détail les types d'informations que nous collectons via nos plateformes (sites web, applications mobiles, API), comment nous les utilisons, les partageons et les protégeons. Elle couvre l'ensemble de nos services : marketplace de comptes et items de jeu, organisation de tournois, système de portefeuille électronique (GTC), abonnements VIP, réseau social et messagerie. En utilisant nos services, vous acceptez les pratiques décrites ci-dessous.`,
  },
  {
    id: "donnees-collectees",
    title: "2. Données collectées",
    subsections: [
      {
        id: "donnees-identite",
        title: "2.1 Données d'identité et de contact",
        badges: ["Obligatoire", "KYC"],
        content: `Nous collectons vos informations d'identification lors de l'inscription et de la vérification d'identité (KYC) :
• Identifiants uniques : UUID, auth_uid, nom d'utilisateur, ID de session
• Informations personnelles : nom complet, email (vérifié), numéro de téléphone, date de naissance
• Adresse postale complète (rue, ville, pays, code postal) stockée en format JSON
• Documents d'identité : type (passeport, CNI, permis), numéro hashé, photo du document, URL de vérification
• Photos de profil et couverture, biographie, site web personnel
• Réseaux sociaux : liens vers vos profils (stockés en tableau JSON)`,
      },
      {
        id: "donnees-compte",
        title: "2.2 Données de compte et préférences",
        badges: ["Profil", "Préférences"],
        content: `Informations liées à votre compte et vos choix personnels :
• Type de compte : BUYER, SELLER, TRADER, TOURNAMENT_ORGANIZER, VIP
• Niveau utilisateur (A, B, C) et statut de vérification email
• Préférences de confidentialité : profil public/privé, visibilité email/téléphone/solde
• Paramètres régionaux : langue, devise préférée, fuseau horaire
• Thème personnalisé : configuration JSON des couleurs, polices, mise en page
• Notifications : préférences par email, push, SMS (stockées en JSON)`,
      },
      {
        id: "donnees-financieres",
        title: "2.3 Données financières et portefeuille",
        badges: ["Finances", "Sécurisé"],
        content: `Informations relatives à vos transactions financières :
• Portefeuille GTC : solde, numéro de carte hashé, code PIN hashé
• Historique des transactions : montants, frais, devises, statuts (PENDING, COMPLETED, FAILED, REFUNDED)
• Types de transactions : achats, ventes, dépôts, retraits, virements, abonnements VIP
• Métadonnées financières : ID produit, ID boutique, ID commande, descriptions
• Méthodes de paiement : banque, mobile money (MTN, Orange, Wave), crypto, PayPal, Stripe
• Requêtes de retrait/dépôt : justificatifs, références de paiement, images de confirmation`,
      },
      {
        id: "donnees-jeu",
        title: "2.4 Données de jeu et tournois",
        badges: ["Gaming", "E-sport"],
        content: `Informations liées à votre activité gaming et compétitive :
• Comptes de jeu : login encrypté, mot de passe encrypté, niveau, rang, platforme (PC, PlayStation, Xbox, Switch, Mobile)
• Participations tournois : statut (REGISTERED, PARTICIPATED, DISQUALIFIED, WINNER), frais d'inscription
• Résultats : scores, statistiques de matchs, classements, prix remportés
• Équipes : rôle (PLAYER, COACH, MANAGER, CAPTAIN), statistiques d'équipe
• Préférences de jeu : personnages favoris, pool de personnages, région de jeu`,
      },
      {
        id: "donnees-comportement",
        title: "2.5 Données de comportement et usage",
        badges: ["Analytics", "Amélioration"],
        content: `Données collectées automatiquement lors de votre navigation :
• Traces d'activité : type (signin, navigation, achat, vue), horodatage, session ID
• Historique de recherche : requêtes effectuées, filtres utilisés
• Interactions : likes, follows, bookmarks, vues sur produits, posts, tournois
• Messages : contenu des communications, destinataires, groupes, pièces jointes
• Posts et stories : contenu texte, images, vidéos, durée de vie des stories
• Médias uploadés : types (image, vidéo, document), tailles, métadonnées EXIF`,
      },
      {
        id: "donnees-techniques",
        title: "2.6 Données techniques et sécurité",
        badges: ["Sécurité", "Technique"],
        content: `Informations techniques pour la sécurité et le bon fonctionnement :
• Données de session : token unique, adresse IP, user agent, dates d'expiration
• Appareils : type d'appareil, système d'exploitation, navigateur
• Clés API et tokens d'accès : fournisseurs OAuth (Google, Discord, etc.)
• Tentatives de connexion : échecs, verrouillages, historique de connexion
• Données de traçage : anonymisées pour l'analyse d'usage globale`,
      },
    ],
  },
  {
    id: "utilisation-donnees",
    title: "3. Utilisation des données",
    content: `Nous utilisons vos données pour :
• Fournir et maintenir nos services : gestion des comptes, traitement des transactions, organisation des tournois
• Sécurité : vérification d'identité, prévention de la fraude, détection d'activité suspecte, respect du KYC
• Amélioration : analyse d'usage, développement de nouvelles fonctionnalités, personnalisation de l'expérience
• Communication : notifications importantes, mises à jour de sécurité, réponses à vos demandes
• Marketing : recommandations personnalisées, offres promotionnelles (avec votre consentement)
• Conformité : respect des obligations légales, traitement des réclamations, protection des droits`,
  },
  {
    id: "partage-donnees",
    title: "4. Partage des données",
    subsections: [
      {
        id: "partage-utilisateurs",
        title: "4.1 Partage entre utilisateurs",
        content: `Certaines informations sont partagées avec d'autres utilisateurs selon vos paramètres :
• Profil public : nom d'utilisateur, bio, photo, statistiques de jeu (si profil public activé)
• Activité de boutique : nom de la boutique, produits listés, évaluations (pour les vendeurs)
• Participations tournois : pseudonyme, équipe, résultats (selon les paramètres du tournoi)
• Messages privés : uniquement avec les destinataires choisis`,
      },
      {
        id: "partage-prestataires",
        title: "4.2 Prestataires de services tiers",
        content: `Nous faisons appel à des services tiers pour :
• Paiements : Stripe, PayPal, opérateurs de mobile money (données financières cryptées)
• Hébergement : serveurs cloud, CDN pour les médias
• Communications : services d'email, push notifications, SMS
• Analytics : outils d'analyse d'usage (données anonymisées)
• Vérification d'identité : services KYC tiers pour la validation des documents`,
      },
      {
        id: "partage-legal",
        title: "4.3 Obligations légales",
        content: `Nous pouvons partager des données lorsque requis par :
• Autorités judiciaires : dans le cadre d'enquêtes légales
• Régulateurs : respect des lois sur les jeux d'argent, lutte contre le blanchiment
• Protection : prévention de la fraude, protection de nos utilisateurs et droits
• Fusion/acquisition : transfert d'actifs dans le cadre d'une restructuration d'entreprise`,
      },
    ],
  },
  {
    id: "securite",
    title: "5. Sécurité des données",
    content: `Nous mettons en œuvre des mesures de sécurité appropriées :
• Cryptage : tous les mots de passe et données sensibles sont hashés (bcrypt, AES-256)
• HTTPS/TLS : toutes les communications sont chiffrées en transit
• Authentification : 2FA optionnel, clés API sécurisées, sessions avec expiration
• Contrôles d'accès : permissions basées sur les rôles, audit des accès admin
• Sauvegardes : données sauvegardées régulièrement avec cryptage
• Monitoring : détection d'intrusion, logs de sécurité, alertes automatiques
• PCI DSS : standards de sécurité pour le traitement des paiements
• RGPD : conformité au Règlement Général sur la Protection des Données`,
  },
  {
    id: "conservation",
    title: "6. Conservation des données",
    content: `Nous conservons vos données uniquement le temps nécessaire :
• Compte actif : données conservées tant que le compte est actif
• Inactivité : suppression après 2 ans d'inactivité complète
• Transactions : 7 ans pour conformité fiscale et réglementaire
• Logs de sécurité : 1 an pour investigation en cas d'incident
• Données anonymisées : conservées indéfiniment pour l'analyse statistique
• Suppression : vous pouvez demander la suppression de vos données à tout moment`,
  },
  {
    id: "droits",
    title: "7. Vos droits",
    content: `Vous disposez de droits sur vos données personnelles :
• Accès : obtenir une copie de vos données personnelles
• Rectification : corriger des données inexactes ou incomplètes
• Suppression : demander l'effacement de vos données (droit à l'oubli)
• Portabilité : recevoir vos données dans un format structuré
• Opposition : vous opposer au traitement de vos données
• Limitation : restreindre l'utilisation de vos données
• Consentement : retirer votre consentement à tout moment
• Plainte : déposer une plainte auprès d'une autorité de protection des données`,
  },
  {
    id: "cookies",
    title: "8. Cookies et technologies similaires",
    content: `Nous utilisons des cookies pour :
• Fonctionnement : cookies essentiels pour la navigation et la sécurité
• Préférences : sauvegarder vos choix (langue, thème, filtres)
• Analytics : comprendre l'utilisation du site (Google Analytics, anonymisé)
• Publicité : personnaliser les publicités (avec consentement)
• Réseaux sociaux : intégration avec les plateformes sociales
• Durée : de la session jusqu'à 13 mois maximum
• Gestion : vous pouvez gérer les cookies dans vos paramètres navigateur`,
  },
  {
    id: "international",
    title: "9. Transferts internationaux",
    content: `Vos données peuvent être transférées vers :
• Serveurs : hébergés dans l'UE principalement, avec CDN mondial
• Sous-traitants : prestataires conformes RGPD (Stripe, Google Cloud)
• Pays tiers : uniquement avec protections adéquates (clauses contractuelles types)
• Cryptage : toutes les données sensibles restent cryptées pendant le transfert
• Droits : vos droits restent protégés quel que soit le lieu de traitement`,
  },
  {
    id: "enfants",
    title: "10. Protection des enfants",
    content: `Nos services ne sont pas destinés aux enfants de moins de 13 ans :
• Âge minimum : 13 ans (16 ans dans certains pays de l'UE)
• Vérification : contrôle de l'âge lors de l'inscription
• Consentement parental : requis pour les mineurs selon la législation locale
• Contenu : filtrage du contenu inapproprié pour les mineurs
• Données : collecte minimale pour les utilisateurs mineurs
• Suppression : suppression immédiate des comptes d'enfants détectés`,
  },
  {
    id: "modifications",
    title: "11. Modifications de la politique",
    content: `Nous pouvons modifier cette politique :
• Notification : vous serez informé par email ou notification in-app
• Date d'entrée en vigueur : minimum 30 jours après la notification
• Historique : toutes les versions précédentes restent disponibles
• Consentement : votre utilisation continue constitue l'acceptation
• Révision : nous vous recommandons de consulter régulièrement cette page`,
  },
  {
    id: "contact",
    title: "12. Nous contacter",
    content: `Pour toute question sur cette politique ou vos données :
• Email : privacy@gamestrafic.com
• Formulaire : section "Confidentialité" dans vos paramètres de compte
• Délégué à la protection des données (DPO) : dpo@gamestrafic.com
• Adresse postale : Games Trafic - Privacy Team, 123 Gaming Street, 75000 Paris, France
• Autorité de contrôle : CNIL (France) - https://www.cnil.fr
• Délai de réponse : 30 jours maximum pour les demandes`,
  },
];

export default function PrivacyPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const filteredSections = sections.filter((section) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesTitle = section.title.toLowerCase().includes(searchLower);
    const matchesContent = section.content?.toLowerCase().includes(searchLower);
    const matchesSubsections = section.subsections?.some(
      (sub) =>
        sub.title.toLowerCase().includes(searchLower) ||
        sub.content.toLowerCase().includes(searchLower) ||
        sub.badges?.some((badge) => badge.toLowerCase().includes(searchLower))
    );
    return matchesTitle || matchesContent || matchesSubsections;
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.replace(
      regex,
      '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Politique de Confidentialité
        </h1>
        <p className="text-xl text-muted-foreground">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
        </p>
      </div>

      <Card className="sticky top-4 z-10">
        <CardHeader>
          <CardTitle>Rechercher dans la politique</CardTitle>
          <CardDescription>
            Trouvez rapidement les informations qui vous concernent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher par mot-clé (ex: cookies, paiement, KYC...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchTerm && (
            <p className="text-sm text-muted-foreground mt-2">
              {filteredSections.length} section(s) trouvée(s)
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        {filteredSections.map((section) => (
          <Card key={section.id} id={section.id} className="scroll-mt-24">
            <CardHeader
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{section.title}</CardTitle>
                <Badge variant="outline">
                  {expandedSections.includes(section.id)
                    ? "Réduire"
                    : "Déplier"}
                </Badge>
              </div>
            </CardHeader>

            {(expandedSections.includes(section.id) || searchTerm) && (
              <CardContent>
                {section.content && (
                  <div
                    className="prose prose-gray dark:prose-invert max-w-none mb-4"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(section.content, searchTerm),
                    }}
                  />
                )}

                {section.subsections?.map((sub) => (
                  <div key={sub.id} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{sub.title}</h3>
                      {sub.badges?.map((badge) => (
                        <Badge key={badge} variant="secondary">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                    <div
                      className="prose prose-gray dark:prose-invert max-w-none text-sm"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(sub.content, searchTerm),
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Résumé des points clés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600 dark:text-green-400">
                ✅ Vos droits
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Accès à vos données à tout moment</li>
                <li>• Rectification et suppression possible</li>
                <li>• Portabilité de vos données</li>
                <li>• Opposition au traitement</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600 dark:text-blue-400">
                🔒 Notre engagement
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Cryptage de toutes les données sensibles</li>
                <li>• Aucune vente de données à des tiers</li>
                <li>• Transparence complète sur l'utilisation</li>
                <li>• Conformité RGPD garantie</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
