# Balances, exposure and reconciliation | module `portfolio`

State: **PLANNED, NOT IMPLEMENTED**. Authority: proposed FV-DISC-001 modular map; separate admitted Work Order required to add source/tests.

Reserved source ownership: `src/portfolio/`.
Harness ownership: `tests/portfolio/`.
Dependency graph: `risk`, `ledger`.

## Responsibility and scope
Aggregate balances, margin, positions, multi-account allocation under explicit authority, collateral boundaries and external venue reconciliation.

## Candidate existing technology to evaluate
PostgreSQL snapshots + event ledger projections; decimal fixed-precision amount types.

## First activation proof / STOP
Deterministic mismatched-fill detection; fail closed on missing balance.

### Design-time interface contract
Produce a typed input/output specification, ownership and failure-state table, fixture/provenance specification, numerical acceptance metrics if appropriate, upstream license/terms record, rollback/reconciliation requirements and one narrowly scoped WO before implementing. Default mode: documentation or deterministic offline research. No live credentials or orders, no trading implementation under this proposal.
