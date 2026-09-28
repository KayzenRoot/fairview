# CEX adapter pair | module `cex`

State: **PLANNED, NOT IMPLEMENTED**. Authority: proposed FV-DISC-001 modular map; separate admitted Work Order required to add source/tests.

Reserved source ownership: `src/cex/`.
Harness ownership: `tests/cex/`.
Dependency graph: `risk`, `market-data`, `clock`, `execution`.

## Responsibility and scope
Two venue-specific authenticated spot adapters, depth subscriptions, order tracking, time sync and fee schedules; trade permissions only much later.

## Candidate existing technology to evaluate
CCXT/CCXT Pro as reference or adapter candidate; native APIs for measurable critical hot paths.

## First activation proof / STOP
Mock exchange rate limits, partial fills, stale order book, withdrawal-disabled keys.

### Design-time interface contract
Produce a typed input/output specification, ownership and failure-state table, fixture/provenance specification, numerical acceptance metrics if appropriate, upstream license/terms record, rollback/reconciliation requirements and one narrowly scoped WO before implementing. Default mode: documentation or deterministic offline research. No live credentials or orders, no trading implementation under this proposal.
