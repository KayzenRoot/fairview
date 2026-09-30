# FV-UI-DEMO-004 — Complete the remaining synthetic local preview pages

Issue: [#56](https://github.com/KayzenRoot/fairview/issues/56)

## Admission and exact source authority

- Repository: `KayzenRoot/fairview`.
- Branch: `feat/fv-ui-demo-004-complete-local-nav`.
- Exact protected `main`, `origin/main`, and branch base: `c3fd830208535502a9cfcc7725b28e82478e6be5`.
- Post-merge Actions run `36661858950` completed successfully at that exact SHA. All four required jobs passed: Source Pack and impact-driven harness, Pinned GEF release validation, Windows PowerShell parser and harness, and Public repository security gate. Protected-main full active harness logs confirm the 14 synthetic owner suites passed `576/576` (bootstrap 88, risk 39, forex 29, AI 25, web 42, policy 57, clock 56, market-data 79, ledger 27, execution 27, portfolio 27, replay 30, research 24, observability 26).
- No other pull request was open at admission. Current Source Pack check passed with SHA-256 `c1445cdecc9192ea34c5f64f8257e6307a0855017329cd12c440437191dbcd0f`; `node scripts/harness.mjs doctor` passed with the pinned GEF checkout `866fe3af8cccc65c929aaf6a47a924401fa448b3`.
- The currently accepted preview has Overview, Risk, Portfolio, Incidents, and Advisory. Markets, Strategies, Replay, and Settings are to become navigable synthetic boundary views in this one source increment.
- Checkpoint `FV-CP-0002-PROPOSED` remains `MIGRATION_DRAFT_NOT_APPROVED` with `independent_approval:false`. D-007/D-008 and all production/financial gates are unchanged. Checkpoint delta: `NONE`.

## Objective and product boundary

Complete all nine local preview navigation pages by adding read-only synthetic status/boundary views for Markets, Strategies, Replay, and Settings. Use only the existing same-origin `GET /api/demo-snapshot?scenario=healthy|degraded|denied`, its existing snapshot, and its existing in-memory request lifecycle. No additional endpoint, source, module, provider, external service, package, account/authentication system, broker, market feed, strategy engine, historical backtester, persistence, or settings mutation is authorized.

Only current accepted, strictly validated, bounded values may be displayed: `mode_label`, `displayed_session_class`, `stream_class`, `redaction_class`, the accepted `scenario/status/reason_code` contract, existing public authority flags, and existing bounded mock classes when necessary to explain synthetic state. Render only fixed allowlisted copy and mapped enum labels. Never display `local_sequence`, fixture scope, identifiers, prices, quotes, balances, instruments, strategy data, prompts, provider data, secrets, or raw backend objects.

Permanent page boundaries:

- **Markets:** `NO LIVE MARKET DATA`; `NO QUOTES / NO ORDER BOOK / NO BROKER`; fixed synthetic fixture only. No chart, fabricated price/spread/volume, venue comparison, performance, latency, or signal.
- **Strategies:** `NO STRATEGY ENGINE`; `NO SIGNAL / NO RECOMMENDATION`; `NO BACKTEST / NO PERFORMANCE CLAIM`; synthetic fixture status only. Do not invent strategy classes, alpha, scores, probabilities, PnL, recommendations, entries/exits, optimization, AI advice, or benchmarks.
- **Replay:** `NO HISTORICAL MARKET REPLAY`; `NO BACKTEST / NO REAL PERFORMANCE`; `BOUNDED LOCAL SYNTHETIC SEQUENCE ONLY`. No historical prices, returns, benchmark, fills, performance, or controls implying a real replay engine.
- **Settings:** `NO LOGIN / NO ACCOUNT`; `NO PROVIDER OR SECURITY SETTINGS`; `READ-ONLY LOCAL PREVIEW`. No form fields, secrets, API keys, save/apply or session controls, provider configuration, roles, passwords, security changes, or persistence.

All nine pages share the same snapshot and selector. Navigation does not fetch; changing scenario performs the existing one same-origin request. Preserve the current monotonic request token, requested-scenario/returned-scenario binding, exact envelope/model/flag validation, and fail-closed state clearing across all nine pages. Loading, denied, malformed, extra/raw data, forged authority flags, unknown enums, stale fetch/body/error completions, current errors, or scenario mismatch must clear prior dynamic values. Denied must never render as healthy. Never render untrusted values as HTML. Preserve desktop/mobile responsiveness and keyboard/ARIA behavior.

## Exact seven-path allowlist

Only these paths may differ from the exact base:

1. `.engineering/work-orders/FV-UI-DEMO-004.md` — first isolated commit.
2. `.engineering/context-locks/FV-UI-DEMO-004.md` — second isolated, immutable pre-code commit.
3. `src/web/local-demo/public/index.html`.
4. `src/web/local-demo/public/app.css`.
5. `src/web/local-demo/public/app.js`.
6. `tests/web/local-demo.test.mjs`.
7. `docs/architecture/modules/web.md`.

Do not edit `src/web/local-demo/server.mjs`, `src/web/read-model.mjs`, registry/module sources, `.engineering/CHECKPOINT.*`, owner modules, dependencies/package files, CI, GEF, security/decision/authority files, or any other path. An unknown required path is a stop condition until an explicitly admitted correction and refreshed lock authorize it.

## Required sequence and proof

1. This Work Order is the first isolated commit and changes only this file.
2. The next isolated commit changes only `.engineering/context-locks/FV-UI-DEMO-004.md`. It records the exact base, this Work Order commit and Git blob, exact allowlist, and frozen authority/owner/implementation fingerprints. Before committing it, reconfirm protected main, `origin/main`, branch parent, clean worktree, Source Pack, GEF pin, and all fingerprints. Before the first code/test edit, reconfirm the lock is the branch HEAD, its parent is the Work Order commit, its fingerprint is unchanged, main is still the exact base, and the worktree is clean. No code or test edit is permitted before both governance commits exist and pass those checks.
3. Keep every existing deterministic test. Expand the current `node:vm` fake-DOM/control harness so it executes the real public `app.js`. Cover all nine hash and click navigation targets, correct `aria-current`, removal of `PLANNED` from the four completed entries, preservation of the existing five views, navigation without refetch, and shared healthy/degraded/denied scenario updates on all nine pages.
4. Add adversarial cases for denied clearing; valid healthy request receiving denied and valid denied request receiving healthy; forged `session_authenticated`, `server_authorization_performed`, `live_stream_connected`, `operator_command_available`, `real_market_performance_established`, `comparative_benchmark_supported`, `network_performed`, `authenticated_provider_evidence`, and other authority flags; unexpected model/envelope/raw fixture fields; malformed `stream_class`, `displayed_session_class`, `mode_label`, and `redaction_class`; stale fetch, body-json and error completion; and current errors. Assert that no untrusted or mismatched value is rendered and all nine pages clear on a current invalid result.
5. Run the focused web tests, exact-base impact graph, applicable bootstrap/Web harnesses, `npm run validate`, `node scripts/check-sources.mjs`, `node scripts/security-scan.mjs`, `node scripts/harness.mjs doctor`, `git diff --check`, and exact seven-path/secret review. Leave planned integration reverse dependents unexecuted. Record command results and counts accurately.
6. Run the actual loopback preview at `http://127.0.0.1:4173`; inspect Markets, Strategies, Replay, and Settings on desktop and mobile for Healthy, Degraded, and Denied. Preserve sanitized screenshots/contact sheets outside Git. Attach evidence to the draft PR where supported; otherwise provide exact local paths and do not claim a GitHub attachment.
7. After local validation, publish a DRAFT PR with exact base/head, governance commit order, seven-path diff, impact graph, local and hosted test evidence, Evidence Bundle, visual evidence, security/compatibility/dependency notes, risks/limits, author audit `NOT_INDEPENDENT`, checkpoint delta `NONE`, and all four required hosted checks completed successfully on the exact PR HEAD. Keep it open and in draft for ChatGPT review. Correct any actual review finding in this same Work Order, recording a correction delta before edits and rerunning applicable proof on the new exact HEAD.

## Stop conditions and non-goals

Stop if protected main or locked source fingerprints drift, the exact required baseline fails, an unlisted path is necessary, an authority gate becomes ambiguous, or a current validation/review blocker cannot be resolved within the admitted paths. Do not merge, promote any checkpoint, enable real financial operations, or claim independent approval, production readiness, market data, authentication, monitoring, strategy execution, backtesting, investment advice, or real replay functionality.

Completion means an auditable pushed DRAFT PR at an exact candidate HEAD with the seven-path scope, complete local and hosted evidence, all four required checks successful at that HEAD, and the four new synthetic pages visually available for review. It does not authorize merge, checkpoint promotion, production, or real financial functionality.
