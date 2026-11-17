# Contrôle visuel et UX (navigateur)

> `tsc` vert ne prouve pas qu'une page est correcte. Cette étape est **obligatoire** avant d'annoncer une correction terminée.

## Outils dans cet environnement

Le navigateur intégré OpenCode est disponible via les outils `browser.*` (à appeler depuis le mode code) :

| Besoin | Outil |
|---|---|
| Ouvrir une page | `tools.browser.tabs.open({ url })` |
| Attendre chargement / texte | `tools.browser.wait({ tabID, condition })` |
| Arbre d'accessibilité + refs | `tools.browser.snapshot({ tabID })` |
| Trouver un texte | `tools.browser.find({ tabID, text })` |
| Cliquer / remplir / cocher | `tools.browser.click`, `fill`, `fill_form`, `check`, `select` |
| Clavier | `tools.browser.press({ tabID, key })` |
| Scroll | `tools.browser.scroll({ tabID, deltaY })` |
| Capture | `tools.browser.tabs.focus` puis `tools.browser.screenshot` |
| Console / réseau | `tools.browser.console`, `network.list`, `network.get` |
| Mesures DOM réelles | `tools.browser.evaluate` (`getBoundingClientRect`, `scrollWidth`) |
| Audit accessibilité | `tools.browser.lighthouse({ tabID })` |
| Montrer un fichier à l'utilisateur | `tools.browser.preview({ path })` |

`localhost:3000` = serveur de dev sur la machine qui exécute OpenCode. Si le serveur n'est pas lancé, le démarrer (`bun run dev`) avant le contrôle.

**Playwright n'est pas installé** dans `package.json` : utiliser le navigateur intégré en priorité. Si un outil est indisponible, le documenter explicitement — ne pas fabriquer de capture ni de résultat.

## Procédure par page prioritaire

### 1. État initial

```js
const tab = await tools.browser.tabs.open({ url: "http://localhost:3000/..." })
await tools.browser.wait({ tabID: tab.id, condition: "load" })
const errors = await tools.browser.console({ tabID: tab.id, level: "error" })
const snapshot = await tools.browser.snapshot({ tabID: tab.id })
return { errors: errors.messages, a11y: snapshot.content }
```

Capturer l'état **avant** correction quand c'est possible (utile pour le rapport).

### 2. Mesures automatiques (evaluate)

```js
await tools.browser.evaluate({ tabID, expression: `(() => {
  const el = document.documentElement;
  const overflow = el.scrollWidth - window.innerWidth;
  const fixed = [...document.querySelectorAll('[class*="fixed"],[class*="sticky"]')]
    .slice(0, 20)
    .map(n => ({ cls: n.className, top: Math.round(n.getBoundingClientRect().top) }));
  return { viewport: window.innerWidth, overflowPx: overflow, fixed };
})()` })
```

Vérifier aussi : `topMiddle` mesuré vs position des tabs sticky, hauteur du dock flottant, zone non chevauchée en bas de liste.

### 3. Grille de largeurs

Pour chaque largeur : **320, 375, 425, 768, 1024, 1280, 1440, 1920**.

Le navigateur intégré ne fournit pas de réglage de viewport natif documenté dans le skill : utiliser l'outil disponible pour redimensionner (ou `evaluate` sur l'iframe/conteneur si fourni). Si le redimensionnement n'est pas possible, **documenter la limitation** et compléter par une inspection statique des breakpoints Tailwind (`xs`, `sm`, `md`, `lg`, `xl`, `2xl`) dans le code.

À chaque largeur :
- [ ] pas de scroll horizontal ;
- [ ] cartes lisibles et alignées ;
- [ ] header non cassé, actions accessibles ;
- [ ] tables utilisables (scroll horizontal ou vue cartes) ;
- [ ] dialogs/drawers dans le viewport ;
- [ ] aucun bouton disparu ;
- [ ] dock/FAB non chevauchant.

### 4. Thèmes clair et sombre

Bascule via `ThemeToggle` (`next-themes`). Pour chaque page prioritaire, reprendre :
- fonds / bordures / textes ;
- badges (souvent `text-white` sur fond clair → à corriger) ;
- cards, dialogs, inputs ;
- graphiques (couleurs `--chart-*` identiques mais contraste du fond changé) ;
- états hover/focus/selected.

### 5. Interactions réelles

- Clics principaux des cards (`onView`) et menus d'actions (ne pas déclencher deux actions).
- Tabs sticky au scroll, dropdown des tabs overflow.
- Filtres : changement → URL synchronisée → pagination reset.
- Dialogs : ouverture, fermeture Échap, focus retour.
- Formulaires : états valide / invalide / erreur serveur / succès.
- Clavier : Tab / Shift+Tab / Entrée / Échap / flèches.

### 6. Audit accessibilité

```js
const report = await tools.browser.lighthouse({ tabID: tab.id })
```

Conserver les échecs concrets (nœuds, sélecteurs) ; un score 100 n'est pas une conformité WCAG (voir skill `accessibility`).

## Compte rendu attendu (format)

```markdown
## Visual QA — [route] — [date] — [agent]

- Serveur : localhost:3000 (up/down)
- Largeurs testées : 320 ✓ / 375 ✓ / 425 ✓ / 768 ✓ / 1024 ✓ / 1280 ✓ / 1440 ✓ / 1920 ✓
- Thèmes : clair ✓ / sombre ✓
- Console : 0 erreur bloquante (détail si reste)
- Lighthouse a11y : score + échecs restants
- Captures : [lien/chemin] ou « indisponible : raison »
- Corrections appliquées : ...
- Points restants : ...
```

Ne jamais inventer une capture ou un score. Si l'outil échoue, écrire « NON VÉRIFIÉ — limitation : ... ».
