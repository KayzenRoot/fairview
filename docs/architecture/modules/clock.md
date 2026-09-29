# Time integrity and latency budgets | module `clock`

**ACTIVE SYNTHETIC FIXTURE CORE only via FV-CLOCK-001; no real capture or timestamp authority.** Reserved module ownership: `src/clock/` and `tests/clock/`. Actual source `src/clock/integrity.mjs` and real owned `tests/clock/integrity.test.mjs` implement exactly the invented time-quality and uncertainty slice authorized by FV-CLOCK-001. The original R2 `docs/architecture/CLOCK-MARKET-DATA-R2.md` and FV-ADR-002 remain **proposed future production design**, not adopted Rust/chrony/PTP infrastructure.

## What is implemented

Pure Node22 exports `assessSyntheticCapture`, `elapsedSyntheticInDomain` and `compareSyntheticSourceEvents`. Synthetic capture inputs must explicitly include `source_class: SYNTHETIC_FIXTURE`, `clock_domain_id`, `receive_epoch_id`, canonical lossless signed 64-bit decimal-string nanosecond local monotonic/wall values, nullable explicitly bounded `estimated_clock_error_ns` and `HEALTHY | DEGRADED | UNSYNCHRONIZED | UNKNOWN` state. All policy error/step bounds are supplied by the deterministic test fixture; no default timing SLA or actual clock capture.

- `assessSyntheticCapture`: rejects malformed or non-synthetic observations, unknown/unhealthy synchronization, missing clock error or error exceeding a fixture-specific bound. Only a **synthetic** healthy result reports the configured local budget as satisfied; it cannot attest a real host clock.
- `elapsedSyntheticInDomain`: checks **same monotonic domain AND same process/boot epoch**, rejects backwards monotonic value, backwards wall UTC, excessive wall/monotonic delta disagreement and unhealthy/unknown clock error. It returns a lossless decimal-string elapsed duration labeled `LOCAL_SYNTHETIC_SAME_DOMAIN_ONLY`; never subtracts cross-host or persisted opaque native `Instant` values.
- `compareSyntheticSourceEvents`: only identical exact contract IDs and synthetic `EVENT` timestamp semantics with explicit fictional source-UTC uncertainty, fictional provider clock error and evidence references. Order only strictly separated conservative UTC intervals; overlapping or touching intervals are `AMBIGUOUS_INTERVAL`. Provider error unknown/excessive, batched/sent event semantics or genuine venue-like input remain non-actionable.

Every result has `fixture_only: true`, `execution_authorized: false` and `remote_one_way_latency_proven: false` even for `HEALTHY` or synthetically `ORDERED`. No real broker/account/market data, network, filesystem, `Date.now`, real hardware capture or OS clock mutation is present in the source.

## Technology path and exact R2 trust boundary

A future **separately admitted** real `CaptureClock` must sample host monotonic and wall UTC with independently measured synchronization uncertainty and source-specific documented remote time semantics; serializing a native monotonic origin requires a new domain/epoch. Rust `Instant`/`SystemTime`, chrony and linuxptp are design candidates only, requiring actual host, hardware, permission and independently measured error before adoption. Displaying nanoseconds is NOT proof of submillisecond cross-host timing. Synthetic source classification is NOT sufficient for Risk Kernel or trading admission. Do not use this module to infer real one-way provider latency.

## Owned module tests and STOP

The executable harness includes hardcoded invented negative fixtures for unsafe JS numbers, i64 overflow and noncanonical strings, absent/invalid source evidence, same-ID different-epoch restart, cross-domain monotonic comparison, backwards/wall-step timing, unknown sync/error, excess local/provider budgets, batch/send semantics, mixed instrument contracts, overlapping uncertainty intervals and REAL_VENDOR denial. All results remain deeply non-executable. The old R2 documentary fixtures remain documented; market-data, risk, replay and integration are still PLANNED and report UNTESTED when impacted.

**STOP:** no installation or real-world capture, no account or venue permission, no provider source timestamp verification, no risk/trading/order gateway and no actual performance guarantee. Real market-data and clock calibration must each be scoped and tested under later independent WOs.
