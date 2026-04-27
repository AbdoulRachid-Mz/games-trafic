You are a senior backend engineer specialized in tournament systems and bracket progression engines, working with TypeScript, Next.js, and Drizzle ORM.

You are given an existing implementation with the following key functions already implemented:

setupEliminationGroups(...)
updateEditionResultsFromBracketNode(...)
updateEditionResultsFromPhase(...)
getPhaseContextAction(...)

The system already:

Creates elimination rounds as phaseGroups per round
Uses bracketNodes to represent matches
Stores participants in metadata.participants
Generates matches only for round 1 (real participants)
Uses placeholders (null, WINNER_X, QUALIFIER_X) for next rounds
❗ CORE PROBLEM

The elimination progression engine is missing.

Currently:

Winners of matches are NOT propagated to next round nodes
Next round bracketNodes.metadata.participants remain empty or placeholders
Matches for next rounds are never generated dynamically
There is no reliable final detection logic
🎯 OBJECTIVE

Implement a robust, idempotent, and deterministic elimination progression system that:

Advances winners between rounds
Dynamically fills bracketNodes.metadata.participants
Generates matches ONLY when both participants are known
Detects whether the phase is truly finished using edition config + runtime state
Prevents duplication and inconsistent states
🧩 REQUIRED IMPLEMENTATION (VERY IMPORTANT)
1. MAIN ENTRY POINT
async function handleEliminationProgression(tx, matchId: string)
Responsibilities:
Fetch the match
Ensure match is COMPLETED
Extract winnerRegistrationId
Identify its bracketNode
Call progression logic
2. DETERMINE NEXT NODE (CRITICAL LOGIC)
function getNextBracketNode(tx, currentNode)
Logic:
Next round = currentNode.round + 1
Next match index:
const nextMatchIndex = Math.floor(currentNode.matchNumber / 2)
Query:
where:
  phaseId = currentNode.phaseId
  round = nextRound
  matchNumber = nextMatchIndex
3. ADVANCE WINNER
async function advanceWinnerToNextRound(tx, currentNode, winnerId)
Steps:
Get next node
Read:
const participants = nextNode.metadata.participants || []
Insert winner:
If empty → push
If 1 participant → push second
If already contains winner → ignore (idempotent)
Update:
metadata.participants = [p1, p2]
metadata.isPlaceholder = false
4. CREATE MATCHES WHEN READY
async function createMatchesIfReady(tx, node)
Conditions:
participants.length === 2
No existing matches for this node
Generate:
Respect:
isHomeAway
matchFormat
CRITICAL:
NEVER create matches if:
participant is null
placeholder detected
5. FINAL DETECTION (ADVANCED — MUST FOLLOW THIS)

DO NOT rely only on:

round === totalRounds
Instead implement:
async function isEliminationPhaseComplete(tx, phaseId)
Combine:
A. STRUCTURAL CHECK
Count nodes in last round
If only 1 node → candidate for final
B. MATCH COMPLETION CHECK
All matches in last round must be COMPLETED
C. EDITION CONFIG CHECK (CRITICAL)

From:

phase.edition.editionConfig

Check:

competitionType
Expected structure (LDC, CUP, etc.)
D. PARTICIPANT STATE CHECK (VERY IMPORTANT)
Count participants still "alive"
If more than 1 participant can still win → NOT finished

Example:

remainingParticipants = nodes
  .flatMap(n => n.metadata.participants)
  .filter(p => !eliminated)

if (remainingParticipants.length > 1) return false
⚠️ IMPORTANT INSIGHT (FROM YOUR SYSTEM)

Even if there are no next nodes/groups/phases,
it does NOT mean the tournament is finished.

So:

You MUST rely on config + actual match results
Not only DB structure
6. FIX EXISTING FUNCTION (IMPORTANT)
updateEditionResultsFromBracketNode

❌ CURRENT PROBLEM:

matchesPlayed: sql`${editionResults.matchesPlayed} + ${regMatches.length}`

👉 This causes double counting

✅ FIX:
Either:
Recompute from scratch
OR store processed matchIds
7. INTEGRATION FLOW

When a match is completed:

await handleEliminationProgression(tx, matchId)

Flow:

Match completed
Winner extracted
Advance to next node
If node ready → create match
Repeat recursively if needed
Check if phase is complete
🔒 HARD CONSTRAINTS
MUST be idempotent (safe to call multiple times)
MUST NOT create duplicate matches
MUST NOT overwrite valid participants
MUST NOT rely on placeholders
MUST work with your current schema (NO breaking changes)
🧠 EDGE CASES YOU MUST HANDLE
Odd participants (BYE already handled upstream)
Missing nodes (organizer deleted structure)
Partial brackets
Matches completed out of order
Re-triggering progression
Home/Away matches
🎯 EXPECTED RESULT
Winners automatically progress
Next round nodes fill correctly
Matches generate dynamically
Final is detected using real logic (NOT naive)
No broken states even if DB is inconsistent
🔥 BONUS (RECOMMENDED)
Add logs:
console.log("[PROGRESSION] Advancing winner", winnerId)
Add helper:
isNodeReady(node)


you can adapts this functions suggestions:

🧠 1. ENTRY POINT — PROGRESSION
export async function handleEliminationProgression(
  tx: any,
  matchId: string,
) {
  const match = await tx.query.matches.findFirst({
    where: eq(matches.id, matchId),
  });

  if (!match || match.status !== "COMPLETED") return;
  if (!match.winnerRegistrationId) return;

  const node = await tx.query.bracketNodes.findFirst({
    where: eq(bracketNodes.id, match.bracketNodeId),
  });

  if (!node) return;

  console.log("[PROGRESSION] Match completed:", match.id);

  await advanceWinnerToNextRound(tx, node, match.winnerRegistrationId);

  // Optionnel: update stats propre
  await updateEditionResultsFromBracketNodeSafe(tx, node.id);
}
🧠 2. NEXT NODE RESOLUTION
async function getNextBracketNode(tx: any, currentNode: any) {
  const nextRound = currentNode.round + 1;

  const nextMatchNumber = Math.ceil(currentNode.matchNumber / 2);

  return await tx.query.bracketNodes.findFirst({
    where: and(
      eq(bracketNodes.phaseId, currentNode.phaseId),
      eq(bracketNodes.round, nextRound),
      eq(bracketNodes.matchNumber, nextMatchNumber),
    ),
  });
}
🧠 3. ADVANCE WINNER
async function advanceWinnerToNextRound(
  tx: any,
  currentNode: any,
  winnerId: string,
) {
  const nextNode = await getNextBracketNode(tx, currentNode);

  if (!nextNode) {
    console.log("[PROGRESSION] No next node → possible final");
    return;
  }

  const metadata = (nextNode.metadata as any) || {};
  let participants: string[] = metadata.participants || [];

  // ✅ Idempotence
  if (participants.includes(winnerId)) return;

  if (participants.length < 2) {
    participants.push(winnerId);
  }

  console.log("[PROGRESSION] Advancing:", winnerId, "→ node", nextNode.id);

  await tx
    .update(bracketNodes)
    .set({
      metadata: {
        ...metadata,
        participants,
        isPlaceholder: participants.length < 2,
      },
      updatedAt: new Date(),
    })
    .where(eq(bracketNodes.id, nextNode.id));

  // 🚀 Si prêt → créer match
  if (participants.length === 2) {
    await createMatchesIfReady(tx, nextNode.id);
  }
}
🧠 4. CREATE MATCH WHEN READY
async function createMatchesIfReady(tx: any, nodeId: string) {
  const node = await tx.query.bracketNodes.findFirst({
    where: eq(bracketNodes.id, nodeId),
  });

  if (!node) return;

  const metadata = (node.metadata as any) || {};
  const participants: string[] = metadata.participants || [];

  if (participants.length !== 2) return;

  const existingMatches = await tx.query.matches.findMany({
    where: eq(matches.bracketNodeId, node.id),
  });

  if (existingMatches.length > 0) return; // ✅ éviter duplication

  const [p1, p2] = participants;

  if (!p1 || !p2) return;

  const isHomeAway = metadata.isHomeAway;
  const matchFormat = metadata.matchFormat || "BEST_OF_1";

  const matchesToCreate = isHomeAway ? 2 : 1;

  console.log("[MATCH CREATE] Node ready:", node.nodeCode);

  for (let i = 0; i < matchesToCreate; i++) {
    await tx.insert(matches).values({
      editionId: null, // ⚠️ à récupérer si besoin
      phaseId: node.phaseId,
      groupId: node.groupId,
      bracketNodeId: node.id,
      participant1RegistrationId: i === 0 ? p1 : p2,
      participant2RegistrationId: i === 0 ? p2 : p1,
      matchCode:
        matchesToCreate > 1
          ? `${node.nodeCode}-L${i + 1}`
          : node.nodeCode,
      status: "PENDING",
      round: node.round,
      matchNumber: node.matchNumber,
      metadata: {
        format: isHomeAway ? "HOME_AWAY" : matchFormat,
        leg: i + 1,
        isHomeAway,
      },
      scheduledTime: getDefaultScheduledTime(
        node.round,
        node.matchNumber,
      ),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
🧠 5. FINAL DETECTION (SMART VERSION)
export async function isEliminationPhaseComplete(
  tx: any,
  phaseId: string,
) {
  const phase = await tx.query.tournamentPhases.findFirst({
    where: eq(tournamentPhases.id, phaseId),
    with: {
      edition: true,
    },
  });

  if (!phase) return false;

  const nodes = await tx.query.bracketNodes.findMany({
    where: eq(bracketNodes.phaseId, phaseId),
  });

  if (!nodes.length) return false;

  // 🔹 Trouver dernier round
  const maxRound = Math.max(...nodes.map((n: any) => n.round || 0));

  const finalNodes = nodes.filter((n: any) => n.round === maxRound);

  // 🔹 Check structure
  if (finalNodes.length !== 1) return false;

  const finalNode = finalNodes[0];

  // 🔹 Check matches completed
  const matchesList = await tx.query.matches.findMany({
    where: eq(matches.bracketNodeId, finalNode.id),
  });

  if (!matchesList.length) return false;

  const allCompleted = matchesList.every(
    (m: any) => m.status === "COMPLETED",
  );

  if (!allCompleted) return false;

  // 🔥 CONFIG CHECK (CRUCIAL)
  const config = (phase.edition?.editionConfig as any) || {};

  // Exemple simple mais extensible
  if (config.competitionType === "LDC") {
    // LDC doit aller jusqu'à finale complète
    return true;
  }

  // 🔥 PARTICIPANT STATE CHECK
  const metadata = (finalNode.metadata as any) || {};
  const participants = metadata.participants || [];

  if (participants.length !== 2) return false;

  const winnerExists = matchesList.some(
    (m: any) => m.winnerRegistrationId,
  );

  if (!winnerExists) return false;

  return true;
}
🧠 6. FIX DOUBLE COUNT (IMPORTANT)
async function updateEditionResultsFromBracketNodeSafe(
  tx: any,
  nodeId: string,
) {
  const node = await tx.query.bracketNodes.findFirst({
    where: eq(bracketNodes.id, nodeId),
    with: { matches: true },
  });

  if (!node) return;

  const participants = (node.metadata as any)?.participants || [];

  for (const regId of participants) {
    const regMatches = node.matches.filter(
      (m: any) =>
        m.player1RegistrationId === regId ||
        m.player2RegistrationId === regId,
    );

    let won = 0,
      lost = 0,
      drawn = 0;

    regMatches.forEach((m: any) => {
      if (m.status === "COMPLETED") {
        if (m.winnerRegistrationId === regId) won++;
        else if (m.winnerRegistrationId) lost++;
        else drawn++;
      }
    });

    await tx
      .insert(editionResults)
      .values({
        editionId: null, // à récupérer
        registrationId: regId,
        matchesPlayed: regMatches.length,
        matchesWon: won,
        matchesLost: lost,
        matchesDrawn: drawn,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [editionResults.editionId, editionResults.registrationId],
        set: {
          matchesPlayed: regMatches.length,
          matchesWon: won,
          matchesLost: lost,
          matchesDrawn: drawn,
          updatedAt: new Date(),
        },
      });
  }
}

for matches generations, you can add default time/date for matches/brackets
after doing that you fixe markBracketsComplet in phases.ts that does not work good.