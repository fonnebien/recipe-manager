# Recipe & Pantry Manager — Frontend Briefing

## Project Context

Personal-use, **local-only** frontend for a recipe/pantry management app. Goal is a functional Vue app rather than framework exploration — pairs with a Hono backend in the same monorepo. No deployment target.

## Repo Structure (monorepo)

This frontend lives at `apps/web`, sibling to `apps/api` (Hono backend — see BACKEND_BRIEFING.md). Because it's a monorepo, this package can import the backend's exported Hono app type directly for a fully-typed RPC client.

```
recipe-pantry-manager/
├── apps/
│   ├── api/       <- Hono backend
│   └── web/        <- this package
├── packages/
│   └── shared/       <- optional: shared Zod schemas/enums
├── pnpm-workspace.yaml
├── docker-compose.yml
└── .env.example
```

## Stack

- **Framework:** Vue 3, Composition API (`<script setup>`)
- **Build tool:** Vite
- **State management:** Pinia — for transient UI state only (e.g. selected recipes for this week's grocery list), not server data
- **Server state/caching:** TanStack Query (Vue Query) — wraps `hono/client` calls for caching, refetching, loading/error states. Matters especially for derived queries like "what can I cook" and the grocery list, which need proper cache invalidation whenever pantry state changes.
- **Styling:** Tailwind (suggested, not locked in — flexible)
- **Routing:** Vue Router

## Folder Structure (apps/web)

```
apps/web/
└── src/
    ├── components/
    ├── views/
    ├── stores/          # Pinia
    ├── composables/       # TanStack Query wrappers around hc calls
    ├── api/                 # hc client setup
    └── router/
```

## Connecting to the Backend (hono/client) — the key integration point

- The backend (`apps/api`) exports its Hono app's type: `export type AppType = typeof app`.
- In `apps/web/src/api/`, import that type as a workspace dependency and create the client:

  ```ts
  import { hc } from "hono/client";
  import type { AppType } from "@repo/api"; // workspace import

  export const client = hc<AppType>("http://localhost:PORT");
  ```

- Calls through `client` are fully typed end-to-end (request params, body shape, response shape) with **zero codegen** — this only works cleanly because both packages live in the same pnpm workspace and the backend keeps its routes chained (see backend briefing).
- Wrap these calls in TanStack Query composables (e.g. `useRecipesQuery()`, `usePantryMutation()`) rather than calling `client` directly from components, so caching/invalidation logic lives in one place.

## Data Flow Notes

- Recipe list, pantry contents, "what can I cook" results → **server state**, via TanStack Query.
- Selected recipes for a grocery list, form drafts, UI toggles → **Pinia**.
- Reuse Zod schemas (from the backend, or from `packages/shared` if introduced) as the single source of truth for form validation, so frontend and backend never drift on what a valid `PantryItem` or `RecipeIngredient` looks like.

## Suggested Build Order

nStack Query composables (e.g. `useRecipesQuery()`, `usePantryMutation()`) rather than calling `client` directly from components, so caching/invalidation logic lives in one place.

## Data Flow Notes

- Recipe list, pantry contents, "what can I cook" results → **server state**, via TanStack Query.
- Selected recipes for a grocery list, form drafts, UI toggles → **Pinia**.
- Reuse Zod schemas (from the backend, or from `packages/shared` if introduced) as the single source of truth for form validation, so frontend and backend never drift on what a valid `PantryItem` or `RecipeIngredient` looks like.

## Suggested Build Order

1. Recipe list + detail views (read-only, wired to `hc`)
2. Pantry view (list + manual add/remove)
3. Recipe selection + grocery list generation view
4. "What can I cook" view
5. Recipe scaling UI (leverages backend unit conversion)
6. Stretch: meal planning calendar view
