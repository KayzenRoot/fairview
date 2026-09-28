# Forex one-/two-leg multi-feed strategies | module `strategy-forex`

State: **PLANNED, NOT IMPLEMENTED**. Authority: proposed FV-DISC-001 modular map; separate admitted Work Order required to add source/tests.

Reserved source ownership: `src/strategy-forex/`.
Harness ownership: `tests/strategy-forex/`.
Dependency graph: `forex`, `replay`, `portfolio`.

## Responsibility and scope
Investigate authorized one-leg fast/slow gap, two-leg locked exposure hedge, multi-feed consensus, news suppression and copier-like allocation under permission.

## Candidate existing technology to evaluate
Typed Rust plugin or strategy-interface candidate after broker selection; deterministic replay first.

## First activation proof / STOP
No trade when stale, policy denied or executable net edge cannot be established.

### Design-time interface contract
Produce a typed input/output specification, ownership and failure-state table, fixture/provenance specification, numerical acceptance metrics if appropriate, upstream license/terms record, rollback/reconciliation requirements and one narrowly scoped WO before implementing. Default mode: documentation or deterministic offline research. No live credentials or orders, no trading implementation under this proposal.
