# TOURNAMENT-AUDIT.md — Games-Trafics

> Generated: 2026-10-30 | Status: **Active** | Updated progressively during implementation

---

## 1. Architecture Overview

```
Tournament (tournamentId)
  └── TournamentEdition (editionId)
        ├── EditionRegistrations (registrationId) → TournamentMember
        └── TournamentPhase (phaseId) [format: ELIMINATION | GROUP_STAGE | ROUND_ROBIN | SWISS | KNOCKOUT | CUSTOM]
              ├── PhaseGroup (groupId)
              │     ├── PhaseGroupParticipants (registrationId ref)
              │     ├── Matches (matchId) [status: PENDING | IN_PROGRESS | COMPLETED | CANCELLED | ...]
              │     └── Standings (standingId)
              └── BracketNodes (nodeId) [depth, round, position, metadata]
                    └── Matches (matchId) via nodeId FK
```

### Key DB Tables (from `database/schema.ts`)

| Table | Key Fields |
|---|---|
| `tournaments` | id, organizerId, name, game, coverImage, profileImage |
| `tournamentEditions` | id, tournamentId, editionNumber, name, status, format, startDate, endDate, maxParticipants, entryFee, winnerMetadata |
| `editionRegistrations` | id, editionId, memberId, status, feePaid, checkedIn |
| `tournamentPhases` | id, editionId, name, format, order, status, maxParticipants, advancingParticipants |
| `phaseGroups` | id, phaseId, name, order |
| `phaseGroupParticipants` | groupId, registrationId |
| `bracketNodes` | id, phaseId, depth, round, position, metadata, winnerId, matchId |
| `matches` | id, phaseId, groupId, nodeId, status, scheduledAt, teamAId, teamBId, scoreA, scoreB, format |
| `standings` | id, phaseId, groupId, registrationId, points, wins, losses, draws, rank |

---

## 2. lib/tournaments/ File Inventory

| File | Purpose | Status |
|---|---|---|
| `types.ts` | Participant, Match, Group, BracketNode, Bracket, Phase interfaces | ⚠️ Type mismatch with schema enum |
| `match.generator.ts` | `generateRoundRobinMatches`, `generateGroupMatches`, `generateEliminationMatches` | ✅ Logic correct |
| `group.generator.ts` | `generateGroups` (MANUAL mode only) | ⚠️ MANUAL only, no AUTO |
| `bracket.generator.ts` | `generateSingleEliminationBracket` | ⛔ @deprecated |
| `generators.ts` | `setupLeaguePhase`, `setupGroupPhase`, `setupEliminationGroups`, `setupSwissPhase`, `setupBracketPhase` | ⚠️ `setupBracketPhase` @deprecated; depth not set |
| `structure-engine.ts` | `createStructureEngine` — wraps generators in `db.transaction()` | ⛔ BROKEN (neon-http) |
| `match-generation-engine.ts` | `generateMatchesEngine` — generates matches in `db.transaction()` | ⛔ BROKEN (neon-http) |
| `progression-engine.ts` | `progressTournamentAfterMatch`, `handleEliminationProgression`, etc. | ⚠️ Uses `tx` inconsistently |
| `propagation-service.ts` | `propagatePhaseResults` | ⛔ @deprecated + uses `db.transaction()` |
| `standings.engine.ts` | `syncStandingsWithMatches`, `rankParticipants` | ✅ No transaction usage |
| `bracket-engine.ts` | `computeWinner`, `computeAggregatedWinner`, `resolveSlotIndex` | ✅ Pure functions |
| `index.ts` | Barrel exports | ⚠️ Does NOT re-export structure-engine or match-generation-engine |

---

## 3. Critical Bugs

### BUG-001 — CRITICAL: `db.transaction()` throws at runtime everywhere

**Root cause**: `lib/db/index.ts` uses `drizzle-orm/neon-http` which throws:
```
"No transactions support in neon-http driver"
```

**Affected files**:
- `lib/tournaments/structure-engine.ts:61` — `createStructureEngine`
- `lib/tournaments/match-generation-engine.ts:40` — `generateMatchesEngine`
- `lib/tournaments/propagation-service.ts:18` — `propagatePhaseResults`
- `actions/phases.ts` — 6+ `db.transaction()` calls
- `actions/tournaments.ts` — 3+ `db.transaction()` calls
- `actions/orders.ts`, `actions/wallets.ts`, `actions/transactions.ts` — additional calls

**Fix**: Switch to `drizzle-orm/neon-serverless` with `Pool` + `ws`. Both packages already installed (`ws@^8.19.0`, `@neondatabase/serverless@^1.2.0`).

**Risk**: LOW — same schema, same query API. Only adds transaction support.

---

### BUG-002 — HIGH: BracketNode `depth` always 0

**Root cause**: In `lib/tournaments/generators.ts`, `setupEliminationGroups` creates bracket nodes without setting `depth`. The default in schema is `0` for all nodes.

**Impact**: `progression-engine.ts:178-183` uses `depth === 0` to identify the "root node" (final/winner node), but ALL nodes have `depth = 0` — the root is never correctly identified.

**Fix**: Set `depth = totalRounds - round` when inserting bracket nodes in `generators.ts`.

---

### BUG-003 — HIGH: PhaseType enum mismatch

**Schema enum** (`tournamentFormatEnum`):
```
ELIMINATION, GROUP_STAGE, ROUND_ROBIN, SWISS, KNOCKOUT, CUSTOM
```

**`lib/tournaments/types.ts`** uses: `"GROUP" | "BRACKET"` — different values, never matches schema.

**`edition-brackets-tab.tsx`** compares against: `"DOUBLE_ELIMINATION"`, `"PLAYOFFS"` — not in enum at all.

**Fix**: Align `types.ts` with schema enum. Update all consumers.

---

### BUG-004 — MEDIUM: Duplicate exported functions

The following functions exist in BOTH `actions/phases.ts` AND `actions/tournaments.ts`:
- `createTournamentPhase`
- `getPhaseGroups`
- `createPhaseGroup`
- `getBracketNodes`
- `createBracketNode`
- `getMatches`
- `createMatch`

**Risk**: Divergence — changes in one won't reflect in the other. Callers import from different sources.

**Fix**: Keep canonical in `actions/phases.ts` (more complete), deprecate/remove from `actions/tournaments.ts`.

---

### BUG-005 — MEDIUM: Export brand name wrong

**File**: `utils/export-utils.ts` line 82:
```typescript
export const DEFAULT_APP_INFO = {
  name: "Game Trafics",  // ❌ wrong
```
Should be: `"Games-Trafics"` (capital G, capital T, hyphen, both words plural).

---

### BUG-006 — MEDIUM: `bracket-export-button.tsx` exports UUIDs instead of names

**File**: `components/pages/tournaments/edition-detail/bracket-export-button.tsx`

Excel/JSON export uses `n.metadata?.participants?.[0]` which is a raw `registrationId` UUID, not the participant's display name.

**Fix**: Enrich nodes with participant name lookup before export.

---

### BUG-007 — LOW: `setupGroupPhase` chunk overflow logic

When `groupsCount > floor(n/2)`, it's capped. But the overflow merging logic (merging extras into last group) can create groups of very different sizes.

---

## 4. Export Inventory

### Formats Supported
| Format | Library | Function | File |
|---|---|---|---|
| PDF | `jspdf` + `jspdf-autotable` | `exportToPDF` | `utils/export-utils.ts` |
| Excel | `xlsx` | `exportToExcel` | `utils/export-utils.ts` |
| CSV | native string | `exportToCSV` | `utils/export-utils.ts` |
| JSON | native JSON | `exportToJSON` | `utils/export-utils.ts` |

### Member Export (standalone)
| Format | Library | Function | File |
|---|---|---|---|
| CSV | native | `exportMembersToCSV` | `lib/utils/member-export-utils.ts` |
| JSON | native | `exportMembersToJSON` | `lib/utils/member-export-utils.ts` |
| PDF | `window.print()` | `exportMembersToPDF` | `lib/utils/member-export-utils.ts` |

> [!NOTE]
> `member-export-utils.ts` does NOT use the shared `export-utils.ts`. This is intentional as it's member-list specific. No major bugs found.

---

## 5. Architecture Issues Summary

| Issue | Severity | File(s) |
|---|---|---|
| `db.transaction()` broken (neon-http) | CRITICAL | `lib/db/index.ts` + all callers |
| BracketNode `depth` always 0 | HIGH | `lib/tournaments/generators.ts` |
| PhaseType enum mismatch | HIGH | `lib/tournaments/types.ts`, `edition-brackets-tab.tsx` |
| Duplicate function exports | MEDIUM | `actions/phases.ts` vs `actions/tournaments.ts` |
| Export brand name wrong | MEDIUM | `utils/export-utils.ts` |
| Bracket export UUIDs vs names | MEDIUM | `bracket-export-button.tsx` |
| `propagation-service.ts` @deprecated still used? | LOW | `lib/tournaments/propagation-service.ts` |
| `generateGroups` MANUAL mode only | LOW | `lib/tournaments/group.generator.ts` |

---

## 6. UI Issues (Header / Tabs)

| Issue | File |
|---|---|
| Match carousel shown in header (to remove) | `edition-detail-header.tsx` lines 237–254 |
| Tabs sticky at `top-0` — no compact edition header when scrolled | `edition-detail-header.tsx` line 470 |
| `hideTopMiddleOnScroll: true` set for edition routes — TopMiddle hides on scroll, so `sticky top-0` will work | `lib/routes-config.ts` |

---

## 7. Test Coverage

| Domain | Test File | Status |
|---|---|---|
| Security | `tests/unit/security/` | ✅ Passing |
| Wallet | `tests/unit/wallet/` | ✅ Passing |
| Tournament — match generation | — | ❌ Missing |
| Tournament — standings engine | — | ❌ Missing |
| Tournament — bracket engine | — | ❌ Missing |
| Tournament — phase generators | — | ❌ Missing |
| Export utils | — | ❌ Missing |

**Total**: 35/35 existing tests passing as of last run.

---

## 8. Progression Engine Notes

`progression-engine.ts` functions accept a `tx` parameter but:
- `progressTournamentAfterMatch` calls them with plain `db` (not inside a transaction)
- Individual helpers (`handleEliminationProgression`, `advanceWinnerToNextRound`, etc.) use `tx.query.*` 
- This works "by coincidence" since `db.query.*` is valid, but is semantically incorrect

After fixing `lib/db/index.ts` to use `neon-serverless`, the progression engine should be wrapped in a proper `db.transaction()` call from the top-level action.
