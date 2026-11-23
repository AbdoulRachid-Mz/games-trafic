# Document 01 — Contexte Métier, Vision et Problématique (Révisé)

---

## 1. Contexte Métier de Games Trafics

**Games Trafics** est une plateforme communautaire et compétitive dédiée à l'esports et aux tournois de jeux vidéo (sur mobile, console et PC), particulièrement axée sur les scènes compétitives émergentes (notamment en Afrique francophone et à l'international).

La plateforme intègre de façon native :
1. **Un écosystème communautaire et social :** profils de joueurs (`users`), équipes/clubs pérennes (`teams`, `team_members`), historiques, interactions, notifications multicanales (In-App, WhatsApp Cloud API, Email via Resend, Web Push).
2. **Un moteur financier strict :** compte de monnaie virtuelle (GTC / Games Trafics Coins), wallet avec transactions à double entrée (`wallet_transactions`, ledger immuable), paiements d'inscriptions (`registration_payments`), distribution de prize pool via des comptes escrow (`financial_accounts`), protection par Passkey / code PIN financier et cooldowns.
3. **Un moteur de tournois et d'éditions :** création de compétitions découpées en éditions successives, gestion des inscriptions, arborescences de phases, poules et brackets éliminatoires, saisie et validation des scores, génération de visuels pour réseaux sociaux (arbres de playoffs, affiches de match).

---

## 2. La Vision : Un Moteur de Compétition Universel

Pour soutenir sa croissance, Games Trafics ne doit pas être un simple site de tournois de football ou de duels 1v1. La plateforme a pour ambition de devenir une **infrastructure universelle d'organisation compétitive**, capable d'orchestrer n'importe quel format et n'importe quel jeu vidéo :

* **Jeux de sport / duels (1v1, 2v2) :** eFootball, EA Sports FC (FIFA), NBA 2K, Rocket League.
* **Jeux de combat (Versus Fighting) :** Street Fighter 6, Tekken 8, Mortal Kombat, Super Smash Bros (arbre simple, double élimination avec repêchage, bracket reset).
* **Jeux de tir et arènes tactiques par équipe (Team vs Team) :** Call of Duty Mobile, PUBG Mobile (mode arène / SnD), Valorant, Free Fire Clash Squad (équipes de 4 ou 5 joueurs, matchs en Best-of-3 ou Best-of-5 découpés en manches/cartes).
* **Jeux multijoueurs de masse et Battle Royale (FFA - Free-For-All) :** PUBG Mobile (Classic 60-100 joueurs), Free Fire (Battle Royale 48 joueurs), Call of Duty Warzone / Warzone Mobile, Fall Guys. Dans ces modes, un match ne réunit pas 2 adversaires mais 12 à 25 escouades (ou 50 à 100 joueurs solos) directement en lice dans la même manche, avec un scoring combinant le rang de survie (placement) et les éliminations (kills).
* **Jeux de course et de vitesse :** Asphalt 9, Real Racing, Mario Kart, TrackMania (poules de 4, 8 ou 12 pilotes avec attribution de points par position).
* **Confrontations collectives (Team vs Team multi-matchs / Inter-Régions / Clan Wars) :** Chocs régionaux (ex. *Région Dakar contre Région Thiès*) ou inter-clubs où deux camps opposent leurs joueurs respectifs dans une série de sous-matchs (simples, doubles) dont les résultats sont agrégés au niveau de la rencontre globale.

---

## 3. La Problématique Actuelle

Le code de Games Trafics a connu une évolution organique rapide, partant d'un modèle centré sur les tournois de football sur console/mobile (1v1, poules aller-retour, élimination directe avec score binaire et tirs au but). 

Bien que le système dispose déjà d'atouts remarquables (moteur de progression `progression-engine.ts`, moteur de playoffs symétriques `playoffs-engine.ts`, isolation financière exemplaire), plusieurs **verrous structurels majeurs** bloquent son évolution :

### A. Le syndrome du "Participant 1 vs Participant 2"
Dans la table `matches` (`database/schema.ts:1530`), le schéma persiste deux colonnes figées :
* `participant1RegistrationId`
* `participant2RegistrationId`
* `score1` et `score2`

Ce modèle impose mathématiquement que tout match est un duel binaire entre deux entités individuelles. Il est structurellement incapable d'accueillir :
* Une manche de Battle Royale à 16 escouades ou 60 joueurs indépendants.
* Une course à 8 concurrents.
* Une confrontation collective parent englobant plusieurs sous-matchs.

### B. Confusion entre Identité, Membre de Tournoi, Inscription et Club de Jeu
Actuellement, le système fait intervenir trois entités successives :
1. `users` / `teams` : l'entité globale de la plateforme.
2. `tournamentMembers` (`database/schema.ts:1161`) : rattaché à un `tournamentId`, mélangeant arbitres, organisateurs et joueurs.
3. `editionRegistrations` (`database/schema.ts:1243`) : rattaché à un `editionId` et pointant vers un `tournamentMembers.id`.

Cette chaîne pose des difficultés fondamentales :
* Les métadonnées du participant (pseudo en jeu, équipe, avatar) sont partagées ou mal isolées entre le membre permanent et l'édition.
* Le "Club choisi dans le jeu" (ex. *Real Madrid* sur FC24) est confondu avec la véritable équipe d'esports (*FC Douane*).
* La composition d'une équipe (roster de joueurs) n'est pas figée par édition : si une équipe change de composition, cela affecte rétroactivement ses anciennes participations.
* L'invitation d'un joueur invité ou non inscrit sur la plateforme nécessite de créer un faux `tournamentMember` fantôme.

### C. Absence de séparation entre la "Confrontation" et les "Manches" (Match vs Game/Set)
* Une **Confrontation (Encounter)** oppose des adversaires dans un cadre global (Best-of-3, session de 4 cartes BR, ou choc inter-régions).
* Cette confrontation est constituée de **plusieurs Manches / Cartes (Games / Sets)**, par exemple Carte 1 (Hardpoint), Carte 2 (Search and Destroy), Carte 3 (Control).
Dans Games Trafics actuel, la table `matches` tente de représenter à la fois la confrontation globale et la partie unique, reléguant le détail des manches dans un champ `gameData: jsonb` non indexé.

### D. Surcharge sémantique de Phase et de Groupe
* Pour implémenter les championnats (League), `phase_groups` a été détourné pour que chaque journée devienne un groupe (`name: "Journée 1"`, `config.isMatchday = true`), créant une confusion entre poules de classement et calendrier temporel.

### E. Moteur de scoring implicitement footballistique
* Les critères de départage dans `standings.engine.ts` sont restreints au football (`POINTS`, `GOAL_DIFF`, `GOALS_FOR`), la règle de confrontation directe `HEAD_TO_HEAD` n'étant pas implémentée dans l'algorithme de classement réel.

---

## 4. Opportunité de la Décision Clean Slate

Toutes les anciennes compétitions et éditions étant terminées et aucun tournoi n'étant en cours, **il a été acté que les structures sportives obsolètes peuvent être supprimées**.

Cette décision supprime toute obligation de maintenir des adaptateurs de compatibilité ou du double stockage. Elle permet d'adopter directement le **Scénario Clean Slate Universel** :
1. **Sécurisation absolue du ledger financier :** Découplage de `registration_payments` pour préserver la traçabilité des `wallet_transactions` sans risque d'effacement en cascade.
2. **Purge des tables sportives obsolètes :** Nettoyage complet des tables de matchs, de nœuds de bracket, de phases et d'anciens membres.
3. **Déploiement du modèle universel sans dette technique :** Entrants dénormalisés, rosters figés, gestion native des duels, du FFA direct et des confrontations collectives, brackets DAG relationnels et Rule Engine configurable en base de données.
