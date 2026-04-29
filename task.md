Tu es un expert senior en développement d'applications temps réel avec Next.js (App Router), TypeScript et architecture scalable.

J’ai actuellement un système de chat basé sur un format `chatId = "type:id"` (ex: "user:123", "group:456"), avec des fonctions `parseChatId` et `validateChatId`. Ce système provoque des bugs fréquents (mauvais parsing, redirections, incompatibilité avec les params Next.js, problèmes avec les DM).

Je veux refactorer complètement vers une architecture professionnelle, robuste et scalable, similaire aux applications modernes (WhatsApp, Messenger, Discord).

## 🎯 OBJECTIF GLOBAL

Remplacer totalement le système `chatId` par un routing structuré basé sur Next.js App Router.

---

## 🧱 NOUVELLE ARCHITECTURE DE ROUTING

Mettre en place les routes suivantes :

* `/chats` → liste des conversations
* `/chats/[entityType]/[entityId]` → conversation
* `/chats/groups` → liste des groupes
* `/chats/groups/create` → création de groupe
* `/chats/groups/[groupId]` → détail du groupe
* `/chats/groups/[groupId]/edit` → édition
* `/chats/groups/[groupId]/members` → membres du groupe

Les `entityType` valides sont :
`user | group | shop | product | post | tournament`

---

## 🔥 RÈGLES IMPORTANTES

1. ❌ Supprimer complètement :

   * `parseChatId`
   * `validateChatId`
   * `formatChatId`

2. ✅ Utiliser uniquement :

   ```ts
   const { entityType, entityId } = useParams();
   ```

3. ✅ Valider les params directement dans les pages :

   * vérifier `entityType` ∈ liste valide
   * vérifier `entityId` non vide
   * sinon redirection vers `/chats`

4. ✅ Pour les DM :

   * utiliser `/chats/user/[userId]`
   * ne plus utiliser `dm:user1-user2`

---

## 🧩 LAYOUT (IMPORTANT)

Refactorer complètement le layout :

### ❌ Supprimer :

* `ResizablePanel`
* logique complexe de resize

### ✅ Implémenter un layout moderne responsive :

* Desktop :

  * sidebar fixe (300px)
  * contenu flexible

* Mobile :

  * sidebar visible uniquement sur `/chats`
  * sidebar cachée sur `/chats/[entityType]/[entityId]`

### Comportement :

```tsx
const hasActiveChat = !!params.entityId;

{(!isMobile || !hasActiveChat) && <Sidebar />}
{children}
```

---

## 🧱 SIDEBAR

Refactorer `ChatSidebar` pour :

* utiliser `Link` avec :

  ```tsx
  /chats/user/123
  /chats/group/456
  ```

* afficher :

  * liste conversations
  * groupes
  * accès création groupe

---

## 🧠 GESTION DES GROUPES

Adapter toutes les pages suivantes :

* `/chats/groups/[groupId]`
* `/chats/groups/[groupId]/edit`
* `/chats/groups/[groupId]/members`

Règles :

* utiliser `groupId` depuis `useParams`
* ne jamais passer par `chatId`
* séparer clairement :

  * logique groupe
  * logique messages

---

## 💬 PAGE CONVERSATION

Dans `/chats/[entityType]/[entityId]` :

* déterminer :

  ```ts
  const isGroup = entityType === "group";
  ```

* charger dynamiquement :

  * user → conversation DM
  * group → messages groupe
  * autres → entity chat

---

## ⚙️ BACKEND / HOOKS

Adapter tous les hooks :

* `useConversation(userId, entityId)`
* `useGroupMessages(groupId)`
* `useCreateMessage()`

Ne plus dépendre de `chatId`, uniquement de :

* `entityType`
* `entityId`

---

## 🚀 BONUS (SI POSSIBLE)

* centraliser `VALID_ENTITY_TYPES`

* créer un helper :

  ```ts
  function isValidEntityType(type: string): boolean
  ```

* améliorer UX mobile (transition sidebar → chat)

---

## 🎯 RÉSULTAT ATTENDU

* zéro parsing de string
* routing propre et scalable
* suppression des bugs "Invalid chat ID"
* code maintenable et extensible
* UX fluide mobile + desktop

---

Génère :

1. Le nouveau `ChatLayout`
2. Une page `/chats/[entityType]/[entityId]/page.tsx` complète
3. Exemple de `ChatSidebar` corrigé
4. Adaptation des hooks principaux
5. Structure finale des dossiers `app/chats`

Le code doit être propre, typé TypeScript, prêt pour production.

on corrige apres cette erreur:"Error analyzing traces: Error: Failed to fetch user traces
    at d (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\_56143236._.js:2:5951)
    at async v (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\[root-of-the-server]__14aa8143._.js:2:11250)
    at async u (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\[root-of-the-server]__14aa8143._.js:2:14587)
    at async i (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\[root-of-the-server]__14aa8143._.js:2:15628)
    at async Module.N (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\[root-of-the-server]__14aa8143._.js:2:16706)
Error loading relation: Error: Failed query: select "id", "user_id", "financial_account_id", "card_number_hash", "pin_hash", "is_active", "is_locked", "is_deleted", "failed_attempts", "last_failed_attempt", "identity_document_type", "identity_document_url", "verification_status", "verified_at", "created_at", "updated_at" from "user_wallets" where "user_wallets"."user_id" = $1 limit $2
params: cI5yE25O5zkqd1oPR5PLTGLY09gGVbdw,1
    at ev.queryWithCache (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\_e85185eb._.js:28:38848)
    at async (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\_e85185eb._.js:28:41510)
    at async p (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\_573a1c6e._.js:588:151198)
    at async y (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\[root-of-the-server]__dcced00d._.js:1:2621)
    at async d (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\[root-of-the-server]__dcced00d._.js:1:6381) {
  query: 'select "id", "user_id", "financial_account_id", "card_number_hash", "pin_hash", "is_active", "is_locked", "is_deleted", "failed_attempts", "last_failed_attempt", "identity_document_type", "identity_document_url", "verification_status", "verified_at", "created_at", "updated_at" from "user_wallets" where "user_wallets"."user_id" = $1 limit $2',
  params: [Array],
  [cause]: Error: read ECONNRESET
      at ignore-listed frames {
    errno: -4077,
    code: 'ECONNRESET',
    syscall: 'read'
  }
}
Error loading relation: Error: Failed query: select "id", "user_id", "plan_type", "status", "start_date", "end_date", "auto_renew", "price_paid", "currency", "transaction_id", "active_benefits", "is_deleted", "created_at", "updated_at" from "vip_subscriptions" where ("vip_subscriptions"."user_id" = $1 and "vip_subscriptions"."status" = $2) limit $3
params: cI5yE25O5zkqd1oPR5PLTGLY09gGVbdw,ACTIVE,1
    at ev.queryWithCache (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\_e85185eb._.js:28:38848)
    at async (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\_e85185eb._.js:28:41510)
    at async p (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\_573a1c6e._.js:588:151198)
    at async y (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\[root-of-the-server]__dcced00d._.js:1:2621)
    at async d (C:\Users\user\Desktop\abdoul\react projets\gt-v3\.next\server\chunks\[root-of-the-server]__dcced00d._.js:1:6381) {
  query: 'select "id", "user_id", "plan_type", "status", "start_date", "end_date", "auto_renew", "price_paid", "currency", "transaction_id", "active_benefits", "is_deleted", "created_at", "updated_at" from "vip_subscriptions" where ("vip_subscriptions"."user_id" = $1 and "vip_subscriptions"."status" = $2) limit $3',
  params: [Array],
  [cause]: Error: read ECONNRESET
      at ignore-listed frames {
    errno: -4077,
    code: 'ECONNRESET',
    syscall: 'read'
  }
}
"