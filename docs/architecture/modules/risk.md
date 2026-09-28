# Independent risk kernel | module `risk`

State: **PLANNED, NOT IMPLEMENTED**. Authority: proposed FV-DISC-001 modular map; separate admitted Work Order required to add source/tests.

Reserved source ownership: `src/risk/`.
Harness ownership: `tests/risk/`.
Dependency graph: `market-data`, `clock`, `policy`.

## Responsibility and scope
Pretrade notional, exposure, drawdown, stale feed, policy, circuit breakers and kill switch; cannot be overridden by AI/UI/strategy.

## Candidate existing technology to evaluate
Deterministic Rust module proposed after dedicated ADR; isolated deny-by-default fixtures.

## First activation proof / STOP
Negative tests prove rejection, recovery and immediate bounded halt.

### Design-time interface contract
Produce a typed input/output specification, ownership and failure-state table, fixture/provenance specification, numerical acceptance metrics if appropriate, upstream license/terms record, rollback/reconciliation requirements and one narrowly scoped WO before implementing. Default mode: documentation or deterministic offline research. No live credentials or orders, no trading implementation under this proposal.
