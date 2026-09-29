# Independent risk kernel | module `risk`

**PLANNED, NOT IMPLEMENTED.** FV-DISC-001 Round 3. Reserved `src/risk/`, `tests/risk/`; existing dependencies `market-data`, `clock`, `policy`.

**Responsibility:** deterministic bounded admission for each proposed and recovery intent. Check entitlement, fresh execution quote, clock/sequence health, reconciled cash/collateral, known and unknown possible fills, exact exposure, fee/slippage and all limits. Persistent scoped kill/revocation must survive crashes and ignore AI, web and strategy bypass attempts. Emergency unwind is a separately licensed and bounded risk decision.

**Technology candidate:** pure Rust fixed-decimal core, optional bounded Tokio I/O after a specific ADR: https://tokio.rs/tokio/tutorial/channels .

**Future harness:** STALE_FEED, MISSING_PORTFOLIO, PARTIAL_A_UNKNOWN_B, KILL_SWITCH_PERSIST, CLOCK_EPOCH_CHANGE, UNLICENSED_RECOVERY. **STOP** if evidence is missing or risk service unavailable. Design contract in `docs/architecture/LEDGER-RISK-EXECUTION-R3.md`.