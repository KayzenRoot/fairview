# Authorized multi-feed market data | module `market-data`

State: **PLANNED, NOT IMPLEMENTED**. Authority: proposed FV-DISC-001 modular map; separate admitted Work Order required to add source/tests.

Reserved source ownership: `src/market-data/`.
Harness ownership: `tests/market-data/`.
Dependency graph: `clock`.

## Responsibility and scope
Normalize bid/ask/depth, tick size/precision, provider IDs, exchange sequence gaps, fast/slow feed pairs and trace capture; separate reference feed from executable venue.

## Candidate existing technology to evaluate
Native venue WebSocket/FIX where licensed; CCXT Pro research adapter for crypto; Arrow/Parquet candidate offline archival.

## First activation proof / STOP
Replay deterministic tick/LOB fixtures; reject stale, crossed invalid or missing fee/depth data.

### Design-time interface contract
Produce a typed input/output specification, ownership and failure-state table, fixture/provenance specification, numerical acceptance metrics if appropriate, upstream license/terms record, rollback/reconciliation requirements and one narrowly scoped WO before implementing. Default mode: documentation or deterministic offline research. No live credentials or orders, no trading implementation under this proposal.
