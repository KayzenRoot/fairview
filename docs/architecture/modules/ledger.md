# Order-event ledger | module `ledger`

**ACTIVE SYNTHETIC IN-MEMORY REDUCER ONLY, NOT AN EXTERNAL FINANCIAL LEDGER.** FV-LEDGER-001 admits a small pure Node22 fictional event/state model at `src/ledger/simulation.mjs` with real deterministic `tests/ledger/simulation.test.mjs`. The only direct upstream graph dependency is the already-active **synthetic** `policy` evaluator. No database, broker API, order transmission, external trusted receipts, persistence or wallet is installed.

## Actual narrow contract

`createSyntheticLedger` accepts an exact fictional `OrderIntentV0`, explicit finite canonical integer order units, immutable account/venue/tenant/instrument/intent identity and an independently evaluated invented policy request. Only complete synthetic DEMO/PAPER classifications initialize a fixture. Even an accepted result is **never an execution permit**: `fixture_only=true`, `persisted=false`, `execution_authorized=false`, `blocked_new_exposure=true`.

`appendSyntheticLedgerEvent` is an immutable deterministic local reducer. It records unique sequenced invented event IDs and at most one `MAY_HAVE_SENT` marker, then fictional ACK, partial/complete fill, cancel-requested, cancel-confirmed, lost ACK/crash and an explicit scoped fictional reconciliation receipt. It rejects malformed or real-vendor input, gaps, duplicate conflicts and reused execution IDs. Identical duplicate event bytes are ignored. Fill evidence arriving during cancellation remains counted. A lost ACK or crash becomes `UNKNOWN_NEEDS_RECONCILIATION`; late ACK or cancellation message **cannot** resolve it. Incomplete or contradictory simulated history becomes `DISCREPANCY_LOCKED`. Only complete, matching *invented* reconciliation can clear a *simulated* unknown; this is **not** a real venue or independent financial proof.

The result and nested output collections are frozen for safe fixture replay. No cross-process local uniqueness, ACID transaction, WAL/fsync, authenticated venue ID, actual replay clock or recovery drill is claimed. Neither source code nor tests issue a network call or connect to real financial infrastructure.

## Deferred high-assurance ledger

Proposed FV-ADR-004 remains `PROPOSED_NOT_ADOPTED` for PostgreSQL financial persistence, scoped local uniqueness, durable pre-send marker and separately authenticated broker reconciliation. Candidate official PostgreSQL references: https://www.postgresql.org/docs/18/sql-insert.html and https://www.postgresql.org/docs/18/wal-intro.html . Genuine unknown order outcomes must freeze new exposure and require complete independently authenticated order/fill/position evidence; no blind resend or claim of exactly-once external execution. Before any real account integration: selected lawful provider rights, dedicated financial data store, independent risk admission, crash/restart and backup/restore exercises, private deployment and qualified external security review.

**STOP:** no broker order, funded account, real-data import, actual durable order record, production claim or silent change to the other 19 graph nodes under this narrow synthetic WO.
