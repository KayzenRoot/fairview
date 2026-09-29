# FV-UI-DEMO-001 | Synthetic local FairView preview

Date: 2026-09-29
Status: ADMITTED FOR LOCAL SYNTHETIC DEVELOPMENT
Admission: direct user instruction to execute the complete, open Fairview issue #47, `KayzenRoot/fairview#47` (FV-UI-DEMO-001). This admission is limited to the exact allowlist and gates below.
Issue: https://github.com/KayzenRoot/fairview/issues/47

## Objective and frozen baseline

Deliver the first visual Fairview interface for Codex Desktop as an offline-capable, loopback-only local preview at `http://127.0.0.1:4173`. It displays only invented fixtures through the existing accepted `composeSyntheticOperatorReadModel`. It is a development preview, not a product/checkpoint promotion, authenticated operator console, market integration, or financial authorization.

Repository: `KayzenRoot/fairview`
Branch: `feat/fv-ui-demo-001-local-preview`
Base and initial HEAD: `e7e19ef0e505eb62cece8b1cc0d6bb601f9fce48` (merged docs PR #46; exact remote `main` matched at freeze).
Baseline exact-main CI: run [36589991327](https://github.com/KayzenRoot/fairview/actions/runs/36589991327), head `e7e19ef0e505eb62cece8b1cc0d6bb601f9fce48`, four of four jobs SUCCESS; the issue records 14 existing synthetic suites, 561/561, 20 registry IDs (14 mock-only ACTIVE, six PLANNED).
Initial local validation: clean worktree and correct base; first `npm run validate` stopped at `GEF_SUBMODULE_NOT_INITIALIZED`. Initialized only the already-pinned GEF submodule at `866fe3af8cccc65c929aaf6a47a924401fa448b3`; subsequent complete `npm run validate` exited 0, including public safety, doctor and all active harness suites. Source Pack SHA-256: `70db12aea0fcc953f33886c4c9f3d55be03a87ed8891dd3c5f45fba34b39a15d`. This repairs the local checkout prerequisite without changing repository source or pin.

Authority read at the frozen base: Source Hierarchy; proposed/unpromoted FV-CP-0002 checkpoint and JSON; Decisions Ledger; Scope; Definition of Done; Architecture; Security; active Web registry entry; Web architecture and accepted read model/tests; package, harness and CI configuration. D-007 remains OPEN. D-008 keeps this credential-free synthetic development in the PUBLIC repository and forbids secrets/data. FV-CP-0002 remains `MIGRATION_DRAFT_NOT_APPROVED`, `independent_approval:false`. Web is already ACTIVE for a bounded four-owner synthetic read model; this WO does not change module admission, registry, accepted owner sources, dependencies or checkpoint.

## Frozen implementation boundary

Implement only a local visual shell and its read-only local API. All data must be invented in this WO and flow through the existing accepted `composeSyntheticOperatorReadModel`; do not compute or simulate Risk, Portfolio, Observability or Advisory owner results in the UI/server. Build one small deterministic healthy fixture and, where needed, a deterministic incomplete/degraded fixture. Keep every raw fixture value inside the server process. Return only bounded, redacted enums and explicit synthetic/non-authoritative flags. Denied or incomplete evidence must remain visibly uncertain and must never become a green/healthy claim.

The page has navigation for Overview, Markets, Strategies, Portfolio, Risk, Replay, Incidents, Advisory and Settings. Implement only the Overview preview. Other sections are clearly marked planned and cannot imply working providers, accounts, alerts, login or controls. Keep an always-visible `SYNTHETIC_NONAUTHORITATIVE` banner and explain that pauses are hypothetical. Do not display prices, PnL, balances, account/tenant/venue/instrument/order IDs, grants, tokens, credentials, session details or other raw fixture fields.

Use Node 22 standard-library HTTP only, no new package or toolchain change. Bind exclusively to `127.0.0.1`; allow only the loopback host for the bound port. Serve only known static asset paths and `GET /api/demo-snapshot`; no other method, route, path or query behavior that mutates state. The imported server module must not listen or start work. Add restrictive local CSP, `Cache-Control: no-store`, content-type/nosniff protections, and no CORS grant. No external network/provider, database, browser auth/cookie, SSE/WS, upload, sensitive logging, user input command or finance action. Offline use after checkout is required.

## Exact allowlist

Only these paths may change in this Work Order:

1. `.engineering/work-orders/FV-UI-DEMO-001.md` — this admitted Work Order.
2. `.engineering/context-locks/FV-UI-DEMO-001.md` — second, standalone pre-code lock.
3. `src/web/local-demo/server.mjs` — loopback-only server and frozen synthetic fixture boundary.
4. `src/web/local-demo/public/index.html` — local preview shell.
5. `src/web/local-demo/public/app.css` — responsive visual styling.
6. `src/web/local-demo/public/app.js` — read-only fetch/render from redacted snapshot.
7. `tests/web/local-demo.test.mjs` — deterministic HTTP, redaction, degraded-state, security and lifecycle tests, included by existing `tests/web/*.test.mjs` owner glob.
8. `docs/architecture/modules/web.md` — narrow local-preview appendix and Windows/Codex launch and rollback instructions.

No changes to `package.json`, `harness/modules.json`, accepted owner sources/tests, contracts, Security, ADRs, checkpoint/ledger, GEF, CI/workflows or other owners. If any additional path, package, auth mechanism, provider, module graph/owner, or security exception becomes necessary, STOP; first record a justified correction delta in this same WO/PR, re-evaluate authority and impact, and do not implement the extra scope unless it is admitted.

## Sequence and proof gates

1. Commit this Work Order alone as the first isolated commit. Create/commit its exact Context Lock alone second, before any product or test code.
2. Implement only the frozen allowlist on the named branch. No code/test file before both governance commits.
3. Add meaningful tests for: exact routes and assets; actual invocation of the accepted read-model function; enum-only public response and all false financial/auth/model/live flags; degraded/denied fixtures stay visibly uncertain; GET-only behavior; unknown/malformed paths and disallowed Host/Origin rejection; CSP, absent CORS and no-store; deterministic fixtures; no import-time listener; loopback bind and clean start/stop. Run the new Web test directly.
4. Run `node scripts/harness.mjs impact --base e7e19ef0e505eb62cece8b1cc0d6bb601f9fce48 --head HEAD`; require known Web ownership and actual Web tests, then run the selected impact proof.
5. Run `npm run validate` from a clean checkout/worktree state after the implementation commits, plus `node scripts/security-scan.mjs`. Preserve the full 561 existing passing tests and report the actual expanded count; do not claim local hosted-Windows coverage.
6. Start the server and visually inspect the responsive page in Codex Desktop at `http://127.0.0.1:4173`; verify the visible banner and that only synthetic/degraded redacted enums appear. Save any requested visual evidence outside tracked source unless separately admitted.
7. Inspect the full diff, exact allowlist, module-impact graph, public scan, secret-free evidence, rollback, risks and checkpoint delta. Prepare a redacted evidence bundle with exact base/head, changed file list, hashes, tests/results, impact owner, screenshot/localhost inspection, and failure/correction history. Do not alter the Source Pack/checkpoint to make candidate work appear accepted.
8. Push the named branch and create a DRAFT PR against `main` only after local proof and evidence are reviewable. Verify all four required Actions jobs on the exact PR HEAD complete SUCCESS, including hosted Windows PowerShell 5.1, pinned GEF, public security and full harness/evidence. Correct failures only on this branch/PR and rerun against the new exact HEAD. The author’s objective audit must state `NOT_INDEPENDENT`; no self-review or CI result is independent approval.
9. Do not merge as part of this delivery. Normal guarded merge, exact post-merge main validation and any separate factual checkpoint/Governance reconciliation remain later gates. No checkpoint promotion is authorized.

## Same-WO correction delta | stale asynchronous fixture responses

Date: 2026-09-29. Authorized by the user's follow-up after the technical review on PR #48 (review comment `4136089526`, reviewed HEAD `53728d6132d6e1a17405111da835ce28e1e96daa`). The review identified that an earlier fixture request, including a delayed fetch error, could finish after a newer selection and replace the newer view.

Correction remains within the existing allowlist and this Work Order: `app.js` assigns a monotonic request ID and checks it after fetch, JSON body resolution, and in the error path before rendering. `tests/web/local-demo.test.mjs` executes the actual browser script with a deterministic fake DOM and deferred responses; it covers stale healthy/degraded/denied responses, a response body that resolves late, a stale fetch error, and a current fetch error that must still fail closed. No dependency, endpoint, module, owner, financial behavior, or gate changed. The original Context Lock is preserved as the pre-code lock; its recorded Work Order commit/blob identify the admitted baseline, and this note records the same-WO correction.

## Same-WO correction delta | docstring coverage CORR-002

Date: 2026-09-29. Authorized by the user's follow-up after the latest technical review on PR #48 (review `5356225971`, reviewed HEAD `f37b78ded0708cd27ff679db3678483442dc3498`). The review reported 0% Docstring Coverage against an 80% threshold for 19 supported functions across the server, browser script, and local Web tests; five unsupported function forms were skipped by the analyzer.

Correction remains within the existing allowlist and this Work Order: meaningful JSDoc now documents all 19 supported function declarations in `server.mjs`, `app.js`, and `tests/web/local-demo.test.mjs`. The contracts explain fixed synthetic scenario inputs and bounded return values, loopback/host/origin/method and response-header boundaries, redacted enum projection and non-authoritative flags, monotonic request-token behavior and stale-response/error drops, and the deterministic test harness controls. The change adds no runtime logic, endpoint, dependency, module, owner, financial behavior, or test assertion, and does not lower the analyzer threshold. The Context Lock remains preserved as the pre-code lock. Re-run the full existing validation and the fresh CodeRabbit analysis against the new exact PR HEAD; report the measured coverage rather than assuming the source annotations satisfy the external analyzer.

## Stop conditions, risk and rollback

Risk: LOW-to-MODERATE local HTTP surface with explicit loopback restriction; review route/path/host handling and public data redaction adversarially. STOP before extending scope if synthetic separation, output redaction, loopback-only binding, CSP/security, or clean lifecycle cannot be proved; if the accepted read model or a dependency fingerprint changes; if exact main/base or required CI changes; or if any request would need actual accounts, provider access, financial actions, login/auth, external data, new dependency, source-owner changes or promotion.

Rollback is limited to stopping the local Node process and reverting this PR through a normal reviewed Git change. No persistent/runtime data exists. Do not reset shared checkouts or rewrite history.

## Acceptance / checkpoint delta

Acceptance requires the exact allowlist, all tests and security checks green, visible local page at the stated URL, actual accepted read-model invocation, redacted-only responses, full exact-head four-job success, no unresolved high/critical issue, and a reviewable draft PR with redacted evidence. This development preview does not authenticate users, connect to markets, provide financial advice, measure returns, operate incidents, pause real trading, or execute any financial operation.

Checkpoint delta: none. Preserve FV-CP-0002 proposed/unpromoted and all real financial / independent-review gates unchanged.
