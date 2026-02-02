"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const termsSections = [
  {
    id: "acceptation",
    title: "1. Acceptation des Conditions",
    content: `
      <p>En accédant ou en utilisant Games Trafic, vous acceptez d'être lié par ces Conditions Générales d'Utilisation. Si vous n'êtes pas d'accord avec une partie quelconque des conditions, vous ne devez pas accéder au service.</p>
      <p>Ces conditions s'appliquent à tous les utilisateurs, qu'ils soient visiteurs, membres réguliers ou abonnés VIP. L'utilisation de notre plateforme implique l'acceptation pleine et entière de ces conditions.</p>
    `,
    tags: ["acceptation", "utilisation", "service"]
  },
  {
    id: "comptes",
    title: "2. Comptes Utilisateurs",
    content: `
      <h3>2.1 Création de Compte</h3>
      <p>Lorsque vous créez un compte chez nous, vous devez nous fournir des informations exactes, complètes et à jour en tout temps. Le non-respect de cette obligation constitue une violation des Conditions.</p>
      
      <h3>2.2 Types de Comptes</h3>
      <ul>
        <li><strong>Compte Régulier :</strong> Accès de base aux fonctionnalités de la plateforme</li>
        <li><strong>Compte VIP :</strong> Accès premium avec des avantages exclusifs selon le plan choisi (MENSUEL, ANNUEL, À VIE)</li>
        <li><strong>Compte Vendeur :</strong> Permet la création de boutiques et la vente de produits</li>
        <li><strong>Compte Organisateur :</strong> Permet la création et la gestion de tournois</li>
      </ul>
      
      <h3>2.3 Sécurité du Compte</h3>
      <p>Vous êtes responsable de la sauvegarde de votre mot de passe et de toutes les activités effectuées sous votre compte. Vous devez nous informer immédiatement de toute utilisation non autorisée de votre compte.</p>
      
      <h3>2.4 Portefeuille Numérique</h3>
      <p>Chaque utilisateur peut avoir un portefeuille numérique (UserWallet) pour effectuer des transactions. La vérification d'identité peut être requise pour activer certaines fonctionnalités du portefeuille.</p>
    `,
    tags: ["compte", "vip", "vendeur", "organisateur", "portefeuille", "sécurité"]
  },
  {
    id: "transactions",
    title: "3. Transactions et Paiements",
    content: `
      <h3>3.1 Types de Transactions</h3>
      <p>Notre plateforme prend en charge divers types de transactions :</p>
      <ul>
        <li>Achat de produits et services</li>
        <li>Abonnements VIP</li>
        <li>Achat d'items de jeu</li>
        <li>Achat de thèmes</li>
        <li>Dépôts et retraits</li>
        <li>Remboursements et transferts</li>
        <li>Participation à des tournois</li>
      </ul>
      
      <h3>3.2 Frais de Transaction</h3>
      <p>Des frais peuvent s'appliquer selon le type de transaction :</p>
      <ul>
        <li>Frais de transaction : 0.1%</li>
        <li>Frais d'achat : 1%</li>
        <li>Frais de retrait : 2%</li>
        <li>Frais de transfert : 0.5%</li>
        <li>Frais de participation aux tournois : 1%</li>
      </ul>
      
      <h3>3.3 Devises Supportées</h3>
      <p>La monnaie principale de la plateforme est le GTC (Games Trafic Coin). Les taux de change sont mis à jour régulièrement pour les conversions vers FCFA, EUR et USD.</p>
      
      <h3>3.4 Statuts des Transactions</h3>
      <p>Les transactions peuvent avoir les statuts suivants : EN_ATTENTE, COMPLET, TRAITEMENT, ÉCHOUÉ, REMBOURSÉ</p>
    `,
    tags: ["transaction", "paiement", "frais", "gtc", "devise", "remboursement"]
  },
  {
    id: "boutiques-produits",
    title: "4. Boutiques et Produits",
    content: `
      <h3>4.1 Création de Boutique</h3>
      <p>Les utilisateurs peuvent créer des boutiques pour vendre des produits liés aux jeux vidéo. Chaque boutique doit respecter nos directives de contenu et de sécurité.</p>
      
      <h3>4.2 Types de Produits</h3>
      <ul>
        <li>Comptes de jeu avec différents niveaux et rangs</li>
        <li>Items virtuels (pièces, skins, équipements)</li>
        <li>Services de boosting et de coaching</li>
      </ul>
      
      <h3>4.3 Statuts des Produits</h3>
      <p>Les produits peuvent avoir les statuts suivants : NON_VENDU, RESERVE, EN_ECHANGE, LIVRE, VENDU, ANNULER</p>
      
      <h3>4.4 Commandes</h3>
      <p>Les commandes passent par différents statuts : EN_ATTENTE, ACCEPTÉ, REJETÉ, ANNULÉ. Le vendeur et l'acheteur sont notifiés à chaque changement de statut.</p>
      
      <h3>4.5 Limites selon le Type de Compte</h3>
      <ul>
        <li>Utilisateur régulier : maximum 5 produits actifs</li>
        <li>Utilisateur VIP : maximum 20 produits actifs</li>
        <li>Utilisateur régulier : maximum 1 boutique</li>
        <li>Utilisateur VIP : maximum 5 boutiques</li>
      </ul>
    `,
    tags: ["boutique", "produit", "commande", "vendeur", "limite", "statut"]
  },
  {
    id: "tournois",
    title: "5. Tournois et Compétitions",
    content: `
      <h3>5.1 Organisation de Tournois</h3>
      <p>Les organisateurs peuvent créer des tournois avec différents formats : ÉLIMINATION, PHASE_DE_GROUPE, RONDE_UNIQUE, SUISSE, ÉLIMINATION_DIRECTE, PERSONNALISÉ</p>
      
      <h3>5.2 Participations</h3>
      <p>Les utilisateurs peuvent s'inscrire aux tournois. Les statuts de participation incluent : INSCRIT, PARTICIPÉ, DISQUALIFIÉ, GAGNANT, ÉLIMINÉ</p>
      
      <h3>5.3 Frais d'Inscription</h3>
      <p>Des frais d'inscription peuvent être demandés pour certains tournois. Ces frais doivent être payés avant la date limite d'inscription.</p>
      
      <h3>5.4 Récompenses</h3>
      <p>Les récompenses peuvent être distribuées aux gagnants sous forme de prix en GTC, d'items spéciaux ou d'autres avantages.</p>
      
      <h3>5.5 Limites</h3>
      <ul>
        <li>Utilisateur régulier : maximum 1 tournoi organisé simultanément</li>
        <li>Utilisateur VIP : maximum 5 tournois organisés simultanément</li>
        <li>Maximum 32 participants par tournoi par défaut</li>
      </ul>
    `,
    tags: ["tournoi", "compétition", "participation", "récompense", "inscription", "organisateur"]
  },
  {
    id: "equipes",
    title: "6. Équipes et Groupes",
    content: `
      <h3>6.1 Création d'Équipe</h3>
      <p>Les utilisateurs peuvent créer des équipes pour participer aux tournois. Chaque équipe peut avoir un capitaine, un vice-capitaine et différents rôles (JOUEUR, ENTRAÎNEUR, MANAGER, REMPLAÇANT, CAPITAINE, VICE_CAPITAINE).</p>
      
      <h3>6.2 Groupes Sociaux</h3>
      <p>Les utilisateurs peuvent créer ou rejoindre des groupes pour discuter et partager. Les rôles dans les groupes incluent : PROPRIÉTAIRE, ADMINISTRATEUR, MEMBRE</p>
      
      <h3>6.3 Messages et Communication</h3>
      <p>La plateforme permet l'envoi de messages entre utilisateurs, dans les groupes, et liés aux différentes entités (produits, boutiques, tournois, etc.)</p>
    `,
    tags: ["équipe", "groupe", "message", "communication", "capitaine", "rôle"]
  },
  {
    id: "contenu",
    title: "7. Contenu et Propriété Intellectuelle",
    content: `
      <h3>7.1 Propriété Intellectuelle</h3>
      <p>Le Service et son contenu original, ses fonctionnalités et sa fonctionnalité sont et resteront la propriété exclusive de Games Trafic et de ses concédants.</p>
      
      <h3>7.2 Publications et Médias</h3>
      <p>Les utilisateurs peuvent publier du contenu (posts, blogs, guides) et télécharger des médias (images, vidéos, documents). Le contenu doit respecter nos directives communautaires.</p>
      
      <h3>7.3 Thèmes</h3>
      <p>Les utilisateurs VIP peuvent créer et vendre des thèmes pour personnaliser l'apparence des boutiques et des tournois. Une commission de 15% est appliquée sur les ventes de thèmes.</p>
      
      <h3>7.4 Interactions</h3>
      <p>Les utilisateurs peuvent interagir avec le contenu via J'AIME, SUIVRE, MARQUER, VU. Ces interactions sont enregistrées pour améliorer l'expérience utilisateur.</p>
    `,
    tags: ["propriété intellectuelle", "contenu", "publication", "média", "thème", "interaction"]
  },
  {
    id: "confidentialite",
    title: "8. Confidentialité et Données",
    content: `
      <h3>8.1 Collecte de Données</h3>
      <p>Nous collectons des données nécessaires au fonctionnement de la plateforme : informations de profil, données de transaction, historique de recherche, traces d'utilisation.</p>
      
      <h3>8.2 Paramètres de Confidentialité</h3>
      <p>Les utilisateurs peuvent contrôler la visibilité de leur profil, email, numéro de téléphone et solde via les paramètres de confidentialité.</p>
      
      <h3>8.3 Traçage et Analytique</h3>
      <p>Nous enregistrons les traces d'utilisation (CONNEXION, DÉCONNEXION, INSCRIPTION, NAVIGATION, ACHAT, etc.) pour améliorer nos services et assurer la sécurité.</p>
      
      <h3>8.4 Notifications</h3>
      <p>Les utilisateurs peuvent configurer leurs préférences de notification pour les différents types d'événements (nouvelles commandes, messages, tournois, etc.)</p>
    `,
    tags: ["confidentialité", "données", "paramètres", "tracage", "notification", "profil"]
  },
  {
    id: "restrictions",
    title: "9. Restrictions et Interdictions",
    content: `
      <h3>9.1 Comportements Interdits</h3>
      <ul>
        <li>Fraude ou tentative de fraude</li>
        <li>Utilisation de logiciels malveillants</li>
        <li>Harassment ou comportement abusif</li>
        <li>Vente de produits illégaux ou interdits</li>
        <li>Triche dans les tournois</li>
        <li>Création de comptes multiples pour contourner les limites</li>
      </ul>
      
      <h3>9.2 Sanctions</h3>
      <p>Les violations peuvent entraîner :</p>
      <ul>
        <li>Avertissement</li>
        <li>Suspension temporaire</li>
        <li>Bannissement permanent</li>
        <li>Confiscation des fonds en cas de fraude</li>
        <li>Poursuites judiciaires si nécessaire</li>
      </ul>
      
      <h3>9.3 Processus de Bannissement</h3>
      <p>Les utilisateurs bannis reçoivent une notification avec la raison du bannissement et sa durée. Les bannissements peuvent être temporaires ou permanents selon la gravité de la violation.</p>
    `,
    tags: ["restriction", "interdiction", "fraude", "bannissement", "sanction", "comportement"]
  },
  {
    id: "responsabilite",
    title: "10. Responsabilité et Garanties",
    content: `
      <h3>10.1 Limitation de Responsabilité</h3>
      <p>Games Trafic ne sera pas responsable des pertes de profits, des pertes de données, ou des dommages indirects résultant de l'utilisation de notre service.</p>
      
      <h3>10.2 Garanties</h3>
      <p>Nous ne garantissons pas que :</p>
      <ul>
        <li>Le service sera ininterrompu ou sans erreur</li>
        <li>Les résultats obtenus seront exacts ou fiables</li>
        <li>La qualité des produits répondra à vos attentes</li>
        <li>Les erreurs seront corrigées</li>
      </ul>
      
      <h3>10.3 Réclamations</h3>
      <p>Les utilisateurs peuvent déposer des réclamations via notre système de claims. Chaque réclamation sera examinée et traitée dans les plus brefs délais.</p>
    `,
    tags: ["responsabilité", "garantie", "limitation", "réclamation", "claim"]
  },
  {
    id: "modifications",
    title: "11. Modifications du Service",
    content: `
      <h3>11.1 Mises à jour des Conditions</h3>
      <p>Nous nous réservons le droit, à notre seule discrétion, de modifier ou de remplacer ces Conditions à tout moment. Les modifications entreront en vigueur immédiatement après leur publication.</p>
      
      <h3>11.2 Modifications du Service</h3>
      <p>Nous pouvons modifier, suspendre ou interrompre le service à tout moment, avec ou sans préavis. Nous ne serons pas responsables envers vous ou des tiers pour toute modification, suspension ou interruption du service.</p>
      
      <h3>11.3 Maintenance</h3>
      <p>Le service peut être indisponible pendant les périodes de maintenance planifiée ou d'urgence. Nous ferons des efforts raisonnables pour informer les utilisateurs à l'avance.</p>
    `,
    tags: ["modification", "mise à jour", "maintenance", "suspension", "interruption"]
  },
  {
    id: "droit-applicable",
    title: "12. Droit Applicable et Juridiction",
    content: `
      <h3>12.1 Loi Applicable</h3>
      <p>Ces Conditions seront régies et interprétées conformément aux lois en vigueur. Tout litige sera soumis aux tribunens compétents.</p>
      
      <h3>12.2 Dispositions Finale</h3>
      <p>Si une disposition de ces Conditions est jugée invalide ou inapplicable, les autres dispositions resteront en vigueur. Ces Conditions constituent l'intégralité de l'accord entre vous et Games Trafic.</p>
    `,
    tags: ["droit", "juridiction", "loi", "disposition", "final"]
  }
];

export default function TermsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return termsSections;
    
    const query = searchQuery.toLowerCase();
    return termsSections.filter(section => 
      section.title.toLowerCase().includes(query) ||
      section.content.toLowerCase().includes(query) ||
      section.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-8">
      <div className="space-y-4 text-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Conditions Générales d'Utilisation
        </h1>
        <p className="text-xl text-muted-foreground">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </p>
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher dans les conditions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-6">
        <p className="text-lg leading-relaxed">
          Bienvenue sur Games Trafic ! Veuillez lire attentivement ces Conditions Générales d'Utilisation avant d'utiliser notre plateforme. 
          En utilisant Games Trafic, vous acceptez d'être lié par ces conditions. Si vous n'acceptez pas ces conditions, 
          veuillez ne pas utiliser notre service.
        </p>
      </div>

      <div className="space-y-4">
        {filteredSections.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Aucune section ne correspond à votre recherche.
            </CardContent>
          </Card>
        ) : (
          filteredSections.map((section) => (
            <Card key={section.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection(section.id)}
                    className="ml-2"
                  >
                    {expandedSections[section.id] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {section.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              {expandedSections[section.id] !== false && (
                <CardContent>
                  <div 
                    className="prose prose-gray dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(section.content, searchQuery)
                    }}
                  />
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      <div className="mt-8 p-6 bg-muted/30 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Besoin d'aide ?</h3>
        <p className="text-muted-foreground">
          Si vous avez des questions concernant ces Conditions Générales d'Utilisation, 
          n'hésitez pas à nous contacter via notre système de messagerie ou à 
          consulter nos guides d'utilisation.
        </p>
      </div>
    </div>
  );
}
