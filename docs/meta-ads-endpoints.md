# Meta Ads (Facebook Marketing API) — Endpoint Reference

> **AI-consultable map of the Meta Marketing API surface used by `metamanager`.**
> Every entry below was crawled from the live Meta for Developers documentation and carries a
> `Source` link to the exact page it came from.

| Metadata | Value |
| --- | --- |
| `api_family` | Meta Graph API — Marketing API |
| `latest_version` | **v26.0** (released 2026-07-29) |
| `base_url` | `https://graph.facebook.com/v26.0` |
| `crawled_on` | 2026-08-03 |
| `doc_status` | Live crawl of developers.facebook.com |

> **Reading note for agents.** Meta's reference pages render examples against whatever version the
> page defaults to (frequently `v25.0`). **Paths themselves are version-agnostic** — the version is
> only the first path segment. Always issue calls against `v26.0` unless a specific behaviour is
> known to have regressed. See [§3 Versioning](#3-versioning) and [§18 v26.0 breaking changes](#18-v260-changes-that-affect-ads-integrations).

---

## Index

| § | Category | Jump |
| --- | --- | --- |
| 1 | Conventions & field-naming | [link](#1-conventions--field-naming) |
| 2 | Authentication, permissions & access tiers | [link](#2-authentication-permissions--access-tiers) |
| 3 | Versioning | [link](#3-versioning) |
| 4 | Rate limits | [link](#4-rate-limits) |
| 5 | Ad Account (root node) | [link](#5-ad-account-root-node) |
| 6 | Campaigns | [link](#6-campaigns) |
| 7 | Ad Sets | [link](#7-ad-sets) |
| 8 | Ads | [link](#8-ads) |
| 9 | Ad Creatives & creative assets | [link](#9-ad-creatives--creative-assets) |
| 10 | Targeting, Audiences & estimates | [link](#10-targeting-audiences--estimates) |
| 11 | Insights & reporting | [link](#11-insights--reporting) |
| 12 | Conversion tracking (Pixel, CAPI, Offline, Custom Conversions) | [link](#12-conversion-tracking) |
| 13 | Business Manager & asset management | [link](#13-business-manager--asset-management) |
| 14 | Catalogs & commerce | [link](#14-catalogs--commerce) |
| 15 | Lead Ads | [link](#15-lead-ads) |
| 16 | Automation: rules, labels, batch & async | [link](#16-automation-rules-labels-batch--async) |
| 17 | Error codes | [link](#17-error-codes) |
| 18 | v26.0 changes | [link](#18-v260-changes-that-affect-ads-integrations) |
| 19 | Source URLs | [link](#19-source-urls-crawled) |

---

## 1. Conventions & field-naming

Used consistently throughout this document.

| Placeholder | Meaning | Example |
| --- | --- | --- |
| `{AD_ACCOUNT_ID}` | Numeric ad account id **without** the `act_` prefix | `123456789` |
| `act_{AD_ACCOUNT_ID}` | Prefixed form required in ad-account paths | `act_123456789` |
| `{CAMPAIGN_ID}` | Campaign node id | `234...` |
| `{ADSET_ID}` | Ad set node id | — |
| `{AD_ID}` | Ad node id | — |
| `{CREATIVE_ID}` | AdCreative node id | — |
| `{BUSINESS_ID}` | Business Manager id | — |
| `{PIXEL_ID}` / `{DATASET_ID}` | Ads Pixel / dataset id (same id space for CAPI) | — |
| `{PAGE_ID}` | Facebook Page id | — |
| `{VERSION}` | API version segment | `v26.0` |

Global request conventions:

- All paths are appended to `https://graph.facebook.com/{VERSION}`.
- `access_token` is required on every call (query string or `Authorization: Bearer` header).
- `fields=a,b,c` selects the returned fields; omitting it returns only default fields.
- Cursor pagination via `limit` + `after` / `before`; response carries a `paging` object.
- `execution_options=['validate_only']` performs a dry-run on most write endpoints (Campaign, Ad Set, Ad).

---

## 2. Authentication, permissions & access tiers

| Item | Detail |
| --- | --- |
| Token types | User access token, System User token (Business Manager), Page access token |
| Core permissions | `ads_management` — read **and** manage ads for owned/granted accounts; `ads_read` — read-only ad reporting |
| Related permissions | `business_management`, `read_insights`, `leads_retrieval`, `catalog_management`, `pages_read_engagement` |
| Scope rule | Standard access suffices for **your own** accounts; advanced access is required to manage **other people's** accounts (App Review). |

### Access tiers

| Tier | How obtained | Rate-limit posture | System users |
| --- | --- | --- | --- |
| `development_access` / "Limited Access" | Automatic on adding the Marketing API product | "Heavily rate-limited per ad account. For development only." | 1 + 1 admin |
| `standard_access` | Intermediate tier surfaced in rate-limit headers | Higher quotas than development | — |
| `full_access` (formerly "Advanced Access") | Click **+Upgrade** in App Dashboard once qualified | "Lightly rate limited per ad account" | 10 + 1 admin |

**Full Access qualification:** ≥ **500** Marketing API calls in the past **15 days** (threshold reduced from 1,500) **and** an error rate below **15%** across the last 500 calls. Limited Access also restricts Business Manager and Catalog API surface area.

> Sources: [Marketing API Access](https://developers.facebook.com/docs/marketing-api/access) · [Insights Limits & Best Practices](https://developers.facebook.com/docs/marketing-api/insights/best-practices/)

---

## 3. Versioning

| Property | Value |
| --- | --- |
| Base URL | `graph.facebook.com` |
| Version format | `https://graph.facebook.com/v26.0/{endpoint}` |
| Current version | **v26.0** — released **2026-07-29** |
| Support window | "Each version will remain for at least 2 years from release" |
| After expiry | Calls "will be defaulted to the next oldest, usable version" (silent fallback, not a hard failure) |
| Unversioned calls | Fall back to the version configured in App Dashboard → Settings → Advanced. **Always pin the version explicitly.** |

### Version lifecycle table

| Version | Released | Expires |
| --- | --- | --- |
| **v26.0** | 2026-07-29 | TBD |
| v25.0 | 2026-02-18 | 2028-07-29 |
| v24.0 | 2025-10-08 | 2028-02-18 |
| v23.0 | 2025-05-29 | 2027-10-08 |
| v22.0 | 2025-01-21 | 2027-05-20 |
| v21.0 | 2024-10-02 | 2027-01-21 |
| v20.0 | 2024-05-21 | 2026-09-24 |

> ⚠️ **v20.0 expires 2026-09-24** — within two months of this document's crawl date.

> Sources: [Graph API Changelog](https://developers.facebook.com/docs/graph-api/changelog) · [Versioning guide](https://developers.facebook.com/docs/graph-api/guides/versioning)

---

## 4. Rate limits

Three independent limiter families apply. Read the headers; do not infer limits from call counts alone.

### 4.1 Platform rate limits (app / user tokens)

| Header | Fields | Meaning |
| --- | --- | --- |
| `X-App-Usage` | `call_count`, `total_cputime`, `total_time` | Percentages 0–100. Throttling begins when **any** field reaches 100. |

**Formula:** `Calls within one hour = 200 × Number of Users` (unique daily active users, smoothed to weekly/monthly during low-activity periods).

### 4.2 Business Use Case (BUC) limits — the ones that matter for Marketing API

Applied to system/page access tokens. Returned in `X-Business-Use-Case-Usage` (up to **32** objects per call).

| Field | Meaning |
| --- | --- |
| `business-id` | Business the quota belongs to |
| `type` | `ads_insights`, `ads_management`, `custom_audience`, `instagram`, `leadgen`, `messenger`, `pages` |
| `call_count` | % of allowed calls used (hourly or 24-hour window depending on type) |
| `total_cputime` | % CPU used |
| `total_time` | % total time used |
| `estimated_time_to_regain_access` | Minutes until throttling lifts |
| `ads_api_access_tier` | `development_access` \| `standard_access` |

**BUC formulas (Standard Access):**

| Type | Formula |
| --- | --- |
| `ads_insights` | `600 + 400 × Active ads − 0.001 × User Errors` per hour |
| `ads_management` | `300 + 40 × Active ads` per hour |
| `custom_audience` | `5000 + 40 × Active Custom Audiences` per hour (cap **700,000**) |
| `leadgen` | `4800 × Leads Generated` per 24h |
| `pages` | `4800 × Engaged Users` per 24h |
| `instagram` | `4800 × Impressions` per 24h |

### 4.3 Insights-specific throttles

| Header | Fields | Notes |
| --- | --- | --- |
| `x-fb-ads-insights-throttle` | `app_id_util_pct`, `acc_id_util_pct` | Per-app **and** per-ad-account load. Exceeding → `error_code = 4`. |
| `x-Fb-Ads-Insights-Reach-Throttle` | — | Guards `reach` queries with breakdowns older than 13 months. |
| `X-Ad-Account-Usage` (Ads API ≤ v3.3, legacy) | `acc_id_util_pct`, `reset_time_duration`, `ads_api_access_tier` | Legacy header; retained for completeness. |

**Reach restriction (effective 2025-06-10):** `reach` is unavailable for synchronous queries combining `breakdowns` with a `start_date` older than 13 months. Async jobs allow up to **10 requests per ad account per day** for older reach data.

**Data-per-call limit:** `error_code = 100`, subcode `1487534` — driven by response row count *and* computation data points. Applies to both sync and async `/insights`.

**Global throttling:** `error_code = 4`, subcode `1504022` during platform-wide high load.

### 4.4 Operational guidance surfaced by the docs

- Insights refresh every **15 minutes** and stop changing after **28 days**.
- Retention/lookback: `date_preset=lifetime` is disabled since v10.0 — use `maximum` (up to **37 months**).
- `report_run_id` expires after **30 days**; async jobs may take **up to one hour** including retries.
- Prefer `date_preset` over custom ranges; use `filtering` to drop empty rows; pace `/insights` calls rather than firing them simultaneously; add back-off as utilisation approaches 100%.
- Campaign `start_time` beyond **37 months** from now → error `3018`.

> Sources: [Graph API Rate Limiting](https://developers.facebook.com/docs/graph-api/overview/rate-limiting) · [Insights Limits & Best Practices](https://developers.facebook.com/docs/marketing-api/insights/best-practices/)

---

## 5. Ad Account (root node)

`AdAccount` is the container every ads write hangs off.

| Method | Path | Use case |
| --- | --- | --- |
| `GET` | `/act_{AD_ACCOUNT_ID}` | Read account metadata, balance, currency, status |

**Key fields:** `id` (`act_…` form), `account_id` (numeric), `account_status`, `name`, `currency`, `amount_spent`, `balance`, `business` (Business object), `timezone_id`, `spend_cap`.

### Edges (grouped by purpose)

| Purpose | Edges |
| --- | --- |
| **Structure** | `campaigns`, `adsets`, `ads`, `adcreatives`, `asyncadcreatives`, `asyncadrequestsets`, `async_batch_requests` |
| **Assets** | `adimages`, `advideos`, `adlabels`, `advertisable_applications`, `applications`, `promote_pages`, `instagram_accounts`, `connected_instagram_accounts` |
| **Audiences** | `customaudiences`, `customaudiencestos`, `saved_audiences`, `broadtargetingcategories` |
| **Targeting tools** | `targetingsearch`, `targetingbrowse`, `targetingsuggestions`, `targetingvalidation`, `deprecatedtargetingadsets` |
| **Estimation** | `reachestimate`, `delivery_estimate`, `minimum_budgets`, `generatepreviews` |
| **Measurement** | `insights`, `adspixels`, `customconversions`, `mcmeconversions`, `impacting_ad_studies`, `ads_reporting_mmm_reports`, `ads_reporting_mmm_schedulers` |
| **Governance** | `activities`, `account_controls`, `assigned_users`, `adrules_library`, `dsa_recommendations` |
| **By-label lookups** | `campaignsbylabels`, `adsetsbylabels`, `adsbylabels`, `adcreativesbylabels` |

> Source: [AdAccount reference](https://developers.facebook.com/docs/marketing-api/reference/ad-account/)

---

## 6. Campaigns

Node type: `Campaign` (reference page slug: `ad-campaign-group`).

| Method | Path | Use case |
| --- | --- | --- |
| `GET` | `/{CAMPAIGN_ID}?fields=…` | Read a single campaign |
| `GET` | `/act_{AD_ACCOUNT_ID}/campaigns` | List campaigns in an account |
| `POST` | `/act_{AD_ACCOUNT_ID}/campaigns` | **Create** a campaign |
| `POST` | `/{CAMPAIGN_ID}` | Update a campaign |
| `POST` | `/{CAMPAIGN_ID}/copies` | Duplicate a campaign (optionally deep-copy children) |
| `POST` | `/act_{AD_ACCOUNT_ID}/async_batch_requests` | Bulk campaign creation asynchronously |
| `DELETE` | `/{CAMPAIGN_ID}` | Delete a campaign |
| `DELETE` | `/act_{AD_ACCOUNT_ID}/campaigns` | Batch delete by strategy |

### Create parameters — `POST /act_{AD_ACCOUNT_ID}/campaigns`

| Parameter | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | UTF-8 string | ✅ | Emoji supported |
| `objective` | enum | ✅ | See enum below |
| `special_ad_categories` | array<enum> | ✅ | `NONE`, `EMPLOYMENT`, `HOUSING`, `CREDIT`, `ISSUES_ELECTIONS_POLITICS`, `ONLINE_GAMBLING_AND_GAMING`, `FINANCIAL_PRODUCTS_SERVICES` |
| `status` | enum | — | `ACTIVE` \| `PAUSED` at creation; default `PAUSED` |
| `buying_type` | string | — | `AUCTION` (default) \| `RESERVED` |
| `daily_budget` | int64 | — | CBO daily budget (minor units) |
| `lifetime_budget` | int64 | — | CBO lifetime budget |
| `spend_cap` | int64 | — | Minimum $100 USD equivalent |
| `bid_strategy` | enum | — | `LOWEST_COST_WITHOUT_CAP`, `LOWEST_COST_WITH_BID_CAP`, `COST_CAP`, `LOWEST_COST_WITH_MIN_ROAS` |
| `promoted_object` | object | — | `page_id`, `pixel_id`, `application_id`, `product_catalog_id`, … |
| `special_ad_category_country` | array<enum> | — | ISO country codes |
| `start_time` / `stop_time` | datetime | — | `start_time` > 37 months ahead → error `3018` |
| `adlabels` | list<AdLabel> | — | Grouping |
| `is_adset_budget_sharing_enabled` | boolean | — | Ad set budget sharing |
| `is_skadnetwork_attribution` | boolean | — | iOS 14+ SKAdNetwork |
| `campaign_optimization_type` | enum | — | `NONE` \| `ICO_ONLY` |
| `budget_schedule_specs` | list | — | High-demand-period budget scheduling |
| `source_campaign_id` | numeric string | — | Set when copied |
| `execution_options` | list<enum> | — | `validate_only`, `include_recommendations` |

### `objective` enum (ODAX + legacy)

`OUTCOME_AWARENESS`, `OUTCOME_TRAFFIC`, `OUTCOME_ENGAGEMENT`, `OUTCOME_LEADS`, `OUTCOME_APP_PROMOTION`, `OUTCOME_SALES` — plus legacy values still listed: `APP_INSTALLS`, `BRAND_AWARENESS`, `CONVERSIONS`, `EVENT_RESPONSES`, `LEAD_GENERATION`, `LINK_CLICKS`, `LOCAL_AWARENESS`, `MESSAGES`, `OFFER_CLAIMS`, `PAGE_LIKES`, `POST_ENGAGEMENT`, `PRODUCT_CATALOG_SALES`, `REACH`, `STORE_VISITS`, `VIDEO_VIEWS`.

> **Use `OUTCOME_*` for new campaigns.** The legacy set is retained for reading pre-ODAX campaigns.

### Update-only parameters — `POST /{CAMPAIGN_ID}`

Beyond the create set: `adset_budgets` (array mapping child ad set ids → budgets, used when toggling CBO↔ABO), `adset_bid_amounts` (map adset id → bid, for autobid→manual transitions), `budget_rebalance_flag`, `smart_promotion_type` (`GUIDED_CREATION` \| `SMART_APP_PROMOTION`), `is_reels_trending_ads_enabled`.

### Copy — `POST /{CAMPAIGN_ID}/copies`

| Parameter | Type | Notes |
| --- | --- | --- |
| `deep_copy` | boolean | Default `false`. Copies child ad sets — max **3** synchronously, **51** asynchronously |
| `start_time` / `end_time` | datetime | Override copied schedule |
| `status_option` | enum | `ACTIVE`, `PAUSED` (default), `INHERITED_FROM_SOURCE` |
| `rename_options` | JSON | `rename_strategy` = `DEEP_RENAME` \| `ONLY_TOP_LEVEL_RENAME` \| `NO_RENAME`, plus `rename_prefix`, `rename_suffix` |
| `parameter_overrides` | Campaign spec | Override source values |

### Batch delete — `DELETE /act_{AD_ACCOUNT_ID}/campaigns`

| Parameter | Type | Required | Values |
| --- | --- | --- | --- |
| `delete_strategy` | enum | ✅ | `DELETE_ANY`, `DELETE_OLDEST`, `DELETE_ARCHIVED_BEFORE` |
| `before_date` | datetime | — | Cutoff for `DELETE_ARCHIVED_BEFORE` |
| `object_count` | integer | — | How many to delete |

### Edges

`adsets`, `ads`, `insights`, `ad_studies`, `adrules_governed`, `copies`.

> Source: [Campaign reference](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group/)

---

## 7. Ad Sets

Node type: `AdSet` (reference page slug: `ad-campaign` — note the confusing legacy slug).

| Method | Path | Use case |
| --- | --- | --- |
| `GET` | `/{ADSET_ID}` | Read one ad set |
| `GET` | `/act_{AD_ACCOUNT_ID}/adsets` | List ad sets in an account |
| `GET` | `/{CAMPAIGN_ID}/adsets` | List ad sets under a campaign |
| `POST` | `/act_{AD_ACCOUNT_ID}/adsets` | **Create** an ad set |
| `POST` | `/{ADSET_ID}` | Update (incl. `status=DELETED` to delete) |
| `POST` | `/{ADSET_ID}/copies` | Duplicate an ad set |

**List filters on `GET /act_{AD_ACCOUNT_ID}/adsets`:** `date_preset`, `effective_status` (`ACTIVE`, `PAUSED`, `DELETED`, `PENDING_REVIEW`, `DISAPPROVED`, …), `is_completed` (boolean), `time_range` (`{since, until}` in `YYYY-MM-DD`).

### Create parameters — `POST /act_{AD_ACCOUNT_ID}/adsets`

| Parameter | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | ✅ | Max 400 chars, emoji supported |
| `campaign_id` | numeric string | ✅¹ | ¹ Or `campaign_spec` (`{name, objective, buying_type}`) |
| `daily_budget` **or** `lifetime_budget` | int64 | ✅² | ² Not required when the parent campaign holds the budget (CBO). Both must be > 0 |
| `optimization_goal` | enum | ✅ | `APP_INSTALLS`, `LINK_CLICKS`, `OFFSITE_CONVERSIONS`, `IMPRESSIONS`, `REACH`, `LEAD_GENERATION`, `THRUPLAY`, `LANDING_PAGE_VIEWS`, `VALUE`, … |
| `billing_event` | enum | ✅ | `IMPRESSIONS`, `LINK_CLICKS`, `CLICKS`, `THRUPLAY`, … |
| `targeting` | Targeting object | ✅ | `geo_locations` required — see [§10](#10-targeting-audiences--estimates) |
| `status` | enum | ✅ | `ACTIVE` \| `PAUSED` only at creation |
| `bid_amount` | integer | conditional | Required when `bid_strategy` is `LOWEST_COST_WITH_BID_CAP` or `COST_CAP` |
| `bid_strategy` | enum | — | Same enum as Campaign |
| `start_time` | datetime | — | — |
| `end_time` | datetime | conditional | Required with `lifetime_budget` |
| `promoted_object` | object | conditional | Required for conversion goals: `page_id`, `pixel_id`, `custom_event_type`, `application_id`, `object_store_url`, `product_catalog_id`, `product_set_id` |
| `dsa_payor` | string ≤512 | conditional | **Required when targeting the EU** — omission → error subcode `3858079` |
| `dsa_beneficiary` | string ≤512 | conditional | **Required when targeting the EU** — omission → error subcode `3858081` |
| `destination_type` | enum | — | `WEBSITE`, `APP`, `MESSENGER`, `INSTAGRAM_DIRECT`, … |
| `is_dynamic_creative` | boolean | — | Enables Dynamic Creative |
| `attribution_spec` | list | — | Attribution windows |
| `adset_schedule` | list | — | Dayparting |
| `frequency_control_specs` | list | — | Frequency caps |
| `execution_options` | list<enum> | — | `validate_only`, `include_recommendations` |

**Read fields of note:** `effective_status`, `issues_info`, `bid_info`, `recommendations`.

**Budget minimums:** vary by `billing_event` and `bid_strategy`. Documented example: with `bid_strategy=LOWEST_COST_WITHOUT_CAP` and impression billing, minimum daily budget is **$0.50**.

**Flagged audiences (effective 2025-09-02):** custom audiences or custom conversions implying health conditions or financial status are blocked. `issues_info` populates with `2460003` (Custom Audience blocked) or `2460004` (Custom Conversion blocked).

### Edges

`ads`, `adcreatives`, `insights`, `delivery_estimate`, `adrules_governed`, `copies`, `targetingsentencelines`.

> Source: [Ad Set reference](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign/)

---

## 8. Ads

Node type: `Ad` (reference page slug: `adgroup`).

| Method | Path | Use case |
| --- | --- | --- |
| `GET` | `/{AD_ID}` | Read one ad |
| `GET` | `/act_{AD_ACCOUNT_ID}/ads` | All ads in the account |
| `GET` | `/{CAMPAIGN_ID}/ads` | Ads under a campaign |
| `GET` | `/{ADSET_ID}/ads` | Ads under an ad set |
| `POST` | `/act_{AD_ACCOUNT_ID}/ads` | **Create** an ad (synchronous) |
| `POST` | `/act_{AD_ACCOUNT_ID}/asyncadrequestsets` | Create ads asynchronously in bulk |
| `POST` | `/{AD_ID}` | Update an ad |
| `POST` | `/{AD_ID}/copies` | Duplicate an ad |
| `DELETE` | `/{AD_ID}` | Delete an ad |

### Create parameters — `POST /act_{AD_ACCOUNT_ID}/ads`

| Parameter | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | ✅ | — |
| `adset_id` | numeric string | ✅ | Immutable after creation |
| `creative` | object | ✅ | `{creative_id}` or an inline AdCreative spec |
| `status` | enum | — | `ACTIVE` \| `PAUSED` |
| `conversion_domain` | string | — | Required for many web-conversion ads (Aggregated Event Measurement) |
| `tracking_specs` | list | — | Third-party / additional tracking |
| `adlabels` | list | — | — |
| `ad_schedule_start_time` / `ad_schedule_end_time` | datetime | — | Per-ad scheduling |
| `display_sequence` | integer | — | Ordering within a sequenced ad set |
| `priority` | integer | — | — |

### Async ad creation — `POST /act_{AD_ACCOUNT_ID}/asyncadrequestsets`

| Parameter | Required | Notes |
| --- | --- | --- |
| `name` | ✅ | Request-set name |
| `ad_specs` | ✅ | Array of ad specs |
| `notification_uri` | — | Callback URL |
| `notification_mode` | — | Notification behaviour |

### Copy — `POST /{AD_ID}/copies`

Parameters: `adset_id` (destination), `creative_parameters`, `rename_options`, `status_option`.

### Mutation constraints

- Only fields usable at creation can be modified.
- **Cannot update:** `adset_id`, `social_prefs`.
- **Archived ads:** only `name` and `status` (→ `DELETED`).
- **Deleted ads:** only `name`.
- Ads inside an ad set with `creative_sequence` settings **cannot be deleted**.

### Edges

`adcreatives`, `insights`, `previews`, `leads`, `targetingsentencelines`, `adrules_governed`, `copies`.

> Source: [Ad reference](https://developers.facebook.com/docs/marketing-api/reference/adgroup/)

---

## 9. Ad Creatives & creative assets

### 9.1 AdCreative

| Method | Path | Use case |
| --- | --- | --- |
| `GET` | `/{CREATIVE_ID}` | Read a creative |
| `GET` | `/act_{AD_ACCOUNT_ID}/adcreatives` | List creatives |
| `POST` | `/act_{AD_ACCOUNT_ID}/adcreatives` | **Create** a creative |
| `POST` | `/{CREATIVE_ID}` | Update (`name`, `status`, `adlabels` only) |
| `DELETE` | `/{CREATIVE_ID}` | Delete a creative |

**Create parameters:**

| Parameter | Type | Notes |
| --- | --- | --- |
| `name` | string | Creative-library name, max **100** chars |
| `object_story_spec` | object | Builds an unpublished page post. Contains `page_id` plus exactly one of `link_data`, `photo_data`, `video_data`, `text_data`, `template_data` |
| `object_story_id` | string | Reference an **existing** post instead of creating one |
| `asset_feed_spec` | object | Dynamic Creative — "automatically experiment and deliver different variations" |
| `degrees_of_freedom_spec` | object | Which creative transformations (Advantage+ creative) are enabled |
| `authorization_category` | enum | `POLITICAL` \| `POLITICAL_WITH_DIGITALLY_CREATED_MEDIA` |
| `url_tags` | string | Query-string params appended for tracking |
| `adlabels` | list | Grouping |

**Update `status` enum:** `ACTIVE`, `IN_PROCESS`, `WITH_ISSUES`, `DELETED`.
**Edge:** `previews` — returns HTML snippets.

> Source: [AdCreative reference](https://developers.facebook.com/docs/marketing-api/reference/ad-creative/)

### 9.2 AdImage

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/act_{AD_ACCOUNT_ID}/adimages` | List images. No required params |
| `POST` | `/act_{AD_ACCOUNT_ID}/adimages` | Upload: `bytes` (Base64) **or** `copy_from` (duplicate across accounts; requires access to source) |
| `DELETE` | `/act_{AD_ACCOUNT_ID}/adimages` | Params: `hash` or `image_id` |

- **Filename must carry an extension** — `sample.jpg`, not `sample` or `sample.tmp`. Max **100** chars.
- Returned fields: `hash`, `url`, `permalink_url`, `width`, `height`, `creatives`, `status` (`ACTIVE`, `INTERNAL`, `DELETED`).
- **Use `hash`, not `url`, in creatives** — image URLs are temporary.
- Images in use by a creative cannot be deleted. Rate-limit breach → error `613`.

> Source: [AdImage reference](https://developers.facebook.com/docs/marketing-api/reference/ad-image/)

### 9.3 AdVideo

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/act_{AD_ACCOUNT_ID}/advideos` | Paginated `Video` nodes; filterable by dimensions, duration, aspect ratio; `summary` gives `total_count` |
| `POST` | `/act_{AD_ACCOUNT_ID}/advideos` | Upload |

**Upload parameters:** `source` (video encoded as form data), `file_url`, `title` (< 255 chars — special characters may count as more than one), `name`, `description` (emoji supported), `unpublished_content_type` (`DRAFT`, `SCHEDULED`, …).

**Chunked/resumable upload** — driven by `upload_phase` ∈ `start` | `transfer` | `finish` | `cancel`, with `file_size`, `video_file_chunk`, `start_offset` (inclusive), `end_offset`, `upload_session_id`.

> Source: [AdVideo edge reference](https://developers.facebook.com/docs/marketing-api/reference/ad-account/advideos/)

### 9.4 Ad previews

| Method | Path | Use case |
| --- | --- | --- |
| `GET` | `/act_{AD_ACCOUNT_ID}/generatepreviews` | Preview a creative spec **before** creating an ad |
| `GET` | `/{AD_ID}/previews` | Preview an existing ad |
| `GET` | `/{CREATIVE_ID}/previews` | Preview an existing creative |

**Required:** `creative` (AdCreative spec object), `ad_format` (enum).
**Optional:** `product_item_ids`, `post` (`{link, message, picture, name, caption, description, call_to_action}`), `height`, `width`, `dynamic_creative_spec`, `place_page_id`, `start_date`, `end_date`, `dynamic_asset_label`, `dynamic_customization`, `creative_feature`.

**`ad_format` enum (abridged — full list on the source page):** `DESKTOP_FEED_STANDARD`, `MOBILE_FEED_STANDARD`, `MOBILE_FEED_BASIC`, `RIGHT_COLUMN_STANDARD`, `INSTAGRAM_STANDARD`, `INSTAGRAM_STORY`, `INSTAGRAM_REELS`, `INSTAGRAM_PROFILE_FEED`, `INSTAGRAM_SEARCH_GRID`, `INSTAGRAM_EXPLORE_GRID_HOME`, `FACEBOOK_STORY_MOBILE`, `FACEBOOK_REELS_MOBILE`, `FACEBOOK_PROFILE_FEED_MOBILE`, `MARKETPLACE_MOBILE`, `WATCH_FEED_MOBILE`, `MESSENGER_MOBILE_INBOX_MEDIA`, `MESSENGER_MOBILE_STORY_MEDIA`, `AUDIENCE_NETWORK_INSTREAM_VIDEO`, `AUDIENCE_NETWORK_REWARDED_VIDEO`, `INSTANT_ARTICLE_STANDARD`, `WHATSAPP_STATUS_MEDIA`, `MOBILE_INTERSTITIAL`, `MOBILE_BANNER`, `MOBILE_NATIVE`, …

> ⚠️ `INSTAGRAM_EXPLORE_CONTEXTUAL` / Explore placement is **removed in v26.0** — see [§18](#18-v260-changes-that-affect-ads-integrations).

> Source: [generatepreviews reference](https://developers.facebook.com/docs/marketing-api/reference/ad-account/generatepreviews/)

### 9.5 Instagram accounts for ads

| Method | Path | Returns |
| --- | --- | --- |
| `GET` | `/act_{AD_ACCOUNT_ID}/instagram_accounts` | `data` (list of `IGUser` nodes), `paging`, `summary.total_count` |
| `GET` | `/act_{AD_ACCOUNT_ID}/connected_instagram_accounts` | Instagram profiles linked to the account (edge listed on AdAccount) |

> Source: [instagram_accounts edge](https://developers.facebook.com/docs/marketing-api/reference/ad-account/instagram_accounts/)

---

## 10. Targeting, Audiences & estimates

### 10.1 Targeting object (embedded in Ad Set `targeting`)

| Group | Fields |
| --- | --- |
| Geo & demographic | `geo_locations`, `age_min`, `age_max`, `genders`, `locales` |
| Interests & behaviours | `interests`, `behaviors` |
| Audience selection | `custom_audiences`, `excluded_custom_audiences`, `flexible_spec`, `exclusions` |
| Placements | `publisher_platforms`, `facebook_positions`, `instagram_positions`, `messenger_positions`, `audience_network_positions`, `device_platforms` (`mobile`, `desktop`, `connected_tv`) |
| Advanced | `targeting_automation`, `targeting_relaxation_types`, `user_os`, `user_device`, `brand_safety_content_filter_levels` |

> ⚠️ **v26.0:** Advantage+ Audience (HEC-F) ad sets with relaxable targeting now **require** an explicit `targeting_automation.advantage_audience` flag — omitting it returns an error.

> Source: [Targeting reference](https://developers.facebook.com/docs/marketing-api/reference/targeting/)

### 10.2 Targeting discovery — `GET /{VERSION}/search`

| Parameter | Required | Notes |
| --- | --- | --- |
| `type` | ✅ | Data category (table below) |
| `q` | mostly ✅ | UTF-8 query string |
| `access_token` | ✅ | User access token |
| `limit` | — | Default **8** |
| `list` | — | `GLOBAL` returns Facebook IDs instead of FIPS codes (`adzipcode`) |

| `type` value | Purpose | Extra parameters |
| --- | --- | --- |
| `adgeolocation` | Countries, regions, cities, ZIPs, geo markets, electoral districts | `location_types` (`country`, `country_group`, `region`, `city`, `zip`, `geo_market`, `electoral_district`), `country_code`, `region_id`, `match_country_code` |
| `adgeolocationmeta` | Metadata for known geos | `countries`, `regions`, `country_groups`, `cities`, `zips` |
| `adradiussuggestion` | Suggested radius | `latitude`, `longitude`, `distance_unit` (`mile` \| `kilometer`) |
| `adlocale` | Language/locale targeting | `q` |
| `adinterest` | Interest targeting | `q` |
| `adinterestsuggestion` | Related interests | `interest_list` |
| `adinterestvalid` | Validate interest terms | `interest_list` \| `interest_fbid_list` |
| `adTargetingCategory` | Browse categories | `class` ∈ `interests`, `behaviors`, `demographics`, `life_events`, `industries`, `income`, `family_statuses`, `user_device`, `user_os` |
| `adeducationschool` | Schools | `q` |
| `adeducationmajor` | Majors | `q` |
| `adworkemployer` | Employers | `q` |
| `adworkposition` | Job titles | `q` |
| `targetingoptionstatus` | Health check on targeting objects | `targeting_option_list` |

**Response fields:** geo → `key`, `name`, `type`, `country_code`, `region_id`, `supports_city`, `supports_region`; interests/demographics → `id`, `name`, `audience_size`, `path`, `coverage`; status → `current_status` (`NORMAL`, `NON-DELIVERABLE`, `DEPRECATING`, `NON-DELIVERABLE-IN-EXCLUSION`, `UNKNOWN`), `future_plan`.

**Account-scoped variants:** `GET /act_{AD_ACCOUNT_ID}/targetingsearch`, `/targetingbrowse`, `/targetingsuggestions`, `/targetingvalidation`.

> Source: [Targeting Search reference](https://developers.facebook.com/docs/marketing-api/audiences/reference/targeting-search/)

### 10.3 Custom Audiences

| Method | Path | Use case |
| --- | --- | --- |
| `GET` | `/{CUSTOM_AUDIENCE_ID}` | Read audience metadata & health |
| `GET` | `/act_{AD_ACCOUNT_ID}/customaudiences` | List audiences |
| `POST` | `/act_{AD_ACCOUNT_ID}/customaudiences` | **Create** an audience |
| `POST` | `/{CUSTOM_AUDIENCE_ID}` | Update |
| `POST` | `/{CUSTOM_AUDIENCE_ID}/users` | **Add** hashed users |
| `DELETE` | `/{CUSTOM_AUDIENCE_ID}/users` | Remove users |
| `POST` | `/{CUSTOM_AUDIENCE_ID}/usersreplace` | **Replace** the whole dataset |
| `POST` | `/{CUSTOM_AUDIENCE_ID}/adaccounts` | Share with another ad account |
| `DELETE` | `/{CUSTOM_AUDIENCE_ID}` | Delete |

**Create parameters:**

| Parameter | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | ✅ | — |
| `subtype` | enum | ✅ | `CUSTOM`, `WEBSITE`, `APP`, `ENGAGEMENT`, `LOOKALIKE`, `OFFLINE_CONVERSION`, `CLAIM`, `VIDEO`, … |
| `description` | string | — | — |
| `customer_file_source` | enum | conditional | `USER_PROVIDED_ONLY`, `PARTNER_PROVIDED_ONLY`, `BOTH` — required for customer-file audiences |
| `rule` | string (JSON) | conditional | For website / product / video audiences |
| `rule_aggregation` | string | — | Aggregation on the rule |
| `retention_days` | int | — | **1–180** |
| `lookalike_spec` | JSON | conditional | Required for `subtype=LOOKALIKE` (`origin_audience_id`, `ratio`, `country`/`starting_ratio`) |
| `event_sources` | array | — | Pixel / app / page / offline event sources |
| `opt_out_link` | string | — | — |
| `claim_objective` | enum | — | `PRODUCT`, `TRAVEL`, `HOME_LISTING`, … |
| `content_type` | enum | — | `GENERIC`, `PRODUCT`, `VEHICLE`, … |
| `enable_fetch_or_create` | boolean | — | Idempotent create |

**Key read fields:** `approximate_count`, `approximate_count_lower_bound`, `approximate_count_upper_bound`, `operation_status` (**200** = normal, **471** = flagged for integrity), `delivery_status` (200 = active, ≥300 = issues), `fields_violating_integrity_policy`, `retention_days`, `rule`, `time_created`, `time_updated`, `time_content_updated`.

**Updatable fields:** `name`, `description`, `opt_out_link`, `retention_days`, `allowed_domains`, `use_for_products`, `use_in_campaigns`.

**Constraints:**
- A flagged audience (`operation_status = 471`) cannot be edited until `fields_violating_integrity_policy` is addressed.
- Deleting is **permanent** and stops ads using it.
- Cannot delete when derived lookalike audiences exist → error `2656`.
- Creating audiences requires accepting Custom Audience Terms of Service (`error 200`, subcode `1870034` otherwise). ToS edge: `/act_{AD_ACCOUNT_ID}/customaudiencestos`.

**Edges:** `users`, `usersreplace`, `adaccounts`, `ads`, `health`, `sessions`, `shared_account_info`.

> Source: [CustomAudience reference](https://developers.facebook.com/docs/marketing-api/reference/custom-audience/)

### 10.4 Saved Audiences

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/{SAVED_AUDIENCE_ID}` | Read a saved targeting spec |
| `GET` | `/act_{AD_ACCOUNT_ID}/saved_audiences` | List |
| `POST` | `/act_{AD_ACCOUNT_ID}/saved_audiences` | Create — `name` ✅, `targeting` ✅, `description` optional |

**Fields:** `id`, `name`, `description`, `targeting`, `approximate_count_lower_bound`, `approximate_count_upper_bound`, `run_status`, `time_created`, `time_updated`, `permission_for_actions`, `sentence_lines`.
**Update and delete are not supported on this node** — the docs return "You can't perform this operation on this endpoint."

> Source: [SavedAudience reference](https://developers.facebook.com/docs/marketing-api/reference/saved-audience/)

### 10.5 Reach & delivery estimates

| Method | Path | Required params |
| --- | --- | --- |
| `GET` | `/act_{AD_ACCOUNT_ID}/delivery_estimate` | `optimization_goal` ✅, `targeting_spec` ✅, `promoted_object` optional |
| `GET` | `/{ADSET_ID}/delivery_estimate` | Estimate for an existing ad set |
| `GET` | `/act_{AD_ACCOUNT_ID}/reachestimate` | Reach projection for a targeting spec |
| `GET` | `/act_{AD_ACCOUNT_ID}/minimum_budgets` | Minimum daily budgets by currency |

Returns `data` (list of `AdAccountDeliveryEstimate` nodes) + `paging`.

> ⚠️ **v26.0 removes `daily_outcomes_curve`, `budget_guardrail` and `estimate_dau`** from both delivery-estimate endpoints. Do not depend on them.

> Source: [delivery_estimate reference](https://developers.facebook.com/docs/marketing-api/reference/ad-account/delivery_estimate/) · [v26.0 changelog](https://developers.facebook.com/docs/graph-api/changelog/version26.0)

---

## 11. Insights & reporting

### 11.1 Synchronous read

| Method | Path | Level |
| --- | --- | --- |
| `GET` | `/act_{AD_ACCOUNT_ID}/insights` | Account |
| `GET` | `/{CAMPAIGN_ID}/insights` | Campaign |
| `GET` | `/{ADSET_ID}/insights` | Ad set |
| `GET` | `/{AD_ID}/insights` | Ad |

Default behaviour: basic metrics for the object, typically the last 30 days.

### 11.2 Parameters

| Parameter | Type | Default | Notes |
| --- | --- | --- | --- |
| `fields` | list<string> | `impressions`, `spend` | Metrics to retrieve |
| `level` | enum | — | `ad` \| `adset` \| `campaign` \| `account` |
| `date_preset` | enum | `last_30d` | `today`, `yesterday`, `last_7d`, `last_30d`, `this_month`, `last_month`, `maximum`, … (`lifetime` disabled since v10.0 → use `maximum`) |
| `time_range` | object | — | `{'since':'YYYY-MM-DD','until':'YYYY-MM-DD'}` |
| `time_ranges` | list<object> | — | Multiple/overlapping ranges for cumulative insights |
| `time_increment` | enum \| int | `all_days` | `monthly` or **1–90** days |
| `breakdowns` | list<enum> | — | See §11.3 |
| `action_breakdowns` | list<enum> | `[action_type]` | Segments action metrics |
| `action_attribution_windows` | list<enum> | `default` | e.g. `1d_view`, `7d_click`. If omitted, `7d_click` is used and returned under `value` |
| `action_report_time` | enum | — | `impression`, `conversion`, `mixed`, `lifetime` |
| `filtering` | list<Filter> | — | Array of `{field, operator, value}` |
| `sort` | list<string> | — | e.g. `reach_descending` |
| `limit` | integer | — | Page size |
| `summary` | list<string> | — | Fields to aggregate in a summary block |
| `summary_action_breakdowns` | list<enum> | `[action_type]` | Summary action segmentation |
| `default_summary` | boolean | `false` | Include a summary section |
| `product_id_limit` | integer | — | Max product IDs per ad breakdown |
| `use_account_attribution_setting` | boolean | `false` | Apply account-level attribution |
| `use_unified_attribution_setting` | boolean | — | Apply ad-set-level unified attribution |
| `export_columns` / `export_format` / `export_name` | list / string / string | — | `export_format` ∈ `xls` \| `csv` |

> ⚠️ **Effective 2025-06-10:** `use_unified_attribution_setting` and `action_report_time` are **disregarded** — responses mirror Ads Manager: values follow the ad-set-level attribution setting, and inline/on-ad actions are included in `1d_click` / `1d_view` data.

### 11.3 Breakdowns

`action_canvas_component_name`, `action_carousel_card_id`, `action_carousel_card_name`, `action_destination`, `action_device`, `action_reaction`, `action_target_id`, `action_type`, `action_video_sound`, `action_video_type`, `ad_format_asset`, `age`, `app_id`, `body_asset`, `call_to_action_asset`, `country`, `description_asset`, `device_platform`, `dma`, `frequency_value`, `gender`, `hourly_stats_aggregated_by_advertiser_time_zone`, `hourly_stats_aggregated_by_audience_time_zone`, `image_asset`, `impression_device`, `is_conversion_id_modeled`, `link_url_asset`, `place_page_id`, `platform_position`, `product_id`, `publisher_platform`, `region`, `skan_campaign_id`, `skan_conversion_id`, `title_asset`, `user_segment_key`, `video_asset`.

**Combination rules:**
- Only some permutations are available (storage constraints). Permutations marked `*` in the docs can join `action_type`, `action_target_id`, `action_destination`.
- If `action_breakdowns` is unspecified, `action_type` is implicitly added.
- Video fields cannot combine with hourly-stats breakdowns.
- `video_avg_time_watched_actions` excludes the `region` breakdown.
- Hourly breakdowns don't support unique fields or reach/frequency metrics.

### 11.4 Common metric fields

| Group | Fields |
| --- | --- |
| Delivery | `impressions`, `reach`, `frequency`, `spend` |
| Clicks | `clicks`, `ctr`, `cpc`, `inline_link_clicks`, `outbound_clicks`, `unique_clicks` |
| Cost | `cpm`, `cpp`, `cost_per_action_type`, `cost_per_inline_link_click` |
| Conversions | `actions`, `action_values`, `conversions`, `conversion_values` |
| ROAS | `purchase_roas`, `website_purchase_roas`, `mobile_app_purchase_roas` |
| Video | `video_views`, `video_play_actions`, `video_complete_watched_actions`, `video_avg_time_watched_actions`, `video_p25/p50/p75/p100_watched_actions` |
| Other | `full_view_impressions`, `canvas_avg_view_time`, `quality_ranking`, `engagement_rate_ranking` |

### 11.5 Asynchronous reports

```
POST /act_{AD_ACCOUNT_ID}/insights        →  { "report_run_id": "…" }
GET  /{REPORT_RUN_ID}                     →  { async_status, async_percent_completion, … }
GET  /{REPORT_RUN_ID}/insights            →  results (only once async_status = "Job Completed")
```

- `POST` accepts the same parameter set as `GET`, queued for processing.
- `async_status` states: `Job Not Started`, `Job Started`, `Job Running`, `Job Completed`, `Job Failed`, `Job Skipped`.
- `report_run_id` **expires after 30 days** — don't persist it long-term.
- Processing can take **up to one hour** including retries. Both sync and async requests can time out.
- **From v25.0 onward**, failed reports return `error_code`, `error_message`, `error_subcode`, `error_user_title`, `error_user_msg`.

> Sources: [Insights API](https://developers.facebook.com/docs/marketing-api/insights/) · [Insights edge reference](https://developers.facebook.com/docs/marketing-api/reference/ad-account/insights/) · [Breakdowns](https://developers.facebook.com/docs/marketing-api/insights/breakdowns/) · [Limits & Best Practices](https://developers.facebook.com/docs/marketing-api/insights/best-practices/)

---

## 12. Conversion tracking

### 12.1 Ads Pixel

| Method | Path | Use case |
| --- | --- | --- |
| `GET` | `/{PIXEL_ID}` | Read pixel metadata |
| `GET` | `/act_{AD_ACCOUNT_ID}/adspixels` | List pixels on an account |
| `POST` | `/act_{AD_ACCOUNT_ID}/adspixels` | Create — `name` (string, required) → `{id, success}` |
| `POST` | `/{PIXEL_ID}` | Update |
| `POST` | `/{PIXEL_ID}/events` | **Conversions API** — send server events (see §12.2) |

**Read fields:** `id`, `name`, `code` (the snippet to place on the site), `creation_time`, `creator`, `last_fired_time`, `automatic_matching_fields`, `enable_automatic_matching`, `first_party_cookie_status`, `data_use_setting`, `is_created_by_business`, `is_unavailable`, `owner_business`.

**Update parameters:** `name`, `enable_automatic_matching` (boolean), `automatic_matching_fields` (array), `data_use_setting` ∈ `EMPTY` \| `ADVERTISING_AND_ANALYTICS` \| `ANALYTICS_ONLY`, `first_party_cookie_status` ∈ `EMPTY` \| `FIRST_PARTY_COOKIE_ENABLED` \| `FIRST_PARTY_COOKIE_DISABLED`, `server_events_business_ids` (array<numeric string>).

**Edges:** `stats`, `assigned_users`, `shared_agencies`, `da_checks`, `offline_event_uploads`, `openbridge_configurations`.

> Source: [AdsPixel reference](https://developers.facebook.com/docs/marketing-api/reference/ads-pixel/)

### 12.2 Conversions API (CAPI)

```
POST https://graph.facebook.com/{VERSION}/{PIXEL_ID}/events?access_token={TOKEN}
```

The same `/events` edge is used for **offline** conversions against a dataset id:

```
POST https://graph.facebook.com/{VERSION}/{DATASET_ID}/events?access_token={TOKEN}
```

**Covered event types:** website events, app events, business-messaging events, offline conversions.

| Body parameter | Required | Notes |
| --- | --- | --- |
| `data` | ✅ | Array of event objects — **up to 1,000 per request** |
| `access_token` | ✅ | Query or body |
| `test_event_code` | — | **Testing only — remove for production payloads** |

#### Server-event parameters (per element of `data`)

| Parameter | Required |
| --- | --- |
| `event_name` | ✅ |
| `event_time` | ✅ (Unix timestamp) |
| `action_source` | ✅ (all events) |
| `event_source_url` | ✅ for web events |
| `event_id` | — (used with Pixel for deduplication) |
| `user_data` | ✅ in practice — see below |
| `custom_data` | — |
| `opt_out` | — |
| `data_processing_options` | — |

#### `user_data` — hashing rules

| Hashing | Parameters |
| --- | --- |
| **SHA-256 required** | `em` (email), `ph` (phone), `fn`, `ln`, `ge`, `db`, `ct`, `st`, `zp`, `country` |
| **Recommended** | `external_id` |
| **Do NOT hash** | `client_ip_address`, `client_user_agent`, `fbc`, `fbp`, `subscription_id`, `fb_login_id`, `lead_id`, `anon_id`, `madid`, `page_id`, `page_scoped_user_id`, `ctwa_clid`, `ig_account_id`, `ig_sid` |

#### `custom_data` standard parameters

`value`, `currency`, `content_name`, `content_category`, `content_ids`, `contents`, `content_type`, `order_id`, `predicted_ltv`, `num_items`, `search_string`, `status`, `delivery_category`.

#### Example payload

```json
{
  "data": [
    {
      "event_name": "Purchase",
      "event_time": 1633552688,
      "event_id": "event.id.123",
      "event_source_url": "http://jaspers-market.com/product/123",
      "action_source": "website",
      "user_data": {
        "client_ip_address": "192.19.9.9",
        "client_user_agent": "test ua",
        "em": ["309a0a5c3e211326ae75ca18196d301a9bdbd1a882a4d2569511033da23f0abd"],
        "ph": ["254aa248acb47dd654ca3ea53f48c2c26d641d23d7e2e93a1ec56258df7674c4"],
        "fbc": "fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890",
        "fbp": "fb.1.1558571054389.1098115397"
      },
      "custom_data": {
        "value": 100.2,
        "currency": "USD",
        "content_ids": ["product.id.123"],
        "content_type": "product"
      },
      "opt_out": false
    }
  ],
  "test_event_code": "TEST123"
}
```

> Sources: [Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api/) · [Using the API](https://developers.facebook.com/documentation/ads-commerce/conversions-api/using-the-api) · [Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters) · [Offline Conversions](https://developers.facebook.com/docs/marketing-api/offline-conversions)

### 12.3 Custom Conversions

| Method | Path | Use case |
| --- | --- | --- |
| `GET` | `/act_{AD_ACCOUNT_ID}/customconversions` | List |
| `GET` | `/{CUSTOM_CONVERSION_ID}` | Read one |
| `POST` | `/act_{AD_ACCOUNT_ID}/customconversions` | Create |
| `POST` | `/{CUSTOM_CONVERSION_ID}` | Update — `name`, `description`, `default_conversion_value` only |
| `DELETE` | `/{CUSTOM_CONVERSION_ID}` | Delete |

**Create parameters:** `name` ✅, `event_source_id` (pixel/dataset id), `custom_event_type` (enum), `rule` (JSON string), `advanced_rule` (string), `default_conversion_value` (float), `description`, `action_source_type` ∈ `app`, `chat`, `email`, `other`, `phone_call`, `physical_store`, `system_generated`, `website`, `business_messaging`.

**`custom_event_type` enum:** `ADD_PAYMENT_INFO`, `ADD_TO_CART`, `ADD_TO_WISHLIST`, `COMPLETE_REGISTRATION`, `CONTENT_VIEW`, `INITIATED_CHECKOUT`, `LEAD`, `PURCHASE`, `SEARCH`, `CONTACT`, `CUSTOMIZE_PRODUCT`, `DONATE`, `FIND_LOCATION`, `SCHEDULE`, `START_TRIAL`, `SUBMIT_APPLICATION`, `SUBSCRIBE`, `LISTING_INTERACTION`, `FACEBOOK_SELECTED`, `OTHER`.

**Read fields:** `id`, `account_id`, `business`, `creation_time`, `custom_event_type`, `data_sources`, `default_conversion_value`, `description`, `event_source_type`, `first_fired_time`, `last_fired_time`, `is_archived`, `is_unavailable`, `name`, `pixel`, `retention_days`, `rule`.
**Edge:** `stats`.

> Source: [CustomConversion reference](https://developers.facebook.com/docs/marketing-api/reference/custom-conversion/)

---

## 13. Business Manager & asset management

### 13.1 Business node

| Method | Path | Use case |
| --- | --- | --- |
| `GET` | `/{BUSINESS_ID}` | Read business metadata |

**Fields:** `id`, `name`, `created_time`, `updated_time`, `verification_status` (`verified`, `pending`, `failed`, …), `timezone_id`, `vertical`.

### Edges by purpose

| Purpose | Edges |
| --- | --- |
| **Owned assets** | `owned_ad_accounts`, `owned_pages`, `owned_pixels`, `owned_product_catalogs`, `owned_businesses`, `owned_instagram_accounts`, `owned_instagram_assets`, `owned_apps`, `owned_whatsapp_business_accounts`, `owned_offsite_signal_container_business_objects` |
| **Client (partner) assets** | `client_ad_accounts`, `client_pages`, `client_pixels`, `client_product_catalogs`, `client_apps`, `client_instagram_assets`, `client_whatsapp_business_accounts`, `client_offsite_signal_container_business_objects` |
| **Pending** | `pending_owned_ad_accounts`, `pending_owned_pages`, `pending_client_ad_accounts`, `pending_client_apps`, `pending_client_pages`, `pending_users`, `pending_shared_offsite_signal_container_business_objects` |
| **People & partners** | `business_users`, `system_users`, `agencies`, `clients`, `collaborative_ads_collaboration_requests`, `collaborative_ads_suggested_partners` |
| **Measurement** | `ad_studies`, `adnetworkanalytics_results`, `ads_reporting_mmm_reports`, `ads_reporting_mmm_schedulers` |
| **Other** | `instagram_accounts`, `instagram_business_accounts`, `adspixels`, `business_asset_groups`, `event_source_groups`, `extendedcredits`, `business_invoices`, `an_placements`, `commerce_merchant_settings`, `openbridge_configurations`, `preverified_numbers`, `self_certified_whatsapp_business_submissions`, `initiated_audience_sharing_requests`, `received_audience_sharing_requests`, `reseller_guidances`, `managed_partner_ads_funding_source_details` |

> Source: [Business reference](https://developers.facebook.com/docs/marketing-api/reference/business/)

### 13.2 Ad-account asset management

| Operation | Method | Path | Parameters |
| --- | --- | --- | --- |
| Create ad account | `POST` | `/{BUSINESS_ID}/adaccount` | `name`, `currency`, `timezone_id`, `end_advertiser`, `media_agency`, `partner` |
| Claim existing account | `POST` | `/{BUSINESS_ID}/owned_ad_accounts` | `adaccount_id` (format `act_###`) |
| List owned | `GET` | `/{BUSINESS_ID}/owned_ad_accounts` | — |
| List pending owned | `GET` | `/{BUSINESS_ID}/pending_owned_ad_accounts` | — |
| List client accounts | `GET` | `/{BUSINESS_ID}/client_ad_accounts` | — |
| Remove account from business | `DELETE` | `/{BUSINESS_ID}/ad_accounts` | `adaccount_id` |
| Assign user / change permissions | `POST` | `/act_{AD_ACCOUNT_ID}/assigned_users` | `user`, `tasks` |
| List users on account | `GET` | `/act_{AD_ACCOUNT_ID}/assigned_users` | — |
| List accounts a user can access | `GET` | `/{BUSINESS_SCOPED_USER_ID}/assigned_ad_accounts` | — |
| Remove user | `DELETE` | `/act_{AD_ACCOUNT_ID}/assigned_users` | `user` |

**`tasks` enum:** `MANAGE`, `ADVERTISE`, `ANALYZE`.

> Sources: [Business Manager API](https://developers.facebook.com/docs/marketing-api/business-manager-api/) · [Ad account asset management](https://developers.facebook.com/docs/marketing-api/business-asset-management/guides/ad-accounts)

---

## 14. Catalogs & commerce

| Method | Path | Use case |
| --- | --- | --- |
| `GET` | `/{BUSINESS_ID}/owned_product_catalogs` | List catalogs owned by a business |
| `GET` | `/{BUSINESS_ID}/client_product_catalogs` | Catalogs shared with the business |
| `POST` | `/{BUSINESS_ID}/owned_product_catalogs` | **Create** a catalog |
| `GET` | `/{CATALOG_ID}` | Read catalog metadata |

**Create parameters:** `name` ✅ (UTF-8), `vertical` (default `commerce`; also `hotels`, `vehicles`, `destinations`, `flights`, …), `da_display_settings` (dynamic-ad image transformation config).

**Key fields:** `id`, `name`, `vertical`, `product_count`, `feed_count`.

### Catalog edges

| Group | Edges |
| --- | --- |
| Inventory | `products`, `product_groups`, `product_sets`, `product_sets_batch`, `categories`, `hotels`, `hotel_rooms_batch`, `vehicles`, `vehicle_offers`, `automotive_models`, `flights`, `destinations`, `home_listings` |
| Ingestion | `data_sources`, `check_batch_request_status`, `pricing_variables_batch` |
| Signals | `external_event_sources`, `event_stats`, `diagnostics` |
| Access | `agencies`, `assigned_users`, `collaborative_ads_share_settings` |

> Source: [ProductCatalog reference](https://developers.facebook.com/docs/marketing-api/reference/product-catalog/)

---

## 15. Lead Ads

| Method | Path | Use case | Key params / fields |
| --- | --- | --- | --- |
| `GET` | `/{AD_ID}/leads` | Leads generated by one ad | Params: `access_token`, `fields`, `filtering`. Returns `id`, `created_time`, `ad_id`, `form_id`, `field_data`, `paging` |
| `GET` | `/{FORM_ID}/leads` | All leads for a form | Adds `custom_disclaimer_responses` |
| `GET` | `/{LEAD_ID}` | Single lead (from a webhook) | Returns `created_time`, `id`, `ad_id`, `form_id`, `field_data` |
| `GET` | `/ads/lead_gen/export_csv/` | CSV export | Params: `id` (form id), `type`, `from_date`, `to_date` |

**Webhook:** subscribe to the `leadgen` field. Payload carries `leadgen_id`, `page_id`, `form_id`, `adgroup_id`, `ad_id`, `created_time`.

**Permission:** `leads_retrieval`. **Rate limit family:** BUC `leadgen` → `4800 × Leads Generated` per 24h.

> Source: [Retrieving Leads](https://developers.facebook.com/docs/marketing-api/guides/lead-ads/retrieving/)

---

## 16. Automation: rules, labels, batch & async

### 16.1 Automated rules (AdRule)

| Method | Path | Use case |
| --- | --- | --- |
| `GET` | `/{AD_RULE_ID}` | Read a rule |
| `GET` | `/act_{AD_ACCOUNT_ID}/adrules_library` | List rules |
| `POST` | `/act_{AD_ACCOUNT_ID}/adrules_library` | **Create** a rule |
| `POST` | `/{AD_RULE_ID}` | Update |
| `DELETE` | `/{AD_RULE_ID}` | Delete → `{success: bool}` |
| `GET` | `/{AD_RULE_ID}/history` | Execution history |
| `GET` | `/{AD_RULE_ID}/preview` | Preview which objects would match |
| `POST` | `/{AD_RULE_ID}/execute` | Force an evaluation run |

**Create parameters (all required except `status`):**

| Parameter | Structure |
| --- | --- |
| `name` | Rule name |
| `evaluation_spec` | `{evaluation_type: SCHEDULE \| TRIGGER, filters: [...]}` |
| `execution_spec` | `{execution_type: PAUSE \| CHANGE_BUDGET \| NOTIFICATION \| …, execution_options: [...]}` |
| `schedule_spec` | `{schedule_type: DAILY \| HOURLY \| SEMI_HOURLY \| CUSTOM, schedule: [...]}` |
| `status` | `ENABLED` \| `DISABLED` |

**Read fields:** `id`, `account_id`, `created_by`, `created_time`, `name`, `status` (`ENABLED`, `DISABLED`, `DELETED`, `HAS_ISSUES`), `schedule_spec`, `evaluation_spec`, `execution_spec`, `disable_error_code`.

Objects governed by rules expose an `adrules_governed` edge (Campaign, Ad Set, Ad).

> Source: [AdRule reference](https://developers.facebook.com/docs/marketing-api/reference/ad-rule/)

### 16.2 Ad Labels

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/act_{AD_ACCOUNT_ID}/adlabels` | Fields: `id`, `name`, `created_time`, `updated_time` |
| `POST` | `/act_{AD_ACCOUNT_ID}/adlabels` | Create — `name` ✅ → `{id}` |
| `POST` | `/{AD_LABEL_ID}` | Rename — `name` ✅ → `{success}` |
| `DELETE` | `/{AD_LABEL_ID}` | Delete → `{success}` |
| `POST` | `/{CAMPAIGN_ID}/adlabels` | Associate labels — `adlabels` ✅, `execution_options` |
| `POST` | `/{ADSET_ID}/adlabels` | Associate labels |
| `POST` | `/{AD_ID}/adlabels` | Associate labels — `adlabels` ✅, `execution_options` |
| `POST` | `/{CREATIVE_ID}/adlabels` | Associate labels — `adlabels` ✅ |

**Lookup-by-label endpoints:** `/act_{AD_ACCOUNT_ID}/campaignsbylabels`, `/adsetsbylabels`, `/adsbylabels`, `/adcreativesbylabels`.
**Label edges:** `campaigns`, `adsets`, `ads`, `adcreatives`.

> Source: [AdLabel reference](https://developers.facebook.com/docs/marketing-api/reference/ad-label/)

### 16.3 Batch requests (Graph API)

```
POST /{VERSION}/?batch=[JSON-ARRAY]&access_token={TOKEN}
```

| Item | Detail |
| --- | --- |
| Per-operation fields | `method` (`GET`/`POST`/`PUT`/`DELETE`) ✅, `relative_url` ✅, `body` (raw POST string), `name` (for referencing), `attached_files`, `omit_response_on_success`, `depends_on` |
| Limit | **50 requests per batch**; each counts individually toward rate limits |
| Response | JSON array in request order — each element has `code`, `headers`, `body` (JSON-encoded string) |
| Efficiency flag | `include_headers=false` strips headers |
| Chaining | Reference earlier results with JSONPath syntax (`{result=name:$.id}`) |
| Per-request tokens | Each operation may carry its own `access_token`, falling back to the top-level one |
| Errors | Operations fail independently — "Other requests within the batch should still complete successfully" |
| **Ads caveat** | A batch **cannot include multiple ad sets under the same campaign** |

> Source: [Batch Requests](https://developers.facebook.com/docs/graph-api/batch-requests)

### 16.4 Async batch (Marketing API)

```
POST /act_{AD_ACCOUNT_ID}/async_batch_requests   →  { "id": "…" }
```

| Parameter | Required | Structure |
| --- | --- | --- |
| `adbatch` | ✅ | List of objects, each `{name ✅, relative_url ✅, body ✅ (UTF-8 encoded)}` |
| `name` | — | Batch name for tracking |

Supports read-after-write. Reading/updating/deleting are not supported on the edge itself. Errors: `194` (missing required parameter), `100` (invalid parameter).

Related async edges: `/act_{AD_ACCOUNT_ID}/asyncadrequestsets` (bulk ad creation), `/act_{AD_ACCOUNT_ID}/asyncadcreatives`.

> Source: [async_batch_requests reference](https://developers.facebook.com/docs/marketing-api/reference/ad-account/async_batch_requests/)

---

## 17. Error codes

| Code | Subcode | Meaning |
| --- | --- | --- |
| `4` | — | Application request limit reached |
| `4` | `1504022` | Global/platform throttling under high load |
| `10` | — | Application does not have permission for this action |
| `17` | — | User request limit reached |
| `100` | — | Invalid parameter (broad; check `blame_field_specs` in the response) |
| `100` | `33` | Unsupported POST request — verify system-user access |
| `100` | `1487534` | Too much data requested per call (rows / computation points) |
| `100` | `1487694` | Deprecated targeting categories unavailable |
| `102` | — | Session key invalid |
| `104` | — | Incorrect signature |
| `190` | — | Invalid OAuth 2.0 access token |
| `194` | — | Missing at least one required parameter |
| `200` | — | Permission error |
| `200` | `1870034` | Custom Audience Terms of Service not accepted |
| `294` | — | Requires `ads_management` permission and API allowlist access |
| `613` | — | Rate limit exceeded (also raised by AdImage) |
| `2635` | — | Deprecated API version |
| `2656` | — | Cannot delete custom audience with dependent lookalikes |
| `3018` | — | Start date beyond 37 months from now |
| `80000`–`80014` | — | Business Use Case rate limits, one code per BUC type |
| `80004` | — | Too many calls to this ad account; retry later |
| `2460003` | — | Custom Audience blocked by integrity policy |
| `2460004` | — | Custom Conversion blocked by integrity policy |
| — | `3858079` | Missing `dsa_payor` for EU targeting |
| — | `3858081` | Missing `dsa_beneficiary` for EU targeting |

> **Handle errors by numeric code only** — human-readable descriptions change without notice. Use `blame_field_specs` to attribute failures to specific input fields.

> Sources: [Marketing API Error Reference](https://developers.facebook.com/docs/marketing-api/error-reference) · [Rate Limiting](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)

---

## 18. v26.0 changes that affect ads integrations

Released **2026-07-29**. Anything a `metamanager` integration must account for:

| Area | Change |
| --- | --- |
| **Commerce Order Management API** | All **47** endpoints blocked as of 2026-07-29. Checkout directly on Facebook/Instagram for Shops is sunset; **no replacement**. |
| **Delivery estimates** | `daily_outcomes_curve`, `budget_guardrail` and `estimate_dau` **removed** from `/{ad-account-id}/delivery_estimate` and `/{adset-id}/delivery_estimate`. |
| **Advantage+ Audience** | HEC-F ad sets with relaxable targeting **require** an explicit `targeting_automation.advantage_audience` flag on v26.0+; omitting it returns an error. |
| **Instagram Explore placement** | Removed entirely — requests specifying Explore return errors. |
| **Messenger placements** | The `story` value in `messenger_positions` is **silently removed** for v26.0+ calls. |
| **Poll ads** | Deprecated — `poll_spec` and poll-type `interactive_components_spec` unavailable. |
| **Web+App destination** | Creatives with `applink_treatment=web_only` cannot attach to Website-and-App conversion campaigns. |
| **Shop Ads** | Eligible creatives now auto-default to `destination_spec.destination_type = WEBSITE_AND_SHOP`. |
| **Ads in WhatsApp Status** | Ad creatives support `wamo_whatsapp_identity_spec`; `user_age_unknown` defaults to `true`; offsite-conversion optimization supported for Sales, Leads, Engagement and Landing Page Views; carousel expanded to **10** cards. |

> Source: [Graph API v26.0 changelog](https://developers.facebook.com/docs/graph-api/changelog/version26.0)

---

## 19. Source URLs crawled

All pages fetched live on **2026-08-03**.

| # | Topic | URL |
| --- | --- | --- |
| 1 | Graph API changelog / versions | https://developers.facebook.com/docs/graph-api/changelog |
| 2 | Graph API v26.0 changelog | https://developers.facebook.com/docs/graph-api/changelog/version26.0 |
| 3 | Versioning guide | https://developers.facebook.com/docs/graph-api/guides/versioning |
| 4 | Rate limiting | https://developers.facebook.com/docs/graph-api/overview/rate-limiting |
| 5 | Batch requests | https://developers.facebook.com/docs/graph-api/batch-requests |
| 6 | Marketing API access & tiers | https://developers.facebook.com/docs/marketing-api/access |
| 7 | AdAccount node | https://developers.facebook.com/docs/marketing-api/reference/ad-account/ |
| 8 | Campaign node | https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group/ |
| 9 | Ad Set node | https://developers.facebook.com/docs/marketing-api/reference/ad-campaign/ |
| 10 | Ad Set edge on ad account | https://developers.facebook.com/docs/marketing-api/reference/ad-account/adsets/ |
| 11 | Ad node | https://developers.facebook.com/docs/marketing-api/reference/adgroup/ |
| 12 | AdCreative node | https://developers.facebook.com/docs/marketing-api/reference/ad-creative/ |
| 13 | AdImage node | https://developers.facebook.com/docs/marketing-api/reference/ad-image/ |
| 14 | AdVideo edge | https://developers.facebook.com/docs/marketing-api/reference/ad-account/advideos/ |
| 15 | Ad previews | https://developers.facebook.com/docs/marketing-api/reference/ad-account/generatepreviews/ |
| 16 | Instagram accounts edge | https://developers.facebook.com/docs/marketing-api/reference/ad-account/instagram_accounts/ |
| 17 | Targeting object | https://developers.facebook.com/docs/marketing-api/reference/targeting/ |
| 18 | Targeting search | https://developers.facebook.com/docs/marketing-api/audiences/reference/targeting-search/ |
| 19 | CustomAudience node | https://developers.facebook.com/docs/marketing-api/reference/custom-audience/ |
| 20 | SavedAudience node | https://developers.facebook.com/docs/marketing-api/reference/saved-audience/ |
| 21 | Delivery estimate | https://developers.facebook.com/docs/marketing-api/reference/ad-account/delivery_estimate/ |
| 22 | Insights API overview | https://developers.facebook.com/docs/marketing-api/insights/ |
| 23 | Insights edge reference | https://developers.facebook.com/docs/marketing-api/reference/ad-account/insights/ |
| 24 | Insights breakdowns | https://developers.facebook.com/docs/marketing-api/insights/breakdowns/ |
| 25 | Insights limits & best practices | https://developers.facebook.com/docs/marketing-api/insights/best-practices/ |
| 26 | AdsPixel node | https://developers.facebook.com/docs/marketing-api/reference/ads-pixel/ |
| 27 | Conversions API overview | https://developers.facebook.com/docs/marketing-api/conversions-api/ |
| 28 | Conversions API — using the API | https://developers.facebook.com/documentation/ads-commerce/conversions-api/using-the-api |
| 29 | Conversions API — parameters | https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters |
| 30 | Offline conversions | https://developers.facebook.com/docs/marketing-api/offline-conversions |
| 31 | CustomConversion node | https://developers.facebook.com/docs/marketing-api/reference/custom-conversion/ |
| 32 | Business node | https://developers.facebook.com/docs/marketing-api/reference/business/ |
| 33 | Business Manager API | https://developers.facebook.com/docs/marketing-api/business-manager-api/ |
| 34 | Ad-account asset management | https://developers.facebook.com/docs/marketing-api/business-asset-management/guides/ad-accounts |
| 35 | ProductCatalog node | https://developers.facebook.com/docs/marketing-api/reference/product-catalog/ |
| 36 | Lead ads — retrieving leads | https://developers.facebook.com/docs/marketing-api/guides/lead-ads/retrieving/ |
| 37 | AdRule node | https://developers.facebook.com/docs/marketing-api/reference/ad-rule/ |
| 38 | AdLabel node | https://developers.facebook.com/docs/marketing-api/reference/ad-label/ |
| 39 | Async batch requests | https://developers.facebook.com/docs/marketing-api/reference/ad-account/async_batch_requests/ |
| 40 | Marketing API error reference | https://developers.facebook.com/docs/marketing-api/error-reference |

---

## Maintenance

Meta ships a new Graph API version roughly every 4–6 months, and each release can remove fields
without warning (see [§18](#18-v260-changes-that-affect-ads-integrations)). **Re-crawl this document
on every Graph API version bump**, starting from source #2 (the version changelog) and then
re-verifying any node reference the changelog touches.
