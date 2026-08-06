# metamanager

Meta Ads creation and management platform.

MetaManager is **AI-agent-first**: the user never operates the Meta Marketing
API through forms or wizards. There are exactly two human-facing surfaces — a
**chat** with an AI agent (the only place actions happen) and a **read-only
dashboard**.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
shadcn/ui · Vitest · ESLint · Prettier.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in META_ACCESS_TOKEN
npm run dev
```

The app runs without a token — `/chat` and `/dashboard` work, and `/health`
reports the Meta integration as _unconfigured_ rather than failing.

### Scripts

| Script                 | What it does                        |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Dev server on http://localhost:3000 |
| `npm run build`        | Production build                    |
| `npm start`            | Serve the production build          |
| `npm test`             | Vitest, single run                  |
| `npm run test:watch`   | Vitest, watch mode                  |
| `npm run lint`         | ESLint                              |
| `npm run typecheck`    | `tsc --noEmit`                      |
| `npm run format`       | Prettier, write                     |
| `npm run format:check` | Prettier, check only                |

### Environment

| Variable              | Required | Purpose                                                              |
| --------------------- | -------- | -------------------------------------------------------------------- |
| `META_ACCESS_TOKEN`   | yes      | System User or User token with `ads_management` / `ads_read`         |
| `META_BUSINESS_ID`    | no       | Reads `/{business_id}/owned_ad_accounts` instead of `/me/adaccounts` |
| `META_API_VERSION`    | no       | Graph API version pin. Defaults to `v26.0`                           |
| `META_API_TIMEOUT_MS` | no       | Request timeout. Defaults to `15000`                                 |

The token is read server-side only and is sent as an `Authorization: Bearer`
header, never in the query string.

## Surfaces

| Route             | What it is                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| `/chat`           | Message history, composer and loading state. Calls the `sendMessage` server action                   |
| `/dashboard`      | Read-only: account overview, campaigns → ad sets → ads, spend, leads and conversions. Mock data      |
| `/health`         | App liveness plus the Meta connection state (token present, accounts reachable, rate-limit headroom) |
| `POST /api/chat`  | Programmatic twin of the chat server action                                                          |
| `GET /api/health` | The health report as JSON. `503` when the Meta probe fails                                           |

## Layout

```
src/
  app/            routes, server actions, API routes
  components/     ui/ (shadcn base), chat/, dashboard/
  lib/
    meta-api/     typed Meta Marketing API v26.0 client
    agent/        intent parsing, plan building and campaign listing
    dashboard/    read-model types and fixtures
```

### `src/lib/meta-api/`

The client pins the Graph API version on every request (unversioned calls fall
back to the App Dashboard default, and expired versions silently downgrade),
parses the three rate-limit header families, follows cursor pagination
explicitly rather than chasing `paging.next`, and maps Graph errors onto typed
exceptions — classified **by numeric code only**, because the human-readable
descriptions change without notice.

```ts
import { MetaApiClient, listAdAccounts, listCampaigns } from "@/lib/meta-api";

const client = MetaApiClient.fromEnv();
const accounts = await listAdAccounts(client, { limit: 25 });
const campaigns = await listCampaigns(client, "act_123", { limit: 25 });
```

Errors: `MetaAuthError`, `MetaRateLimitError`, `MetaValidationError`,
`MetaTransportError`, `MetaConfigError`.

Budgets (`daily_budget`, `lifetime_budget`) come back in the account currency's
**minor units** — cents — while insights `spend` comes in **major units**. Use
`minorUnitsToEur` and `majorUnitsToEur` rather than converting inline.

## Reading campaigns from the chat

Generic Portuguese listing questions — "Que campanhas tenho criadas?", "Lista as
minhas campanhas", "Quantas campanhas tenho?" — parse to `action: "list"` and are
answered with the account's **real** campaigns: name, state, budget, spend and
total count. The Graph calls run server-side only, so the token never reaches the
browser. Spend is read from a separate `insights` call, so losing it costs the
column and not the listing.

A phrasing that names a metric ("mostra o CPA das campanhas") stays a `report`:
it asks for numbers, not for inventory.

## What this slice does not do

The agent has no LLM behind it yet. Apart from campaign listings, which execute,
`respondToMessage` parses the request into a structured intent and answers with
the plan of API calls it _would_ run — nothing else is executed against the Graph
API, and the reply says so. Listings at ad set and ad level are planned but not
executed. The dashboard reads fixtures, not live insights. Campaign/ad set/ad
writes, winning-ad marking, real-time refresh and auth flows beyond the env token
are all follow-up work.
