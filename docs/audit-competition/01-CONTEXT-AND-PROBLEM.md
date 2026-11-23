# Document 01 — Contexte Métier, Vision et Problématique

---

## 1. Contexte Métier de Games Trafics

**Games Trafics** est une plateforme communautaire et compétitive dédiée à l'esports et aux tournois de jeux vidéo (sur mobile, console et PC), particulièrement axée sur les scènes compétitives émergentes (notamment en Afrique francophone et à l'international).

La plateforme intègre de façon native :
1. **Un écosystème communautaire et social :** profils de joueurs, équipes/clubs, historiques, fils d'actualités, interactions, notifications multicanales (In-App, WhatsApp Cloud API, Email via Resend, Web Push).
2. **Un moteur financier strict :** compte de monnaie virtuelle (GTC / Games Trafics Coins), wallet avec transactions à double entrée (ledger immuable), paiements d'inscriptions verrouillés, distribution automatisée ou semi-automatisée de prize pool, protection par Passkey / code PIN financier et cooldowns.
3. **Un moteur de tournois et d'éditions :** création de tournois récurrents découpés en éditions successives (ex. *Ligue 1 - Édition 2024*, *Tournoi de Noël - Édition 2*), gestion des inscriptions, arborescences de phases, poules et brackets éliminatoires, saisie et validation des scores, génération de visuels pour réseaux sociaux (arbres de playoffs, affiches de match).

---

## 2. La Vision : Un Moteur de Compétition Universel

Pour soutenir sa croissance, Games Trafics ne doit pas être un simple site de tournois de football ou de duels 1v1. La plateforme a pour ambition de devenir une **infrastructure universelle d'organisation compétitive**, capable d'orchestrer n'importe quel format et n'importe quel jeu vidéo :

* **Jeux de sport / duels (1v1, 2v2) :** eFootball, EA Sports FC (FIFA), NBA 2K, Rocket League.
* **Jeux de combat (Versus Fighting) :** Street Fighter 6, Tekken 8, Mortal Kombat, Super Smash Bros (arbre simple, double élimination avec repêchage, bracket reset).
* **Jeux de tir et arènes tactiques par équipe (Team vs Team) :** Call of Duty Mobile, PUBG Mobile (mode arène / SnD), Valorant, Free Fire Clash Squad (équipes de 4 ou 5 joueurs, matchs en Best-of-3 ou Best-of-5 découpés en manches/cartes).
* **Jeux multijoueurs de masse et Battle Royale (FFA - Free-For-All) :** PUBG Mobile (Classic 60-100 joueurs), Free Fire (Battle Royale 48 joueurs), Call of Duty Warzone / Warzone Mobile, Fall Guys. Dans ces modes, un match ne réunit pas 2 adversaires mais 12 à 25 escouades (ou 50 à 100 joueurs solos) dans la même manche, avec un scoring combinant le rang de survie (placement) et les éliminations (kills).
* **Jeux de course et de vitesse :** Asphalt 9, Real Racing, Mario Kart, TrackMania (poules de 4, 8 ou 12 pilotes avec attribution de points par position).

L'organisateur d'un tournoi sur Games Trafics doit pouvoir concevoir, paramétrer et lancer des compétitions avec une autonomie totale, un calcul de classement infaillible et une progression automatisée d'étape en étape.

---

## 3. La Problématique Actuelle

Le code de Games Trafics a connu une évolution organique rapide, partant d'un modèle centré sur les tournois de football sur console/mobile (1v1, poules aller-retour, élimination directe avec score binaire et tirs au but). 

Bien que le système dispose déjà d'atouts remarquables (moteur de progression `progression-engine.ts`, moteur de playoffs symétriques `playoffs-engine.ts`, isolation financière exemplaire), plusieurs **verrous structurels majeurs** limitent son évolution :

### A. Le syndrome du "Participant 1 vs Participant 2"
Dans la table `matches` (`database/schema.ts:1530`), le schéma persiste deux colonnes figées :
* `participant1RegistrationId`
* `participant2RegistrationId`
* `score1` et `score2`

Ce modèle impose mathématiquement que tout match est un duel binaire entre deux entités individuelles. Il est structurellement incapable d'accueillir :
* Une manche de Battle Royale à 16 escouades ou 60 joueurs.
* Une course à 8 concurrents.
* Un match FFA de Smash Bros ou de jeux de cartes à 4.

### B. Confusion entre Identité, Membre de Tournoi et Inscription à l'Édition
Actuellement, le système fait intervenir trois entités successives :
1. `users` / `teams` : l'entité globale de la plateforme.
2. `tournamentMembers` (`database/schema.ts:1161`) : rattaché à un `tournamentId`.
3. `editionRegistrations` (`database/schema.ts:1243`) : rattaché à un `editionId` et pointant vers un `tournamentMembers.id`.

Cette chaîne pose des difficultés fondamentales :
* Les métadonnées du participant (pseudo en jeu, équipe, avatar de compétition) sont partagées ou mal isolées entre le membre permanent et l'édition.
* La composition d'une équipe (roster de joueurs) n'est pas figée par édition : si une équipe change de composition, cela affecte rétroactivement ses anciennes participations.
* L'invitation d'un joueur invité ou non inscrit sur la plateforme nécessite de créer un faux `tournamentMember` fantôme.

### C. Absence de séparation entre la "Confrontation" et les "Manches" (Match vs Game/Set)
Dans les compétitions modernes (esports comme traditionnelles) :
* Une **Confrontation / Rencontre (Encounter / Series)** oppose l'Équipe A et l'Équipe B en Best-of-3 (BO3).
* Cette confrontation est constituée de **plusieurs Manches / Cartes (Games / Sets)**, par exemple Carte 1 (Hardpoint), Carte 2 (Search and Destroy), Carte 3 (Control).
* Chaque manche possède ses propres scores, ses statistiques et ses données spécifiques.

Dans Games Trafics actuel, la table `matches` tente de représenter à la fois la confrontation globale et la partie unique, reléguant le détail des manches ou des statistiques individuelles dans un champ `gameData: jsonb` non indexé, ou forçant la création de lignes de match artificielles sans hiérarchie claire.

### D. Rigidité du modèle de Phase et de Groupe
Le concept de phase et de groupe est actuellement surchargé :
* Pour implémenter les journées de championnat (League), l'architecture a dû détourner `phase_groups` pour que chaque journée devienne un groupe (`name: "Journée 1"`, `config.isMatchday = true`), tandis que dans un tournoi de poules classique, `phase_groups` représente une véritable poule physique (Groupe A, Groupe B).
* Cette surcharge sémantique complique le calcul des classements transversaux et fragilise les algorithmes de qualification.

### E. Moteur de scoring implicitement footballistique
Bien que `lib/tournaments/scoring.ts` et `lib/tournaments/standings.engine.ts` permettent de configurer `pointsPerWin`, `pointsPerDraw`, et `pointsPerLoss`, les critères de départage par défaut (`POINTS`, `GOAL_DIFF`, `GOALS_FOR`) et les champs de `phaseGroupParticipants` (`scoreFor`, `scoreAgainst`, `scoreDifference`) restent sémantiquement ancrés dans le lexique du football. Un jeu comme PUBG Mobile (Score = Points de kill + Points de rang) ou TrackMania nécessite un moteur de scoring générique et enfichable.

---

## 4. Les Enjeux de la Refonte

Pour transformer Games Trafics en référence incontournable de l'organisation esports, l'architecture cible doit satisfaire à 5 exigences non négociables :

1. **Universalité des formats :** Prendre en charge nativement le 1v1, le Team vs Team, le FFA (Battle Royale, Racing), les Poules, les Championnats, les Brackets Simple/Double Élimination, le Système Suisse et les formats hybrides (ex. Phase de Poules qualifiant vers un Bracket Éliminatoire).
2. **Intégrité et Traçabilité financière :** Toute inscription payante, désistement ou gain de prize pool doit demeurer rigoureusement lié au ledger financier sans faille.
3. **Continuité de service et rétrocompatibilité :** Les dizaines de tournois et d'éditions déjà créés sur la plateforme ne doivent pas être détruits ou rendus illisibles.
4. **Ergonomie pour l'organisateur :** Réduire la complexité administrative via des assistants de génération intelligents, des prévisualisations fiables et une automatisation sans friction de la progression.
5. **Performance et scalabilité :** Permettre le calcul instantané de classements de milliers de participants et le rafraîchissement d'arbres complexes sur terminaux mobiles sans latence.
