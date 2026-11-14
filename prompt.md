# GAMES-TRAFICS — AUDIT ET REFONTE COMPLÈTE DE LA DOCUMENTATION, DES GUIDES, DES SERVICES ET DU SYSTÈME D’UPLOAD

## OBJECTIF GÉNÉRAL

Réaliser une refonte approfondie et professionnelle de quatre domaines de Games-Trafics :

1. La documentation officielle accessible sous `/docs/**`.
2. Les guides interactifs accessibles sous `/docs/guides/**`, alimentés par les tables `guides` et `guide_steps`.
3. Les services accessibles sous `/services/**`, alimentés par la table `services`.
4. Les composants d'upload d'images, de vidéos et de médias, avec une attention particulière à la sélection multiple, à la fiabilité des uploads, à l'expérience responsive et au design.

L'objectif n'est pas simplement d'ajouter des textes ou de moderniser quelques composants. Il faut analyser l'application complète, comprendre ses fonctionnalités réellement implémentées, ses règles métier, ses permissions, ses limites et ses parcours, puis produire une documentation cohérente et des contenus seedés qui reflètent fidèlement le fonctionnement réel de Games-Trafics.

Le résultat doit être digne d'une plateforme gaming professionnelle en production.

---

# PHASE 0 — AUDIT COMPLET AVANT MODIFICATION

Avant toute modification, analyser le projet existant dans son intégralité.

Ne pas commencer par modifier directement les pages concernées.

### 0.1 Comprendre l'architecture

Examiner notamment :

- `database/schema.ts`
- `database/relations.ts` si présent
- `database/seed.ts`
- `actions/**`
- `hooks/**`
- `app/**`
- `components/**`
- `lib/**`
- `types/**`
- `config/**`
- les middlewares/proxy et les règles d'autorisation
- les composants de navigation et d'AppShell
- les configurations des comptes, rôles, limites et abonnements
- les API utilisées par les fonctionnalités documentées.

Identifier les fonctionnalités réellement disponibles dans l'application, les fonctionnalités réservées à certains rôles, les fonctionnalités conditionnelles et celles qui ne sont que partiellement implémentées.

### 0.2 Construire une cartographie fonctionnelle

Établir une cartographie des fonctionnalités à partir du code et de la base de données.

Examiner au minimum :

- Authentification, inscription, connexion et sécurité.
- Profils utilisateurs et paramètres.
- Rôles et types de comptes.
- Wallet GTC et comptes financiers.
- Dépôts, retraits, transferts et transactions.
- Paiements, reçus, réclamations et remboursements.
- Abonnements VIP et avantages associés.
- Boutiques et gestion des vendeurs.
- Produits, catégories, commandes et suivi.
- Jeux et catalogue de Game Items.
- Demandes d'items et transactions associées.
- Tournois et organisateurs.
- Éditions, inscriptions et participants.
- Phases, groupes, journées, brackets et matchs.
- Résultats, classements et qualifications.
- Équipes, membres et rôles.
- Clips vidéo, publications et interactions.
- Messagerie privée et conversations de groupe.
- Notifications et annonces.
- Partenaires et partenariats.
- Thèmes et personnalisation.
- Blog, support et assistance.
- Services et autres modules effectivement présents.

Pour chaque fonctionnalité, identifier :

1. Ce qu'elle permet réellement de faire.
2. Les utilisateurs qui peuvent l'utiliser.
3. Les prérequis.
4. Les limites et restrictions.
5. Les étapes du parcours utilisateur.
6. Les statuts et transitions importants.
7. Les actions disponibles.
8. Les éventuels frais, plafonds ou conditions configurés.
9. Les pages et composants associés.
10. Les éventuelles limites ou fonctionnalités incomplètes.

Ne pas déduire une fonctionnalité uniquement à partir d'un nom de table ou d'un texte marketing.

Vérifier les actions serveur, les API, les hooks, les composants et les conditions d'autorisation.

### 0.3 Rapport d'audit

Avant la réalisation, établir une cartographie interne des fonctionnalités et des contenus existants.

Identifier :
- Les documents existants.
- Les guides existants et leurs étapes.
- Les services existants.
- Les doublons.
- Les contenus obsolètes.
- Les fonctionnalités documentées mais absentes du code.
- Les fonctionnalités réelles qui ne sont pas documentées.
- Les incohérences entre les données, les pages et les textes.

Ce rapport doit guider les modifications. Ne pas supprimer de contenu existant simplement parce qu'il est ancien : le vérifier et le mettre à jour lorsque c'est pertinent.

---

# PHASE 1 — REFONTE DE LA DOCUMENTATION OFFICIELLE `/docs/**`

## 1.1 Rôle de la documentation

La documentation officielle doit expliquer l'ensemble des fonctionnalités de Games-Trafics.

Elle constitue la référence centrale pour comprendre le fonctionnement de la plateforme.

Elle doit répondre à des questions telles que :

- À quoi sert cette fonctionnalité ?
- Qui peut l'utiliser ?
- Comment y accéder ?
- Comment l'utiliser correctement ?
- Quelles sont les conditions nécessaires ?
- Quelles sont les limites ?
- Quels statuts peut-on rencontrer ?
- Que faire en cas de problème ?
- Quelles autres fonctionnalités sont liées ?

Ne pas transformer la documentation en simple présentation commerciale.

## 1.2 Organisation des pages

Conserver le mécanisme de documentation existant fondé sur les fichiers Markdown/MDX dans `docs/content/**`, sauf si l'audit révèle un problème architectural qui justifie une correction.

Créer une arborescence claire, cohérente et évolutive.

Proposition de structure à adapter aux fonctionnalités réellement trouvées :

### Découvrir Games-Trafics
- Présentation de la plateforme.
- Démarrage rapide.
- Navigation et organisation de l'application.
- Types de comptes et rôles.
- Fonctionnement général de GTC.

### Compte et sécurité
- Création de compte.
- Connexion et déconnexion.
- Gestion du profil.
- Paramètres du compte.
- Sécurité et passkeys, si réellement disponibles.
- Permissions et vérification du compte.

### Wallet et finances
- Présentation du Wallet GTC.
- Solde et comptes financiers.
- Dépôts.
- Retraits.
- Transferts.
- Historique des transactions.
- Paiements et reçus.
- Remboursements et réclamations.
- Statuts des transactions.
- Frais et limites réellement configurés.

### Marketplace
- Découvrir les boutiques.
- Créer et gérer une boutique.
- Publier des produits.
- Gérer les produits.
- Découvrir les produits.
- Commander un produit.
- Suivre une commande.
- Gestion des commandes côté vendeur.
- Statuts et règles de commande.

### Jeux et Game Items
- Catalogue des jeux.
- Types d'items disponibles.
- Coins et monnaies virtuelles.
- Skins et équipements.
- Consulter un item.
- Demander ou acheter un item selon le parcours réellement disponible.
- Suivre une demande ou une transaction.
- Conditions et limites.

### Tournois
- Découvrir les tournois.
- Créer et gérer un tournoi.
- Organisateurs et permissions.
- Fonctionnement des éditions.
- Inscriptions et participants.
- Gestion des paiements.
- Phases et formats de compétition.
- Groupes et journées.
- Matchs et résultats.
- Brackets et éliminations.
- Classements et qualifications.
- Gestion des litiges et validations si disponibles.
- Règles spécifiques aux formats réellement implémentés.

### Équipes
- Création d'une équipe.
- Gestion des membres.
- Rôles et responsabilités.
- Gestion des invitations si disponible.

### Communauté
- Publications.
- Clips.
- Interactions et visibilité.
- Messagerie privée.
- Conversations de groupe.
- Notifications.
- Annonces.

### Autres fonctionnalités
- VIP et abonnements.
- Partenaires.
- Thèmes et personnalisation.
- Blog.
- Assistance et support.

Cette structure est indicative. Adapter les catégories et les pages à la cartographie issue de l'audit. Ne pas créer une page pour une fonctionnalité inexistante.

## 1.3 Qualité rédactionnelle

Chaque page doit être complète, claire et exploitable.

Lorsque cela est pertinent, utiliser cette structure :

1. Présentation.
2. Objectif et fonctionnement.
3. Conditions préalables.
4. Accès à la fonctionnalité.
5. Procédure détaillée.
6. Règles métier.
7. Statuts et cas particuliers.
8. Limites et restrictions.
9. Problèmes fréquents et solutions.
10. Fonctionnalités associées.

Éviter les textes génériques qui répètent simplement les mêmes informations dans toutes les pages.

Les informations doivent être exactes et cohérentes avec le code.

Ne jamais inventer :
- Des moyens de paiement.
- Des frais.
- Des garanties.
- Des délais.
- Des plafonds.
- Des avantages VIP.
- Des permissions.
- Des options de réservation.
- Des fonctionnalités qui ne sont pas disponibles.

Lorsque l'information dépend d'une configuration, documenter la valeur réellement configurée ou indiquer clairement qu'elle peut varier.

## 1.4 Design documentaire

Créer une expérience de lecture professionnelle, inspirée des meilleures documentations techniques et produits.

La documentation doit rester fidèle à l'identité Games-Trafics : gaming premium, moderne, lisible et soignée.

Améliorer :

- La page d'accueil `/docs`.
- La navigation latérale.
- Les catégories.
- Le header et le breadcrumb.
- Les pages de contenu.
- Le sommaire de chaque page.
- La navigation précédent/suivant.
- Les liens entre articles.
- Les encadrés informatifs.
- Les avertissements.
- Les prérequis.
- Les exemples.
- Les tableaux.
- Les listes et procédures.
- Les blocs de code lorsque nécessaires.

Prévoir des états :
- Article non trouvé.
- Catégorie vide.
- Recherche sans résultat.
- Chargement.
- Erreur de récupération.

Le contenu doit être parfaitement lisible sur mobile, tablette et desktop.

Vérifier les débordements, les largeurs, les menus et les éléments sticky avec l'AppShell existant.

Ne pas introduire de nouvelle bibliothèque lourde si les composants déjà disponibles suffisent.

## 1.5 Liens officiels

Les liens entre les pages de documentation doivent utiliser les véritables routes `/docs/...`.

Créer une navigation interne cohérente et vérifier que chaque lien pointe vers une page existante.

Les liens vers les guides interactifs doivent être utilisés lorsqu'un parcours étape par étape existe.

---

# PHASE 2 — REFONTE DES GUIDES INTERACTIFS

Les guides sont différents de la documentation.

- La documentation explique une fonctionnalité en profondeur.
- Le guide accompagne l'utilisateur dans l'exécution concrète d'une action.

Les guides utilisent actuellement les tables `guides` et `guide_steps`. Conserver cette architecture si elle répond aux besoins.

## 2.1 Audit des données existantes

Récupérer les guides existants depuis la base au moment de l'exécution du seed.

Ne jamais supposer que la base est vide.

Analyser :
- Les titres.
- Les descriptions.
- Les catégories.
- Les images.
- Les étapes.
- L'ordre des étapes.
- Les statuts de publication.
- Les compteurs de vues.
- Les dates.
- Les relations avec les administrateurs.

Conserver les données utiles et les guides déjà administrés.

## 2.2 Créer tous les guides importants

À partir de la cartographie fonctionnelle, déterminer les parcours qui méritent un guide.

Exemples à adapter au code :

- Bien démarrer sur Games-Trafics.
- Créer et compléter son profil.
- Sécuriser son compte.
- Comprendre le Wallet GTC.
- Effectuer un dépôt.
- Effectuer un retrait.
- Effectuer un transfert.
- Consulter ses transactions.
- Créer une boutique.
- Publier un produit.
- Acheter un produit.
- Gérer une commande.
- Découvrir et acheter un Game Item.
- Créer un tournoi.
- Créer une édition.
- Inscrire des participants.
- Organiser les phases et les groupes.
- Générer un bracket.
- Gérer les matchs et les résultats.
- Créer et gérer une équipe.
- Publier un clip.
- Créer une publication.
- Utiliser la messagerie.
- Gérer les notifications.
- Découvrir les avantages VIP.

Ne créer que les guides correspondant à des parcours réellement implémentés.

## 2.3 Qualité des étapes

Chaque guide doit être un véritable tutoriel.

Les étapes doivent :
- Être ordonnées.
- Être suffisamment détaillées.
- Décrire une action concrète.
- Expliquer le résultat attendu.
- Mentionner les éventuelles précautions.
- Utiliser un vocabulaire cohérent avec l'interface réelle.
- Être adaptées au rôle concerné.

Ne pas créer des guides constitués de deux ou trois phrases génériques.

Ajouter des captures ou illustrations uniquement lorsqu'elles apportent une réelle valeur. Ne pas fabriquer de fausses captures de l'application.

Si les captures réelles ne sont pas disponibles, utiliser des illustrations explicatives cohérentes et clairement identifiables comme illustrations.

## 2.4 Catégories et recherche

Aligner les catégories de guides entre :
- La page publique.
- Les formulaires d'administration.
- Les filtres.
- Les données seedées.

Éviter les catégories codées en dur à plusieurs endroits.

Mettre en place une recherche et des filtres réellement fonctionnels si les composants existent déjà.

## 2.5 Page détail d'un guide

Améliorer :
- Le titre et la description.
- La progression.
- La présentation des étapes.
- Les images.
- Les étapes terminées.
- Les boutons précédent/suivant.
- L'état de fin.
- Les guides associés.
- Le lien vers la documentation officielle correspondante.

Corriger toute récupération redondante des étapes et vérifier les mécanismes de cache et d'invalidation.

Le rendu du contenu doit supporter correctement les paragraphes, titres, listes et liens.

---

# PHASE 3 — REFONTE DES SERVICES `/services/**`

## 3.1 Positionnement fonctionnel

IMPORTANT : `/services` ne doit PAS devenir une seconde page de documentation ni un catalogue artificiel de fonctionnalités.

Cette section doit présenter clairement les prestations que l'utilisateur peut réellement obtenir ou demander auprès de Games-Trafics.

La distinction est la suivante :

- `/docs` explique les fonctionnalités de la plateforme.
- `/services` présente les prestations proposées ou accessibles à l'utilisateur.
- Les guides expliquent comment effectuer les actions dans l'application.

Un service doit répondre à ces questions :

1. Qu'est-ce que cette prestation ?
2. À qui s'adresse-t-elle ?
3. Qu'est-ce que l'utilisateur peut réellement obtenir ?
4. Que doit-il fournir ou préparer ?
5. Comment faire une demande ?
6. Quelles sont les conditions ?
7. Quelles sont les limites ?
8. Comment contacter Games-Trafics ou accéder au parcours réellement disponible ?
9. Quelle documentation officielle peut l'aider ?

## 3.2 Audit des services existants

Récupérer et analyser toutes les données existantes de la table `services`.

Examiner les pages :
- `/services`
- `/services/[id]`
- `/admin/services`
- `/admin/services/create`

Examiner aussi :
- `actions/services.ts`
- `hooks/use-services.ts`
- Les composants de cartes.
- Les formulaires.
- Les API.
- Les permissions d'administration.

Ne pas supprimer les services existants sans justification.

Corriger les descriptions qui présentent des offres inexistantes ou des garanties non vérifiées.

## 3.3 Contenus de services

Créer un ensemble cohérent de prestations réellement proposées ou pouvant être demandées.

Les catégories doivent être déterminées à partir des prestations effectivement présentes dans le projet et de l'offre réelle de Games-Trafics.

Exemples de pistes à vérifier, et non de fonctionnalités à inventer :

- Accompagnement à la création et à la configuration d'une boutique.
- Assistance à l'organisation d'un tournoi.
- Accompagnement pour la configuration d'une compétition.
- Assistance technique liée à l'utilisation de la plateforme.
- Accompagnement à la publication ou à la gestion de contenus gaming.
- Prestations gaming spécialisées uniquement si elles sont réellement proposées.

Ne pas créer artificiellement des prestations de coaching, boosting, réservation, freelance ou gestion de comptes si Games-Trafics ne les propose pas réellement.

Ne pas inventer de tarifs, de délais, de notes, d'avis, de garanties ou de disponibilité.

Si le prix ou le délai n'est pas défini, ne pas afficher de prix ou de délai fictif. Utiliser une formulation transparente telle que « Nous contacter pour étudier votre demande », uniquement si un vrai moyen de contact est disponible.

## 3.4 Parcours de demande

Pour chaque service, déterminer le parcours réellement disponible.

Si l'application dispose d'un formulaire ou d'une action de demande, le relier correctement.

Si elle ne dispose pas de système de commande ou de réservation :
- Ne pas créer de faux bouton « Commander ».
- Ne pas afficher de faux statut de réservation.
- Ne pas simuler une commande.
- Proposer un CTA de contact uniquement si une route ou un canal fonctionnel existe.
- Expliquer clairement comment soumettre une demande.

Ne pas développer un système de commande complet sans nécessité fonctionnelle et sans validation de l'architecture existante.

## 3.5 Liaison avec la documentation officielle

C'est une exigence importante.

Chaque service doit, lorsque c'est pertinent, renvoyer vers la documentation officielle correspondante.

Exemples :
- Un service d'accompagnement à la création de boutique renvoie vers `/docs/shops/...`.
- Un service d'accompagnement à l'organisation de tournoi renvoie vers `/docs/tournaments/...`.
- Une prestation d'assistance Wallet renvoie vers `/docs/transactions/...`.
- Une prestation liée aux Game Items renvoie vers la documentation officielle des Game Items.

Les liens doivent être vérifiés et ne jamais pointer vers une route inexistante.

Sur la page détail d'un service, prévoir une section explicite :

**Comprendre la fonctionnalité**

Une courte explication contextualisée, puis un lien du type :
« Consulter la documentation officielle ».

Ce lien doit mener à l'article qui explique réellement la fonctionnalité concernée.

Ne pas transformer cette section en duplication intégrale de la documentation.

## 3.6 Refonte UI/UX

Refondre la page `/services` et les pages détail.

Créer une expérience premium :
- Hero clair et pertinent.
- Présentation des prestations.
- Cartes cohérentes.
- Catégories réellement utilisées.
- Recherche fonctionnelle.
- Filtres fonctionnels.
- États vides et erreurs.
- CTA adaptés.
- Informations utiles.
- Liens vers la documentation.
- Responsive sur tous les écrans.

Supprimer les notes, garanties, badges et statistiques fictifs.

Ne pas afficher des notes 5.0, « vérifié », « sécurisé », « garanti », « 24h/7j » ou « 100 % satisfait » sans données ou preuve réelle.

Si le modèle `services` ne permet pas de représenter correctement les informations nécessaires, étudier les besoins avant de modifier le schéma.

Toute évolution du schéma doit être justifiée, minimale, migrée correctement et compatible avec les données existantes.

---

# PHASE 4 — SEED DES GUIDES ET SERVICES

Créer un seed de contenu dédié, par exemple :

`database/seed-guides-services.ts`

Adapter le nom et l'organisation aux conventions existantes.

## 4.1 Règles impératives

Le seed doit être :
- Idempotent.
- Non destructif.
- Compatible avec les données existantes.
- Exécutable sur une base déjà remplie.
- Adapté aux environnements de développement et de production.
- Facile à maintenir.

Ne jamais :
- Vider les tables.
- Supprimer tous les guides avant insertion.
- Supprimer les services administrés.
- Réinitialiser les compteurs de vues.
- Écraser des modifications éditoriales existantes.
- Créer des doublons à chaque exécution.

## 4.2 Récupération des données existantes

Au démarrage du seed :
1. Récupérer les guides existants.
2. Récupérer leurs étapes.
3. Récupérer les services existants.
4. Identifier les contenus déjà présents.
5. Comparer les contenus à ajouter.
6. Insérer uniquement les éléments manquants.

Prévoir une stratégie stable de détection des doublons.

Ne pas se baser uniquement sur les UUID générés.

Utiliser une clé stable ou un slug unique si le schéma le permet. Si ce n'est pas le cas, déterminer une stratégie de correspondance fiable et documentée.

## 4.3 Protection des contenus administrés

Les contenus seedés doivent pouvoir être distingués des contenus créés par l'administration.

Ne jamais écraser une description ou une image modifiée manuellement par un administrateur.

Si le schéma nécessite un champ `source`, `seedKey` ou équivalent, étudier l'impact avant de l'ajouter.

Ne pas multiplier les champs inutilement.

## 4.4 Administrateur associé

Les tables qui nécessitent un `adminId` doivent utiliser un véritable utilisateur administrateur existant.

Ne jamais inventer un identifiant d'utilisateur.

Si aucun administrateur n'existe :
- Afficher une erreur explicite.
- Ne pas créer de contenu avec un faux administrateur.
- Ne pas contourner les contraintes de clés étrangères.

## 4.5 Commande d'exécution

Ajouter une commande dédiée dans `package.json` en respectant les conventions existantes.

Documenter :
- La commande.
- Les variables d'environnement nécessaires.
- Le comportement idempotent.
- Les tables concernées.
- Les protections contre l'écrasement.

Tester deux exécutions successives : la seconde ne doit pas créer de doublons ni écraser les modifications manuelles.

---

# PHASE 5 — AUDIT ET REFACTORING DES UPLOADS

Composants principaux à analyser :

- `components/ui/advanced-upload.tsx`
- `components/ui/advanced-multi-upload.tsx`
- `components/ui/advanced-video-upload.tsx`
- `lib/upload.ts`
- `utils/image-upload-utils.ts`
- `app/api/upload/**`
- Les autres composants et hooks qui utilisent les uploads.
- Les intégrations Cloudinary.
- Les composants de sélection des médias internes.

L'objectif est de fiabiliser les uploads sans casser les API ni les formulaires existants.

## 5.1 Audit des usages

Rechercher tous les usages des composants d'upload dans le projet.

Pour chacun, identifier :
- Le type de média.
- Le nombre maximum.
- La taille maximale.
- Les formats acceptés.
- Le mode d'upload.
- Le comportement de compression.
- Le format des valeurs contrôlées.
- Le stockage cible.
- Les éventuels besoins de sélection d'images déjà présentes.

Ne pas modifier une signature publique sans analyser ses consommateurs.

Conserver la compatibilité avec les formulaires existants ou prévoir une migration complète.

## 5.2 Sélection multiple

La sélection multiple doit être entièrement fiable.

Corriger notamment les risques suivants :

- Le contrôle de `maxImages` doit inclure les images déjà sélectionnées et les fichiers en cours d'envoi.
- Plusieurs sélections rapides ne doivent jamais dépasser la limite.
- Deux lots envoyés simultanément ne doivent pas se remplacer.
- Les résultats doivent être fusionnés correctement.
- Les suppressions doivent rester synchronisées avec `value` et `onChange`.
- Les doublons doivent être évités lorsque c'est pertinent.
- Les fichiers invalides doivent être rejetés individuellement sans bloquer les autres fichiers valides.
- Les sélections répétées du même fichier doivent fonctionner correctement.
- Le composant doit gérer les valeurs contrôlées et les changements venant du parent.

Prévoir un système de file d'attente.

Limiter la concurrence des uploads à une valeur raisonnable et configurable si nécessaire.

Éviter de lancer un nombre illimité de requêtes en parallèle.

## 5.3 États des fichiers

Chaque fichier doit posséder un état clair :

- En attente.
- Validation.
- Compression.
- Upload.
- Terminé.
- Erreur.
- Annulé si l'annulation est supportée.

Afficher une progression compréhensible.

Ne pas afficher une progression artificielle qui prétend représenter le transfert réseau alors qu'elle ne mesure que la compression.

Si nécessaire, utiliser une méthode d'upload permettant une véritable progression réseau, compatible avec Cloudinary.

## 5.4 Gestion des erreurs et récupération

Prévoir :
- Erreurs de format.
- Taille dépassée.
- Limite maximale atteinte.
- Échec de compression.
- Échec réseau.
- Échec Cloudinary.
- Fichier invalide.
- Annulation.
- Réessai individuel.

Les messages doivent être explicites.

Ne pas faire disparaître les erreurs trop rapidement.

Permettre à l'utilisateur de comprendre et corriger le problème.

## 5.5 Ressources et mémoire

Gérer correctement :
- `URL.createObjectURL`.
- `URL.revokeObjectURL`.
- Les previews.
- Les références DOM.
- Les requêtes annulables.
- Le nettoyage au démontage.
- Les fichiers temporaires.

Ne pas conserver inutilement des objets File ou des URL temporaires après la fin de leur utilisation.

## 5.6 Upload vidéo

Examiner séparément `AdvancedVideoUpload`.

Vérifier :
- Les formats acceptés.
- La taille maximale.
- La durée maximale si elle existe.
- La génération ou sélection de miniature.
- La prévisualisation.
- La progression réelle.
- Les erreurs.
- La compatibilité mobile.
- La cohérence avec le système d'upload des images.

Ne pas imposer une fonctionnalité de conversion ou de traitement vidéo qui n'existe pas dans l'architecture actuelle.

## 5.7 Stockage et sécurité

Analyser les destinations d'upload.

Cloudinary doit être utilisé conformément à la configuration existante.

Examiner le stockage local de `/api/upload`, notamment son comportement en production sur un environnement à système de fichiers éphémère.

Vérifier :
- Les contrôles de type MIME.
- Les extensions.
- Les tailles.
- Les noms de fichiers.
- Les permissions.
- Les chemins.
- Les paramètres Cloudinary.
- Les signatures et variables sensibles.
- Les protections contre les uploads non autorisés.

Ne jamais exposer de secret Cloudinary côté client.

Ne pas conserver un stockage local présenté comme permanent si l'environnement ne le garantit pas.

## 5.8 Responsive et design

Utiliser `hooks/use-screen.ts` lorsqu'il est pertinent.

Le hook existant expose les informations de taille d'écran et de breakpoint. Vérifier ses conventions avant utilisation.

Ne pas créer un second système de détection responsive.

Privilégier Tailwind pour les adaptations de layout.

Les composants doivent fonctionner de manière cohérente sur :
- Petits mobiles.
- Mobiles standards.
- Grands mobiles.
- Tablettes.
- Ordinateurs.
- Très grands écrans.

Prévoir :
- Zone de sélection facile à utiliser au tactile.
- Aperçus adaptatifs.
- Grille d'images responsive.
- Barre d'actions accessible.
- Dialog ou Drawer adapté à l'écran.
- Pas de débordement horizontal involontaire.
- Pas de boutons coupés.
- Pas de textes superposés.
- Pas de zones interactives trop petites.

Conserver une expérience gaming premium, avec les couleurs, surfaces et composants de Games-Trafics.

Ne pas surcharger visuellement les composants.

---

# PHASE 6 — IMAGE PNG PAR DÉFAUT POUR LES UPLOADS

Créer une illustration originale Games-Trafics destinée à être utilisée comme image par défaut dans les composants d'upload.

Cette image doit être un véritable fichier PNG exploitable dans le projet.

## Direction artistique

- Identité Games-Trafics.
- Univers gaming / e-sport.
- Aspect premium.
- Illustration 3D ou rendu 3D.
- Éléments visuels liés aux médias et à la création de contenu.
- Éclairage et profondeur maîtrisés.
- Composition propre.
- Bonne lisibilité sur fond clair et fond sombre.
- Pas de texte illisible généré.
- Pas de faux logo déformé.
- Pas de surcharge d'éléments.

Le visuel doit fonctionner dans un composant de sélection d'image vide.

Prévoir un fichier source et un format optimisé si nécessaire.

Emplacement suggéré :

`public/images/placeholders/games-trafics-upload.png`

Adapter le chemin à l'organisation réelle des assets.

Utiliser ce visuel par défaut uniquement lorsque l'utilisateur n'a fourni aucun média et qu'aucune miniature ou image pertinente n'est disponible.

Ne jamais remplacer l'aperçu d'un fichier déjà sélectionné par ce placeholder.

Prévoir un rendu cohérent pour :
- Upload simple.
- Upload multiple.
- Upload vidéo.

Pour la vidéo, le placeholder doit rester un placeholder visuel et ne doit jamais être interprété comme un fichier vidéo.

---

# PHASE 7 — COHÉRENCE GLOBALE ET INTÉGRATION

Vérifier la cohérence entre :
- Documentation officielle.
- Guides interactifs.
- Services.
- Pages publiques.
- Pages d'administration.
- Actions serveur.
- Hooks.
- Schémas.
- Navigation.

Les trois espaces doivent se compléter :

**Documentation :** comprendre la fonctionnalité.

**Guide :** apprendre à effectuer une action.

**Service :** découvrir une prestation que l'utilisateur peut réellement obtenir ou demander.

Lorsqu'un service concerne une fonctionnalité de la plateforme, il doit proposer un lien vers l'article documentaire correspondant.

Ne pas dupliquer la documentation dans les pages de services.

Ne pas transformer une fonctionnalité gratuite ou native de la plateforme en prestation payante sans preuve dans le modèle commercial.

Vérifier les routes et les liens internes.

---

# PHASE 8 — TESTS ET VALIDATION

Effectuer les vérifications suivantes :

## Documentation
- Toutes les pages sont accessibles.
- Aucun lien interne cassé.
- Les catégories et menus sont cohérents.
- Les pages MDX sont correctement interprétées.
- Le sommaire fonctionne.
- Les états vides et erreurs sont corrects.
- La navigation mobile est utilisable.

## Guides
- Les guides existants sont conservés.
- Les nouveaux guides sont correctement insérés.
- Les étapes sont ordonnées.
- Aucun doublon après plusieurs exécutions du seed.
- La progression fonctionne.
- Les images s'affichent.
- Les liens vers la documentation fonctionnent.

## Services
- Les prestations affichées sont réellement disponibles ou demandables.
- Les textes ne contiennent aucune promesse inventée.
- Les filtres et recherches fonctionnent.
- Les pages détail sont cohérentes.
- Les CTA fonctionnent réellement.
- Les liens vers la documentation officielle sont valides.

## Uploads
- Sélection simple.
- Sélection multiple.
- Plusieurs lots successifs.
- Sélections rapides.
- Limite maximale.
- Suppression d'un fichier.
- Échec individuel.
- Réessai.
- Upload vidéo.
- Prévisualisation.
- Nettoyage des URL temporaires.
- Responsive.
- Gestion des erreurs réseau.

## Qualité du projet
- TypeScript.
- ESLint.
- Build Next.js.
- Tests unitaires pertinents.
- Vérification des imports.
- Vérification des routes.
- Vérification des migrations si le schéma évolue.

Corriger les erreurs introduites par les modifications.

Ne pas masquer les erreurs préexistantes en désactivant les règles TypeScript, ESLint ou les tests.

---

# PHASE 9 — LIVRABLES ET RAPPORT FINAL

À la fin du travail, fournir un rapport précis avec :

1. Les fonctionnalités réellement analysées.
2. Les pages de documentation créées ou mises à jour.
3. Les guides ajoutés et leurs étapes.
4. Les services ajoutés ou corrigés.
5. Les liens entre services et documentation.
6. Les modifications apportées au seed.
7. Les protections contre les doublons et l'écrasement.
8. Les composants d'upload corrigés.
9. Les améliorations de sélection multiple.
10. Les améliorations responsive.
11. Le fichier PNG créé et son emplacement.
12. Les éventuelles migrations.
13. Les commandes à exécuter.
14. Les tests effectués et leurs résultats.
15. Les limites qui restent à traiter.

Ne pas annoncer une fonctionnalité comme terminée si elle n'a pas été implémentée et vérifiée.

---

# CONSIGNES ABSOLUES

- Travailler sur le code réel du projet fourni.
- Ne pas se limiter à l'analyse superficielle des pages.
- Ne pas inventer des fonctionnalités.
- Ne pas inventer des services commerciaux.
- Ne pas inventer des prix, délais, garanties ou statistiques.
- Ne pas supprimer les données existantes.
- Ne pas écraser les contenus administrés.
- Ne pas créer de faux parcours de commande ou de réservation.
- Ne pas dupliquer inutilement les fonctionnalités.
- Ne pas créer une nouvelle architecture si l'existante peut être améliorée proprement.
- Respecter les conventions Games-Trafics.
- Réutiliser les composants existants lorsqu'ils sont adaptés.
- Utiliser les types réels et éviter `any`.
- Préserver les fonctionnalités déjà opérationnelles.
- Tester les changements sur les petits et grands écrans.
- Garder un code propre, modulaire, maintenable et prêt pour la production.

**Priorité absolue : fidélité fonctionnelle, qualité du contenu, fiabilité des données, expérience utilisateur et cohérence visuelle Games-Trafics.**

Ne pas s'arrêter après le rapport d'audit : effectuer réellement les corrections et livrer les fonctionnalités terminées.