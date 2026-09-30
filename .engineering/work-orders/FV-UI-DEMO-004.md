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

## Correction delta: FV-UI-DEMO-004-CORR-001

Recorded before any correction evidence or PR update on 2026-09-30, in response to the ChatGPT review of PR #57 at candidate HEAD `8b00c9e9975defa8152aadf5b2f72f6fcad44266`.

### Finding and authorized correction

The original visual evidence comment used `http://127.0.0.1:4174`, while this Work Order requires the supported preview at `http://127.0.0.1:4173`. The original comment states that 4173 was occupied by a pre-existing local process and left untouched. At this correction's initial live inspection, `Get-NetTCPConnection -State Listen -LocalPort 4173` returned no listener, and historical PID `17512` was not running. No process has been terminated. The correction will use the exact supported command `node src/web/local-demo/server.mjs` from this checkout to serve on 4173, verify the listener and rendered application, and regenerate all 24 captures and eight contact sheets (four pages × three scenarios × desktop/mobile) outside Git. The existing same-origin synthetic snapshot and unchanged preview source are used; no source edit to select or alter the port is authorized or required.

The eight updated contact sheets will replace the prior 4174 evidence in the PR evidence comment, explicitly identify 4173 as the capture origin, and retain hashes and exact state records in the external evidence manifest. If the official 4173 preview cannot be started or verified, stop without terminating any process or claiming visual completion, record the concrete failure here, and leave the existing evidence labeled as 4174 pending re-audit.

### Scope and gates

This delta authorizes only this correction record within the existing Work Order path, the prescribed local preview execution, regeneration and inspection of external visual artifacts, and updating PR #57's evidence comment/description. The original seven-path allowlist is unchanged. No product source, tests, documentation outside this Work Order, server, read model, registry, checkpoint, CI, GEF, dependency, or financial module change is authorized by this delta. PR #57 remains OPEN and DRAFT; no merge, checkpoint promotion, or real financial capability is authorized. If this record is committed, rerun all correction-required local validations and obtain the four hosted checks on the exact final HEAD before handoff.

### Completion evidence

Correction completed on 2026-09-30. This delta stays within this Work Order; the original seven-path allowlist is unchanged.

- Safe port inspection found no listener on 127.0.0.1:4173; historical PID 17512 was not running. No process was terminated. The official command `node src/web/local-demo/server.mjs` was run from `D:\Projects\fairview` at candidate HEAD `84ddaf9280f37a282a73728d0a996512135579d4`. It printed `Fairview synthetic local preview: http://127.0.0.1:4173`; the capture run verified a loopback listener for the same Node command (PID 8672). A subsequent live confirmation also started the same official command and verified `127.0.0.1:4173`, HTTP 200, and the four page entries (current listener PID 12952). The capture script uses a literal base URL of `http://127.0.0.1:4173/`. No source was changed to select a port.
- The existing preview returned the expected synthetic scenario contracts for `healthy` (`HEALTHY_FIXTURE`), `degraded` (`INCOMPLETE_FIXTURE`), and `denied` (`DENIED_FIXTURE` / `DENY`). The capture harness verified the four routes (Markets, Strategies, Replay, Settings), all three scenarios, and both desktop (1440×900) and mobile (390 px) viewports: 24/24 screenshots. The eight resulting contact sheets were visually inspected and attached to the updated PR evidence comment: https://github.com/KayzenRoot/fairview/pull/57#issuecomment-5903844691. That comment now identifies 4173, the exact command and capture HEAD, and supersedes the previous 4174 statement.
- All images, capture script, and manifest are outside Git under `C:\Users\csn19\.codex\visualizations\2026\09\27\01a0e401-589b-7542-b015-6720fe096f67\fv-ui-demo-004`. Contact-sheet SHA-256 values:
  - `markets-desktop-contact-sheet.png` — `6431018E2050445EB15A37893D6C7DB19579530B2B4F10C7CCF9FD814BAD83A9`
  - `markets-mobile-contact-sheet.png` — `F0B7F51FD5D3FEC69B72A3CB2C816D1ED0B3E9464A732FE61889C64212EB4F0E`
  - `strategies-desktop-contact-sheet.png` — `90D13C023EE37F1BFFD32E805091F453CB9DEB19F4AE74C436FA1FB368941DE3`
  - `strategies-mobile-contact-sheet.png` — `6C7FD46CDFA66CD0177730C304984FC474F25838E4B014CF126229EB553E572F`
  - `replay-desktop-contact-sheet.png` — `FB9E31A340056ABC1C87D2ACFB3DE98AA4A8C72EDEA6B92BC578FE44DB3DB127`
  - `replay-mobile-contact-sheet.png` — `01C1553A401A701CCA6463405D64F749442D1054A6210F4B3BAAAAD20D7FF4E7`
  - `settings-desktop-contact-sheet.png` — `703B694AAE0DE4384A00267291BBA671D3C6C6D8F6DADA01BB91A2253A67B463`
  - `settings-mobile-contact-sheet.png` — `319FF89932640ADC6C80C248427C46C07E32A06859E93C7B841FE8ECF2B8F610`
- No application source, tests, lock, module, server, registry, checkpoint, CI, GEF, dependency, or financial path was changed by this correction. The only repository path changed is this already-allowlisted Work Order. The PR evidence comment was verified to contain the eight new GitHub user-attachment links; no screenshot image is committed.
- Local validation and hosted required checks must be recorded in the PR description against the final evidence commit. The PR remains OPEN and DRAFT; checkpoint delta remains NONE; no merge, checkpoint promotion, or live financial capability is authorized. Author inspection remains `NOT_INDEPENDENT`; CodeRabbit is still skipped because the PR is draft.
