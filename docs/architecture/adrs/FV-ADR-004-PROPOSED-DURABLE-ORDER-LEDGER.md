# FV-ADR-004 | Durable order ledger

**Status: PROPOSED_NOT_ADOPTED.** Initial ledger-of-record candidate: a dedicated FairView PostgreSQL financial ledger database. Scoped unique `intent_key` and immutable transaction-committed intent/admission/attempt events protect local at-most-once intent creation. Persist `MAY_HAVE_SENT` before the nontransactional broker call. A broker may act even if ACK is lost: unknown attempts freeze new exposure and require authoritative order/fill/position reconciliation; no blind retry. Unique broker fill IDs must be scoped according to provider contract.

PostgreSQL `ON CONFLICT` protects local duplicate inserts and WAL supports locally committed crash recovery. Neither provides distributed exactly-once trading. Source: https://www.postgresql.org/docs/18/sql-insert.html ; https://www.postgresql.org/docs/18/wal-intro.html .

**Rejected:** Redis as trading ledger; reusing unrelated engineering databases; automatic resend after lost ACK; treating a transaction/outbox as atomic with a venue. Later proof: duplicate racing local intents, crash between marker and send, lost ACK after simulated fill, restart and incomplete authoritative broker history. Requires an admitted WO and independent review.

**Foundation amendment D-009:** the accepted Git/Node22/pinned GEF foundation in protected main replaces previous host-service prerequisites. A future pure synthetic source Work Order requires its own admitted scope and actual nonempty deterministic tests; order-capable financial deployment still requires independent security review and exact provider legal rights.
