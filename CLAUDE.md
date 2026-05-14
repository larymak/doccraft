# DocCraft — AI Assistant Guide

## Project overview

DocCraft is a gamified documentation-systems curriculum. Players progress through 10 units and 37 missions across four tiers (Beginner → Intermediate → Advanced → Pro), learning real-world documentation skills via interactive assessments.

**Stack:** Astro 4 (static output) · React 18 · TypeScript 5 · CSS Modules · pnpm

## Commands

```bash
pnpm dev        # dev server on localhost:4321
pnpm build      # production build → dist/
pnpm preview    # preview the built output
```

## Repo layout

```
src/
  content/
    config.ts          # Zod schemas for Content Collections
    units/             # 10 YAML files (unit-01.yaml … unit-10.yaml)
    missions/          # 37 YAML files (u01-m01.yaml … u10-m01.yaml)
  pages/
    index.astro        # Landing / marketing page
    onboarding.astro
    map.astro
    dashboard.astro
    unit/[id].astro    # Unit intro page
    mission/[slug].astro
    results/[slug].astro
    git-sim/[slug].astro
  components/
    MapPage.tsx / .module.css
    MissionPage.tsx / .module.css
    UnitIntroPage.tsx / .module.css
    OnboardingFlow.tsx / .module.css
    ResultsPage.tsx / .module.css
    DashboardPage.tsx / .module.css
    assessments/       # MultipleChoice, SortingTask, WritingTask, ReviewTask,
                       # SimulationTask, MetadataEditTask, AssessmentRouter
    game/              # UnitCard, MissionCard, DebtMeter, DebtDelta,
                       # ScorePanel, BadgeDisplay
    git/               # CommitForm, DiffViewer, PRChecklist, etc.
    layout/            # Header, PageLayout
    ui/                # Button, Card, Badge, ProgressBar, CharacterDialog,
                       # Confetti
  context/
    AppContext.tsx      # userProgress, isLoading, isOnboarded
    GameContext.tsx     # knowledgeDebt
    MissionContext.tsx  # active mission state
    Providers.tsx       # wraps all providers
  lib/
    progression.ts     # isUnitUnlocked, getUnitStatus, getUnitCompletion
    scoring.ts         # scoreMission
    rubric.ts          # evaluateRubric (keyword-check logic)
    claude-api.ts      # Anthropic SDK wrapper (Unit 10 boss only)
    storage.ts         # localStorage read/write helpers
    content-loader.ts  # runtime YAML → typed objects
  hooks/
    useLocalStorage.ts
    useProgress.ts
    useMission.ts
    useDebt.ts
  types/
    content.ts         # Unit, Mission, Tier, ContentBlock
    progress.ts        # UserProgress, UnitProgress, MissionAttempt
    game.ts            # UnitStatus, KnowledgeDebt
  styles/
    tokens.css         # --fcc-* CSS custom properties
    global.css
```

## Content model

### Unit YAML fields
| Field | Type | Notes |
|---|---|---|
| `id` | string | e.g. `unit-01` |
| `order` | number | display order |
| `tier` | `beginner\|intermediate\|advanced\|pro` | unlocking group |
| `prerequisiteUnitId` | string \| null | boss-complete gate |
| `title` | string | |
| `description` | string | |
| `totalXP` | number | |
| `badge` | `{iconSlug, label, color}` | earned on boss complete |
| `goal` | string | shown in unit intro |
| `objectives` | string[] | shown as chips |
| `contentBlocks` | `ContentBlock[]` | educational content |

### Mission YAML fields
| Field | Type | Notes |
|---|---|---|
| `id` | string | e.g. `u01-m01` |
| `unitId` | string | parent unit |
| `order` | number | position in unit |
| `type` | `normal\|boss` | boss = unit capstone |
| `title` | string | |
| `scenario` | string | Jordan's briefing text |
| `xpReward` | number | |
| `debtImpact` | number | |
| `assessment` | object | type-specific payload |
| `rubric` | `RubricItem[]` | scoring criteria |

### Assessment types
- `multiple-choice` — single answer from options
- `sorting` — drag items into correct buckets
- `writing` — free-text evaluated by rubric keyword-check
- `review` — review a doc excerpt and identify issues
- `simulation` — fill-in interactive task
- `metadata-edit` — edit metadata fields
- `git-simulation` — routed to `/git-sim/[slug]`

## Tier unlock logic

All units in a tier share the same `prerequisiteUnitId` (the capstone unit of the prior tier). A tier's units unlock simultaneously when that prerequisite's boss mission is completed.

| Tier | Units | Prerequisite |
|---|---|---|
| Beginner | 1–2 | none |
| Intermediate | 3–5 | unit-02 boss |
| Advanced | 6–8 | unit-05 boss |
| Pro | 9–10 | unit-08 boss |

`isUnitUnlocked` in `src/lib/progression.ts` checks `progress.unitProgress[unit.prerequisiteUnitId]?.bossMissionCompleted`.

## Progress state

Stored in localStorage under key `doccraft_progress`. Shape defined in `src/types/progress.ts`. No backend, no auth, no database.

## Scoring

- Pass threshold: **70%**
- `scoreMission` in `src/lib/scoring.ts` aggregates `evaluateRubric` results
- Rubric items with `checkFn: keyword-check` match `acceptedPatterns` against the answer
- Rubric items without `checkFn` always award `0.5 * weight` (partial credit)

## Claude API (Unit 10 boss)

`src/lib/claude-api.ts` wraps `@anthropic-ai/sdk`. Requires `ANTHROPIC_API_KEY` env variable. Only called for the final boss mission. Provide the key in a `.env` file at the project root:

```
ANTHROPIC_API_KEY=sk-ant-…
```

## Design system

CSS custom properties defined in `src/styles/tokens.css`:
- Colors: `--fcc-gold`, `--fcc-navy`, `--fcc-blue-dark`, `--fcc-blue-mid`, `--fcc-green`, `--fcc-gray-*`, `--fcc-text-light`
- Spacing: `--space-1` through `--space-16`
- Typography: `--text-xs` through `--text-4xl`
- Radii: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`

## Path alias

`@/` resolves to `src/` (configured in `tsconfig.json` and `astro.config.mjs`).

## Animation patterns

- Scroll-reveal: `.reveal` / `.tierReveal` + `.visible` toggled by `IntersectionObserver`
- CSS custom properties for stagger delays: `--metric-delay`, `--option-delay` set via `style={{ '--option-delay': '80ms' } as React.CSSProperties}`
- Spring keyframes: `cubic-bezier(0.34, 1.56, 0.64, 1)` for pop effects
