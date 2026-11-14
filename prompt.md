# AUDIT, COMPLÉTION ET REFONTE COMPLÈTE DES RESSOURCES PUBLIQUES — GAMES TRAFICS

## 1. Objectif général

Effectuer un audit approfondi et une refonte complète de l'environnement des ressources publiques de **Games Trafics**.

Le travail ne consiste pas simplement à ajouter quelques images ou à déplacer des fichiers. Il faut analyser tout ce qui existe déjà dans le projet, identifier les ressources produites par les précédents agents, retrouver les anciennes ressources toujours pertinentes, déterminer les besoins réels de l'application, compléter les éléments manquants et construire une bibliothèque de ressources propre, cohérente, organisée et adaptée à une application gaming moderne.

Le périmètre concerne notamment :

- Images et illustrations.
- Logos et identité visuelle.
- Icônes et pictogrammes.
- SVG.
- Vidéos et animations.
- Images de jeux et ressources associées.
- Placeholders et états vides.
- Bannières, couvertures et arrière-plans.
- Polices et autres ressources statiques.
- Tous les autres fichiers présents dans `public/`.

**Règle fondamentale : ne rien recréer inutilement, ne rien supprimer sans vérification et ne pas considérer le travail terminé tant que les ressources ne sont pas réellement intégrées dans l'application.**

---

## 2. Phase 1 — Audit exhaustif de l'existant

Commencer par examiner l'intégralité du projet et particulièrement le dossier `public/`.

### 2.1. Inventaire récursif

Parcourir tous les dossiers et sous-dossiers, sans exception.

Pour chaque ressource, identifier :

- Son chemin actuel.
- Son nom et son extension.
- Sa catégorie.
- Ses dimensions lorsqu'il s'agit d'une image.
- Son poids.
- Son éventuel rôle dans l'application.
- Son utilisation effective dans le code.
- Son état : utilisée, inutilisée, dupliquée, obsolète ou à conserver.
- Son éventuelle appartenance à une identité graphique ou à une fonctionnalité particulière.

Analyser les formats suivants, entre autres :

`png`, `jpg`, `jpeg`, `webp`, `avif`, `gif`, `svg`, `ico`, `mp4`, `webm`, `mov`, `woff`, `woff2`, `ttf`, `otf`.

Ne pas se limiter à une simple liste de fichiers. Il faut comprendre leur utilité.

### 2.2. Examiner les ressources historiques

Retrouver et analyser les ressources présentes depuis les premières versions du projet.

Il faut notamment identifier :

- Les anciens logos et variantes.
- Les anciennes illustrations.
- Les images de jeux.
- Les icônes personnalisées.
- Les images utilisées dans les pages publiques.
- Les ressources conservées dans des dossiers historiques.
- Les éventuels éléments graphiques encore utilisés indirectement.

Ne pas supprimer automatiquement une ancienne ressource sous prétexte qu'elle semble dépassée. Vérifier si elle possède encore une utilité fonctionnelle ou visuelle.

### 2.3. Examiner les ressources créées par les agents

Identifier précisément les ressources produites par les précédents agents.

Comparer les résultats obtenus aux besoins réels de l'application.

Déterminer :

- Ce qui a effectivement été créé.
- Ce qui est incomplet.
- Ce qui manque totalement.
- Ce qui existe en plusieurs versions.
- Ce qui n'a jamais été intégré.
- Ce qui ne respecte pas l'identité visuelle de Games Trafics.
- Ce qui nécessite une amélioration ou un remplacement.

Ne pas supposer qu'une tâche est terminée parce que son agent a créé quelques fichiers.

---

## 3. Phase 2 — Audit des besoins de toute l'application

L'objectif est de connaître les ressources réellement nécessaires à Games Trafics.

Parcourir les pages, composants, fonctionnalités et parcours utilisateurs.

Examiner notamment :

### Identité visuelle
- Logo principal.
- Logo secondaire.
- Logo compact.
- Variantes adaptées aux fonds clairs et sombres.
- Favicon.
- Icône PWA.
- Images de marque.
- Éventuels éléments décoratifs de marque.

### Authentification et profils
- Illustrations des pages de connexion et d'inscription.
- Avatars par défaut.
- Placeholders de profil.
- Illustrations d'états vides.
- Éléments graphiques liés aux comptes VIP et aux statuts.

### Marketplace et boutiques
- Images par défaut des produits.
- Illustrations des catégories.
- Ressources des différents jeux.
- Placeholders de boutiques.
- Illustrations des produits indisponibles.
- Visuels de présentation et de promotion.

### Jeux
Créer ou compléter les ressources nécessaires aux jeux effectivement pris en charge dans l'application, notamment :

- eFootball.
- Call of Duty Mobile.
- FC Mobile.

Examiner également les autres jeux réellement présents dans les fonctionnalités ou les données du projet.

### Tournois
- Illustrations des tournois.
- Bannières.
- Visuels des compétitions.
- Icônes des phases et formats.
- Illustrations des groupes et matchs.
- Ressources des classements et podiums.
- Visuels des trophées et récompenses.

### Clips et médias
- Placeholders vidéo.
- Miniatures par défaut.
- Illustrations des médias indisponibles.
- Ressources des lecteurs vidéo.
- États de chargement et d'erreur.

### Communauté et interactions
- Illustrations des publications.
- Avatars.
- Icônes sociales.
- Réactions.
- Notifications.
- Messages et conversations.
- États vides des discussions.

### Wallet et transactions
- Icônes des opérations.
- Moyens de paiement réellement pris en charge.
- Illustrations des transactions.
- Visuels des différents statuts.
- Ressources des documents et reçus si nécessaires.

### Autres pages
Examiner également les tableaux de bord, paramètres, pages d'administration, pages d'aide, notifications, services, pages publiques, erreurs, résultats de recherche et toutes les autres fonctionnalités existantes.

**Ne pas créer de ressources fictives pour des fonctionnalités absentes du projet. L'inventaire des besoins doit être fondé sur le code et les fonctionnalités réelles.**

---

## 4. Phase 3 — Établir une architecture publique cohérente

Après l'audit, proposer puis mettre en place une organisation claire de `public/`.

La structure doit être logique, évolutive et facile à maintenir.

Voici une architecture indicative à adapter aux besoins réellement constatés :

```text
public/
├── images/
│   ├── brand/
│   ├── placeholders/
│   ├── illustrations/
│   ├── games/
│   │   ├── efootball/
│   │   ├── cod-mobile/
│   │   └── fc-mobile/
│   ├── marketplace/
│   ├── tournaments/
│   ├── community/
│   ├── profiles/
│   ├── banners/
│   ├── backgrounds/
│   └── misc/
│
├── icons/
│   ├── games/
│   ├── payments/
│   ├── social/
│   ├── status/
│   └── custom/
│
├── svg/
│   ├── brand/
│   ├── illustrations/
│   ├── decorative/
│   └── custom/
│
├── videos/
│   ├── previews/
│   ├── backgrounds/
│   └── tutorials/
│
├── fonts/
│
└── favicon.ico
```

Cette structure est une proposition de départ, pas une obligation de reproduire exactement ces dossiers.

Adapter les catégories selon les besoins identifiés.

Éviter les dossiers inutiles, les catégories vides sans justification et les niveaux d'imbrication excessifs.

### Conventions de nommage

Adopter des noms :

- Explicites.
- Cohérents.
- En minuscules.
- Sans espaces.
- Sans accents.
- Avec des tirets lorsque nécessaire.
- Sans suffixes ambigus comme `final2`, `new-final`, `copy`, `test`.

Exemples :

```text
games/
  efootball-logo.webp
  cod-mobile-logo.webp
  fc-mobile-logo.webp

placeholders/
  image-upload.webp
  video-upload.webp
  empty-products.webp
  empty-tournaments.webp

brand/
  games-trafics-logo.svg
  games-trafics-mark.svg
```

Éviter de mélanger les logos, les illustrations, les icônes et les images de contenu dans un même dossier.

---

## 5. Phase 4 — Compléter toutes les ressources manquantes

Après l'inventaire et la définition de l'architecture, produire les ressources manquantes.

Il faut privilégier des ressources originales, propres à Games Trafics et adaptées à son identité graphique.

### 5.1. Direction artistique

Respecter l'identité existante de Games Trafics :

- Univers gaming premium.
- Esthétique moderne.
- Palette violette et verte déjà utilisée dans le projet.
- Éléments graphiques sobres et élégants.
- Contrastes maîtrisés.
- Design propre, lisible et professionnel.
- Cohérence entre les modes clair et sombre.
- Pas d'accumulation inutile d'effets lumineux.
- Pas d'illustrations excessivement chargées.

Les illustrations doivent être conçues pour leur contexte d'utilisation réel.

Ne pas utiliser une seule illustration générique partout.

### 5.2. Images d'upload

Une attention particulière doit être accordée aux images d'upload.

Une illustration minimaliste a déjà été générée pour Games Trafics : une manette gaming 3D, un symbole de transfert vers le cloud et un éclairage violet/bleu discret.

Retrouver et réutiliser cette direction visuelle lorsqu'elle est disponible.

Créer les variantes nécessaires :

- Upload d'une image.
- Upload de plusieurs images.
- Upload d'une vidéo.
- État sans média.
- État de chargement, si une illustration dédiée est pertinente.

Les variantes doivent appartenir à la même famille graphique.

Éviter les compositions surchargées, les textes intégrés aux illustrations et les éléments décoratifs sans utilité.

### 5.3. Illustrations des états vides

Créer les illustrations réellement nécessaires pour les fonctionnalités concernées :

- Aucun produit.
- Aucune boutique.
- Aucun tournoi.
- Aucun match.
- Aucun clip.
- Aucune publication.
- Aucune conversation.
- Aucune notification.
- Aucun résultat.
- Aucune transaction.

Ne pas créer des dizaines de variantes redondantes. Une illustration doit correspondre à un contexte précis et pouvoir être réutilisée intelligemment.

### 5.4. Qualité des images

Pour chaque image :

- Choisir un format adapté à son usage.
- Respecter les proportions.
- Éviter les dimensions inutilement élevées.
- Préférer WebP ou AVIF lorsque cela est pertinent.
- Préserver une qualité visuelle suffisante.
- Éviter les arrière-plans non désirés.
- Éviter les images floues, pixelisées ou déformées.
- Respecter les contraintes de transparence lorsque nécessaire.

Ne pas remplacer une image de marque par une simple capture ou une image générique.

Respecter les droits d'utilisation des ressources provenant de tiers.

---

## 6. Phase 5 — Construire une bibliothèque SVG complète

C'est un point majeur de cette correction.

Il faut créer un véritable ensemble d'icônes et d'illustrations SVG personnalisées pour Games Trafics.

### 6.1. Audit préalable

Avant de créer des SVG :

- Identifier la bibliothèque d'icônes déjà installée.
- Identifier les icônes déjà utilisées dans les composants.
- Repérer les icônes manquantes.
- Repérer les SVG existants.
- Éviter les doublons avec les icônes de bibliothèque.

Les icônes fonctionnelles génériques peuvent continuer à utiliser la bibliothèque existante si elle répond correctement au besoin.

Les SVG personnalisés doivent couvrir en priorité les besoins propres à Games Trafics.

### 6.2. Catégories d'icônes à examiner

Créer les icônes nécessaires selon les fonctionnalités réellement présentes :

**Identité et navigation**
- Logo et symbole Games Trafics.
- Éléments de navigation propres à la marque.
- Icônes de sections personnalisées.

**Gaming**
- Jeux.
- Manette.
- Contrôleur.
- Consoles.
- Compétitions.
- Récompenses.
- Trophées.
- Classements.
- Équipes.

**Marketplace**
- Produits.
- Boutiques.
- Vendeurs.
- Achats.
- Ventes.
- Catalogue.

**Wallet**
- Portefeuille.
- Dépôt.
- Retrait.
- Paiement.
- Transactions.
- Solde.

**Communauté**
- Clips.
- Publications.
- Discussions.
- Groupes.
- Réactions.
- Partage.

**Statuts**
- VIP.
- Vérifié.
- En attente.
- Réussi.
- Échoué.
- Annulé.
- En cours.

Cette liste est indicative : vérifier chaque besoin dans le code avant de produire les fichiers.

### 6.3. Règles de qualité SVG

Tous les SVG doivent :

- Être valides.
- Être propres et optimisés.
- Utiliser `viewBox`.
- Être redimensionnables.
- Ne pas dépendre de dimensions fixes inutiles.
- Utiliser des couleurs compatibles avec le contexte lorsque nécessaire.
- Éviter les styles inline excessifs.
- Être accessibles lorsque utilisés comme éléments informatifs.
- Permettre une intégration simple dans React/Next.js.

Privilégier `currentColor` pour les icônes monochromes afin de faciliter leur adaptation aux thèmes clair et sombre.

Éviter les SVG inutilement complexes et les énormes fichiers générés par des outils graphiques.

Ne pas transformer toutes les icônes de la bibliothèque existante en fichiers SVG locaux sans raison.

---

## 7. Phase 6 — Réorganiser et migrer toutes les ressources

Une fois l'architecture définie et les ressources manquantes créées, déplacer les fichiers vers les emplacements appropriés.

Attention : un déplacement de fichier peut casser de nombreux composants.

Effectuer une recherche globale dans le projet pour retrouver toutes les références aux ressources concernées :

- Chemins `/images/...`.
- Chemins `/icons/...`.
- Chemins `/svg/...`.
- Imports statiques.
- Imports dynamiques.
- `next/image`.
- Balises `img`.
- Backgrounds CSS.
- Variables de configuration.
- Manifestes PWA.
- Métadonnées.
- Pages de partage.
- Composants d'upload.
- Composants de visualisation.
- Données statiques et configurations.

Mettre à jour toutes les références après les déplacements.

Ne pas laisser de chemins cassés, de références vers les anciens dossiers ou de duplications temporaires.

### Centralisation des ressources

Si cela apporte une réelle valeur au projet, créer un point central de référencement des ressources.

Par exemple :

```text
src/
  config/
    assets.ts
```

Ce fichier pourra centraliser les chemins des ressources réutilisées dans plusieurs endroits :

```ts
export const ASSETS = {
  brand: {
    logo: "/images/brand/games-trafics-logo.svg",
    mark: "/images/brand/games-trafics-mark.svg",
  },
  placeholders: {
    imageUpload: "/images/placeholders/image-upload.webp",
    videoUpload: "/images/placeholders/video-upload.webp",
  },
};
```

Adapter cet exemple à l'architecture existante.

Ne pas centraliser artificiellement toutes les ressources si cela rend le code plus complexe.

---

## 8. Phase 7 — Nettoyage approfondi

Après la migration, effectuer un nettoyage de tous les dossiers et fichiers publics.

Identifier :

- Les doublons exacts.
- Les images quasi identiques.
- Les anciennes variantes inutilisées.
- Les fichiers temporaires.
- Les fichiers de test.
- Les ressources orphelines.
- Les dossiers vides inutiles.
- Les anciennes structures remplacées.
- Les fichiers qui ne servent plus à aucune fonctionnalité.

Avant toute suppression :

1. Vérifier les références dans tout le projet.
2. Vérifier les références indirectes.
3. Vérifier les usages dynamiques.
4. Vérifier les références dans les configurations.
5. Vérifier les éventuelles références externes ou publiques.

Ne pas supprimer un fichier uniquement parce qu'une recherche textuelle simple ne trouve pas son chemin.

En cas de doute, conserver le fichier et le signaler dans le rapport final.

Ne jamais supprimer les ressources nécessaires au fonctionnement de Next.js, de la PWA, des métadonnées ou d'autres dépendances.

---

## 9. Phase 8 — Réajustement de toute l'application

Le travail ne s'arrête pas à `public/`.

Examiner les composants qui utilisent les ressources afin de garantir une intégration homogène.

Vérifier particulièrement :

- Les composants d'upload.
- Les avatars et profils.
- Les cartes produits.
- Les cartes boutiques.
- Les cartes tournois.
- Les cartes matchs.
- Les clips.
- Les publications.
- Les conversations.
- Les notifications.
- Les pages de dashboard.
- Les états vides.
- Les loaders.
- Les pages d'erreur.
- Les métadonnées et favicons.
- Les écrans mobiles et desktop.

Corriger les ressources manquantes, les mauvais ratios, les images déformées, les arrière-plans inadaptés et les incohérences visuelles.

Utiliser correctement les mécanismes de chargement d'images de Next.js.

Vérifier également les règles de configuration des images distantes : ne pas introduire de domaines arbitraires ou de configuration inutile.

Les ressources doivent être réellement intégrées et utilisées là où elles sont nécessaires.

---

## 10. Phase 9 — Optimisation des médias

Examiner les performances de chargement.

### Images
- Éviter les images trop lourdes.
- Utiliser les formats adaptés.
- Réduire les dimensions excessives.
- Préserver la qualité.
- Utiliser le lazy loading lorsque pertinent.
- Prioriser uniquement les images réellement critiques.

### SVG
- Nettoyer les métadonnées inutiles.
- Réduire la complexité.
- Préserver la qualité vectorielle.
- Éviter les répétitions inutiles.

### Vidéos
- Éviter les vidéos volumineuses dans les pages qui n'en ont pas besoin.
- Utiliser des formats adaptés au navigateur.
- Prévoir des posters lorsque nécessaire.
- Vérifier les attributs de lecture et de chargement.
- Éviter le chargement automatique des vidéos lourdes sans justification.

Ne pas dégrader la qualité visuelle dans le seul but de réduire la taille des fichiers.

---

## 11. Phase 10 — Vérifications et critères de validation

À la fin, effectuer une vérification complète.

### Vérifications techniques
- Aucune référence locale cassée.
- Aucun import invalide.
- Aucun chemin obsolète.
- Aucun fichier essentiel supprimé.
- Aucun SVG invalide.
- Aucune erreur de build liée aux ressources.
- Aucun problème de métadonnées ou favicon.
- Aucun problème de chargement d'image.
- Aucun problème de compilation TypeScript.

### Vérifications visuelles
- Mode clair.
- Mode sombre.
- Mobile.
- Tablette.
- Desktop.
- Pages publiques.
- Pages authentifiées.
- Pages d'administration.
- États vides.
- Uploads.
- Médias.

### Vérifications de qualité
- Nommage cohérent.
- Arborescence logique.
- Absence de doublons inutiles.
- Ressources bien catégorisées.
- SVG personnalisés cohérents.
- Images alignées avec l'identité de Games Trafics.

Exécuter les commandes de vérification déjà prévues dans le projet : lint, typecheck, tests et build, selon les scripts disponibles.

Ne pas contourner les erreurs en désactivant les contrôles ou en masquant les avertissements.

---

## 12. Rapport final obligatoire

À la fin, fournir un rapport précis qui présente :

### A. Audit initial
- Nombre total de ressources trouvées.
- Nombre d'images.
- Nombre de SVG.
- Nombre d'icônes.
- Nombre de vidéos.
- Nombre d'autres fichiers.
- Ressources historiques conservées.
- Ressources produites par les agents.
- Ressources manquantes identifiées.

### B. Travail réalisé
- Ressources réutilisées.
- Ressources créées.
- Ressources optimisées.
- Ressources déplacées.
- Ressources supprimées.
- Dossiers supprimés.
- Dossiers créés.
- Composants et pages mis à jour.

### C. Architecture finale
Présenter l'arborescence finale complète de `public/`, avec une brève description des catégories.

### D. Intégration
Présenter les principales références et composants modifiés, ainsi que les éventuels points nécessitant une intervention complémentaire.

### E. Vérifications
Indiquer les résultats réels du lint, du typecheck, des tests et du build.

Ne jamais annoncer qu'une vérification a réussi si elle n'a pas été exécutée.

### F. Ressources restantes
Signaler les ressources conservées volontairement parce que leur suppression n'était pas suffisamment sûre.

---

## 13. Consignes impératives

1. Analyser avant de modifier.
2. Examiner récursivement tous les dossiers publics et leurs sous-dossiers.
3. Comparer les ressources historiques avec celles produites par les agents.
4. Identifier les besoins à partir des fonctionnalités réelles.
5. Ne pas recréer inutilement les ressources existantes.
6. Compléter les ressources réellement manquantes.
7. Respecter strictement l'identité visuelle Games Trafics.
8. Construire une bibliothèque SVG cohérente et utile.
9. Réorganiser toutes les ressources par catégorie.
10. Mettre à jour toutes les références dans l'ensemble du projet.
11. Nettoyer les anciens dossiers uniquement après vérification.
12. Ne pas supprimer les ressources essentielles ou potentiellement utilisées dynamiquement.
13. Ne pas introduire de dépendances inutiles.
14. Ne pas modifier les fonctionnalités métier sans nécessité.
15. Ne pas laisser de migration incomplète.
16. Ne pas se contenter de créer des fichiers : les intégrer réellement dans l'application.
17. Ne pas déclarer le travail terminé sans vérifications techniques.

**Résultat attendu :** Games Trafics doit disposer d'un environnement public entièrement audité, complété, optimisé, organisé et cohérent. Chaque ressource doit avoir une catégorie, un nom explicite, une raison d'exister et une utilisation claire. L'ensemble doit pouvoir évoluer facilement sans accumuler des fichiers désorganisés, des doublons ou des ressources inutilisées.

Commence par l'audit complet du dépôt et de son historique disponible, puis réalise la correction de bout en bout. Ne t'arrête pas à un simple rapport d'analyse : exécute effectivement les modifications nécessaires.