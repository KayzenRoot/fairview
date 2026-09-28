# Time integrity and latency budgets | module `clock`

State: **PLANNED, NOT IMPLEMENTED**. Authority: proposed FV-DISC-001 modular map; separate admitted Work Order required to add source/tests.

Reserved source ownership: `src/clock/`.
Harness ownership: `tests/clock/`.
Dependency graph: independent planning boundary.

## Responsibility and scope
Monotonic local timing, UTC provenance, offset/uncertainty per feed, venue timestamps, packet event/receive time, out-of-order and skew detection.

## Candidate existing technology to evaluate
Rust std::time; chrony/PTP only when hardware/deployment supports them; OpenTelemetry spans for non-critical async tracing.

## First activation proof / STOP
Synthetic skew/drift and time reordering cause stale/opportunity rejection.

### Design-time interface contract
Produce a typed input/output specification, ownership and failure-state table, fixture/provenance specification, numerical acceptance metrics if appropriate, upstream license/terms record, rollback/reconciliation requirements and one narrowly scoped WO before implementing. Default mode: documentation or deterministic offline research. No live credentials or orders, no trading implementation under this proposal.
