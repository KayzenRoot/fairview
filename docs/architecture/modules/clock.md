# Time integrity and latency budgets | module `clock`

**ACTIVE SYNTHETIC-ONLY CORE**, FV-CLOCK-001. No operating-system clock capture, time daemon, NTP/PTP, actual provider timestamps or financially actionable timing claims. Source owner: `src/clock/time.mjs`, real isolated test harness: `tests/clock/time.test.mjs`. Clock has no registry dependencies. The complete graph has 20 IDs with bootstrap, synthetic policy and synthetic clock ACTIVE; 17 remaining product modules are PLANNED.

## Implemented fictional timestamp contract
- `normalizeSyntheticClockSample` accepts only exactly schema-versioned `SYNTHETIC_FIXTURE` records: exact instrument contract, local `clock_domain_id` and `receive_epoch_id`, signed i64 decimal-string receive monotonic/wall UTC, optional claimed source UTC, unsigned u64 decimal-string local and source uncertainties, explicit `EVENT | BATCH | SEND | UNKNOWN` source semantics and sync state. Invalid/unsafe JS Numbers, malformed strings, missing/extra fields and untrusted throwing getters are denied.
- `elapsedWithinSyntheticDomain` computes an exact `BigInt` duration only when domain **and** process/boot epoch match. Backward monotonic, backward wall and cross-domain deltas are denied. A purely fictional same-domain elapsed interval is **not** real host performance.
- `compareSyntheticSourceEventOrder` uses only matching exact instrument, both `EVENT` semantics, `HEALTHY` sync and explicit bounded source/local error intervals. Distinctly separated conservative windows can return hypothetical BEFORE or AFTER; equal/touching/overlapping windows remain AMBIGUOUS. Unknown source UTC, unknown error, non-event semantics and unhealthy sync must DENY rather than infer cross-provider latency.
- All results are immutable, labeled `fixture_only:true`, `trading_authorized:false` and `remote_latency_claim_allowed:false`. `REAL_VENDOR` is unconditionally DENY because provider-clock attestation is NOT IMPLEMENTED.

## Research-only future capture interfaces and external technology
R2's proposed `CaptureClock.now_pair()`, `ProviderClockEvidence`, source time calibration, measured host error/drift and approved per-instrument budgets **remain unimplemented**, pending a separate, adopted ADR and a narrower source WO. Rust `Instant`/`SystemTime`, chrony tracking and linuxptp `ptp4l`/`phc2sys` are candidate future tools only. An actual broker source event time may be sampled, batched or absent; this mock cannot infer real one-way latency from printed nanoseconds.

Official research source: `docs/architecture/CLOCK-MARKET-DATA-R2.md` and proposed `docs/architecture/adrs/FV-ADR-002-PROPOSED-TIME-INTEGRITY.md`.

## Actual harness and STOP
`node --test tests/clock/*.test.mjs` exercises i64/u64 boundaries, no float coercion, optional source time, same-domain exact elapsed, restarted process/domain denial, backward wall/monotonic, overlapping event uncertainty, bad source semantics, unknown sync/calibration, mismatched instrument, throwing getters and actual host/network-call absence. Earlier R2 market-data gap, sampling, licensing and order-book obligations remain future `market-data` tests, not clock-unit test claims.

**STOP:** no actual host clock modification, vendor timestamp certification, production NTP/PTP, guaranteed remote latency, active quote execution or trading entitlement follows from this isolated fictional clock. Financial use requires validated real clock/provenance sources, explicit per-instrument limits, legally permitted feed/account, independent security/risk review and a separately admitted runtime integration WO.
