Tu es un expert en frontend React / Next.js spécialisé dans les interfaces type TikTok, Instagram Reels et WhatsApp Status.

J’ai déjà un système de lecture de clips (vidéo + images), mais il a plusieurs problèmes critiques de fluidité, UX et architecture.

Ta mission est de REFACTORISER complètement le système pour atteindre une expérience ULTRA FLUIDE, similaire à TikTok / WhatsApp.

---

# 🎯 OBJECTIFS PRINCIPAUX

1. Fluidité parfaite (zéro lag, zéro saut)
2. Lecture vidéo fiable (autoplay fonctionne toujours)
3. Navigation tactile intuitive (gauche / centre / droite)
4. Support natif des clips multi-médias (vidéo + images type stories)
5. Performance optimisée (préload intelligent + pas de re-render inutile)
6. UX moderne (overlay, actions, animations smooth)

---

# ❌ PROBLÈMES ACTUELS À CORRIGER

* Chaque clip change l’URL (router.replace) → provoque des re-renders et des sauts
* scrollIntoView + IntersectionObserver → conflit et manque de fluidité
* Les vidéos ne se lancent pas correctement
* Mauvaise gestion du cycle de vie des vidéos
* Impossible de naviguer correctement entre les médias d’un clip
* Les images et vidéos ne sont pas bien mélangées (pas comme stories)
* UI pas stable (infos cachées au hover)
* Mauvaise gestion du preload
* Mauvaise gestion des gestures (tap / long press)

---

# ✅ ARCHITECTURE ATTENDUE

## 1. CLIP ENGINE (centralisé avec Zustand)

* currentIndex
* isPaused global
* muted
* isTransitioning
* preloadIndex (next / prev)

👉 Navigation SANS scrollIntoView
👉 Le scroll utilisateur contrôle l’index via IntersectionObserver stable

---

## 2. PARAMS URL

* Lire activeClipId UNIQUEMENT au chargement
* NE JAMAIS modifier l’URL pendant le scroll

---

## 3. SCROLL SYSTEM

* scroll-snap uniquement (pas de scrollIntoView auto)
* IntersectionObserver avec threshold 0.8
* Aucun setState inutile pendant scroll

---

## 4. MEDIA SYSTEM (TRÈS IMPORTANT)

Chaque clip doit supporter :

* 1 vidéo (optionnelle)
* plusieurs images

👉 Fusion en une timeline :

* vidéo en premier
* puis images

👉 comportement :

* vidéo → durée réelle
* image → 4s chacune
* swipe droite/gauche → navigation
* fin → next clip

---

## 5. GESTION VIDÉO (CRITIQUE)

* autoplay fiable (muted fallback obligatoire)
* key dynamique sur <video>
* playsInline + preload="metadata"
* retry automatique si play() échoue
* pause automatique si clip non actif
* préchargement de la vidéo suivante

---

## 6. NAVIGATION TACTILE (À IMPLÉMENTER PARFAITEMENT)

Diviser l’écran en 3 zones :

* 🟦 Gauche (25%) → PREV media ou PREV clip
* 🟩 Centre (50%) → PLAY / PAUSE
* 🟥 Droite (25%) → NEXT media ou NEXT clip

👉 règles :

* priorité au media interne
* sinon navigation clip

👉 support :

* click (desktop)
* tap (mobile)

---

## 7. LONG PRESS

* appui long → pause
* relâche → resume
* ne pas casser le scroll

---

## 8. PRELOAD INTELLIGENT (TRÈS IMPORTANT)

* preload clip actuel
* preload clip suivant
* preload partiel du précédent

👉 éviter :

* preload de toute la liste (mauvaise perf)

---

## 9. UI / DESIGN

* media fullscreen (object-contain)
* gradient overlay bas
* infos toujours visibles (pas de hover)
* actions à droite (like, share, etc.)
* animation fluide (framer-motion)

---

## 10. PERFORMANCE

* React.memo sur les clips
* key stable
* pas de re-render global
* lazy loading images
* pas de setState dans scroll
🔥 cache offline clips
🔥 algo feed personnalisé (comme TikTok)
🔥 analytics (watch time, drop rate)

---

# 🔥 BONUS (IMPORTANT)

* double tap → like animation
* progress bar (video + images)
* animation de pause (comme TikTok)
* gestion visibility API (tab inactive)

---

# 📦 OUTPUT ATTENDU

* code complet refactorisé :

  * GameClipReel
  * GameClipPlayer
  * ClipMediaController
  * useClipEngine
* code propre, optimisé, production-ready
* aucune régression UX
* navigation ultra fluide

---

# ⚠️ CONTRAINTES

* Next.js App Router
* React + Zustand
* Framer Motion autorisé
* Typescript strict
* aucun hack sale
* architecture scalable

---

Objectif final : une expérience identique à TikTok / WhatsApp Status, fluide, rapide, intuitive.


