🧠 PROMPT FINAL — CORRECTION FORMULAIRES + BULK + LOGIQUE TOURNOI AVANCÉE
🎯 OBJECTIF

Corriger et améliorer tous les formulaires de création (phases, groupes, bracketNodes, matches,edtition results) + les bulk components pour qu’ils soient :

cohérents avec la refactorisation actuelle
alignés avec une vraie logique de tournoi
capables de gérer :
création manuelle
génération automatique
création progressive
validation intelligente

⚠️ IMPORTANT :
Ne pas recréer → adapter et enrichir l’existant

1️⃣ 🔧 PROBLÈME PRINCIPAL

Les formulaires actuels :

❌ ne tiennent pas compte des nouvelles relations
❌ ne respectent pas la hiérarchie (édition → phase → groupe → bracket → match)
❌ permettent des incohérences (doublons, participants invalides)
❌ ne supportent pas correctement les bulk
2️⃣ 🧩 NOUVELLE LOGIQUE GLOBALE
👉 Chaque niveau DOIT dépendre de son parent direct :
Entité	Source des participants
Phase	Edition
Groupe	Phase
BracketNode	Groupe
Match	BracketNode / Groupe
edition results	

⚠️ RÈGLE CRITIQUE :

❌ On ne récupère JAMAIS directement depuis l’édition si un parent existe
✅ Toujours filtrer depuis le parent direct

3️⃣ ⚙️ MODE DE GESTION (OBLIGATOIRE)

Ajouter dans TOUS les formulaires + bulk :

🎚️ Mode :
1. AUTO
l’utilisateur définit :
nombre d’éléments
type (round robin / elimination)
le système génère automatiquement
2. MANUEL
l’utilisateur construit lui-même :
via des cards dynamiques
ajout/suppression libre
4️⃣ 🧱 BULK COMPONENTS — NOUVELLE LOGIQUE
📌 Comportement global

Chaque bulk doit permettre :

➕ ajouter une card
➖ supprimer une card
🔁 modifier dynamiquement
⚠️ validation temps réel
📌 Création progressive

➡️ On ne crée PAS en base immédiatement
➡️ On construit un state local (draft)
➡️ On submit → création réelle

5️⃣ 🎮 CAS SPÉCIFIQUES PAR NIVEAU
🧩 PHASES
MODE AUTO :
création automatique :
ex: Group Stage + Knockout

👉 génère :

phase 1 (round robin)
phase 2 (elimination)
MODE MANUEL :
ajouter plusieurs phases (cards)
chaque card contient :
nom
type
config
les autres infos (dans la table phases de la base de données: schema.ts)

⚠️ validation :

pas de doublon de nom
🧩 GROUPES
MODE AUTO :
nombre de groupes basé sur participants
distribution automatique
MODE MANUEL :
cards de groupes
possibilité :
nom personnalisé
participants assignés

⚠️ validation :

pas de groupes avec mêmes participants
pas de noms dupliqués
🧩 BRACKET NODES (TRÈS IMPORTANT)

👉 ici :

⚠️ un bracketNode = un sous-groupe de matches (pas juste un match)

MODE MANUEL :
création de cards de bracketNodes
chaque node contient :
liste participants
matches internes
validation :
pas de duplication de participants
pas de nodes identiques
🧩 MATCHES (CAS CRITIQUE)
MODE MANUEL :

Dans un bracketNode :

👉 bouton ➕ "Ajouter match"

comportement :
crée une card vide
auto-remplit :
joueur 1 (random ou premier dispo)
utilisateur choisit :
joueur 2
actions :
modifier joueur 1
modifier joueur 2
supprimer match
⚠️ VALIDATIONS OBLIGATOIRES :
joueur1 ≠ joueur2
match unique :
(A vs B) interdit si déjà existant
(B vs A) interdit aussi
⚠️ ALERTES :
duplication → warning immédiat
participants invalides → blocage
6️⃣ 🔁 LOGIQUE PAR FORMAT DE TOURNOI
🟣 ROUND ROBIN

👉 structure :

1 phase
plusieurs journées
chaque journée :
plusieurs matches
🔴 ELIMINATION

👉 structure :

arbre (bracket)
nodes reliés
progression automatique

⚠️ Les formulaires doivent adapter leur UI selon :

phaseType === "ROUND_ROBIN"
phaseType === "ELIMINATION"
7️⃣ 🎯 FILTRAGE DES PARTICIPANTS
RÈGLE ABSOLUE :
MATCH / NODE :

➡️ participants = uniquement ceux du groupe parent

❌ INTERDIT :
utiliser tous les participants de l’édition
✅ OBLIGATOIRE :
participants = groupParticipants
8️⃣ ⚠️ GESTION DES DOUBLONS (GLOBAL)

Ajouter un système global de détection :

Cas à détecter :
match dupliqué
node dupliqué
groupe dupliqué
phase dupliquée
UX :
warning visuel
blocage si critique
9️⃣ 🎨 UX À RESPECTER

Chaque bulk doit avoir :

cards modernes
ajout fluide
suppression rapide
feedback visuel
🔟 🔥 AMÉLIORATIONS À AJOUTER (IMPORTANT)

Tu peux enrichir avec :

✅ shuffle automatique des participants
✅ génération intelligente :
éviter répétitions
équilibrer
✅ prévisualisation avant submit
✅ compteur dynamique :
participants utilisés
restants
✅ RÉSULTAT FINAL ATTENDU

Un système :

propre
flexible
scalable
réaliste (niveau esport pro)
sans incohérences
utilisable en manuel OU automatique