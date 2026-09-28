# CEX cross-venue and triangular strategies | module `strategy-cex`

State: **PLANNED, NOT IMPLEMENTED**. Authority: proposed FV-DISC-001 modular map; separate admitted Work Order required to add source/tests.

Reserved source ownership: `src/strategy-cex/`.
Harness ownership: `tests/strategy-cex/`.
Dependency graph: `cex`, `replay`, `portfolio`.

## Responsibility and scope
Two-exchange spot spread, partial-fill hedge simulation, optional triangular route based on executable depth and actual fees; basis/funding later.

## Candidate existing technology to evaluate
Hummingbot strategy architecture reference; CCXT fixtures; Rust strategy plug-ins remain ADR subject.

## First activation proof / STOP
All three legs costed; one-leg timeout triggers bounded recovery.

### Design-time interface contract
Produce a typed input/output specification, ownership and failure-state table, fixture/provenance specification, numerical acceptance metrics if appropriate, upstream license/terms record, rollback/reconciliation requirements and one narrowly scoped WO before implementing. Default mode: documentation or deterministic offline research. No live credentials or orders, no trading implementation under this proposal.
