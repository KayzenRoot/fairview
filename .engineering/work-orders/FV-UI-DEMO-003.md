# FV-UI-DEMO-003 | Synthetic local Incidents and Advisory pages

Date: 2026-09-29
Status: ADMITTED FOR LOCAL SYNTHETIC UI DEVELOPMENT
Admission: Direct user instruction to execute the complete open issue #53 in KayzenRoot/fairview, subject to this Work Order and its paired exact Context Lock.
Issue: https://github.com/KayzenRoot/fairview/issues/53

## Exact source authority and frozen baseline

- Repository: KayzenRoot/fairview.
- Required branch: `feat/fv-ui-demo-003-incidents-advisory`.
- Exact base and initial branch HEAD: `19130b06d05a25f9368a093e37e5f3e5e7fa954a` (protected `main`, normal merge commit for GOV-013 PR #52).
- GOV-013 PR #52 merged normally from expected feature HEAD `1b6467bcecbc9fb527457ed9269d9ecdf58aeb89`; merge commit is the exact base above. PR #52 is MERGED, CodeRabbit review completed, no actionable review comments, and no PR is currently open.
- Exact post-merge main Actions run `36629950549` at base `19130b06d05a25f9368a093e37e5f3e5e7fa954a`: all four hosted jobs SUCCESS, including Windows PowerShell 5.1, pinned GEF, public security, and the protected-main full active harness. Fourteen owned suites are synthetic-only and total 574/574 PASS.
- Local `origin/main`, GitHub API `main`, and this clean branch checkout were rechecked at the exact base immediately before this Work Order. Initial local checks: `node scripts/check-sources.mjs` passed with Source Pack SHA-256 `decc791a0805815e8bb4604c902ee25892451424e8b64d2c5a50c84f99927055`; `node scripts/security-scan.mjs` passed; `node scripts/harness.mjs doctor` initially reported the GEF submodule uninitialized, then passed after initializing only the pinned `866fe3af8cccc65c929aaf6a47a924401fa448b3` (`v1.0.0`) commit. No tracked source was changed.
- Checkpoint `FV-CP-0002-PROPOSED` remains `MIGRATION_DRAFT_NOT_APPROVED` with `independent_approval:false`. GOV-013 is documentation-only and does not authorize production, real financial data, or checkpoint promotion. D-007 and D-008 remain open for real provider/data rights and private-before-funded production.
- The existing Web module is ACTIVE only for bounded synthetic source tests. The registry still has twenty IDs, fourteen synthetic-only ACTIVE modules, and six PLANNED modules; no module admission or graph change is in scope. `integration` remains PLANNED.

## Objective

Extend the offline-capable, loopback-only preview at `http://127.0.0.1:4173` with two navigable, read-only views, Incidents and Advisory. Reuse only the existing `GET /api/demo-snapshot?scenario=healthy|degraded|denied`, its current redacted snapshot, and the existing shared request lifecycle. Overview, Risk, and Portfolio remain accepted and must retain their current requested-scenario binding, single monotonic request token, navigation behavior, and fail-closed handling. Markets, Strategies, Replay, and Settings remain visibly PLANNED.

## Frozen UI and data boundary

Render only literal allowlisted display labels from the same accepted snapshot. Do not fabricate a second incident/advisory data source, calculate owner outcomes in browser code, or derive monitoring, alert-delivery, security, performance, or financial claims.

Incidents may display only the fixed `incident_banner` and allowlisted `diagnostic_class` from the current validated snapshot. It must clearly distinguish a fictional in-process diagnostic, unknown event, or refusal from any actual alert or acknowledgement and permanently show `NO REAL ALERT / NO ACK / NO MONITORING`. Add no acknowledge, clear, escalate, retry, inject, reconnect, webhook, SSE/WS, or other operational control.

Advisory may display only the allowlisted `advisory_class` from the same snapshot and static copies that model inference and human review are FALSE. Permanently show `FIXED FICTIONAL TEMPLATE / NOT INVESTMENT ADVICE / NO MODEL / NO HUMAN APPROVAL`. Add no LLM/model/service, freeform output, prompt/tool call, investment recommendation, trade suggestion, tuning, approval, or personalized decision.

Validate the complete existing envelope, schema, flags, model keys, statuses, all new and existing enum fields, and `snapshot.scenario === scenarioLabels[requestedScenario]` before applying values. A current mismatch, invalid/unknown enum, extra/raw field, malformed/missing response, current fetch/body error, denied `read_model:null`, or stale response must clear values across all five implemented views. In particular, `real_alert_delivered`, `mandatory_audit_satisfied`, `model_inference_performed`, and `human_review_complete` must remain false. Navigation among the five pages shares one current snapshot and must not fetch again.

The preview remains local to `127.0.0.1`, offline-capable, in-memory, credential-free, and visibly synthetic/non-authoritative. No real provider, account, balance, position, order, trade, alert delivery, financial permission, persistence, cookie, localStorage, CORS, telemetry, network service, or new dependency is admitted.

## Exact seven-path allowlist

Only these tracked paths may change:

1. `.engineering/work-orders/FV-UI-DEMO-003.md` — this admission; first isolated commit.
2. `.engineering/context-locks/FV-UI-DEMO-003.md` — immutable exact pre-code lock; second isolated commit.
3. `src/web/local-demo/public/index.html` — accessible Incidents and Advisory view shells.
4. `src/web/local-demo/public/app.css` — desktop and mobile display for the new views and their states.
5. `src/web/local-demo/public/app.js` — shared validated snapshot mapping, five-view navigation, and fail-closed clearing.
6. `tests/web/local-demo.test.mjs` — deterministic real-script tests and retained adversarial coverage.
7. `docs/architecture/modules/web.md` — candidate-local-preview documentation only.

Do not change `src/web/local-demo/server.mjs`, `src/web/read-model.mjs`, any owner implementation or owner tests, `harness/modules.json`, GEF, dependency files, CI, security/decision/authority sources, checkpoint, or any other path. An unknown or necessary extra path is a STOP; first record a narrow admitted correction in this same Work Order, then obtain a new exact lock if any locked source changes.

## Required pre-code sequence

This Work Order is the first standalone commit and contains only this file. The second standalone commit contains only `.engineering/context-locks/FV-UI-DEMO-003.md`, records the exact base, Work Order commit and Git blob, seven-path allowlist, locked owner/authority source fingerprints and required proof, and confirms that no code or tests have changed. Before that second commit, recheck GitHub `main`, `origin/main`, branch HEAD/parent, worktree cleanliness, base Source Pack, GEF pin, seven-path scope, and all locked fingerprints. Any base drift, new conflict, failure, or unresolved blocking review invalidates the lock and stops work. No implementation or test code may be written until both commits exist and the lock is reconfirmed.

## Required implementation proof

Use the existing deterministic `node:vm` harness to execute the actual browser `app.js` with fake DOM nodes and controlled fetch/body/error promises. Preserve every existing test. Cover all five implemented pages for hash and mouse navigation, ARIA current-page state, responsive navigation, shared scenario selector, and all three fixture scenarios. Exercise navigation while a request is pending with no extra fetch. Add negative coverage for valid-but-wrong scenario bodies on Incidents and Advisory, late old body/error results, invalid new diagnostic/advisory/incident enums, forged real-alert/model/human-review/audit flags, raw prompt/fixture or added fields, malformed and denied-null models, and current request errors. Assert that invalid or stale results never display raw or mismatched content and clear every implemented view.

After code, run `node --test tests/web/local-demo.test.mjs`, exact-base `node scripts/harness.mjs impact --base 19130b06d05a25f9368a093e37e5f3e5e7fa954a --head <full candidate SHA>`, the applicable bootstrap and Web harnesses (integration stays PLANNED), `node scripts/check-sources.mjs`, `node scripts/security-scan.mjs`, `node scripts/harness.mjs doctor`, full `npm run validate` for all currently ACTIVE modules, and `git diff --check`. Inspect the full seven-path diff and exact-head Evidence Bundle; report failures honestly and correct in-scope issues before publishing a new candidate SHA.

## Visual inspection and completion

Launch the actual server using `node src/web/local-demo/server.mjs` and open `http://127.0.0.1:4173/#incidents` and `http://127.0.0.1:4173/#advisory` in Codex Desktop. Inspect all five implemented views at desktop and mobile sizes with healthy, degraded, and denied synthetic states. Preserve sanitized screenshots outside Git and attach them to the draft PR. Do not imply that static synthetic labels are real monitoring, alert delivery, model inference, human approval, financial safety, or investment advice.

Create or update the issue's PR as a draft, with the exact base and candidate HEAD, this Work Order and Context Lock, seven-path list, impact graph, local and hosted results, visual-evidence links, security/dependency/compatibility notes, known limitations, author audit `NOT_INDEPENDENT`, and checkpoint delta `NONE`. Require all four hosted checks successful at the exact pushed HEAD and a current Evidence Bundle. Keep the PR in draft for re-audit. Do not merge, promote the checkpoint, or claim independent approval or real financial functionality.

Completion for this Work Order means an auditable, pushed draft PR with the exact seven-path boundary, complete local and hosted evidence, four exact-head checks successful, and the two synthetic pages available for owner inspection. It does not mean independent review, merge, production readiness, funded use, trading authority, alert delivery, investment advice, or checkpoint promotion.

Checkpoint delta: none.
