# Uniswap and on-chain observation | module `defi`

State: **PLANNED, NOT IMPLEMENTED**. Authority: proposed FV-DISC-001 modular map; separate admitted Work Order required to add source/tests.

Reserved source ownership: `src/defi/`.
Harness ownership: `tests/defi/`.
Dependency graph: `risk`, `market-data`, `execution`, `policy`.

## Responsibility and scope
Select one chain/deployment and read-only supported pool; model gas, fees, price impact, chain reorg and liquidity; no signing in planning.

## Candidate existing technology to evaluate
Official Uniswap SDK v3/v4 according to deployed pool; viem/ethers candidates subject to review.

## First activation proof / STOP
Deterministic fork/simulation receipt, gas spikes and reorg fixtures before future signing.

### Design-time interface contract
Produce a typed input/output specification, ownership and failure-state table, fixture/provenance specification, numerical acceptance metrics if appropriate, upstream license/terms record, rollback/reconciliation requirements and one narrowly scoped WO before implementing. Default mode: documentation or deterministic offline research. No live credentials or orders, no trading implementation under this proposal.
