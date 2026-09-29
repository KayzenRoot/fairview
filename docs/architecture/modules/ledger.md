# In-memory fictional event lifecycle | module `ledger`

**ACTIVE SYNTHETIC LIFECYCLE ONLY** on FV-LEDGER-001 scoped source branch. Owned `src/ledger/synthetic-lifecycle.mjs` and real `tests/ledger/synthetic-lifecycle.test.mjs`, dependency existing synthetic `policy`. All returned results: `fixture_only:true`, `durable:false`, `execution_authorized:false`. No real database, financial event, WAL, external broker/venue connection or live trading.

**Interface:** `beginSyntheticIntent` imports the accepted synthetic eligibility evaluator and accepts only invented PAPER grants. `appendSyntheticLedgerEvent` adds bounded frozen mock event facts. Invented MAY_HAVE_SENT precedes mock ACK/fill, duplicate or overfill is denied, cancel request is not confirmation, late contradictory fill is retained and locks discrepancy, timeout locks unknown outcome without resend. Complete matching fabricated reconciliation only marks the mock state and keeps the lock. `replaySyntheticLedgerEvents` is repeatable in-process fixture replay, **never** crash recovery.

**Adverse proof:** malformed/expired/real-provider policy, wrong scope/prototype/throwing getter, missing mandatory mock marker, duplicate event/execution ID, overfill/u64 overflow, out-of-order states, cancel/fill race, unknown remote-outcome simulation, incomplete/contradictory fake reconciliation, immutable bounded journals. In-process dedup never proves cross-process local uniqueness.

**Future PROPOSED_NOT_ADOPTED financial design:** separate PostgreSQL immutable scoped event/intent ledger, durable MAY_HAVE_SENT, transaction uniqueness, WAL, independent restart/backup recovery and actual authenticated broker order/fill/position reconciliation. See R3 and ADR-004. No invented fixture can replace data-provider rights or independently qualified financial-security review.

**STOP:** failed exact-head CI, unexpected scope/I/O, missing event provenance, a false durability/authorization claim or any attempted funded trading. D-007/D-008 and HIGH_ASSURANCE gates remain OPEN.
