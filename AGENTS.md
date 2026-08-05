# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Gates, in order: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build`. They pass on a plain `npm ci` with the committed lockfile — the vitest/jsdom toolchain needs no config rename or dependency pin.
- No Meta token is needed to exercise the app end-to-end: `META_GRAPH_HOST` (see `src/lib/meta-api/config.ts`) points the whole client at a local Graph stub, and every resource takes an injectable `fetchImpl`.
- Graph money units are not uniform: budgets arrive in **minor** units, insights `spend` in **major** units. Convert with `minorUnitsToEur` / `majorUnitsToEur` from `src/lib/meta-api/resources/campaigns.ts`, never inline.
- The agent executes reads and only plans writes. Anything that would write goes through `buildPlan` with `requiresConfirmation` and a `validate_only` dry-run first; see `src/lib/agent/plan.ts`.
- The Meta token is server-side only. It is read from the environment inside `src/lib/agent/listing.ts` and sent in the `Authorization` header — never in a URL, never in a payload returned to the browser.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
