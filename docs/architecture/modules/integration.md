# Cross-module contracts and release proofs | module `integration`

State: **PLANNED, NOT IMPLEMENTED**. Authority: proposed FV-DISC-001 modular map; separate admitted Work Order required to add source/tests.

Reserved source ownership: `src/contracts/`.
Harness ownership: `tests/integration/`.
Dependency graph: `risk`, `forex`, `cex`, `defi`, `ai`, `web`, `policy`, `clock`, `market-data`, `ledger`, `execution`, `portfolio`, `replay`, `research`, `strategy-forex`, `strategy-cex`, `strategy-defi`, `observability`.

## Responsibility and scope
Typed event schema, simulated cross-venue failure injections, whole-pipeline replay, audit, gated paper rollout and independent review.

## Candidate existing technology to evaluate
Contract-test harness and exact source fingerprint; no production keys in CI.

## First activation proof / STOP
Full suites, independent assurance and FV-BOOT-001 completion before activation.

### Design-time interface contract
Produce a typed input/output specification, ownership and failure-state table, fixture/provenance specification, numerical acceptance metrics if appropriate, upstream license/terms record, rollback/reconciliation requirements and one narrowly scoped WO before implementing. Default mode: documentation or deterministic offline research. No live credentials or orders, no trading implementation under this proposal.
