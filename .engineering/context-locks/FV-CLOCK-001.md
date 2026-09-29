# FV-CLOCK-001 | Exact-head single-module context lock

Accepted `main` base `a4fba7b5c2c91c730a50c45f934e3cdf16252680`. The future clock core is strictly SYNTHETIC_FIXTURE and clock-accounting only. No host clock, Docker, daemon, network, signed trading instructions, commercial source data, real provider calibration, actual risk-limit edit, Rust SDK adoption or external context dependency. One module's source `src/clock/integrity.mjs`, owned tests `tests/clock/integrity.test.mjs`, limited status/contract changes to `harness/modules.json`, `tests/bootstrap/impact.test.mjs`, `docs/architecture/modules/clock.md`, `docs/architecture/MODULE-READINESS-AND-IMPLEMENTATION-R10.md`, `docs/architecture/CLOCK-MARKET-DATA-R2.md`, and these two governance files are the only permitted paths.

Keep R2 and proposed ADR-002 evidence/limitations. Exact signed i64 decimal strings and BigInt internally; same-monotonic-domain and boot epoch for elapsed durations; local wall and remote UTC error bounds separate; unknown/nonhealthy sources fail closed, never assume actual provider clock precision or make an order signal. After the code/test commit require 4/4 exact-head CI, active clock test execution, scope/pin verification and truthful self-audit, no silent checkpoint promotion. Other dependent modules remain PLANNED, external trading controls unchanged.

## Scoped bootstrap fixture delta

Extra allowed path: `tests/bootstrap/evidence-contract.test.mjs` solely to substitute the stale planned-clock example with still-PLANNED market-data. Preserve actual Evidence Bundle implementation, denial of unknown/direct planned paths, truthful untested reverse dependents and CI. This is not a waiver of a failing test; rerun all exact-head jobs.
