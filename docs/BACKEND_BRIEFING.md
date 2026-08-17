# Recipe & Pantry Manager — Backend Briefing

## Project Context

Personal-use, **local-only** application for managing recipes, pantry inventory, and grocery list generation. Built by a backend-focused engineer deepening existing Node/TypeScript skills — prioritize idiomatic architecture and query design over exploring new languages or paradigms. No deployment target.

## Repo Structure (monorepo)

pnpm workspaces monorepo. This backend lives at `apps/api`. Sibling workspace `apps/web` (Vue frontend) imports this app's exported type directly for a fully-typed RPC client — see "Connecting to the Frontend" below.

```
recipe-pantry-manager/
├── apps/
│   ├── api/            <- this package
│   └── web/             <- Vue frontend (see FRONTEND_BRIEFING.md)
├── packages/
│   └── shared/           <- optional: shared Zod schemas/enums
├── pnpm-workspace.yaml
├── docker-compose.yml     <- local Postgres only
└── .env.example
```

## Stack

- **Runtime:** Node
- **Framework:** Hono
- **ORM:** Drizzle
- **Database:** PostgreSQL, run locally via docker-compose (deliberately not SQLite — real relational integrity, window functions, CTEs)
- **Validation:** Zod, wired in via `@hono/zod-validator` middleware
- **Testing:** Vitest

## Folder Structure (apps/api)

```
apps/api/
├── src/
│   ├── routes/           # recipes.ts, pantry.ts, grocery-list.ts
│   ├── db/
│   │   ├── schema.ts       # Drizzle schema
│   │   ├── migrations/
│   │   └── client.ts
│   ├── services/           # unit conversion, aggregation, "what can I cook"
│   ├── middleware/          # logging, error handling, request-id
│   ├── lib/                   # logger instance, env config
│   ├── validators/             # Zod schemas
│   ├── app.ts                   # Hono instance — export its type for hc
│   └── index.ts                   # server entry (node listen)
└── test/
```

## Domain Model

- `Recipes` — title, instructions, servings, prep/cook time, tags
- `Ingredients` — name, base unit, category
- `RecipeIngredients` — join table: recipe, ingredient, quantity, unit
- `PantryItems` — ingredient, quantity, unit, expiration date
- `GroceryList` — derived/generated, not manually maintained

## Core Business Logic (the actual hard parts)

1. **Unit conversion** — needs a per-ingredient density/conversion table, not a generic constant (a cup of flour and a cup of sugar don't weigh the same).
2. **Grocery list generation** — sum ingredient needs across selected recipes (unit-normalized), subtract current pantry stock, output what's missing.
3. **"What can I cook?"** — rank recipes by how many ingredients are already in the pantry; set-intersection-style query.
4. **Pantry depletion** — marking a recipe as cooked deducts used quantities from pantry stock.

## Suggested Build Order

1. CRUD: recipes, ingredients
2. Pantry tracking (manual add/remove)
3. Grocery list generation
4. Recipe scaling + unit conversion
5. "What can I cook" endpoint
6. Stretch: meal planning calendar (auth likely unnecessary — single local user)

## Connecting to the Frontend

- Export the Hono app's type from `app.ts`: `export type AppType = typeof app`.
- The Vue frontend (`apps/web`) imports this type directly as a workspace dependency and uses `hono/client`'s `hc<AppType>()` to get a fully typed fetch client — no OpenAPI spec, no codegen step.
- Keep route definitions **chained** (`.get()`, `.post()`, etc. returning `this`) rather than registered imperatively — Hono's RPC type inference depends on the chained builder pattern. Breaking the chain breaks the frontend's type inference.

## Logging & Observability (local-only scope)

No deployment target — skip fleet-oriented tooling (Prometheus/Grafana, APM agents, log aggregators). Keep to what's genuinely useful for local development and debugging:

## Connecting to the Frontend

- Export the Hono app's type from `app.ts`: `export type AppType = typeof app`.
- The Vue frontend (`apps/web`) imports this type directly as a workspace dependency and uses `hono/client`'s `hc<AppType>()` to get a fully typed fetch client — no OpenAPI spec, no codegen step.
- Keep route definitions **chained** (`.get()`, `.post()`, etc. returning `this`) rather than registered imperatively — Hono's RPC type inference depends on the chained builder pattern. Breaking the chain breaks the frontend's type inference.

## Logging & Observability (local-only scope)

No deployment target — skip fleet-oriented tooling (Prometheus/Grafana, APM agents, log aggregators). Keep to what's genuinely useful for local development and debugging:

- **Pino** for structured (JSON) logging, with `pino-pretty` for readable console output in dev.
- **Request logging middleware** — either Hono's built-in `logger()` or a custom Pino-backed one (method, path, status, duration).
- **Request IDs** — `crypto.randomUUID()` per request, attached to log context. Not functionally necessary for a single-user local app, but cheap and good practice.
- **Centralized error handling** via `app.onError()` — one place to catch, log, and shape error responses instead of scattered try/catch.
- **Drizzle query logging** — enable Drizzle's `logger: true` (or a custom logger) to see raw SQL, especially useful while building the aggregation/"what can I cook" queries.

Optional stretch (learning only, not needed for this app): self-hosted Grafana + Prometheus via docker-compose, scraping API metrics, purely for practicing the pattern.
