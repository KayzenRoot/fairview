# FV-UI-DEMO-002 | Synthetic local Risk and Portfolio views

Date: 2026-09-29
Status: ADMITTED FOR LOCAL SYNTHETIC UI DEVELOPMENT
Admission: direct user instruction to execute the complete, open Fairview issue #49, KayzenRoot/fairview#49. This admission is limited to the exact allowlist and gates below.
Issue: https://github.com/KayzenRoot/fairview/issues/49

## Objective and frozen baseline

Extend the accepted local Fairview preview at http://127.0.0.1:4173 with navigable Risk and Portfolio pages. The pages are read-only visualizations of the existing redacted synthetic snapshot. They add no owner calculation, persisted state, live integration, operational control, financial authority, or checkpoint promotion.

Repository: KayzenRoot/fairview
Branch: feat/fv-ui-demo-002-risk-portfolio
Base and initial HEAD: 429dc73bfa5d39b3150707d29c300331bde6acec (protected main after GOV-012 PR #50).
Protected origin/main and GitHub API main were both checked at the exact base immediately before this Work Order. The branch was clean and had no implementation changes.
Exact-main Actions run 36612762226 at the exact base: completed SUCCESS, all four required jobs SUCCESS. The accepted issue records 14 synthetic owner suites, 569/569 PASS.
Local baseline npm run validate exited 0 on the exact base. This ran the Source Pack check (SHA-256 63b9242f0b05f55399e96e593227f2e69a070d41df358c11a337db11b13bf5f2), public-repository security scan, harness doctor, and all active harness suites. The pinned GEF checkout is initialized at 866fe3af8cccc65c929aaf6a47a924401fa448b3.
Predecessor PRs #48 and #50 are merged; issues #47 is closed and #49 is open. No open PR existed at admission. FV-CP-0002-PROPOSED remains MIGRATION_DRAFT_NOT_APPROVED with independent_approval=false.

Authority read at the frozen base: Source Hierarchy; latest proposed/unpromoted checkpoint and JSON; Decisions Ledger; Scope; Definition of Done; Architecture; Security; Requirements; active Web harness/module record; Web charter; the accepted local preview source and tests; package, harness and CI configuration; and issue #49 including its refined UI contract. D-007 remains OPEN. D-008 permits only credential-free synthetic development in the PUBLIC repository. The existing Web module remains ACTIVE for its bounded synthetic read model; this Work Order does not change module admission, ownership, dependencies, registry, or checkpoint.

## Frozen product and data boundary

Reuse the existing same-origin GET /api/demo-snapshot?scenario=healthy|degraded|denied and the same accepted response already loaded by Overview. Do not recreate or call the Risk or Portfolio owner calculations from browser code. Do not change server.mjs or read-model.mjs. Render only validated public values and static explanatory text; never render reason_code, raw DTO data, private fixture inputs, account identifiers, or monetary values.

The only permitted model values for these views are:

- risk_class: MOCK_RISK_PASS_NOT_AUTHORIZATION or MOCK_RISK_REFUSAL.
- portfolio_class: FICTIONAL_BALANCE_AND_LEDGER_MATCH, FICTIONAL_BALANCE_UNCERTAIN, or FICTIONAL_BALANCE_REJECTED.
- hypothetical_pause_hint: boolean.
- The existing top-level scenario and status allowlists and complete flags contract, with fixture_only=true and every authority flag false.
- A denied response has read_model=null and must remain visibly denied/unavailable.

Risk displays the fictional class and a hypothetical pause hint only, with a persistent, prominent “NÃO AUTORIZA NEGOCIAÇÃO” notice. It must not add kill/reset, approval, limits, orders, recommendations, or real state. Portfolio displays the fictional class and explicit uncertainty/completeness wording only. It must not show balances, positions, account histories, money, performance, returns, PnL, or actual reconciliation.

Healthy, degraded, denied, loading, and failure states must be textually and accessibly distinguishable; color is supplementary. Starting a new scenario request, an accepted degraded or denied response, malformed/unavailable data, or a current request error clears prior view values so stale scenario content cannot remain visible. No prior response may override a newer scenario after out-of-order fetch, body, or error completion. Reuse the existing single monotonic latestSnapshotRequestId; view navigation must not introduce another fetch token, page store, or request race. Keep the scenario selector visible on Overview, Risk, and Portfolio. Keep Markets, Strategies, Replay, Incidents, Advisory, and Settings visibly PLANNED.

Keep this preview loopback-only and offline-capable. Use only existing synthetic values in memory; no localStorage, cookies, service worker, external services, provider, login, new dependency, model/LLM, or real financial operation. Maintain responsive desktop and mobile layouts and the persistent synthetic/non-authoritative banner.

## Exact allowlist

Only these seven tracked paths may change in this Work Order:

1. .engineering/work-orders/FV-UI-DEMO-002.md — admitted Work Order, first isolated commit.
2. .engineering/context-locks/FV-UI-DEMO-002.md — exact pre-code lock, second isolated commit.
3. src/web/local-demo/public/index.html — accessible Risk and Portfolio view shells.
4. src/web/local-demo/public/app.css — responsive presentation of implemented view states.
5. src/web/local-demo/public/app.js — shared accepted snapshot rendering and navigation.
6. tests/web/local-demo.test.mjs — deterministic browser-script tests plus all existing adversarial tests.
7. docs/architecture/modules/web.md — candidate-local preview documentation only.

Do not change server.mjs, read-model.mjs, any owner source, tests outside the named browser test, module registry, GEF, dependency manifests/lockfiles, security policy, CI, decisions, scope, checkpoint, or any other path. If an unlisted change becomes necessary, stop before changing it and record a narrow admitted correction delta in this same Work Order before proceeding.

## Required pre-code sequence

The first commit contains only this Work Order. The second commit contains only the Context Lock with the exact base, Work Order commit/blob, locked source fingerprints, allowlist, tests, and gates. No implementation or test code may be written until both commits exist and the live base and locked fingerprints are reconfirmed. Any change to main, authority, accepted dependencies, owners, GEF, or gate sources before the lock invalidates this freeze and requires stopping to recalculate it.

## Required implementation proof

Extend the existing node:vm tests to execute the actual public app.js against deterministic fake DOM elements and controlled fetch/body promises. Retain all existing adversarial HTTP and UI coverage. Add deterministic assertions for:

- Startup from a Risk or Portfolio hash, mouse navigation, current-page accessibility state, and the scenario selector on each implemented page.
- Each of Risk and Portfolio displaying all three allowed scenarios with only approved synthetic values and explicit non-authority/uncertainty text.
- Clearing stale content at request start and on degraded, denied, malformed, missing, forged-flag, unsuccessful-response, and current-error paths.
- Navigation among Overview, Risk, and Portfolio while a response is pending without extra fetches; late stale response bodies and stale errors cannot overwrite the latest accepted state.
- Invalid enum values fail closed; raw fields and authority flags never enter rendered text.

The browser tests must remain deterministic and must not introduce a test dependency. After the edit, run the exact-base impact proof for bootstrap and web, the changed-owner web tests and applicable bootstrap tests, security scan, full npm run validate / 14 active harness suites, and git diff --check. Do not run still-planned owner modules. Correct all in-scope failures and revalidate the final exact HEAD.

## Visual inspection and PR evidence

Serve the real app on 127.0.0.1:4173. Inspect Overview, Risk, and Portfolio in desktop and mobile viewports using Codex Desktop, with healthy/degraded/denied fixture states represented in deterministic tests and screenshots limited to synthetic fixtures. Preserve sanitized screenshots outside the Git allowlist and show them to the owner for design feedback before treating the PR as final. Record evidence links/locations and any in-scope feedback resolution in the draft PR and Evidence Bundle.

The draft PR and its exact candidate HEAD must include the base SHA, final HEAD, exact file list, impact graph, targeted test and full validation results, security/diff scan results, four exact-head hosted checks, sanitized visual evidence, failures corrected, risk/compatibility/dependency notes, author audit marked NOT_INDEPENDENT, and proposed checkpoint delta NONE. Never claim an independent audit, financial safety, authorization, or checkpoint promotion. Keep the PR in draft until owner design feedback and required review gates are resolved. Do not merge.

## Completion boundary

Completion for this Work Order means an auditable draft PR at a pushed exact HEAD, with the seven-path allowlist respected, complete local and hosted evidence, four exact-head checks successful, and the local synthetic Risk and Portfolio pages available for owner inspection. It does not mean independent approval, merge, production readiness, funded use, trading authority, or promotion of FV-CP-0002-PROPOSED.

Checkpoint delta: none.

## Correction Delta CORR-001 — bind the response to the requested scenario

Date: 2026-09-29
Admission: direct user instruction to continue PR #51 and execute the latest owner-authored ChatGPT review finding in this same Work Order. This correction does not expand the frozen scope or seven-path allowlist.
Review: https://github.com/KayzenRoot/fairview/pull/51#discussion_r4137760242 (review submitted at candidate `b6cbae86e32638fb16e65e50ced3304007dc4563`, verdict `NOT_INDEPENDENT`).

Finding: validating only the response's internal scenario/status contract permits the current request for one allowlisted scenario to receive a different internally valid scenario and render it under the selected scenario control. The monotonic request token rejects older requests but does not bind the current body to the requested scenario.

Authorized correction: pass the current request's allowlisted scenario into the existing response validation and require `snapshot.scenario` to equal `scenarioLabels[scenario]` before applying any response values. A current mismatch must use the existing fail-closed unavailable/error path, clearing values on Overview, Risk, and Portfolio; the selector remains on the requested scenario and no response-provided value is rendered. Keep the single existing request token and same-origin GET contract.

Required adversarial proof: add two deterministic tests that execute the real `src/web/local-demo/public/app.js` through the existing node:vm harness. Test a current `denied` request receiving a fully valid `HEALTHY_FIXTURE` envelope. Test a current `healthy` request receiving a fully valid `DENIED_FIXTURE` envelope while navigating across Overview, Risk, and Portfolio. In both cases assert that the request remains current, the requested selector is retained, the UI fails closed, all implemented-view values remain unavailable, and no wrong-scenario fixture content is rendered. Preserve every existing test and all prior adversarial cases.

Proof sequence: inspect the seven-path diff; run `node --test tests/web/local-demo.test.mjs`; recompute exact-base impact from `429dc73bfa5d39b3150707d29c300331bde6acec` to the candidate and run applicable bootstrap/Web harness verification; run `node scripts/security-scan.mjs`, full `npm run validate` (all 14 active modules), and `git diff --check`; publish the new candidate SHA and require all four hosted checks to complete successfully on that exact SHA. Keep PR #51 in draft for re-audit. Do not merge, promote a checkpoint, expand paths, or solicit/re-enable automated review.

Correction boundary: only the original seven allowlisted paths remain authorized. Checkpoint delta remains none.
