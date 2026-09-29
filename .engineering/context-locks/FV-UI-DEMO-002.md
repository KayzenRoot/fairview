# Context Lock | FV-UI-DEMO-002

Date: 2026-09-29
State: LOCKED BEFORE PRODUCT OR TEST CODE
Work Order: .engineering/work-orders/FV-UI-DEMO-002.md
Work Order commit: b9bb94805e9ce5f98f5eeea49f1fa589b222c57c
Work Order Git blob: 4394334fd0d27e0defb10f3061a6d6fce4d2ca58

## Exact repository state

- Repository: KayzenRoot/fairview.
- Branch: feat/fv-ui-demo-002-risk-portfolio.
- Base: 429dc73bfa5d39b3150707d29c300331bde6acec, protected main after merged GOV-012 PR #50.
- Local origin/main and GitHub API main were rechecked immediately before locking and both equal the exact base above.
- Work Order parent HEAD: 429dc73bfa5d39b3150707d29c300331bde6acec. Work Order commit: b9bb94805e9ce5f98f5eeea49f1fa589b222c57c, whose sole changed path is the admitted Work Order.
- Lock parent HEAD: b9bb94805e9ce5f98f5eeea49f1fa589b222c57c. The working tree is clean after the Work Order commit; the only path changed from base is the Work Order. No implementation or test code exists yet.
- Exact-main Actions run 36612762226 at the exact base completed with all four required jobs SUCCESS. Issue #49 records the full 14 synthetic suites at 569/569 PASS. Local npm run validate on the exact base exited 0, including Source Pack, public security, doctor, and all active harness suites. Source Pack SHA-256: 63b9242f0b05f55399e96e593227f2e69a070d41df358c11a337db11b13bf5f2.
- Pinned read-only GEF submodule: vendor/gef-bootstrap, exact gitlink SHA 866fe3af8cccc65c929aaf6a47a924401fa448b3.
- PRs #48 and #50 are merged, issue #47 is closed, issue #49 is open, and no PR is open for this change. Checkpoint FV-CP-0002-PROPOSED remains MIGRATION_DRAFT_NOT_APPROVED with independent_approval=false.

## Frozen owner, dependency, and authority fingerprints

The following Git blob IDs were read from the exact base 429dc73bfa5d39b3150707d29c300331bde6acec. They must remain unchanged for this implementation; the GEF row is the gitlink commit rather than a blob. package-lock.json is absent at this base; no package or dependency change is authorized.

| Locked path at base | Git object |
| --- | --- |
| .engineering/SOURCE-HIERARCHY.md | 7b2cb9989d8d3de3ec3396a41fb9fc1675662103 |
| .engineering/CHECKPOINT.md | 420452374d04b541cb1e57b97ac942a5fde3bf4d |
| .engineering/CHECKPOINT.json | 4836a3d93de394e8fbf2db9d9c119a1f2bb93f96 |
| .engineering/DECISIONS-LEDGER.md | 116b962fbec0b54bdd9d698d15671aba4ab96664 |
| .engineering/SCOPE.md | de4217061a8e6d495019d5ec20606cca7f6b24b6 |
| .engineering/DEFINITION-OF-DONE.md | 0f057693c0dfecfd1059ac09594fbb778f3d9a80 |
| .engineering/ARCHITECTURE.md | 87e741438676701cad7f6a714d9df253bab90d46 |
| .engineering/SECURITY.md | 1c924baeb56882250e7a03519cb26fd2a01816e4 |
| .engineering/REQUIREMENTS.md | 0dcbdb2e6f63f29b3fc8f9a78f8e04520e7f6039 |
| docs/architecture/modules/web.md | 9cb8e00a61f22bb4301ba4ff26a957e58c071468 |
| harness/modules.json | bef8d6905be50145a46a7a9b25bc98a9b8a6d9d0 |
| package.json | 39a235fdb52ea33b402db576def8abb25021de56 |
| scripts/harness.mjs | a716afc8ecb4d4a95657a5efd6e22ded8f114294 |
| scripts/security-scan.mjs | be3fc43e104bfc9e84b41f7a12a9a1f0292eafc1 |
| .github/workflows/foundation.yml | cb374e59b959f9e083fcd2cac9ef96395cdaacbc |
| vendor/gef-bootstrap | 866fe3af8cccc65c929aaf6a47a924401fa448b3 |
| src/web/read-model.mjs | fb408ce92dec2c4a8ddc6a78e3c4c1e1e177ad8f |
| src/web/local-demo/server.mjs | 656251c8baa16b8acbcd94c78ed730f301165f74 |
| src/web/local-demo/public/index.html | ce2cea1c2236eeca6d7dfa646e9f1d4088ace6d7 |
| src/web/local-demo/public/app.css | ce910b8c7df263cc0f4bda7a378c9bf8204af79a |
| src/web/local-demo/public/app.js | 83f31f0d11ca9140645210c7e9eeede7c50aa0d4 |
| tests/web/read-model.test.mjs | 7757219670bb8c82043d636d4e337d5ca50cb7c3 |
| tests/web/local-demo.test.mjs | 238a428fb8a4e8ac10944568b37d1e3492730889 |
| src/risk/evaluate.mjs | 322222a28919bdc0d2b0e0e622555fb71f9d56f2 |
| src/portfolio/projection.mjs | a01f366228ad180d5715fa47303b179d1dd8b75a |
| src/observability/diagnostics.mjs | ad7bb4dc5b5ccdca0f62b209c62df7dd2a6b186b |
| src/ai/explanation.mjs | 36153dc22dc8b436853cad15f3274b60917cc140 |

The admitted Web module is ACTIVE for the existing bounded synthetic read model and has direct dependencies risk, portfolio, observability, and ai. The harness registry remains 20 IDs with 14 synthetic-only ACTIVE modules and six PLANNED modules. The GEF pin, owner implementations, read model, server, test globs, registry, and dependencies are immutable. No external context service is used.

## Frozen allowlist and implementation boundary

Exactly these seven paths may differ from the base:

1. .engineering/work-orders/FV-UI-DEMO-002.md
2. .engineering/context-locks/FV-UI-DEMO-002.md
3. src/web/local-demo/public/index.html
4. src/web/local-demo/public/app.css
5. src/web/local-demo/public/app.js
6. tests/web/local-demo.test.mjs
7. docs/architecture/modules/web.md

Do not change local-demo/server.mjs, src/web/read-model.mjs, risk/portfolio/observability/ai owner source or tests, registry, GEF, package manifests, security, CI, decisions, checkpoint, or any other path. The web charter update may document this candidate local preview only and must not claim accepted production capabilities.

Only the existing GET /api/demo-snapshot?scenario=healthy|degraded|denied is permitted. Validate the existing schema/status/scenario/full-flags contract and allowlisted risk_class, portfolio_class, and boolean hypothetical_pause_hint before rendering. Denied has read_model=null and is unavailable. Do not render reason_code, private fixture values, raw response data, monetary values, balance/position/account information, PnL, returns, orders, or real state. Risk has only a fictional class, hypothetical pause hint, and persistent non-authorization warning. Portfolio has only fictional class and explicit uncertainty/completeness wording.

Healthy, degraded, denied, loading, and failure outcomes must be distinct in accessible text. Clear older labels when a scenario request starts and on degraded/denied/error/invalid responses. Preserve the one existing monotonic latestSnapshotRequestId through navigation and all screens; add no request store/token or fetch on view-only navigation. The selector is visible on Overview, Risk, and Portfolio; the other six navigation entries stay PLANNED. Keep the always-visible synthetic/non-authoritative warning and responsive loopback-only behavior. No local persistence, external network/provider, auth, real financial operation, dependency, or module activation.

## Locked proof and stop conditions

Before editing code after this second commit, confirm the live GitHub main and local origin/main still equal 429dc73bfa5d39b3150707d29c300331bde6acec, verify this lock commit is the branch HEAD and its parent is the Work Order commit, confirm the complete seven-path allowlist, and recompute all locked source objects. Any mismatch, new PR conflict, failed gate, owner change, or unknown path invalidates this lock: stop and record a narrow admitted same-WO correction delta before proceeding.

Required deterministic node:vm coverage executes the actual public app.js and retains all existing adversarial cases. Cover mouse and hash entry/navigation, all three scenarios on both screens, ARIA/current page and scenario selector, clear-on-loading/degraded/denied/error, malformed JSON, missing model, forged flags and enums, stale fetch/body/error, and navigation while pending without additional requests. Do not remove existing tests or add a dependency.

After implementation, run the impact graph against exact base 429dc73bfa5d39b3150707d29c300331bde6acec and candidate HEAD; unknown or direct planned paths stop. Execute applicable Web and bootstrap proofs, security scan, git diff --check, full npm run validate across all 14 active suites, and exact-head hosted four-job CI. Do not execute planned owner suites. Inspect the exact seven-path diff and public-tree security result before creating the draft PR. Open the preview in Codex Desktop at 127.0.0.1:4173 for Overview, Risk, and Portfolio on desktop and mobile; retain sanitized synthetic-only screenshots outside Git and provide them for owner design feedback. Keep the PR draft pending feedback/review; no merge or checkpoint promotion.

## Safety verdict

D-007 remains OPEN. D-008 authorizes only public, credential-free synthetic development. FV-CP-0002-PROPOSED stays MIGRATION_DRAFT_NOT_APPROVED with independent_approval=false. This work proves only local browser presentation of synthetic read-model labels; it does not prove live data, user authentication, market connection, balances, performance, reconciliation, orders, execution authorization, production readiness, or financial safety. Author audit is NOT_INDEPENDENT. Checkpoint delta: none.
