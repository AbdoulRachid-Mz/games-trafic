# Design par catégorie de page

Objectif : personnalité propre par usage, **langage graphique unique** (mêmes tokens, rayons, espacements, états).

## A. Tournois et compétitions

**Identité : compétition / e-sport.**

À faire ressortir dans l'ordre :
1. Nom du tournoi, jeu, statut (badge).
2. Organisateur, dates, participants.
3. Indicateurs de progression (phases, matchs joués, avancement).
4. Actions distinctes : « Participer » (utilisateur) vs « Gérer » (organisateur/admin).
5. Phases, groupes, matchs, classements.

Règles :
- Le statut est toujours visible sans scroll (badge dans le header).
- Hiérarchie claire entre information sportive et action administrative : les actions admin ne dominent pas la vue participant.
- Les cartes de tournoi utilisent `components/cards/tournament-card.tsx` ; ne pas recréer une vignette locale.
- Les phases/groupes/matchs réutilisent `phase-card`, `group-card`, `match-card` avec `viewMode` et `onView`.

## B. Éditions et gestion de compétition

**Identité : organisation / suivi.**

À faire ressortir :
- En-tête d'édition + navigation entre sections (tabs sticky dynamiques).
- Indicateurs financiers et statistiques (inscriptions, paiements, frais).
- Participants (table dense + vue cartes mobile), phases/groupes, matchs/results, classements.
- Actions de gestion : organiser, générer, publier, révéler, exporter.
- États de progression et de qualification lisibles d'un coup d'œil.

Règles :
- `resolveRoute()` reste la source de vérité de la configuration de route ; le store App Shell rend l'état observable.
- Les actions de tirage/révélation sont des **visualisations d'une structure déjà persistée serveur** : jamais de tirage client, jamais `sort(() => Math.random() - 0.5)`.
- La 3e place est une option explicite et persistée (`thirdPlaceMatch`), générée depuis les perdants des demi-finales, sans doublon, compatible anciennes phases.
- Résultats : déverrouillage organisateur/admin côté UI **et** vérification serveur obligatoire ; pas de double progression.
- Filtres (statut, phase, groupe, recherche) synchronisés URL ; reset pagination au changement.

## C. Dashboards

**Identité : pilotage.**

À faire ressortir :
- KPI en haut (stats-card), graphiques (recharts), activité récente, actions rapides.
- Informations importantes avant sections secondaires.
- Navigation contextuelle cohérente avec l'édition/tournoi courant.

Règles :
- Éviter l'assemblage de cartes toutes identiques : varier la **densité** (KPI compact, graphique large, activité en liste) sans varier les tokens.
- Le dashboard de matchs affiche les **vraies données avec relations participantes** (`getMatchesWithParticipants`) ; une erreur != une liste vide.
- Boutons de navigation rapide (« Voir tous les matchs », « Calendrier complet ») dans le header.
- Vérifier les hauteurs : le contenu ne doit pas être masqué par top-middle, breadcrumbs ou dock flottant.

## D. Marketplace

**Identité : découverte / achat.**

À faire ressortir :
- Visuel produit en premier, puis nom, prix, badges (vedette, statut), vendeur/boutique.
- Filtres et recherche persistants, pagination fiable.
- Actions d'achat et de consultation claires ; prix lisible.
- États de chargement et résultats vides soignés.

Règles :
- `ProductCard` est la carte de référence (grid/list/compact). Harmoniser les autres cards produits avec elle.
- Prix en `text-primary`, montant formatté, devise explicite (`GTC` par défaut).
- Badges de statut centralisés via `productStatusLabel` ; éviter les couleurs divergentes d'une page à l'autre.
- Les exports documentaires passent par `actions/documents.ts` + `downloadDocument` (ou `ShopExportButton` là où déjà utilisé) — ne pas dupliquer la logique d'export.

## E. Jeux (Games)

**Identité : univers gaming.**

À faire ressortir :
- Illustrations/logo du jeu, titre, description, catégories.
- Statistiques (produits, boutiques, joueurs) et navigation vers les contenus associés.

Règles :
- `GameCard` est la carte de référence ; garder le même ratio d'image et le même rayon que les autres cards média.
- Les visuels utilisent `components/shared/image.tsx` / `next/image` avec `sizes` adaptés et fallback.
- Pas d'illustration générée pour remplacer une donnée réelle manquante : utiliser les assets officiels `public/icons/gt-*.png` et les placeholders validés.

## F. Transactions, admin, profils, autres espaces

Mêmes principes que ci-dessus, avec ces contraintes :

- **Transactions** : étapes lisibles (`transaction-*` classes), statut sans ambiguïté, actions de confirmation explicites.
- **Admin** : densité acceptable, mais actions dangereuses clairement séparées et confirmées.
- **Profil** : avatar, informations personnelles, préférences de thème via `ThemeToggle` uniquement.
- **Boutiques** : fiche vendeur cohérente avec `ShopCard` ; éviter les prix et badges divergents.

## Règle transversale de composition

| Catégorie | Densité | Mise en avant | Action principale |
|---|---|---|---|
| Tournoi | moyenne | statut + progression | Participer / Gérer |
| Édition | élevée | état + indicateurs | Organiser / Publier |
| Dashboard | moyenne | KPI + graphiques | Navigation rapide |
| Marketplace | visuelle | image + prix | Acheter |
| Game | visuelle | illustration + catégories | Explorer |
| Admin | élevée | état + risque | Valider / Corriger |

Changer la densité, pas le langage visuel.
