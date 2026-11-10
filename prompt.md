# AUDIT ET REFONTE COMPLÈTE DES MODULES CHATS, INBOX ET GAME CLIPS — GAMES-TRAFICS

## 1. Objectif général

Réaliser un audit approfondi et une amélioration complète des modules Chats, Inbox et Game Clips de Games-Trafics.

Le travail doit couvrir :
- Architecture et organisation des composants.
- Logique métier et permissions.
- Actions serveur, API et requêtes SQL.
- Gestion du cache des données et des médias.
- Optimisation du chargement des messages et vidéos.
- Optimisation du rendu React et des animations.
- Fluidité des interactions.
- Responsive design et ergonomie mobile.
- Gestion des erreurs, reprises et états de chargement.
- Sécurité et validation serveur.

Ne pas effectuer une simple refonte graphique. Corriger les problèmes structurels et fonctionnels identifiés.

## 2. Module Chats et Inbox

### 2.1 Architecture des conversations

Auditer et distinguer clairement :
- Conversations privées entre deux utilisateurs.
- Discussions de groupes.
- Discussions associées aux entités : shops, tournaments, editions, produits, clips et autres entités compatibles.

Chaque type de conversation doit conserver ses règles d'accès, ses participants et ses métadonnées.

Éviter les duplications de conversations, les incohérences entre `messages`, `conversations`, `groups` et `groupMembers`, ainsi que les relations ambiguës.

### 2.2 Envoi local-first

Mettre en place un véritable système d'envoi optimiste :

1. Création immédiate d'un message temporaire.
2. Affichage immédiat dans la conversation.
3. Statut `sending`.
4. Envoi asynchrone au serveur.
5. Confirmation et remplacement par le message persistant.
6. En cas d'échec, conservation du message et affichage d'une icône de retry à proximité.
7. Nouvelle tentative avec le même identifiant client/idempotency key.
8. Éviter absolument les doublons lors des reprises.

Gérer les envois multiples, les interruptions réseau, les changements de conversation, les actualisations et les reprises après reconnexion.

Ne jamais perdre silencieusement un message déjà saisi ou affiché.

### 2.3 Chargement des messages

Remplacer les chargements inadaptés par une pagination efficace, idéalement cursor-based, avec TanStack Query.

Prévoir :
- Chargement initial rapide des messages récents.
- Chargement des anciens messages en remontant.
- Préservation exacte de la position de scroll lors du chargement historique.
- Insertion des nouveaux messages sans recharger toute la conversation.
- Déduplication par identifiant.
- Tri chronologique cohérent.
- Cache séparé par conversation.
- Préchargement raisonnable des conversations récemment consultées.
- Revalidation ciblée.

Éviter les refetch globaux trop fréquents et les requêtes inutiles.

Évaluer les index SQL nécessaires pour les recherches, les messages privés, les groupes, les discussions d'entités et les tris chronologiques.

Ne pas charger inutilement les relations complètes des utilisateurs ou des entités pour chaque message.

### 2.4 Règles et administration des groupes

Créer un système configurable de permissions :

- Qui peut envoyer des messages.
- Qui peut envoyer des images, vidéos et fichiers.
- Qui peut ajouter ou retirer des membres.
- Qui peut modifier les informations du groupe.
- Qui peut modifier les permissions.
- Qui peut épingler ou supprimer des messages.
- Possibilité de passer le groupe en lecture seule.
- Possibilité d'autoriser certains membres individuellement.

Prévoir les rôles OWNER, ADMIN et MEMBER ainsi que des permissions complémentaires sans multiplier inutilement les rôles.

Toutes les règles doivent être appliquées côté serveur, y compris lorsque les actions sont appelées directement.

Créer une interface de paramètres du groupe claire et adaptée au mobile.

### 2.5 Gestion des membres

Améliorer :
- Liste complète des membres.
- Recherche et filtres.
- Affichage des rôles.
- Gestion des administrateurs.
- Ajout et retrait de membres.
- Consultation des profils.
- Démarrage d'une conversation privée depuis un membre.
- Gestion des états de chargement et des erreurs.

### 2.6 Discussions des entités et Inbox

Pour les discussions liées aux shops, tournaments, editions et autres entités :

- Pouvoir consulter les participants ayant déjà discuté.
- Afficher leur profil et leur identité.
- Démarrer une conversation privée directement depuis cette liste.
- Distinguer participants d'une discussion et membres d'un groupe.
- Ne pas créer de conversations privées automatiquement sans action explicite.
- Conserver une navigation cohérente entre la discussion d'entité et l'Inbox.

Optimiser `getConversationsForUser()` pour supprimer les effets N+1 et récupérer les entités par lots.

Implémenter réellement les actions d'épinglage, de masquage, de mise en sourdine, d'archivage et de suppression lorsqu'elles sont proposées dans l'interface.

### 2.7 Cache des médias de chat

Auditer les mécanismes existants et mettre en place une stratégie cohérente pour :
- Images.
- Miniatures.
- Audios.
- Vidéos.
- Fichiers.

Utiliser chargement différé, miniatures, cache HTTP/CDN, préchargement conditionnel et cache local maîtrisé.

Éviter les téléchargements répétés lors des changements de conversation.

Respecter les paramètres de téléchargement automatique et les contraintes de confidentialité.

Prévoir :
- Compression avant upload.
- Progression par fichier.
- Annulation.
- Reprise lorsque possible.
- Gestion des erreurs.
- Nettoyage des ressources temporaires.
- Limitation de consommation mémoire et réseau.

Un upload ne doit pas empêcher l'affichage immédiat du message optimiste.

## 3. Module Game Clips

### 3.1 Feed et pagination

Améliorer le chargement infini :

- Première page rapide.
- Préchargement de la prochaine page avant la fin du feed.
- Déduplication.
- Conservation de la position active.
- Pas de duplication artificielle des clips déjà consultés.
- Gestion correcte de la fin du feed.
- Gestion des erreurs et retry.
- Rafraîchissement sans perdre inutilement la position de lecture.

### 3.2 Chargement vidéo progressif

Créer une stratégie de chargement selon la position du clip :

- Clips éloignés : miniature uniquement.
- Clip suivant : préchargement léger.
- Clip actif : chargement prioritaire et lecture.
- Clip précédent : conservation temporaire si utile.
- Clips devenus inutiles : libération des ressources.

Limiter le nombre de vidéos montées et actives simultanément.

Ne jamais bloquer le swipe en attendant une vidéo.

Afficher immédiatement une miniature ou un placeholder pendant le chargement.

Gérer correctement les événements `loadstart`, `loadedmetadata`, `canplay`, `waiting`, `playing`, `pause`, `ended` et `error`.

### 3.3 Lecteur et progression

Améliorer la barre de progression :
- Précision.
- Fluidité.
- Faible coût de rendu.
- Distinction buffering/lecture.
- Synchronisation avec la vidéo.
- Gestion pause/reprise.
- Gestion des médias multiples.
- Adaptation responsive.

Éviter un `setState` React trop fréquent pour chaque mise à jour de progression si une mise à jour visuelle directe ou un mécanisme plus léger est préférable.

### 3.4 Swipe et navigation

Auditer :
- Swipe vertical.
- Scroll snap.
- Navigation précédente/suivante.
- Navigation clavier desktop.
- IntersectionObserver.
- Préchargement du prochain clip.
- Transitions.
- Gestion des gestes et conflits avec les boutons.
- Reprise après ouverture des commentaires.

Le clip actif doit être unique et sa lecture doit rester synchronisée avec le moteur.

### 3.5 Interactions

Auditer et finaliser :
- Likes.
- Bookmarks.
- Commentaires.
- Partage.
- Téléchargement.
- Vues.
- Profil auteur.
- Informations du jeu.
- Liste des personnes ayant interagi.

Utiliser des mises à jour optimistes avec rollback en cas d'échec.

Éviter les requêtes séparées et répétées par clip pour récupérer les statistiques lorsque les données peuvent être récupérées en lots.

### 3.6 Gestion des stores

Auditer `useClipEngineStore` et `useGameClipsStore`.

Déterminer clairement la responsabilité de chaque store et supprimer les sources de vérité concurrentes.

Ne pas persister des états transitoires inutiles.

Éviter les états obsolètes lors du changement de clip et les timers non nettoyés.

## 4. Design et responsive

Créer une identité visuelle Games-Trafics inspirée des bonnes conventions de WhatsApp, Messenger, TikTok et Reels, sans reproduire leurs interfaces.

Chats :
- Bulles modernes.
- Statuts d'envoi.
- Actions de message.
- Réponses et réactions.
- Inbox lisible.
- Sidebar adaptée.
- Groupes et profils cohérents.
- Composer compact et ergonomique.

Clips :
- Lecteur immersif.
- Contrôles discrets.
- Progression lisible.
- Actions tactiles accessibles.
- Panneau commentaires adapté.
- Transitions fluides.

Tester au minimum 320, 375, 390, 430, 768, 1024 et 1280 px.

Tenir compte de `100dvh`, des safe areas et du clavier mobile.

Éviter les hauteurs fixes inutiles, les débordements et les boutons trop petits.

Respecter le design system existant.

## 5. Performances

Mesurer et optimiser :
- Nombre de requêtes.
- Taille des réponses.
- Temps de première ouverture.
- Nombre de composants montés.
- Re-renders.
- Mémoire vidéo.
- Cache navigateur.
- Cache TanStack Query.
- Chargements réseau.
- Temps de transition entre clips.
- Latence d'envoi des messages.

Utiliser la virtualisation lorsque nécessaire, mais préserver les comportements de scroll et de lecture.

Ne pas ajouter une bibliothèque supplémentaire sans justifier sa nécessité.

## 6. Tests obligatoires

Chats :
- Envoi texte.
- Envoi image.
- Envoi audio.
- Échec réseau et retry.
- Plusieurs envois rapides.
- Message reçu pendant le scroll.
- Chargement historique.
- Groupe privé.
- Groupe en lecture seule.
- Membre autorisé et non autorisé.
- Promotion/démotion.
- Retrait d'un membre.
- Discussion d'entité.
- Passage d'une discussion d'entité à l'Inbox.
- Cache média.
- Reconnexion.

Clips :
- Feed vide.
- Feed avec plusieurs pages.
- Fin de feed.
- Chargement vidéo lent.
- Erreur vidéo.
- Swipe rapide.
- Retour au clip précédent.
- Pause/reprise.
- Ouverture des commentaires.
- Like/bookmark optimiste.
- Perte de réseau.
- Changement d'orientation.
- Passage en arrière-plan.
- Mémoire et libération des vidéos.

Responsive :
- Mobile étroit.
- Mobile standard.
- Tablette.
- Desktop.
- Clavier mobile ouvert.
- Safe areas.

## 7. Livrables

Avant de modifier :
- Cartographie des fichiers concernés.
- Audit des flux existants.
- Problèmes confirmés.
- Problèmes potentiels à vérifier.
- Plan de correction.

Après modification :
- Architecture finale.
- Fichiers modifiés.
- Corrections réalisées.
- Éventuelles migrations.
- Tests exécutés.
- Résultats des tests.
- Problèmes restant à résoudre.

Ne pas supprimer une fonctionnalité existante sans raison métier documentée.

Ne pas inventer une nouvelle architecture avant d'avoir compris et vérifié celle qui existe.

Ne pas considérer un composant visuellement terminé si ses actions ne fonctionnent pas réellement.

L'objectif final est d'obtenir des modules Chats et Clips robustes, rapides, maintenables et prêts pour une utilisation intensive en production.