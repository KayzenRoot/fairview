# DEX feasibility strategies | module `strategy-defi`

State: **PLANNED, NOT IMPLEMENTED**. Authority: proposed FV-DISC-001 modular map; separate admitted Work Order required to add source/tests.

Reserved source ownership: `src/strategy-defi/`.
Harness ownership: `tests/strategy-defi/`.
Dependency graph: `defi`, `replay`, `portfolio`.

## Responsibility and scope
Read-only CEX/DEX spread and Uniswap pool opportunity research with gas/MEV/reorg risk; atomic routing after separate audit only.

## Candidate existing technology to evaluate
Official Uniswap SDK and Hummingbot Gateway as evaluated reference options.

## First activation proof / STOP
No optimistic profit ignoring gas, sandwich exposure, revert or execution asymmetry.

### Design-time interface contract
Produce a typed input/output specification, ownership and failure-state table, fixture/provenance specification, numerical acceptance metrics if appropriate, upstream license/terms record, rollback/reconciliation requirements and one narrowly scoped WO before implementing. Default mode: documentation or deterministic offline research. No live credentials or orders, no trading implementation under this proposal.
