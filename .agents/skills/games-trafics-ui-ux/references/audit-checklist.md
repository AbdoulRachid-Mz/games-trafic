# Grille d'audit UI/UX

Utiliser cette grille **avant** toute modification. Chaque item doit être vérifié dans le code ou dans le navigateur, pas supposé.

## 1. Structure et responsive (priorité 1)

- [ ] `scrollWidth <= innerWidth` à 320, 375, 425, 768, 1024, 1280, 1440, 1920
- [ ] Grilles : 1 col mobile → 2 col sm → 3 col lg ; `min-w-0` sur enfants flex
- [ ] Tables : `overflow-x-auto`, `min-w-[720px]`, colonnes secondaires masquées sous `sm`
- [ ] Vue cartes mobile présente pour les tables de données essentielles
- [ ] Dialogs/sheets : `max-w-[calc(100vw-2rem)]`, `max-h-[90vh]`, scroll interne
- [ ] Dock/FAB ne masque pas le contenu (padding-bottom adapté)
- [ ] Aucune hauteur fixe (`h-*`) sur un contenu dynamique

## 2. Headers et layouts (priorité 2)

- [ ] Breadcrumbs cohérents et mesurés via App Shell
- [ ] Titre + description + statut + actions présents selon le besoin de la page
- [ ] Mobile : actions empilées/wrap, pas de débordement
- [ ] Desktop : titre et actions alignés, header pas trop haut
- [ ] Tabs sticky : offset depuis `topMiddle.height`, z-index, visibilité au scroll, compact header
- [ ] Aucun `top-16` / `top-20` codé en dur

## 3. Cards et surfaces (priorité 3)

- [ ] Rayon `rounded-xl` cohérent pour une même famille
- [ ] Bordure/ring, fond `bg-card`, ombre au hover cohérents
- [ ] `onView` + `viewMode` présents sur les cards métier
- [ ] Clic principal ≠ menu d'actions ; `stopPropagation` sur le menu
- [ ] Pas plus de deux niveaux de cards imbriquées
- [ ] Variantesadaptées : stat, produit, boutique, jeu, tournoi, participant, match, dashboard

## 4. Spacing et alignements (priorité 4)

- [ ] Padding card `p-4` / `p-3` compact
- [ ] Gaps de section homogènes (`gap-3` → `gap-4`/`gap-6`)
- [ ] Pas d'espaces excessifs ni de contenu collé
- [ ] Cohérence entre pages d'une même catégorie

## 5. Boutons, icônes, petits composants (priorité 5)

- [ ] Une seule action principale `default` par zone
- [ ] Tailles de boutons cohérentes (`sm` cards, `default`/`lg` pages)
- [ ] Icônes `size-3/4/5` cohérentes
- [ ] Zones tactiles >= 24 px (44 px pour actions critiques)
- [ ] Badges lisibles, statuts via helpers (`types-label.ts`)
- [ ] Inputs avec label, focus ring, état erreur

## 6. Navigation, tabs, filtres, actions (priorité 6)

- [ ] Tabs responsive (`responsive-tabs.tsx`) ou sticky dynamique
- [ ] Filtres synchronisés URL ; reset pagination au changement
- [ ] Erreur distincte d'une liste vide
- [ ] Actions organisateur/admin visibles mais non dominantes pour le participant
- [ ] Résultats : vérification serveur + pas de double progression

## 7. États (priorité 7)

- [ ] Loading : skeleton de la forme finale
- [ ] Empty : message + action si possible
- [ ] Error : distinct, avec « Réessayer »
- [ ] Success : toast discret
- [ ] Disabled : explication si lié à une règle métier
- [ ] Hover / focus / active / selected cohérents

## 8. Typographie et hiérarchie (priorité 8)

- [ ] `Typography` utilisé pour la hiérarchie
- [ ] Un seul `h1`, pas de saut de niveau
- [ ] Variantes responsive (pas de `text-4xl` fixe sur mobile)
- [ ] Titres longs gérés (`min-w-0`, `truncate` + `title`)

## 9. Animations (priorité 9)

- [ ] Micro-interactions utiles, 150–300 ms
- [ ] `prefers-reduced-motion` respecté
- [ ] Pas d'animation sur listes longues/tables
- [ ] Tirage = visualisation de données persistées, jamais client

## 10. Accessibilité et finition (priorité 10)

- [ ] Contrast en clair et sombre (Lighthouse)
- [ ] Navigation clavier complète
- [ ] ARIA : rôles, états, labels
- [ ] Pas de `text-white` sur fond clair
- [ ] Données réelles intactes, aucune fonctionnalité supprimée

## Livrable d'audit

Producer un tableau :

| Page / Composant | Problème | Priorité | Correctif | Vérifié visuellement |
|---|---|---|---|---|
| ... | ... | P1/P2/P3 | ... | oui/non (largeur, thème) |

Ne pas passer à la correction sans ce tableau (même simplifié).
