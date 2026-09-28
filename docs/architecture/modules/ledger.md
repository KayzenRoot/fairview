# Durable order-event ledger | module `ledger`

State: **PLANNED, NOT IMPLEMENTED**. Authority: proposed FV-DISC-001 modular map; separate admitted Work Order required to add source/tests.

Reserved source ownership: `src/ledger/`.
Harness ownership: `tests/ledger/`.
Dependency graph: `policy`.

## Responsibility and scope
Append-only intent/ack/fill/cancel/reject events with idempotency, attribution and startup reconciliation receipts; isolate from HIVE.

## Candidate existing technology to evaluate
PostgreSQL transactional event tables initially; formal outbox only if measured needs justify it.

## First activation proof / STOP
Crash between order send and acknowledgement must not create an uncontrolled duplicate.

### Design-time interface contract
Produce a typed input/output specification, ownership and failure-state table, fixture/provenance specification, numerical acceptance metrics if appropriate, upstream license/terms record, rollback/reconciliation requirements and one narrowly scoped WO before implementing. Default mode: documentation or deterministic offline research. No live credentials or orders, no trading implementation under this proposal.
