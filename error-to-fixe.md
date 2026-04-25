1. Corriger markGroupCompleteAction (dans phases.ts)
C'est ici que la magie de la progression doit opérer. Quand un groupe (ex: 1/8) se termine, on prend les gagnants des brackets, on les passe au groupe suivant (ex: 1/4), on fait le tirage et on génère les matchs.

Remplace la gestion du phaseType === "ELIMINATION" dans markGroupCompleteAction par ceci :

TypeScript
      // 🧠 PROPAGATION vers le groupe suivant (pour élimination en mode UEFA)
      if ((phaseType === "ELIMINATION" || phaseType === "KNOCKOUT") && qualifiedRegistrationIds.length > 0) {
        const nextGroup = await tx.query.phaseGroups.findFirst({
          where: and(
            eq(phaseGroups.phaseId, group.phaseId),
            eq(phaseGroups.order, group.order + 1), // Le tour suivant (ex: 1/4 après 1/8)
            eq(phaseGroups.isDeleted, false),
          ),
        });

        if (nextGroup) {
          // 1. Ajouter les qualifiés au groupe suivant
          for (const regId of qualifiedRegistrationIds) {
            const existing = await tx.query.phaseGroupParticipants.findFirst({
              where: and(
                eq(phaseGroupParticipants.groupId, nextGroup.id),
                eq(phaseGroupParticipants.registrationId, regId),
              ),
            });
            if (!existing) {
              await tx.insert(phaseGroupParticipants).values({
                groupId: nextGroup.id,
                registrationId: regId,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          }

          // 2. Configuration du tirage et des matchs
          const nextGroupConfig = (nextGroup.config as any) || {};
          const isHomeAway = options.isHomeAway !== undefined ? options.isHomeAway : (nextGroupConfig.isHomeAway || false);
          const matchFormat = options.matchFormat !== undefined ? options.matchFormat : (nextGroupConfig.matchFormat || "BEST_OF_1");
          // Si AUTO, on peut forcer RANDOM. Si MANUEL, on respecte le choix de l'orga.
          const seedingMethod = options.seedingMethod || nextGroupConfig.seedingMethod || "RANDOM"; 

          // 3. Tirage au sort (Répartition)
          let shuffledParticipants = [...qualifiedRegistrationIds];
          if (seedingMethod === "RANDOM") {
            // Utiliser ta fonction shuffle importée
            shuffledParticipants = shuffle(shuffledParticipants);
          }

          // 4. Création des Brackets (Nœuds) et des Matchs pour le tour suivant
          const matchCount = Math.floor(shuffledParticipants.length / 2);
          
          // Nettoyer les anciens brackets vides s'il y en a pour éviter les doublons
          await tx.delete(bracketNodes).where(eq(bracketNodes.groupId, nextGroup.id));

          for (let matchIdx = 0; matchIdx < matchCount; matchIdx++) {
            const p1 = shuffledParticipants[matchIdx * 2];
            const p2 = shuffledParticipants[matchIdx * 2 + 1];

            if (!p1 || !p2) continue;

            // Créer le bracket
            const [node] = await tx
              .insert(bracketNodes)
              .values({
                phaseId: group.phaseId,
                groupId: nextGroup.id,
                nodeCode: `${nextGroup.order + 1}-${matchIdx + 1}`,
                round: nextGroup.order + 1,
                matchNumber: matchIdx + 1,
                bracketType: "UPPER",
                order: matchIdx,
                metadata: {
                  requiresMatch: true,
                  matchFormat: matchFormat,
                  isHomeAway: isHomeAway,
                  format: isHomeAway ? "HOME_AWAY" : matchFormat,
                  participants: [p1, p2],
                },
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .returning();

            // Générer les matchs (1 pour aller simple, 2 pour aller-retour)
            const matchesToCreate = isHomeAway ? 2 : 1;
            for (let mIdx = 0; mIdx < matchesToCreate; mIdx++) {
              await tx.insert(matches).values({
                editionId: group.phase?.editionId,
                phaseId: group.phaseId,
                groupId: nextGroup.id,
                bracketNodeId: node.id,
                participant1RegistrationId: mIdx === 0 ? p1 : p2, // Inversion domicile/extérieur au retour
                participant2RegistrationId: mIdx === 0 ? p2 : p1,
                matchCode: matchesToCreate > 1 ? `${node.nodeCode}-L${mIdx + 1}` : node.nodeCode,
                status: "PENDING",
                round: nextGroup.order + 1,
                matchNumber: matchIdx + 1,
                metadata: { format: isHomeAway ? "HOME_AWAY" : matchFormat, leg: mIdx + 1 },
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          }

          // Mettre à jour les stats du groupe suivant
          await tx.update(phaseGroups)
            .set({ participantCount: shuffledParticipants.length, matchCount, updatedAt: new Date() })
            .where(eq(phaseGroups.id, nextGroup.id));
        }
      }
2. Nettoyer markBracketNodeCompleteAction (dans phases.ts)
Puisque la progression se fait à la fin du Groupe, le nœud (Bracket) ne doit pas essayer de pousser le joueur vers un nœud parent direct. Il doit juste déterminer le gagnant.

Dans markBracketNodeCompleteAction, supprime tout ce bloc qui cause un conflit :

TypeScript
      // 🧠 PROPAGATION VERS LE NŒUD PARENT (arbre de bracket)
      if (node.parentNodeId) { ... }
Garde uniquement l'enregistrement du vainqueur (winnerRegistrationId) et la mise à jour des editionResults. Le nœud a fini son travail, il attend que le Groupe entier soit clôturé pour que markGroupCompleteAction prenne le relais.

3. Corriger la détection des entités en attente checkPendingEntitiesAction (dans phases.ts)
C'est ce qui bloquait ta finale. Le système vérifiait mal si les groupes étaient terminés.

Remplace la partie if (type === "PHASE") par cette version plus fiable :

TypeScript
    if (type === "PHASE") {
      const groups = await db.query.phaseGroups.findMany({
        where: and(eq(phaseGroups.phaseId, id), eq(phaseGroups.isDeleted, false)),
      });

      for (const group of groups) {
        // On récupère les matchs rattachés à ce groupe
        const groupMatches = matchesList.filter(m => m.groupId === group.id);
        
        // Si le groupe a des participants prévus mais aucun match généré, c'est bloquant
        if (groupMatches.length === 0 && group.participantCount > 0) {
          pendingEntities.push({
            type: "GROUP",
            id: group.id,
            label: group.name || `Groupe ${group.order}`,
            reason: "Aucun match généré",
          });
          continue;
        }

        // S'il y a des matchs non terminés
        if (hasPending(groupMatches)) {
          pendingEntities.push({
            type: "GROUP",
            id: group.id,
            label: group.name || `Groupe ${group.order}`,
            reason: "Matchs non terminés",
          });
        }
      }
    }
4. Corriger checkIfLastMatchForWinner (dans tournaments.ts)
Cette fonction doit savoir que dans ton système, s'il n'y a pas de nextGroup, c'est que c'est la finale.

TypeScript
    if (currentNode.phase?.phaseType === "ELIMINATION") {
      // Dans ton architecture, on vérifie s'il y a un groupe (tour) suivant
      const nextGroup = await db.query.phaseGroups.findFirst({
        where: and(
          eq(phaseGroups.phaseId, currentNode.phaseId),
          gt(phaseGroups.order, currentNode.group?.order || 0),
          eq(phaseGroups.isDeleted, false)
        )
      });

      // S'il n'y a pas de groupe suivant, c'est le dernier match (Finale)
      if (!nextGroup) return true;
      
      // S'il y a un groupe suivant, ce n'est pas son dernier match dans l'édition
      return false;
    }
Résumé du fonctionnement après ces corrections :
Pendant le tour (ex: 1/8 de finale) : Les joueurs jouent leurs matchs (aller ou aller-retour). L'orga (manuel) ou le système (auto) saisit les scores.

Fin du match : markBracketNodeCompleteAction s'exécute. Il regarde le score (ou le cumul aller-retour), déclare un gagnant pour ce bracket et s'arrête.

Fin du tour : L'orga clique sur "Terminer le groupe" (manuel) ou le système le détecte (auto). markGroupCompleteAction prend les 8 gagnants, les met dans le groupe 1/4 de finale, fait le tirage au sort aléatoire, crée 4 brackets, génère les matchs (1 ou 2) selon la config du 1/4.

Validation de fin d'édition : La fonction de vérification ne panique plus, elle comprend que la phase n'est finie que lorsque le dernier groupe (la finale) a joué tous ses matchs.