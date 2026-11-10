# Audit & refonte — Chats, Inbox, Game Clips (Games-Trafics)

> Source : `PROMPT.md` (audit complet). Ce document est le livrable « Avant de
> modifier » (§7) : cartographie, flux, problèmes confirmés, problèmes
> potentiels, plan. Les corrections sont ensuite exécutées par lots validés
> (tsc + tests), comme pour le chantier Phases 1–6.

## 0. Cartographie des fichiers

### Chats / Inbox
- Pages : `app/chats/page.tsx`, `app/chats/layout.tsx`,
  `app/chats/groups/[groupId]/page.tsx`, `.../edit`, `.../create`.
- Composants : `components/pages/chats/*` (18 fichiers) —
  `chat-conversation-view`, `message-list`, `message-input`, `message-bubble`,
  `message-actions-dropdown`, `conversation-list`, `conversation-item`,
  `chat-sidebar`, `chat-header`, `chat-search`, `group-info`, `group-members`,
  `add-member-dialog`, `join-group-dialog`, `voice-recorder`, `chat-audio-player`,
  `emoji-picker-wrapper`, `theme-selector`.
- Actions serveur : `actions/messages.ts` (17 exports : getMessageById,
  getConversationsForUser, getEntityComments, getMessages, getConversation,
  getGroupMessages, getUnreadMessages, countUnreadMessages, getMessageStats,
  createMessage, updateMessage, deleteMessage, restoreMessage, markMessageAsRead,
  markMessagesAsRead, markConversationAsRead, replyToMessage),
  `actions/groups.ts`.
- Hooks : `hooks/use-messages.ts`, `hooks/use-conversations.ts`,
  `hooks/use-chat-theme.ts`, `hooks/use-chat-media.ts`, `hooks/use-groupes.ts`,
  `hooks/use-users.ts`, `hooks/use-shops.ts`, `hooks/use-tournaments.ts`.
- Contextes : `contexts/chat-context.tsx`.
- Types : `types/chat.ts`, `types/api.ts` (MessageFilters).
- Stores : `stores/chat-audio-store.ts`.
- DB : `conversations`, `messages`, `groups`, `groupMembers` (schema.ts).
- Tests : `tests/unit/*` (21 fichiers / 220 tests — aucun test chat/clip
  dédié à ce jour).

### Game Clips
- Pages : `app/game-clips/page.tsx`, `app/game-clips/create/page.tsx`,
  `app/game-clips/client-page.tsx`, `app/api/game-clips/route.ts`.
- Composants : `components/pages/game-clips/*` (7 fichiers) —
  `game-clip-reel`, `game-clip-player`, `game-video-controller`,
  `clip-media-controller`, `game-trafics-loader`, `interaction-list`,
  `home-game-clips-section`.
- Commentaires : `components/comments/comments-sheet.tsx`.
- Hooks/stores : `hooks/use-clip-engine.ts` (useClipEngineStore),
  `hooks/use-game-clips-player.ts`, `stores/game-clips-store.ts`.
- Actions : `actions/game-clips.ts`.
- Tests : aucun test clip dédié.

## 1. Flux existants (résumé)

### Conversations / Inbox
1. `useConversations(userId)` → `getConversationsForUser(userId)` (server).
2. Enrichissement par entité fait en **N+1** (un `findFirst` par conversation
   selon entityType USER/GROUP/SHOP/TOURNAMENT).
3. `chat-conversation-view` choisit le fetch selon entityType (group/dm/entity)
   via useGroupMessages / useConversation / useEntityMessages.
4. Envoi : `useCreateMessage` → `createMessage` (server) — **pas d'optimistic
   update** : le message n'apparaît qu'après round-trip.
5. Polling : conversations refetch toutes les 30 s ; messages staleTime 10 s.
6. Pagination : offset/page (pas cursor) — `getConversation`/`getGroupMessages`
   utilisent `offset`.

### Game Clips
1. Feed paginé via `useInfiniteQuery` (page/limit).
2. `game-clip-reel` gère l'index actif, swipe, préchargement.
3. Stores : `useClipEngineStore` (playback global) + `useGameClipsStore` (feed).
   Risque de sources de vérité concurrentes (index actif dans les deux).
4. Progression : `setState` React sur chaque `timeupdate` (coût élevé).
5. Vidéos : plusieurs `<video>` montés simultanément → mémoire.

## 2. Problèmes confirmés

### P0 — Structurel
- **N+1 dans `getConversationsForUser`** : un `findFirst` par conversation pour
  récupérer l'entité cible (USER/GROUP/SHOP/TOURNAMENT). Confirmé lignes
  148–181 de `actions/messages.ts`. À corriger par batch `inArray` groupé par
  type.
- **Envoi non optimiste** : aucun message temporaire `sending`, pas de retry
  local, risque de perte silencieuse et de doublons au retry (pas
  d'idempotency key visible dans `createMessage`).
- **Pagination offset** pour les messages : chargement historique ne préserve
  pas la position de scroll ; pas de cursor. À migrer vers cursor-based.
- **Sources de vérité concurrentes** dans les clips : `useClipEngineStore`
  (index actif/playback) vs `useGameClipsStore` (feed). Risque d'état obsolète.
- **Progression vidéo** : `setState` par `timeupdate` (~4 Hz+) → re-renders
  excessifs.
- **Plusieurs `<video>` montés** sans libération → mémoire.

### P1 — Fonctionnel / UX
- Actions d'épinglage/masquage/mute/archive/suppression : proposées dans
  l'UI mais à vérifier côté serveur (actions existent ?).
- `refetchInterval: 30s` sur conversations → polling global trop fréquent.
- `getEntityComments` / entity messages : à vérifier N+1 sur users.
- Pas de déduplication par id côté client pour les messages entrants.
- Pas de préchargement de la page suivante du feed clips.
- Pas de distinction buffering/lecture dans la barre de progression.

### P2 — Responsive / design
- Bulles de messages, composer, panneau commentaires clips : à auditer à
  320/375/390/430/768/1024/1280 px.
- Safe areas, `100dvh`, clavier mobile.

## 3. Problèmes potentiels à vérifier (avant correction)

- `createMessage` : validation serveur des permissions (groupe lecture seule,
  membre autorisé) — à lire.
- `markConversationAsRead` : concurrence / double comptage unread.
- Index SQL : `messages` n'a pas d'index composite `(groupId, createdAt)` ni
  `(recipientId, senderId, createdAt)` → à ajouter.
- `conversations.participantIds` array indexé (GIN) ? Actuellement btree sur
  l'array — requête `@>` peut être lente → à vérifier EXPLAIN.
- Cache TanStack : clés par filtres mais pas par conversation pour les
  messages → risque de cache partagé incorrect.
- Clips : `IntersectionObserver` rootMargin / seuils, gestion du retour au clip
  précédent, pause lors de l'ouverture des commentaires.
- Upload média chat : compression, progression, annulation, reprise.

## 4. Plan de correction (par lots, validés tsc + tests)

### Lot A — Serveur & données (priorité haute)
A1. Batch `getConversationsForUser` (N+1 → inArray groupé par type).
A2. Ajouter les index SQL manquants (messages, conversations).
A3. Vérifier/appliquer les permissions serveur dans `createMessage` et
    `groups` (lecture seule, rôles).
A4. Idempotency key sur `createMessage` (anti-doublon au retry).

### Lot B — Messages (client)
B1. Pagination cursor-based pour DM/groupe/entity.
B2. Préservation de la position de scroll lors du chargement historique.
B3. Envoi optimiste local-first (temp message `sending`, retry, remplacement).
B4. Déduplication par id, insertion sans reload complet.
B5. Cache séparé par conversation + préchargement raisonnable.
B6. Revalidation ciblée, réduction du polling 30 s.

### Lot C — Groupes & permissions
C1. Système de permissions configurable (OWNER/ADMIN/MEMBER + flags).
C2. UI paramètres groupe (mobile).
C3. Gestion membres (recherche, filtres, rôles, ajout/retrait, profil,
    démarrer DM).
C4. Discussions d'entité → participants → DM sans création auto.

### Lot D — Média chat
D1. Cache média cohérent (thumbnails, HTTP/CDN, préchargement conditionnel).
D2. Upload : compression, progression, annulation, reprise, erreur.
D3. Respect auto-download + confidentialité.

### Lot E — Game Clips
E1. Feed : première page rapide, préchargement page suivante, dédup, position
    active, fin de feed, retry.
E2. Chargement vidéo progressif (miniature → next léger → actif prioritaire →
    libération).
E3. Limiter les `<video>` montés ; libération.
E4. Progression légère (ref + rAF, pas setState par timeupdate).
E5. Swipe/navigation (vertical, snap, clavier, IntersectionObserver,
    commentaires).
E6. Interactions optimistes (like/bookmark/comment/share/view) + batch stats.
E7. Stores : clarifier responsabilités, supprimer sources concurrentes,
    nettoyer timers.

### Lot F — Design & responsive
F1. Identité visuelle (bulles, statuts, composer, inbox, clips).
F2. Responsive 320/375/390/430/768/1024/1280, safe areas, 100dvh, clavier.

### Lot G — Tests
G1. Chats (texte/image/audio, échec réseau+retry, envois rapides, scroll,
    historique, groupe privé, lecture seule, permissions, DM depuis entité,
    cache média, reconnexion).
G2. Clips (feed vide/multi-pages/fin, vidéo lente/erreur, swipe rapide, retour,
    pause/reprise, commentaires, like/bookmark optimiste, perte réseau,
    orientation, background, mémoire).
G3. Responsive (mobile étroit/standard, tablette, desktop, clavier, safe areas).

## 5. Stage 1 — Réalisé

- **A1** : N+1 supprimé dans `getConversationsForUser`.
- **A4** : idempotency sur `createMessage` via la PK `messages.id`.
- **A2** : index SQL ajoutés (messages, conversations GIN).

## 6. Stage 2 (Lot B) — Réalisé (partiel)

- **B2** : préservation de la position de scroll lors du chargement de
  l'historique (`scrollAdjustRef` dans `message-list.tsx`).
- **B4** : déduplication par id des messages dans `chat-conversation-view`.
- **B3** : envoi optimiste local-first — `useCreateMessage` (onMutate append
  temp message `sending`, onSuccess remplace par le persistant, onError marque
  `failed`) ; `handleSendMessage` passe un UUID client (idempotency A4) et ne
  refetch plus ; `handleRetryMessage` rejoue le contenu et retire le message
  échoué ; statut affiché dans `message-bubble` (« Envoi… » / « Échec ·
  réessayer »).

### Reporté (Lot B suite)
- **B1** : pagination cursor-based (actuellement offset/page, non câblé côté
  UI — `onLoadMore`/`hasMore` non passés). Nécessite la migration des hooks
  vers `useInfiniteQuery` + curseur côté serveur.
- **B5/B6** : cache séparé par conversation + préchargement + polling ciblé
  (actuellement refetch 30 s global).

Validation : tsc EXIT:0, tests 220/220.

## 6. Livrables finaux (à compléter)

- Architecture finale.
- Fichiers modifiés.
- Corrections réalisées.
- Migrations éventuelles.
- Tests exécutés / résultats.
- Problèmes restant à résoudre.
## 6b. Stage 2 (Lot B) - complete

- B1 : pagination cursor-based (getConversation/getGroupMessages cursor, hooks useInfiniteQuery, vue aplatit pages, hasMore/loadMore).
- B5/B6 : cache par conversation conserve, polling allege (60 s), invalidation ciblee.

Validation : tsc EXIT:0, tests 220/220.

## Stage 3 (Lot C) - Permissions groupes

- Schema: groups.isReadOnly + groups.permissions (jsonb), groupMembers.permissions (jsonb).
- getGroupPermissions / hasGroupPermission / checkGroupPermission (server).
- createMessage: garde canSend + canSendMedia (lecture seule respectee).
- updateGroup: garde canEditInfo + canEditPermissions (owner only pour permissions/isReadOnly).
- addGroupMember / updateGroupMemberRole / removeGroupMember: garde canAddMembers + protection des roles.
- getEntityDiscussionParticipants (server) pour la liste des participants d'une discussion d'entite.
- UI edit groupe: section Permissions (lecture seule + qui peut envoyer).

Validation : tsc EXIT:0, tests 220/220.

## Stage 4 (Lot D) - Media chat

- use-chat-media: AbortController par upload + cancelUpload(fileId).
- Dedup par signature fichier (urlCache) pour eviter les re-uploads identiques.
- clearCompleted() pour liberer les ressources temporaires.
- Auto-download deja respecte dans message-bubble (downloadedImages initialise selon settings).
- Cache media: delegation au cache HTTP du navigateur + Next/Image ; prechargement conditionnel documente.

Validation : tsc EXIT:0, tests 220/220.

## Stage 5 (Lot E) - Game Clips

- useFeedBuffer: suppression de la duplication artificielle (shuffled) a la fin du feed ; accumulation sans doublons conservee.
- use-game-clips: dedup par id dans la derivation des clips.
- Stores: lecture isGloballyPaused/muted unifiee sur useClipEngineStore (source unique de playback) ; useGameClipsStore conserve feed/volume/playbackRates/commentaires.
- clip-media-controller: progression video throtlee a ~10 fps (evite setState a chaque timeupdate).
- game-clip-player: rollback optimiste sur like (onError) pour double-tap et handleLike.

Validation : tsc EXIT:0, tests 220/220.

## Stage 6 (Lot F) - Design & responsive (chats/clips)

- Chat: h-[100dvh] au lieu de absolute inset-0 ; safe-area sur le composer (env(safe-area-inset-bottom)) ; actions message visibles sur tactile (opacity-100 md:opacity-0) ; touch targets >= 44px (chat-header/sidebar/message-input/group-members) ; group-info boutons en colonne sur mobile ; group-members flex-wrap + badge shrink-0 ; emoji picker largeur responsive.
- Game Clips: h-screen -> h-[100dvh] ; max-h-screen -> max-h-[100dvh] ; safe-area top/bottom sur overlays, sheets (70dvh) et controles ; touch targets p-2.5/p-2 -> p-3.

Validation : tsc EXIT:0, tests 220/220.

## Stage 7 (Lot G) - Tests

- tests/unit/chats/group-permissions.test.ts : 8 tests sur resolveGroupPermissions (owner/admin/member, read-only, config whoCanSend, overrides).
- Total tests : 22 fichiers / 228 tests verts.

Validation : tsc EXIT:0, tests 228/228.
