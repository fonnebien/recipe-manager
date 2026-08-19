# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

The monorepo is scaffolded and working end-to-end: `apps/api` serves `/health` and a minimal `/recipes` CRUD backed by a real Postgres instance (migrated via Drizzle), and `apps/web` runs against it through the typed `hc` client. Most business logic is still unimplemented — pantry CRUD, grocery-list generation, unit conversion, and "what can I cook" are stubs or missing. Use the briefings (`docs/BACKEND_BRIEFING.md`, `docs/FRONTEND_BRIEFING.md`) for full domain detail; the summary below is kept current with what's actually in the repo.

## Commands

Run from the repo root unless noted.

```sh
pnpm install               # install all workspace deps

pnpm db:up                 # start local Postgres (docker compose)
pnpm db:down               # stop it

pnpm --filter @repo/api db:generate   # generate a Drizzle migration from src/db/schema.ts
pnpm --filter @repo/api db:migrate    # apply migrations to DATABASE_URL
pnpm --filter @repo/api db:studio     # open Drizzle Studio

pnpm dev:api               # run apps/api in watch mode (tsx), port from .env (default 3000)
pnpm dev:web               # run apps/web (Vite), http://localhost:5173

pnpm lint                  # oxlint across the repo
pnpm lint:fix               # oxlint --fix
pnpm format                 # oxfmt, formats the repo in place
pnpm format:check           # oxfmt --check, fails without writing
pnpm typecheck              # tsc --noEmit / vue-tsc --noEmit across all workspaces
pnpm test                   # vitest across all workspaces (currently only apps/api has tests)
pnpm --filter @repo/api test        # run just the api's tests
pnpm --filter @repo/api test:watch  # watch mode
pnpm build                 # build all workspaces
```

`apps/api` needs a `.env` (copy `.env.example`) with `DATABASE_URL` pointing at the docker-compose Postgres — required even to run its test suite, since `src/lib/env.ts` validates env vars eagerly at import time.

## Project context

Personal-use, **local-only** recipe/pantry/grocery-list manager. No deployment target — skip fleet-oriented tooling (Prometheus/Grafana, APM, log aggregators, auth) in favor of what's useful for local dev. Built as a backend-focused engineer's Node/TypeScript deepening exercise — prioritize idiomatic architecture and query design over exploring new stacks.

## Repo structure (pnpm workspaces monorepo)

```
recipe-manager/
├── apps/
│   ├── api/            # Hono backend
│   └── web/            # Vue 3 frontend
├── packages/
│   └── shared/          # Zod schemas/types shared by both apps
├── pnpm-workspace.yaml
├── docker-compose.yml    # local Postgres only
└── .env.example
```

## Stack

**Backend (`apps/api`)**

- Node, Hono, Drizzle ORM, PostgreSQL (local via docker-compose — chosen deliberately over SQLite for real relational integrity, window functions, CTEs)
- Zod validation via `@hono/zod-validator`
- Vitest for tests
- Pino for structured logging (+ `pino-pretty` in dev), request-id middleware, centralized error handling via `app.onError()`, Drizzle `logger: true` for raw SQL visibility

**Frontend (`apps/web`)**

- Vue 3 Composition API (`<script setup>`), Vite
- Pinia for transient UI state only (e.g. selected recipes for the current grocery list) — not server data
- TanStack Query (Vue Query) for server state/caching, wrapping `hono/client` calls
- Tailwind (suggested, not locked in)
- Vue Router

## The key integration point: typed RPC via `hono/client`

The frontend and backend share types with **zero codegen**, which only works because both live in the same pnpm workspace and the backend's routes stay chained:

- `apps/api/src/app.ts` exports `export type AppType = typeof app`; `apps/api/package.json` points `main`/`types` at that file so `@repo/api` resolves as a workspace type-only import.
- Route definitions **must stay chained** (`.get()`, `.post()`, etc., each returning `this`) rather than registered imperatively — Hono's RPC type inference depends on the chained builder pattern. Breaking the chain breaks the frontend's type inference.
- `apps/web/src/api/` imports `AppType` as a workspace dependency and builds the client: `hc<AppType>("http://localhost:PORT")`.
- Wrap `hc` calls in TanStack Query composables (e.g. `useRecipesQuery()`, `usePantryMutation()`) rather than calling the client directly from components, so cache invalidation logic lives in one place — this matters especially for derived queries like "what can I cook" and the grocery list, which must invalidate whenever pantry state changes.
- Reuse Zod schemas (from the backend or `packages/shared`) as the single source of truth for validation on both ends, so frontend and backend never drift on what a valid `PantryItem` or `RecipeIngredient` looks like.

## Domain model

- `Recipes` — title, instructions, servings, prep/cook time, tags
- `Ingredients` — name, base unit, category
- `RecipeIngredients` — join table: recipe, ingredient, quantity, unit
- `PantryItems` — ingredient, quantity, unit, expiration date
- `GroceryList` — derived/generated, not manually maintained

## Core business logic (the actual hard parts)

1. **Unit conversion** — needs a per-ingredient density/conversion table, not a generic constant (a cup of flour and a cup of sugar don't weigh the same).
2. **Grocery list generation** — sum ingredient needs across selected recipes (unit-normalized), subtract current pantry stock, output what's missing.
3. **"What can I cook?"** — rank recipes by how many ingredients are already in the pantry; set-intersection-style query.
4. **Pantry depletion** — marking a recipe as cooked deducts used quantities from pantry stock.

## Suggested build order

Backend: CRUD (recipes, ingredients) → pantry tracking (manual add/remove) → grocery list generation → recipe scaling + unit conversion → "what can I cook" endpoint → stretch: meal planning calendar.

Frontend: recipe list/detail (read-only) → pantry view → recipe selection + grocery list generation → "what can I cook" view → recipe scaling UI → stretch: meal planning calendar view.

## Folder structure

```
apps/api/src/
├── routes/          # recipes.ts, pantry.ts, grocery-list.ts
├── db/
│   ├── schema.ts      # Drizzle schema
│   ├── migrations/
│   └── client.ts
├── services/          # unit conversion, aggregation, "what can I cook"
├── middleware/          # logging, error handling, request-id
├── lib/                   # logger instance, env config
├── validators/             # Zod schemas
├── app.ts                   # Hono instance — export its type for hc
└── index.ts                   # server entry (node listen)

apps/web/src/
├── components/
├── views/
├── stores/          # Pinia
├── composables/       # TanStack Query wrappers around hc calls
├── api/                 # hc client setup
└── router/
```
