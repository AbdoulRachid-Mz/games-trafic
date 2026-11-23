# 📬 Guide de Configuration du Système de Notifications — Games Trafics

Ce document détaille l'activation, la configuration et l'obtention des clés d'environnement pour le système de notifications multi-canal de Games Trafics.

---

## 🎛️ 1. Activer ou Désactiver les Notifications Externes

Games Trafics dispose d'un interrupteur global dans votre fichier `.env` :

```env
# Activer (true) ou désactiver (false) l'envoi vers WhatsApp, Email et Web Push
ENABLE_EXTERNAL_NOTIFICATIONS=false
```

- **Si `ENABLE_EXTERNAL_NOTIFICATIONS=false` (ou absent)** : La plateforme utilise **uniquement les notifications internes (In-App)** comme avant. Aucun appel réseau vers WhatsApp, Resend ou Web Push n'est émis.
- **Si `ENABLE_EXTERNAL_NOTIFICATIONS=true`** : Le dispatcher transmet automatiquement les notifications aux canaux externes selon les clés configurées et les préférences de chaque utilisateur.

---

## 🔑 2. Récapitulatif des Variables d'Environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# ─── INTERRUPTEUR GLOBAL ───────────────────────────────────────────
ENABLE_EXTERNAL_NOTIFICATIONS=true

# ─── EMAIL (Resend) ────────────────────────────────────────────────
RESEND_API_KEY=re_votre_cle_ici
RESEND_FROM_EMAIL=Games Trafics <onboarding@resend.dev>

# ─── WHATSAPP CLOUD API (Meta) ────────────────────────────────────
WHATSAPP_PHONE_NUMBER_ID=votre_phone_number_id
WHATSAPP_ACCESS_TOKEN=votre_access_token_meta
WHATSAPP_WEBHOOK_VERIFY_TOKEN=votre_chaine_secrete_arbitraire
WHATSAPP_BUSINESS_ACCOUNT_ID=votre_waba_id

# ─── WEB PUSH VAPID (Navigateur & PWA) ─────────────────────────────
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BM4GwlN-YJMqTEkEY_rs8kBondps-_MGdfqSn0l0GoKDAHdcJOH4858ySTvnLSS8lsOvzgNvCw3yBnV-0eDK2jk
VAPID_PRIVATE_KEY=4HXZXP8izn5ejOG1o4tMCOaM7hvS1esHMG2lq8FEmqc
VAPID_SUBJECT=mailto:admin@games-trafics.com
```

---

## 📧 3. Canal Email : Resend

[Resend](https://resend.com) est le service transactionnel utilisé pour envoyer des courriels responsive lors des confirmations d'inscriptions, récapitulatifs de matchs et reçus financiers.

### Étapes d'obtention :
1. Créez un compte gratuit sur [resend.com/signup](https://resend.com/signup).
2. Rendez-vous sur la page des clés API : **[resend.com/api-keys](https://resend.com/api-keys)**.
3. Cliquez sur **"Create API Key"**, attribuez-lui le nom `games-trafics`, permission **"Full access"**.
4. Copiez la clé commençant par `re_` et collez-la dans `RESEND_API_KEY`.
5. Configuration de l'expéditeur (`RESEND_FROM_EMAIL`) :
   - **En développement / Sandbox** :
     ```env
     RESEND_FROM_EMAIL=onboarding@resend.dev
     ```
     *(Note : en mode sandbox, Resend délivre les emails uniquement sur l'adresse associée à votre compte Resend).*
   - **En production avec votre nom de domaine** :
     Allez sur **[resend.com/domains](https://resend.com/domains)**, ajoutez votre domaine (ex: `games-trafics.com`) et suivez les instructions pour ajouter les enregistrements DNS (DKIM, SPF). Une fois vérifié :
     ```env
     RESEND_FROM_EMAIL=Games Trafics <notifications@games-trafics.com>
     ```

---

## 💬 4. Canal WhatsApp : Cloud API (Meta for Developers)

L'API officielle Meta permet d'envoyer des notifications WhatsApp instantanées aux joueurs.

### Étapes d'obtention :
1. Connectez-vous sur la console développeur Meta : **[developers.facebook.com/apps](https://developers.facebook.com/apps)**.
2. Cliquez sur **"Créer une application"** (Create App) :
   - Type d'application : **"Autre"** ou **"Entreprise"** (Business).
   - Nom de l'app : `Games Trafics`.
3. Ajoutez le produit **WhatsApp** en cliquant sur **"Configurer"** (Set up).
4. Récupérez les identifiants sous le menu latéral **WhatsApp > Configuration de l'API (API Setup)** :
   - **`WHATSAPP_PHONE_NUMBER_ID`** : Nombre affiché sous *"ID du numéro de téléphone"*.
   - **`WHATSAPP_BUSINESS_ACCOUNT_ID`** : Nombre affiché sous *"ID du compte WhatsApp Business"*.
   - **`WHATSAPP_ACCESS_TOKEN`** :
     - *Mode test* : Copiez le *"Jeton d'accès temporaire"* (valide 24 heures).
     - *Mode permanent (Production)* : Dans le [Meta Business Manager > Utilisateurs système](https://business.facebook.com/settings/system-users), créez un utilisateur système avec rôle Admin, cliquez sur **"Générer un token"**, sélectionnez votre application et activez les permissions :
       - `whatsapp_business_messaging`
       - `whatsapp_business_management`
5. Configuration du Webhook (`WHATSAPP_WEBHOOK_VERIFY_TOKEN`) :
   - Définissez une chaîne secrète de votre choix (ex: `gt_webhook_secret_2026`).
   - Allez dans **WhatsApp > Configuration** dans le panneau gauche.
   - Sous la section **Webhook**, cliquez sur **Modifier** :
     - **URL de rappel** : `https://votre-domaine.com/api/webhooks/whatsapp`
     - **Jeton de vérification** : Indiquez la valeur exacte de `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
   - Cliquez sur **"Vérifier et enregistrer"**.
   - Cochez le champ **`messages`** dans la liste des champs d'abonnement.

---

## 🔔 5. Canal Web Push : Clés VAPID (Navigateur & PWA)

Les clés VAPID assurent la signature cryptographique standard (W3C Push) pour les alertes sur ordinateur, tablette et smartphone (Android & iOS Safari PWA).

**Aucun compte tiers payant n'est requis.**

### Clés par défaut pré-générées pour le projet :
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BM4GwlN-YJMqTEkEY_rs8kBondps-_MGdfqSn0l0GoKDAHdcJOH4858ySTvnLSS8lsOvzgNvCw3yBnV-0eDK2jk
VAPID_PRIVATE_KEY=4HXZXP8izn5ejOG1o4tMCOaM7hvS1esHMG2lq8FEmqc
VAPID_SUBJECT=mailto:admin@games-trafics.com
```

### Générer une nouvelle paire de clés à tout moment :
Dans votre terminal à la racine du projet :
```bash
bunx web-push generate-vapid-keys
```

---

## 🧪 6. Tester les Notifications depuis l'Application

1. Rendez-vous sur votre profil : `/profile/settings`.
2. Cliquez sur l'onglet **"Alertes"**.
3. Activez les canaux souhaités (In-App, WhatsApp, Email, Push).
4. Cliquez sur le bouton **"Tester"** à côté de chaque canal pour valider immédiatement la réception.
