# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

## Meta Marketing API

`docs/meta-ads-endpoints.md` is the authoritative endpoint map for this project: paths, methods,
parameters, rate limits and per-version breaking changes, each row linked to the live Meta docs page
it was crawled from. Consult it before writing any Graph API call.

Sharp edges it records and that bite silently:

- Pin the version in every request. Unversioned calls fall back to the App Dashboard default, and
  expired versions silently downgrade to the next oldest instead of erroring.
- Meta's own reference pages render examples against an older version than the current release.
  Paths are version-agnostic; only the examples are stale.
- Each Graph API release can remove response fields with no deprecation period. Re-crawl the doc on
  every version bump, starting from the version changelog.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
