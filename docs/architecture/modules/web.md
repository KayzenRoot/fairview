# Browser control plane | module `web`

State: **PLANNED, NOT IMPLEMENTED**. Authority: proposed FV-DISC-001 modular map; separate admitted Work Order required to add source/tests.

Reserved source ownership: `src/web/`.
Harness ownership: `tests/web/`.
Dependency graph: `risk`, `portfolio`, `observability`, `ai`.

## Responsibility and scope
Venue health, opportunity lens, tick/gap/spread chart, news schedule, strategy controls, positions, risk breakers, backtest compare and incident dashboard.

## Candidate existing technology to evaluate
Next.js/React candidate UI; typed API and stream endpoints behind authentication.

## First activation proof / STOP
Disconnect has zero effect on risk kill switch and standalone execution runtime.

### Design-time interface contract
Produce a typed input/output specification, ownership and failure-state table, fixture/provenance specification, numerical acceptance metrics if appropriate, upstream license/terms record, rollback/reconciliation requirements and one narrowly scoped WO before implementing. Default mode: documentation or deterministic offline research. No live credentials or orders, no trading implementation under this proposal.
