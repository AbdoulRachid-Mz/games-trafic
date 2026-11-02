# 📱 Documentation des Pages et Layouts — Games-Trafics

Bienvenue dans la documentation d'architecture du répertoire \pp/\ de **Games-Trafics**.
Cette documentation décrit l'organisation du routage Next.js (App Router), la hiérarchie des layouts, les protections de routes et les flux de navigation.

---

## 1. Vue d'Ensemble du Routage

L'application Games-Trafics utilise Next.js 16.4.3 avec l'App Router.
Les routes sont réparties en quatre grandes catégories d'accès :

| Catégorie | Préfixe / Emplacement | Description | Protection |
|---|---|---|---|
| **Publique** | \/\, \/games\, \/game-clips\, \/shops\, \/partners\, \/services\, \/welcome\ | Accessible à tous les visiteurs sans authentification. | Aucune (libre accès). |
| **Authentification** | \/sign-in\, \/sign-up\, \/forgot-password\, \/reset-password\, \/error\ | Parcours de connexion et d'inscription avec redirection sécurisée. | Redirige vers la destination cible ou \/profile\ si déjà connecté. |
| **Protégée (Membre)** | \/dashboard\, \/wallet\, \/profile\, \/chats\ | Espace personnel, gestion du portefeuille gaming, transactions, messagerie. | Session active obligatoire via \proxy.ts\ et \pp/(protected)/layout.tsx\. |
| **Administration** | \/admin/**\ | Gestion globale de la plateforme, modération, administration des tournois. | Rôle \ADMIN\ obligatoire vérifié côté serveur. |

---

## 2. Diagramme Mermaid des Routes et Layouts

\\\mermaid
flowchart TD
    RootLayout["Root Layout (app/layout.tsx)<br/>ThemeProvider, AuthProvider, AppShell"]
    
    RootLayout --> PublicPages["Pages Publiques<br/>/, /games, /game-clips, /shops, /services"]
    RootLayout --> AuthPages["Groupe (auth)<br/>/sign-in, /sign-up, /forgot-password"]
    RootLayout --> ProtectedGroup["Groupe (protected) (app/(protected)/layout.tsx)<br/>Vérification serveur de session"]
    RootLayout --> AdminGroup["Groupe admin (app/admin/layout.tsx)<br/>Vérification serveur du rôle admin"]
    RootLayout --> Tournaments["Tournois (app/tournaments/)<br/>Consultation publique & Inscriptions membres"]

    ProtectedGroup --> Dashboard["/dashboard/** (Statistiques, Achats)"]
    ProtectedGroup --> Wallet["/wallet/** (Solde, Transactions, QR)"]
    ProtectedGroup --> Profile["/profile/** (Profil joueur, Paramètres)"]
    
    AdminGroup --> AdminTournaments["/admin/tournaments"]
    AdminGroup --> AdminUsers["/admin/users"]
\\\

---

## 3. Rôle des Layouts et Composants Shell

### \pp/layout.tsx\ (Root Layout)
- Point d'entrée de toute l'application.
- Injecte les contextes React : \AuthProvider\, \AppProvider\, \ChatProvider\, \ChatThemeProvider\.
- Enveloppe le contenu dans le composant \AppShell\.

### \components/layout/app-shell.tsx\
- **Coordination UI** : affiche la barre de navigation supérieure (\TopMiddle\), la barre latérale (\LeftBar\), le dock flottant et les boutons d'action rapide (\FABAction\).
- **Étape de Bienvenue (\/welcome\)** :
  - Par défaut, si \gt_welcome_visited\ n'est pas présent dans le \localStorage\, l'utilisateur est redirigé vers \/welcome\.
  - **Omission autorisée** : Si l'URL contient \skipWelcome=1\, \skip_welcome=true\ ou \ignore_visite=true\, cette étape est ignorée sans bloquer le parcours.
- **Performance** : Les pages publiques sont rendues sans attendre les vérifications privées superflues.

### \pp/(protected)/layout.tsx\
- Contrôle côté serveur (Server Component) garantissant que la session utilisateur est active via \uth.api.getSession\.
- En cas d'absence de session, redirection immédiate vers \/sign-in\.

### \pp/admin/layout.tsx\
- Vérifie la session ET le rôle \ADMIN\ via les métadonnées de session.
- Empêche tout affichage ou fuite de composant sensible aux utilisateurs non autorisés.

---

## 4. Conventions de Redirection Sécurisée

Toutes les redirections d'authentification et de parcours métier doivent utiliser l'utilitaire \lib/routes/safe-redirect.ts\ :

\\\	ypescript
import { getSafeRedirectUrl } from '@/lib/routes/safe-redirect';

// Empêche les attaques Open Redirect (CWE-601)
const destination = getSafeRedirectUrl(searchParams.get('redirect'), '/profile');
router.push(destination);
\\\

- **Paramètres supportés** : \edirect\, \eturnTo\, \callbackUrl\.
- **Règles de sécurité** : Rejet strict des domaines externes (\https://\), des URL protocol-relative (\//attacker.com\) et des caractères d'injection CRLF.