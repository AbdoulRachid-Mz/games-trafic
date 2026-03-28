Objectif :
Refactoriser et optimiser la page des game-clips pour obtenir une expérience ultra fluide, similaire aux stories/reels des grandes apps (Instagram, TikTok, Facebook, WhatsApp).

---

1. ANALYSE INITIALE

Analyser tous les fichiers liés :
- game-clip-reel.tsx
- game-clip-player.tsx
- game-clip-viewer-modal.tsx
- game-clip-creation-dialog.tsx
- client-page.tsx
- hook useGameClips
- gestion du state + navigation + events

Identifier clairement :
- Les causes de re-render inutiles
- Les problèmes de synchronisation (pause/play / navigation)
- Les problèmes liés aux animations / transitions
- Les conflits entre state local et global

---

2. PROBLÈMES À CORRIGER

A. PERFORMANCE & FLUIDITÉ
- Page globalement non optimisée (trop de re-renders, timers, effets)
- Saccades lors du scroll vertical (translateY)
- Mauvaise gestion du “activeIndex”
- Mauvaise utilisation des timers (setInterval / setTimeout)

Objectif :
→ Scroll ultra fluide (60fps constant)
→ Aucun lag ou freeze
→ Optimisation mémoire + CPU

---

B. PROBLÈMES VISUELS (JANK / SURSAUTS)
- Sursaut du premier clip
- Sursauts lors du changement de clip
- Progress bars instables (surtout premier élément)
- Effet “jump” au lieu de transition fluide

Objectif :
→ Transitions smooth (type TikTok)
→ Utiliser animations GPU (transform + opacity uniquement)
→ Précharger les clips suivants

---

C. PROBLÈMES DE LECTURE (CRITIQUE)

1. Pause ne fonctionne pas correctement :
- Le bouton pause ne stoppe pas réellement la vidéo
- Le player continue de jouer en background
- Le play relance avec un saut (désynchronisation)

2. Conflit entre :
- isPaused (global)
- localPaused
- isPlaying

Objectif :
→ Source de vérité unique pour le playback
→ Pause RÉELLE (video.pause() + freeze timers)
→ Reprise propre sans jump

---

D. VITESSE & TIMING DES CLIPS
- Clips/images passent trop rapidement
- Pas d’animation entre les images
- Mauvaise perception utilisateur

Objectif :
→ Timing naturel (comme stories Instagram)
→ Animations fluides entre images
→ Progress bar parfaitement synchronisée

---

E. INTERACTIONS UTILISATEUR

1. Commentaires :
- Le clip doit se mettre en pause automatiquement quand :
  → section commentaires ouverte
  → input focus
  → utilisateur en train d’écrire

2. Navigation :
- Scroll trop sensible / brutal
- Mauvaise gestion du wheel / touch

Objectif :
→ UX naturelle et contrôlée
→ Bloquer navigation pendant transitions
→ Gérer correctement gestures (swipe)

---

F. INFINITE SCROLL + SHUFFLE

Problème :
- Pas de vraie boucle fluide
- Fin des clips mal gérée

Objectif :
→ Quand dernier clip atteint :
   - soit fetch next page
   - soit shuffle + restart depuis le début
→ Expérience infinie sans coupure
→ Aucun écran vide

---

G. UI / UX FIXES

- Le bouton “create clip” apparaît parfois en double
- Mauvais placement du bouton retour

Objectif :
→ Ajouter bouton “back” en haut à gauche (fixe)
→ Supprimer celui dans le player
→ Corriger duplication create button

---

3. AMÉLIORATIONS ARCHITECTURALES (TRÈS IMPORTANT)

- Séparer clairement :
  → logique de navigation (reel)
  → logique de playback (player)
  → logique UI

- Centraliser :
  → état de lecture (play/pause)
  → état actif (clip courant)

- Utiliser :
  → useRef pour éviter re-renders inutiles
  → memo / useMemo / useCallback correctement
  → requestAnimationFrame au lieu de setInterval si nécessaire

- Précharger :
  → clip suivant et précédent

---

4. COMPORTEMENT ATTENDU (RÉFÉRENCE)

Le résultat final doit être équivalent à :
- TikTok / Instagram Reels / WhatsApp Status

Donc :
- Scroll vertical ultra fluide
- Zéro sursaut
- Pause instantanée et fiable
- Reprise sans bug
- Transitions propres
- Lecture automatique maîtrisée
- UX naturelle et intuitive

---

5. BONUS (SI POSSIBLE)

- Ajouter inertie naturelle au scroll
- Ajouter easing sur transitions
- Améliorer perception du progress (plus smooth)
- Optimiser mobile en priorité

---

IMPORTANT :
Ne pas faire de patch rapide.
→ Faire une vraie refonte propre et scalable.
→ Priorité absolue : fluidité + stabilité + UX.
