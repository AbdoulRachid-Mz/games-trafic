---
name: games-trafics-ui-ux
description: Référence UI/UX obligatoire pour Games Trafics. À activer pour toute intervention sur l'interface : audit, correction responsive, harmonisation de cards/headers/spacing, accessibilité, états d'interface, animation ou contrôle visuel des pages Tournois, Éditions, Dashboards, Marketplace, Shops, Games, transactions, admin et profils. Contient les règles opérationnelles, le workflow et les critères de validation adaptés au code réel du projet.
---

# Games Trafics — UI/UX Engineering

Ce skill est la **référence permanente** de l'interface Games Trafics. Il remplace les conseils génériques par des règles vérifiables dans le code de ce dépôt.

## 1. Quand activer ce skill

Active-le dès que la tâche touche :

- un composant visible (`@/components/ui`, `@/components/cards`, `@/components/shared`) ;
- une route `app/**/page.tsx` ou `app/**/layout.tsx` ;
- du responsive, du thème clair/sombre, de l'accessibilité ;
- un état loading / empty / error / success / disabled ;
- une animation ou micro-interaction ;
- un audit visuel, une capture, un test navigateur, Lighthouse.

Ne pas l'activer pour une pure migration de schéma, une action serveur sans rendu ou un script de données.

## 2. Règles fondamentales (non négociables)

1. **Lire avant d'écrire.** Ouvrir le fichier, ses tokens et ses usages avant toute modification.
2. **Réutiliser avant créer.** Chercher dans `@/components/ui`, puis `@/components/cards`, puis `@/components/shared`. Si un composant proche existe, l'améliorer plutôt que d'en ajouter un deuxième.
3. **Palette existante uniquement.** Violet + or (gold), tokens OKLCH de `app/globals.css`. Aucune palette concurrente, aucun thème parallèle.
4. **Tokens sémantiques.** `bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`… Pas de `bg-white`/`text-black` arbitraire quand un token existe.
5. **Un langage, des personnalités.** Harmoniser les fondamentaux (rayons, spacings, états) sans rendre le dashboard identique à la marketplace.
6. **App Shell = source de vérité.** `resolveRoute()` configure la route ; le store Zustand `stores/app-shell-store.ts` expose les mesures DOM réelles. Jamais de `top-16`/`top-20` codé en dur pour les éléments sticky.
7. **Préserver le métier.** Aucune règle tournoi/édition, permission, paiement, filtre, export, API ou Server Action ne doit être supprimée ou remplacée par du faux.
8. **Vérifier visuellement.** `tsc` vert ne prouve pas qu'une page est correcte. Navigate obligatoire avant de déclarer terminé.
9. **Validation complète.** TypeScript + ESLint + tests + build + contrôle visuel multi-largeurs et bi-thème.

> **Important — identité réelle :** le missionnaire parle parfois de « violet et vert ». Le code réel utilise **violet (`--primary`, hue 280) et or (`--secondary`/`--accent`, hue 90)**. Le vert n'apparaît que comme couleur utilitaire de statut (`text-green-600` dans `Typography`, badges de statut). Ne pas introduire de palette verte concurrente. Voir `references/design-tokens.md`.

## 3. Workflow obligatoire

```
1. AUDIT
   - Lire references/audit-checklist.md
   - Cartographier les routes et composants concernés
   - Identifier problems réels (captures si possible) avant de toucher au code

2. DÉCISION
   - Composant existant réutilisable ? → l'améliorer
   - Sinon : justifier la nouveauté, rester dans les conventions

3. IMPLÉMENTATION
   - Corriger dans cet ordre : structure/responsive → headers/layout →
     cards/surfaces → spacing → petits composants → navigation/filtres →
     états → typographie → animations → accessibilité
   - Un changement à la fois, type check après chaque grand lot

4. CONTRÔLE VISUEL (obligatoire)
   - Suivre references/visual-qa.md
   - Largeurs : 320, 375, 425, 768, 1024, 1280, 1440, 1920
   - Thèmes clair ET sombre
   - Interactions réelles (clic, tabs, filtres, dialogs, clavier)

5. VALIDATION TECHNIQUE
   - bun x tsc --noEmit
   - bun run lint
   - bun x vitest run tests/unit
   - bun run build

6. DOCUMENTATION
   - Consigner ce qui a changé, pourquoi, et ce qui reste
```

## 4. Références à consulter

| Fichier | Contenu |
|---|---|
| `references/design-system.md` | Stack, architecture des dossiers, App Shell, règles globales |
| `references/design-tokens.md` | Tokens OKLCH réels, couleurs, radius, typographie, breakpoints |
| `references/component-guidelines.md` | Cards, headers, boutons, badges, inputs, états |
| `references/page-categories.md` | Identité propre à chaque catégorie de page |
| `references/responsive-guidelines.md` | Grilles, tables, tabs, dialogs, dock flottant |
| `references/accessibility.md` | Contrastes, clavier, ARIA, zones tactiles |
| `references/animation-guidelines.md` | Framer Motion, GSAP, CSS, modération |
| `references/audit-checklist.md` | Grille d'audit complète et priorisation |
| `references/visual-qa.md` | Procédure navigateur et comptes rendus |
| `examples/good-patterns.md` | Patterns tirés du code réel |
| `examples/anti-patterns.md` | Pièges observés et corrections |

## 5. Outils disponibles dans cet environnement

- **OpenCode** : agent courant. Skills globaux dans `C:\Users\user\.agents\skills` et `C:\Users\user\.claude\skills`.
- **Navigateur intégré OpenCode** : outils `browser.*` (onglets, snapshot accessibilité, `evaluate`, `screenshot`, `console`, `network`, `lighthouse`). Voir `references/visual-qa.md`.
- **Playwright** : non installé dans `package.json` ; utiliser le navigateur intégré en priorité. Le documenter si indisponible.
- **Lighthouse** : disponible via `browser.lighthouse`.
- **Animations** : `framer-motion`, `motion`, `gsap`/`@gsap/react`, `canvas-confetti`, `tw-animate-css`.
- **Testing** : `vitest`, `jsdom`.

## 6. Interdictions explicites

- Créer un second `Button`, `Card`, header, modal, badge ou système de thème.
- Introduire une dépendance UI sans justification technique documentée.
- Remplacer les tokens par des couleurs codées en dur (sauf statuts utilitaires cohérents et centralisés).
- `top-16` / `top-20` pour un élément sticky : utiliser les mesures du store App Shell.
- `sort(() => Math.random() - 0.5)` ou tout tirage côté client.
- Données fictives pour améliorer une capture.
- Supprimer une fonctionnalité difficile à intégrer visuellement.
- Masquer une erreur avec `any` ou une désactivation ESLint injustifiée.
- Annoncer « terminé » sans contrôle visuel et sans validation technique.

## 7. Critères de validation

Une intervention est terminée seulement si :

- [ ] le composant existant le plus proche a été réutilisé ou amélioré ;
- [ ] les tokens sémantiques et les rayons de la charte sont respectés ;
- [ ] aucun débordement horizontal de 320 à 1920 px ;
- [ ] rendu correct en thème clair **et** sombre ;
- [ ] états loading / empty / error / success / disabled cohérents ;
- [ ] navigation clavier et labels accessibles vérifiés ;
- [ ] App Shell / dock / tabs sticky non régressés ;
- [ ] règles métier et données réelles intactes ;
- [ ] `tsc`, lint, tests et build passent ;
- [ ] capture ou compte rendu navigateur joint (ou limitation documentée).
