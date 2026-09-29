# Time integrity and latency budgets | module `clock`

**PLANNED, NOT IMPLEMENTED.** FV-DISC-001 Round 2 planning; no clock daemon change, PTP installation or active runtime. Source reservation: `src/clock/`; harness reservation: `tests/clock/`; no upstream module dependency.

## Single responsibility
Provide local monotonic timing with a strict clock-domain/boot boundary, wall-UTC capture with measured local error, optional provider event-UTC provenance and source-specific clock uncertainty, cross-domain ordering status and an explicit sync-health decision. `Instant` measures local elapsed time; `SystemTime` can step and is not suitable for unchecked latency deltas. Providers' timestamp accuracy cannot be inferred from ours.

## Proposed interfaces
- `CaptureClock.now_pair()`: returns local receive monotonic and wall UTC values sampled closely with a `clock_domain_id`, `sync_state` and `estimated_clock_error_ns` or explicit UNKNOWN.
- `ProviderClockEvidence`: timestamp semantics, provider claimed precision, independently confirmed sync/error bound if available, source doc reference and expiry. Absent evidence remains UNKNOWN.
- `ClockQualityPolicy.evaluate()`: `HEALTHY | DEGRADED | UNSYNCHRONIZED | UNKNOWN`; uncertainty > instrument-approved bound, backward wall step or domain mismatch cannot pass as a known cross-host ordering.
- `DurationInDomain`: returns elapsed nanoseconds only for the same monotonic domain, otherwise `CROSS_DOMAIN`. After restart issue a new domain; do not join persisted `Instant` values.

## Technology ADR candidates
Rust `Instant`/`SystemTime` for future native app capture, optional chrony tracking for approved Linux NTP infrastructure, linuxptp `ptp4l`+`phc2sys` only if NIC PHC, driver, network grandmaster and measured requirement justify it. No guarantee from nanosecond precision display, PTP package install or virtualized Windows host. Research and official references in `docs/architecture/CLOCK-MARKET-DATA-R2.md` and `docs/architecture/adrs/FV-ADR-002-PROPOSED-TIME-INTEGRITY.md`.

## Activated harness design, not current tests
Simulated `UNKNOWN_CLOCK`, `CROSS_DOMAIN`, `BACKWARD_WALL`, `STALE_FEED`, restarted process epoch and changed `sync_state`. Must fail closed without relying on the real CI runner clock. Record clock health provenance and thresholds in instrument-specific Risk Kernel policy.

**STOP:** without source-specific clock and applicable error budget, no one-way cross-provider latency or actionable low-latency signal may be claimed. Remain PLANNED until separate admitted activation WO, FV-FOUNDATION-002 independent FULL gate and exact-head tests.