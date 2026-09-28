# FV-ADR-019 | Canonical dependency-gated module admission sequence

**Status: PROPOSED_NOT_ADOPTED.** FV-DISC-001 Round 10 docs only. A planning dependency wave is not an admitted implementation WO, independent reviewer signoff or checkpoint promotion.

## Proposed decision
Use the **unchanged** `harness/modules.json` as the authoritative registered module identities, exact `depends_on` and reserved source/test owners. At the exact Round-9 baseline the registry has **20 modules**, `bootstrap` sole ACTIVE and **19 product modules PLANNED**, each with empty registered product tests/no owned product source. FV-BOOT-001 host FULL and independent exact-head technical review are mandatory external gates before any product-source WO, even though HIVE is strictly engineering context and not a live runtime dependency.

After the external gate, a future reviewer may admit ONE narrow module at a time only after direct registered dependencies are truly ACTIVE, governing ADR accepted and per-module nonempty deterministic negative fixtures and source/cost/licensing obligations are documented. Exact minimal topological waves of the CURRENT DAG:
- Wave 0: existing `bootstrap`, host HIVE FULL + independent reviewer acceptance still OPEN.
- Wave 1: `policy`, `clock`.
- Wave 2: `market-data`, `ledger`.
- Wave 3: `risk`.
- Wave 4: `execution`, `portfolio`.
- Wave 5: `forex`, `cex`, `defi`, `replay`, `observability`.
- Wave 6: `research`, `strategy-forex`, `strategy-cex`, `strategy-defi`.
- Wave 7: `ai`.
- Wave 8: `web`.
- Wave 9: `integration`.

Same-wave WOs may be separately developed once every dependency is ACTIVE; wave order does not grant batch activation or force unrelated source work. `replay` depends on admitted `execution` in the current graph even though early modules may use *their own* mock fixtures. `web` depends on `ai` even for a read-only view. These are recorded graph facts. Early independent UI/replay product activation requires separately reviewed and accepted graph/ADR change and impact tests, NOT a hidden waiver. `integration` depends on all 18 other planned product modules, so global integration ACTIVE comes last; module-owned seam tests must be implemented early under each separately admitted module harness.

## External governance and STOP
Per canonical `.engineering/SOURCE-HIERARCHY.md`, independently audited promoted exact-head checkpoints outrank proposed PR planning. Existing `.engineering/BACKLOG.md` says do not advance from failed/unreviewed work. `.engineering/SCOPE.md` lists actual selected venue/pool and paper/live work as later WOs. `.engineering/DEFINITION-OF-DONE.md` bars bootstrap green-CI interpretation as production. All current R1-R9 technology choices, rights and ADRs remain proposals, and D-007 provider choices/security reviewer remain OPEN. D-008 permits PUBLIC non-secret development but requires verified PRIVATE visibility and HIGH_ASSURANCE acceptance before financially funded deployment; no tracked `.env` under any visibility.

Reject setting a module ACTIVE based on documentary tests, creating real source before an approved owner harness/WO, bypassing failed HIVE host review, silently changing the dependency graph to accelerate UI/replay, and benchmarking vendor marketing as observed own performance. No change to registry or official pin is made by this proposal.