# Forex venue and feed adapters | module `forex`

State: **PLANNED, NOT IMPLEMENTED**. Authority: proposed FV-DISC-001 modular map; separate admitted Work Order required to add source/tests.

Reserved source ownership: `src/forex/`.
Harness ownership: `tests/forex/`.
Dependency graph: `risk`, `market-data`, `clock`, `execution`.

## Responsibility and scope
One authorized programmatic execution venue plus eligible reference feed; FIX or documented REST/WebSocket bridge; no direct terminal injection or disguise.

## Candidate existing technology to evaluate
QuickFIX C++ evaluated if the selected venue permits FIX; cTrader Open API and official MetaTrader APIs only after permissions review.

## First activation proof / STOP
Contract tests cover session reset, quotes, reject/last-look states and broker policy.

### Design-time interface contract
Produce a typed input/output specification, ownership and failure-state table, fixture/provenance specification, numerical acceptance metrics if appropriate, upstream license/terms record, rollback/reconciliation requirements and one narrowly scoped WO before implementing. Default mode: documentation or deterministic offline research. No live credentials or orders, no trading implementation under this proposal.
