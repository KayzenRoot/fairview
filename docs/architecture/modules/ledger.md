# Durable order-event ledger | module `ledger`

**PLANNED, NOT IMPLEMENTED.** FV-DISC-001 Round 3. Reserved `src/ledger/`, `tests/ledger/`; dependency `policy`. Future product ledger storage is separate from developer tooling.

**Responsibility:** append-only scoped intent, admission, MAY_HAVE_SENT attempt, acknowledgment, execution, cancellation and reconciliation receipts. Local at-most-once intent under scoped PostgreSQL uniqueness is not broker exactly-once. On unknown external outcome, block auto resend and demand authenticated order/fill/position proof.

**Technology candidate:** PostgreSQL transactions, unique indexes, WAL and possible future transaction outbox. Official sources: https://www.postgresql.org/docs/18/sql-insert.html ; https://www.postgresql.org/docs/18/wal-intro.html .

**Future harness:** DUPLICATE_INTENT, CRASH_BEFORE_TRANSMIT, LOST_ACK_AFTER_FILL, DUPLICATE_FILL_EVENT, SESSION_GAP and independent backup/restore tests. **STOP** at any unknown remote effect, missing licence, release gate or independent review. Design contract in `docs/architecture/LEDGER-RISK-EXECUTION-R3.md`.