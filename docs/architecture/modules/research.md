# Opportunity and benchmark laboratory | module `research`

State: **PLANNED, NOT IMPLEMENTED**. Authority: proposed FV-DISC-001 modular map; separate admitted Work Order required to add source/tests.

Reserved source ownership: `src/research/`.
Harness ownership: `tests/research/`.
Dependency graph: `market-data`, `replay`.

## Responsibility and scope
Matched-feed and matched-hardware benchmark, latency distributions, post-trade attribution and robust slippage/fee/carry/gas accounting.

## Candidate existing technology to evaluate
Python/Pandas/Arrow candidate analytics; LEAN, NautilusTrader and Hummingbot benchmark/reference evaluation.

## First activation proof / STOP
p50/p95/p99 and net-edge counterfactual measured; no marketing-only profit claims.

### Design-time interface contract
Produce a typed input/output specification, ownership and failure-state table, fixture/provenance specification, numerical acceptance metrics if appropriate, upstream license/terms record, rollback/reconciliation requirements and one narrowly scoped WO before implementing. Default mode: documentation or deterministic offline research. No live credentials or orders, no trading implementation under this proposal.
