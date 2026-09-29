# Portfolio, available balances and reconciliation | module `portfolio`

**PLANNED, NOT IMPLEMENTED.** FV-DISC-001 Round 8 extends original `portfolio`, reserved `src/portfolio/` and `tests/portfolio/`. Existing dependencies `risk`, `ledger` stay **unchanged**; additional reverse dependency could create a cycle and requires a separately audited integration contract and activation WO.

## Financial responsibility
Project immutable, exact-decimal, contract-aware **per-venue/per-account/per-asset** balances, positions, reserved inventory, fees/carry/funding and worst possible externally unknown fills. Reconcile against complete authenticated scoped external venue history and source-specific blockchain canonicality, including cursor watermark, timestamp/clock proof and chain finality. Never assume CEX A's assets fund B, infer no fill from lost ACK, call a pending transfer spendable or merge ticker-identical different contract assets. Reconciliation state `VALID | STALE | UNRECONCILED | DISCREPANCY_LOCKED` independently governs Risk Kernel view freshness.

## Proposed typed contracts
`BalancePositionObservationV0`, `ReconciliationCursorV0`, `InventoryReservationV0`, `ReconciliationDiscrepancyV0`, `PortfolioSnapshotV0`, `PortfolioRiskViewV0` with version/hash and restricted immutable evidence links. Defined in `docs/architecture/PORTFOLIO-OBSERVABILITY-R8.md` and proposed FV-ADR-015. Maintain a segregated audit reference to Ledger, never write simulated external fills into financial truth.

## Existing technology candidates
Separate product PostgreSQL for versioned local projections and scoped unique/atomic reservation transactions, local SERIALIZABLE conflict retry only (SQLSTATE 40001), optional asynchronous **dashboard-only** materialized views: https://www.postgresql.org/docs/18/transaction-iso.html ; https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html ; https://www.postgresql.org/docs/18/sql-refreshmaterializedview.html . No database is installed under this planning proposal.

## Future activated harness and STOP
Synthetic DUPLICATE_EXTERNAL_FILL, CONFLICTING_FILL_IDS, LOST_ACK_OPEN_POSITION, INCOMPLETE_HISTORY_CURSOR, BALANCE_POSITION_DRIFT, CROSS_ACCOUNT_FUNDS, PENDING_WITHDRAWAL, WRONG_ASSET_ISSUER, FX_CONVERSION_STALE, MISSING_FEE_OR_CARRY, RESERVATION_CONFLICT, SERIALIZATION_RETRY_SIDE_EFFECT, STALE_RISK_VIEW, REORGED_CHAIN_RECEIPT, KILL_PERSIST_AFTER_RESTART and PRIVATE_STREAM_GAP. **STOP** new risk-increasing orders when no complete reconciled and unexpired evidence-bound risk view; any hedge requires a separate permitted Risk Kernel admission and FV-FOUNDATION-002 FULL/independent review.