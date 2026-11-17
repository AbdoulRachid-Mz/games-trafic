# Animations et micro-interactions

## Bibliothèques disponibles

- `framer-motion` / `motion` — transitions de composants, `whileHover`, `AnimatePresence`.
- `gsap` / `@gsap/react` — timelines complexes, animations de révélation 3D.
- `canvas-confetti` — célébrations (résultats, qualifications).
- `tw-animate-css` — utilitaires `animate-in`, `fade-in`, `slide-in-from-*`.
- CSS custom dans `globals.css` : `animate-float`, `animate-gradient`, `modal-content`, `skeleton-pulse`, `page-transition-*`, `transaction-step-*`, `scan-line`.

## Principes

1. **Utile avant décoratif.** Une animation doit expliquer un changement d'état, une progression ou une attention.
2. **Durée** : 150–300 ms pour les micro-interactions ; 400–800 ms pour les reveals ; jamais plus d'1 s pour une action utilisateur.
3. **Modération** : pas d'animation sur les listes longes, tables denses ou dashboards chargés.
4. **Cohérence** : même courbe (`ease-out` entrée, `ease-in` sortie) sur une même famille.
5. **Reduced motion** : toujours prévoir un chemin statique.

## Micro-interactions autorisées

| Élément | Effet |
|---|---|
| Card cliquable grid | `whileHover={{ y: -4 }}` + ombre, `active:scale-[0.99]` |
| Card liste | ombre au hover uniquement |
| Bouton | `transition-all`, pas de déplacement |
| Tabs | transition de fond `data-[state=active]` |
| Skeleton → contenu | fade-in court |
| Toast | entrée sonner, non bloquant |

## Révélation de structure / tirage (domaine tournoi)

Règles métier strictes :

- L'animation est une **représentation visuelle d'une structure déjà persistée côté serveur**.
- **Jamais** de tirage côté client, **jamais** `sort(() => Math.random() - 0.5)`.
- Le tirage réel est généré par `lib/tournaments/structure-engine.ts` et persisté via `actions/phases/structure.ts`.
- Le composant `draw-reveal-dialog.tsx` / la page dédiée de révélation consomment les données persistées ; l'animation ne modifie pas l'état.
- Prévoir un bouton « Passer l'animation » et un état final stable accessible.
- Compatibilité anciennes phases : absolute (pas de cassure si `thirdPlaceMatch` absent).
- 3e place : option explicite persistée, match généré depuis les perdants des demi-finales, sans doublon.

## Reveal / scroll-reveal dashboards

- Utiliser les patterns déjà en place (IntersectionObserver / framer-motion `whileInView`).
- Ne pas masquer du contenu important tant que l'animation n'a pas eu lieu : toujours un fallback visible si JS indisponible.
- Ne pas animer les KPI critique au point de retarder la lecture.

## Reduced motion — patron recommandé

```tsx
const reduce = useReducedMotion(); // framer-motion

<motion.div
  initial={reduce ? false : { opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: reduce ? 0 : 0.25 }}
/>
```

Pour le CSS custom, prévoir :

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Interdictions

- Confettis sur une erreur ou une action administrative sensible.
- Animation bloquante sans bouton de sortie.
- Glow/3D sur les tableaux, formulaires longs et zones de saisie.
- Dupliquer une animation déjà fournie par un composant (`sonner`, `vaul`, `tw-animate-css`).
