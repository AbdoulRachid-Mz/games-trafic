salut on va corriger un peu la logique de progression pour les groupes des phases type elemination. le probleme avec la logique de 

mark-complete-dialog.tsx
est que ca fait presque bien pour progression/transition d'une phase a une autre. mais pour les phase type elemination, c'est les groupes qui gerent les niveaux: 1/16, 1/8 1/4 1/2 et finale. donc on a besoin a chaque fin de groupe, on fait une nouvelle structure pour le niveau suivant avec les participants qualifies. pour ce faire j'ai fait en sorte que les brackets recuperent les brackets pour chaque brackets, on utilise les participants qualifies car on peut avoir un niveau  de bracket avec plusieurs matches (surtout si c'est aller-retour donc des la structure de base on fait on sorte que chaque bracket soit calcule selon les matches et le groupes recupere les tous les participants qualifies de chaque brackets, on qualifie selon la logique de chaque niveau: eg: de 1/4 contient generalement 8 participants, 1/3 finale 4 et finale 2 participants. donc on part de cette logique et y'a nombre impaire on demande a l'organisateur de faire un barrage pour equilibrer la puissance 2. mais le plus grand probleme ici est que quand on marque comme complet un groupe, ca ne cree pas la structure du niveau supperieur en repartissant les participants dans les brackets et cree les matches convenus generalement la structure est cree mais c'est les participants qu'on a du mal a envoie au niveau supperieur et la creation de matches. donc quand on complete un groupe, on s'assure que le groupe suivant est bien mis en place avec les matches brackets et matches. apres cela le deuxieme probleme c'est la correction du design 

edition-detail-header.tsx
dont le carousel n'est pas stable. on peut utiliser 

carousel.tsx
si ca fait bien avec defilement auto. apres on corrige le 

edition-standings-tab.tsx
pour afficher les autres  donnees meme aux ecrans mobiles on ajoute un overflow-x-auto si ca deborde et on reduit la taille a part des mobile: md on reduit encore pour sm. apres cela on corrige le desgin 

organize-wizard-client.tsx
surtout le calcul et la limitation selon le type choisi, participants selectionnes, aller simple ou aller-retour et les options choisis (si matches non coches, on calcule pas avec les matches, pareil pour brackets) et dans preview aussi. on arrange egalement le range/progress nombre de groupes et limite par group. on doit avoir minimun 2 participants par group et on calcule bien la limite des participants par groupes: eg: pour 3 participants par groups qualification doit etre calculee selon le type et pour 3 participants max 2 vont qualifes et minimum 1; pour 4 participants par group max 3 et min 1 etc... et on calcule bien que ce soit au niveau de button deploiement ou bien au niveau de preview. apres on corrige 

match-generation-dialog.tsx
qui n'a jamais marche dans les page 

page.tsx

page.tsx

page.tsx
 car il est toujours desactive. ici on fait en sorte que quand on clique pour genere une nouvelle  structure, on verifie et demande si un groupe/phase/bracket a deja une structure on demande de la reinitialiser pour creer une nouvelle. on accepte, on ouvre le dialog pour configurer la nouvelle structure on genere selon cette structure. si un groupe a deja une structure mais  sans matches, on peut generer les matches les la structure existante sans meme reinitialiser. donc c'est trois options que je veux pour ce composent. donc il faut d'abord tout analyser pour bien contextualiser les differentes logiques: ref: 
 
 actions:

tournaments.ts

editions.ts

phases.ts

edition-detail

participants.ts

 hooks:
use-match-manager.ts

use-bracket-manager.ts

use-phase-manager.ts

use-edition-manager.ts

use-tournaments.ts

lib/tournaments

tournaments

pages et composents: 

page.tsx

/tournaments/[tournamentId]/editions/[editionId]/dashboard/organize

page.tsx

page.tsx

page.tsx

page.tsx
etc...