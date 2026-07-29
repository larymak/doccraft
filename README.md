# DocCraft

> Learn documentation by doing a gamified curriculum that takes you from total beginner to documentation lead.

DocCraft is an interactive web app where you complete missions, earning XP and badges as you master the skills that separate good engineers from great ones: writing clear docs, choosing the right format, building governance systems, and reducing knowledge debt.

## What you'll learn

| Tier | Units | Skills |
|---|---|---|
| 🌱 Beginner | 1–2 | Documentation fundamentals, doc types (Tutorial / How-To / Reference / Explanation / SOP / Runbook / ADR / Postmortem) |
| 🔧 Intermediate | 3–5 | Audience analysis, templates & style guides, search & discoverability |
| ⚡ Advanced | 6–8 | Metadata architecture, Markdown maintenance, governance planning |
| 🏆 Pro | 9–10 | ADR history, Knowledge Lead strategy, AI-reviewed capstone |

## Tech stack

- **[Astro 4](https://astro.build)** — static site generator with React islands
- **React 18** + **TypeScript 5** — interactive assessment components
- **CSS Modules** — scoped styling with the FCC design system
- **Astro Content Collections** — type-safe YAML content (units + missions)
- **@dnd-kit** — drag-and-drop sorting assessments
- **@anthropic-ai/sdk** — AI feedback on the final boss mission (Unit 10)

No database. No auth. Progress lives in `localStorage`.

## Getting started

**Prerequisites:** Node 18+ and [pnpm](https://pnpm.io)

```bash
# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321) and complete the 5-step onboarding to begin.

### Unit 10 (final boss)

The capstone mission uses Claude AI to evaluate your documentation strategy. Add your Anthropic API key to a `.env` file at the project root:

```
ANTHROPIC_API_KEY=sk-ant-…
```

## Project structure

```
src/
  content/units/      10 unit definitions (YAML)
  content/missions/   37 mission definitions (YAML)
  pages/              Astro routes
  components/         React islands (assessments, game UI, layout)
  lib/                Scoring, progression, storage, Claude API
  context/            React context (progress, debt, mission state)
  styles/             Global CSS + design tokens
  types/              TypeScript interfaces
```

## Available commands

| Command | Action |
|---|---|
| `pnpm dev` | Start dev server at `localhost:4321` |
| `pnpm build` | Build for production → `dist/` |
| `pnpm preview` | Preview the production build |

## How missions work

Each mission has:
1. **Scenario** — a workplace situation delivered by a character (Jordan, Marcus, etc.)
2. **Assessment** — multiple-choice, sorting task, writing task, review task, or simulation
3. **Scoring** — rubric-based, 70% to pass; XP awarded on success
4. **Knowledge Debt** — a game mechanic that rises when you skip or fail and falls when you pass

Complete a unit's four missions (including the boss) to earn a badge and unlock the next tier.

## Contributing

Content lives in YAML files under `src/content/`. To add or edit a mission, follow the schema defined in `src/content/config.ts`.

---

Built with the [freeCodeCamp](https://freecodecamp.org) design system.
