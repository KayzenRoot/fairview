# Order router and hedge recovery | module `execution`

**PLANNED, NOT IMPLEMENTED.** FV-DISC-001 Round 3. Reserved `src/execution/`, `tests/execution/`; existing dependencies `risk`, `market-data`, `clock`, `ledger`.

**Responsibility:** route only durably persisted, fresh independently admitted intents to later licensed venue adapters; track every ACK, partial fill, fill, rejection, cancellation and unknown state. Maintain per-leg two-leg exposure, prohibit blind retry after MAY_HAVE_SENT, reconcile authenticated venue fills and portfolio and require new bounded risk admission before any permitted hedge. A cancel request is not a canceled-confirmed state.

**Technology candidate:** Rust/Tokio bounded channels and separately managed kill priority, with PostgreSQL Ledger and off-hot-path private OpenTelemetry. Sources: https://tokio.rs/tokio/tutorial/channels ; https://opentelemetry.io/docs/concepts/signals/ .

**Future harness:** LOST_ACK_AFTER_FILL, CANCEL_RACE_FILL, PARTIAL_A_UNKNOWN_B, REJECTED_HEDGE, SESSION_GAP, QUEUE_BACKPRESSURE. **STOP** on uncertain venue state, missing entitlement or kill. Design contract in `docs/architecture/LEDGER-RISK-EXECUTION-R3.md`.