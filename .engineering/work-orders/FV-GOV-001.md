# FV-GOV-001 | Evidence-only current checkpoint reconciliation

**Status:** ADMITTED FOR GOVERNANCE RECONCILIATION, never automatic checkpoint promotion.
**OBJECTIVE:** Repair stale post-migration Source Pack statements against observed protected-main Git and CI, while explicitly keeping FV-CP-0002 PROPOSED / NOT independently approved. No retired service or other external context dependency may return.

## CONTEXT and source order
Exact immutable base main: `8da9fc71e35d25cef8849db5d7c218f69875faad`. Merged: PR #18 native foundation (`694fe60c759ab5a5f91ffaa32b599899bc614f83`), #17 20-module planning (`858c12538df93a51d4faed50a7f4faa5e08be50d`), #19 impact harness (`69ef5e6649d00ec06c1d6ba6adb0f7e5c97a637d`), #20 synthetic policy (`a4fba7b5c2c91c730a50c45f934e3cdf16252680`), #21 synthetic clock (`f42bd032085f96b24da81e6c1cd837849733b4cc`), #23 synthetic market data (`8da9fc71e35d25cef8849db5d7c218f69875faad`). Latest actual protected-main push run `36518003115`: four jobs SUCCESS. PR #22 CLOSED WITHOUT MERGE. Current repo has 20 registered IDs, four ACTIVE (bootstrap/policy/clock/market-data), 16 PLANNED. Independent review of market-safety and financial security NOT established. Owner D-009 withdrawal of external context service remains authoritative.

## SCOPE / ALLOWED FILES
This WO, .engineering/context-locks/FV-GOV-001.md, .engineering/CHECKPOINT.md, CHECKPOINT.json, BACKLOG.md, SCOPE.md, DEFINITION-OF-DONE.md, ARCHITECTURE.md, docs/architecture/MODULE-READINESS-AND-IMPLEMENTATION-R10.md and docs/architecture/ARBITRAGE-MODULE-MAP.md (observed-versus-proposed status lines only), plus .engineering/SOURCE-HIERARCHY.md, INTEGRATION-CONTRACTS.md and TEST-BENCHMARK-PLAN.md (current factual-status lines only). No source, tests, CI, submodule, accepted decision, ADR, deployment, issue history or product-module activation.

## OUT OF SCOPE / ARCHITECTURE
No credential, order execution, financial backend, durable database, market data feed, model or additional software. Keep exact native Git/Node22/GEF foundation and existing module ownership. Historical records remain immutable; old independent audit must not be impersonated. Correct inconsistencies using only observed repo facts; no falsely promoted checkpoint. Next necessary synthetic Ledger WO may be planned but cannot be auto-activated by this governance edit.

## REQUIREMENTS / CONSTRAINTS
- Preserve FV-CP-0002 checkpoint ID and `MIGRATION_DRAFT_NOT_APPROVED` until objectively independent approval exists; do not claim proposed design ADRs adopted or product readiness.
- Record merged migration PR #18 and subsequent documented merges, current observed 20/4/16 registry snapshot and exact-main CI, with separate evidence fields for source observation versus checkpoint approval.
- Update BACKLOG and CURRENT SCOPE from retired migration to status-aligned synthetic-only planning. Keep D-007/D-008 and public-dev/private-before-funded-production restrictions.
- R10 module inventory/status must agree with actual registry. Do not rewrite researched proposal contracts or futures as completed.
- All edits require fresh SHA/context verification and fail-closed on divergence.

## ACCEPTANCE CRITERIA / TESTS
1. Diff is limited to allowlist; source, test, CI, GEF pin and accepted ADR SHA unchanged.
2. Canonical files agree with current merged Git history and `harness/modules.json`, and do not claim independent acceptance.
3. `node scripts/check-sources.mjs`, `node scripts/security-scan.mjs`, `node scripts/harness.mjs doctor`, `node scripts/harness.mjs verify --all` and all four hosted exact-PR-head jobs pass.
4. Evidence includes exact base/head, file diff, check statuses, existing review limitation and unchanged governance gates.

## DELIVERABLES / REVIEW FORMAT / STOP CONDITION
Versioned WO+lock before other edits; narrow docs correction PR; objective pt-BR scope audit + exact-head CI receipt; no checkpoint promotion, no unsafe merge. STOP and CORRECTION REQUIRED for false factual status, high-impact unexpected edits, red CI, missed stale claims or unresolved HIGH/CRITICAL. After verified merge, independently promoted checkpoint remains pending until actual required independent review.
