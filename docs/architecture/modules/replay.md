# Replay, paper and failure injection | module `replay`

State: **PLANNED, NOT IMPLEMENTED**. Authority: proposed FV-DISC-001 modular map; separate admitted Work Order required to add source/tests.

Reserved source ownership: `src/replay/`.
Harness ownership: `tests/replay/`.
Dependency graph: `market-data`, `clock`, `execution`, `ledger`, `risk`.

## Responsibility and scope
Same typed events and strategy contracts across deterministic offline replay and paper experiments; full cost/slippage model and adverse scenarios.

## Candidate existing technology to evaluate
NautilusTrader/LEAN evaluated as research comparators, not silently grafted into execution; local fixture engine proposal.

## First activation proof / STOP
Reproducible run IDs; identical input trace and config reproduce opportunity and rejected intent.

### Design-time interface contract
Produce a typed input/output specification, ownership and failure-state table, fixture/provenance specification, numerical acceptance metrics if appropriate, upstream license/terms record, rollback/reconciliation requirements and one narrowly scoped WO before implementing. Default mode: documentation or deterministic offline research. No live credentials or orders, no trading implementation under this proposal.
