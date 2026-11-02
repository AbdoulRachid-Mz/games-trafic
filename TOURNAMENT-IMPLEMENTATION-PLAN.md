# TOURNAMENT-IMPLEMENTATION-PLAN.md — Games-Trafics

> Status: **In Progress** | Last updated: 2026-10-30

---

## Method

- Work in sequential batches. Each batch is fully verified before the next begins.
- No `@ts-ignore` hacks. TypeScript strict mode always.
- `bun` only (never `npm` or `pnpm`).
- Brand always: **Games-Trafics** (capital G, capital T, hyphen, both words plural).
- Run `bunx tsc --noEmit` + `bunx vitest run` after every batch.
- No regressions on existing 35 tests.

---

## Batch 0 — Deliverables ✅

- [x] Create `TOURNAMENT-AUDIT.md` at project root
- [x] Create `TOURNAMENT-IMPLEMENTATION-PLAN.md` at project root

---

## Batch 1 — Critical DB Fix + UI Carousel Removal

### 1A. Fix `lib/db/index.ts` — Enable transactions (BUG-001)

**File**: `lib/db/index.ts`

Switch from `drizzle-orm/neon-http` to `drizzle-orm/neon-serverless` with WebSocket Pool.

```typescript
import { Pool, neon } from "@neondatabase/serverless";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@/database/schema";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
export const db = drizzle(pool, { schema });
```

> [!IMPORTANT]
> `ws` and `@neondatabase/serverless` are already installed — no new packages needed.

**Validation**: All `db.transaction()` calls will work; all `db.query.*` remain compatible.

**Status**: 🔄 In progress

---

### 1B. Remove match carousel from edition-detail-header (UI)

**File**: `components/pages/tournaments/edition-detail/edition-detail-header.tsx`

- Remove lines 237–254 (carousel block)
- Remove unused imports: `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`, `CarouselApi`, `MatchCard`
- Remove `const [api, setApi] = useState<CarouselApi>()`
- Remove autoplay `useEffect` (lines 111–121)
- Keep `recentMatches` in props as optional (for backward compat with page.tsx) but stop rendering it

**Callers to update**:
- `components/pages/tournaments/edition-detail/edition-page-content.tsx` — no change needed (already passes `recentMatches`)
- `app/tournaments/.../editions/[editionId]/page.tsx` — keep `getEditionRecentMatches` call in case it's used elsewhere, or remove. Removing is cleaner.

**Status**: 🔄 In progress

---

### 1C. Add compact sticky header above tabs (UI)

**File**: `components/pages/tournaments/edition-detail/edition-detail-header.tsx`

Strategy: IntersectionObserver on sentinel div at bottom of hero banner.

- Add `sentinelRef` (div at hero bottom)
- Add `useRef` + `IntersectionObserver` hook
- Show compact bar (edition logo + name + status) above tabs when sentinel exits viewport
- Animate with `AnimatePresence` + `motion.div`
- No scroll event listeners (performance-safe)

**Status**: 🔄 In progress

---

## Batch 2 — Business Logic Fixes

### 2A. Fix BracketNode `depth` in generators.ts (BUG-002)

**File**: `lib/tournaments/generators.ts`

In `setupEliminationGroups`, compute `depth = totalRounds - round` when inserting bracket nodes.

**Status**: ⬜ Pending

---

### 2B. Align PhaseType enum (BUG-003)

**Files**: 
- `lib/tournaments/types.ts` — update Phase type to use schema enum values
- `components/pages/tournaments/edition-detail/edition-brackets-tab.tsx` — remove `"DOUBLE_ELIMINATION"`, `"PLAYOFFS"` comparisons

**Status**: ⬜ Pending

---

### 2C. Remove duplicate functions (BUG-004)

**Strategy**: Canonical in `actions/phases.ts`. Deprecate in `actions/tournaments.ts` with re-exports.

**Duplicates**: `createTournamentPhase`, `getPhaseGroups`, `createPhaseGroup`, `getBracketNodes`, `createBracketNode`, `getMatches`, `createMatch`

**Status**: ⬜ Pending

---

### 2D. Wrap progression-engine in proper transaction

**File**: `lib/tournaments/progression-engine.ts` + calling action

Ensure `progressTournamentAfterMatch` runs inside `db.transaction()` after BUG-001 is fixed.

**Status**: ⬜ Pending (depends on 1A)

---

## Batch 3 — Export Fixes

### 3A. Fix brand name in export-utils.ts (BUG-005)

**File**: `utils/export-utils.ts`

Change `"Game Trafics"` → `"Games-Trafics"`.

**Status**: ⬜ Pending

---

### 3B. Fix bracket-export-button.tsx UUIDs (BUG-006)

**File**: `components/pages/tournaments/edition-detail/bracket-export-button.tsx`

Enrich nodes with participant name data. Add loading state + empty state guard.

**Status**: ⬜ Pending

---

## Batch 4 — Tests

### 4A. Create tournament test suite

**Directory**: `tests/unit/tournaments/`

Files:
- `match-generator.test.ts` — `generateRoundRobinMatches` (2/even/odd/0/1 participants, BYE), `generateGroupMatches`, `generateEliminationMatches`
- `standings-engine.test.ts` — `syncStandingsWithMatches`, `rankParticipants`
- `bracket-engine.test.ts` — `computeWinner`, `computeAggregatedWinner`, `resolveSlotIndex`

**Status**: ⬜ Pending

---

## Batch 5 — Final Validation

```bash
bunx tsc --noEmit          # 0 errors
bunx vitest run             # all tests passing
bun run build               # successful build
```

**Status**: ⬜ Pending

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `neon-serverless` Pool connection leak in dev (HMR) | Medium | Medium | Use `globalThis` singleton pattern |
| Removing `recentMatches` breaks some hidden consumer | Low | Low | Grep all usages before removing |
| Changing `db/index.ts` breaks some HTTP-only query | Low | Medium | All `db.query.*` work with Pool too |
| Fixing depth breaks existing bracket data in DB | Medium | High | Apply to new generations only; migration optional |
| Removing duplicates breaks an import elsewhere | Low | High | Run tsc after each change |
