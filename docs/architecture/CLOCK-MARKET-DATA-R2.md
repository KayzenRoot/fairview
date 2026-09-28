# FV-DISC-001 | Round 2: clock integrity and authorized market-data contracts

**Status: PLANNING ONLY.** Neither clock nor market-data is implemented. The product remains under the FV-BOOT-001 isolated HIVE FULL blocker, canonical checkpoint is unchanged, official HIVE v1.0.3 stays pinned, and no Forex venue/feed permissions were granted by Round 1. This proposal is **not** a latency benchmark, real account connection, data-vendor agreement or executable trading design admission.

**Design goal:** compare permitted fast/reference and executable quotes without inventing time precision, source entitlement, available liquidity or actual order profitability. This contract is upstream of every planned Forex, CEX, DeFi, risk, replay and execution module. Every signal and replay frame must preserve the distinction between data observation and legally executable prices.

## 1. Time is three different observations

| Time field (design) | Source and domain | Use and prohibition |
|---|---|---|
| `source_event_utc_ns` | Optional UTC timestamp supplied by the data venue, only when provider meaning and precision are documented | Event-time reconstruction within the SAME source contract; never fabricate by copying local receipt time. A source can transmit batches or sampled quotes, so event time may refer to a different event. |
| `local_receive_monotonic_ns` + `clock_domain_id` | Application-captured monotonic reading on receipt, scoped to the capture process/boot and clock implementation | Local elapsed durations against other samples from exactly the same clock domain; do not subtract Rust `Instant` values across machines, processes, restarts or log files. A monotonic-origin relative counter needs a documented epoch/reference if serialized. |
| `local_receive_wall_utc_ns` + `estimated_clock_error_ns` + `sync_state` | Application UTC wall observation paired as closely as practical with monotonic capture, with measured/estimated local synchronization uncertainty | UTC correlation when clock health is known. A stepped-back/forward wall clock invalidates absolute-time inferences; unknown or unbounded clock error blocks cross-source event-time ordering. |

`source_event_utc_ns` may be `null`; missing source time is NOT the same as zero latency. For a source where event-time ordering is required, missing source timestamp means not eligible to trade. `local_receive_monotonic_ns` and UTC time MUST be represented as signed 64-bit nanosecond values in the proposed native contract; when crossing JavaScript/JSON use decimal strings or an explicitly lossless encoding to prevent the IEEE-754 53-bit precision trap. Price/quantity use a declared exact decimal scale; no float-only financial serialization.

### Timestamp quality and ordering rules
- Store local receive monotonic/wall timestamp pair and uncertainty even when a provider event timestamp is absent.
- Never calculate one-way provider-to-local network latency from cross-host UTC subtraction unless the two clock error bounds and provider timestamp semantics are known. Clock offset uncertainty MUST be propagated; no hypothetical sub-millisecond precision from just displaying nanoseconds.
- Capture and label `clock_domain_id` using process/boot/synchronization epoch. After application restart or clock-domain change, same-domain monotonic differences cannot continue across the boundary.
- Local wall time may jump because `SystemTime` is not monotonic; detect or mark `BACKWARD_WALL` and fail closed for UTC event ordering until the clock is healthy.
- Local elapsed timing may use Rust `Instant`, whose platform underlying clock is opaque. Prefer `checked_duration_since` for negative-case detection, not an assumption that any host sleep/VM/migration semantics or `Instant` persistence are portable.
- Even a precise, healthy local clock does NOT establish remote feed clock quality. Each provider needs independent timestamp semantics and error evidence; otherwise `UNKNOWN_CLOCK`.
- Cross-source ordering is valid only when compatible event semantics, instrument contract, source timestamp calibration and non-overlapping uncertainty intervals are demonstrated; if intervals overlap ambiguously, `CROSS_DOMAIN` blocks actionability.

## 2. Candidate clock stack with observed capabilities, not performance promises

| Candidate | Research deployment | Verified property | Why not default everywhere |
|---|---|---|---|
| Rust `Instant` + `SystemTime` | Cross-platform proposed application capture | `Instant` offers a monotonic nondecreasing duration source; `SystemTime` is non-monotonic wall time and can step; on Windows `Instant` is backed by QueryPerformanceCounter | No built-in proof of provider clocks or cross-host UTC accuracy. Windows development != colocated production feed latency. |
| chrony NTP `tracking` | Optional licensed Linux research host with NTP | Tracks system-clock correction, root delay, root dispersion and estimated distance/errors; estimates must be sampled and bounded | NTP quality depends on network/path, server, host privileges and measured output; do not assert a microsecond SLA from installation. |
| linuxptp `ptp4l` + `phc2sys` | Optional Linux production-hardware evaluation, after separate host approval | `ptp4l` can use NIC hardware timestamping/PHC; `phc2sys` can align PHC and system clock, with explicit PTP vs UTC offset handling | Requires suitable NIC/driver/network PTP grandmaster, access rights, UTC offset handling and separate measured error; not installed on Windows or generic Docker by this WO. |

Primary official sources: https://doc.rust-lang.org/std/time/struct.Instant.html ; https://doc.rust-lang.org/std/time/struct.SystemTime.html ; https://chrony-project.org/faq.html ; https://www.linuxptp.org/documentation/ptp4l/ ; https://www.linuxptp.org/documentation/phc2sys/ .

Hardware timestamping is a **future measured option** if software receive timestamps or transport jitter fail a defined instrument-specific service-level objective. PTP/NTP daemon installation, changing host clocks and NIC settings are expressly OUT OF SCOPE for this PR.

## 3. Proposed normalized quote envelope v0 (design, not code)

```text
NormalizedQuoteV0 {
 schema_version: 0
 quote_id: nonempty stable source-event identity (or explicitly synthesized replay identity)
 provider_id: licensed source identifier
 feed_id: per contractual feed/connection identifier
 venue_id: optional executable venue identity (not inferred from provider_id)
 instrument_contract_id: exact instrument/asset/settlement/CFD-vs-spot identity
 bid: fixed_decimal?; ask: fixed_decimal?; price_scale: required when price is present
 bid_size: fixed_decimal?; ask_size: fixed_decimal?; quantity_scale: required when size is present
 book_depth_level: integer?; quote_kind: EXECUTABLE | INDICATIVE | SNAPSHOT | HISTORICAL | UNKNOWN
 source_event_utc_ns: signed_int64?; source_timestamp_semantics: EVENT | BATCH | SEND | UNKNOWN
 source_event_uncertainty_ns: uint64?; provider_sequence: opaque?; source_sequence_epoch: opaque?
 local_receive_monotonic_ns: monotonic_ticks with documented conversion; clock_domain_id: nonempty
 local_receive_wall_utc_ns: signed_int64
 estimated_clock_error_ns: uint64?; sync_state: HEALTHY | DEGRADED | UNSYNCHRONIZED | UNKNOWN
 transport_kind: REST | WEBSOCKET | FIX | ITCH | REPLAY | OTHER
 rate_limit_and_throttle_status: NORMAL | SAMPLED | THROTTLED | UNKNOWN
 provenance_ref: private evidence reference (hash + source document/version + capture entitlement)
 data_usage_scope: INTERNAL | DISPLAY | RESEARCH | REDISTRIBUTION | UNKNOWN (must be licence-backed)
 source_payload_digest: hash? (only if retention/use are permitted)
 receive_epoch_id: process/boot id; frame_quality_codes: set of reason strings
}
```

Zero or missing `bid_size`/`ask_size` does not imply infinite liquidity. Top-of-book is not depth; REST sampled price streams are not raw tick feeds. Executable quote semantics and permissions require the exact account and venue contract. The `data_usage_scope` enum describes a *granted* scope, not a toggle that creates a licence.

### Proposed quality decision
`RESEARCH_RECORD_ONLY`: retain only if contractual storage permits it, use for permitted replay without issuing orders. `OBSERVABLE_NON_ACTIONABLE`: render non-sensitive metadata or private diagnostic state; not a signal. `ELIGIBLE_FOR_FURTHER_RISK_EVALUATION`: ONLY when current venue-specific quote is genuinely executable under a separately approved policy, instrument contract is identical/convertible under explicit model, bid/ask/size/fee input known, local clock quality and source event-time requirements met, feed and sequence healthy and current within an approved budget. This last state is NOT an order authorization and still needs strategy/execution/risk admission.

No global numeric staleness, clock-error, p95 or min-book-size threshold is approved without a specific vendor/instrument/host benchmark and signed Risk Kernel policy. Source-side streaming cadence is a hard observational constraint: OANDA's documented stream produces **at most four prices/s/instrument**, so `THROTTLED_FEED`/sampled quote status cannot be relabeled tick-complete or used to claim a sub-250ms advantage. Source: https://developer.oanda.com/rest-live-v20/pricing-ep/ .

## 4. Bitemporal replay and archival proposal

`source_event_utc_ns` (what venue claims) and `local_receive_wall_utc_ns` with `local_receive_monotonic_ns` (what our capture witnessed) must both survive replay, including an explicit missing-source-time case. Preserve source/connection ID and sequence epoch to distinguish duplicates from expected sequence reset. Deterministic capture must record loss gaps as separate events, not silently stitch a perfect-looking series.

**Hot path:** typed bounded in-process messages with captured monotonic reception; no synchronous archive write, Python bridge, Arrow conversion or hosted dashboard call in the critical quote-to-risk path until actual bounded benchmarks justify that choice. **Offline research:** Apache Arrow in-memory columnar batches and Parquet archive candidates for efficiently replaying lawfully retained ticks; separate asynchronous bounded capture with explicit overflow event and hashes; if backlog overflows, record `CAPTURE_OVERFLOW` and prevent incomplete traces from being called full-tick recordings. Do not dump raw paid-feed ticks in GitHub Actions, HIVE, chat, a public dashboard or a PDF. Storage retention, encryption and derived-data rights are provider- and account-specific, still OPEN.

Official format docs: https://github.com/apache/arrow/blob/main/docs/source/format/Columnar.rst ; https://arrow.apache.org/docs/python/parquet.html .

## 5. Deterministic negative fixture matrix (next activated module)

| Synthetic scenario ID | Setup | Expected non-actionable outcome |
|---|---|---|
| UNKNOWN_CLOCK | Event UTC provided, but no bounded source or local offset/error | Do not rank sources by event UTC for trading |
| CROSS_DOMAIN | Two monotonic readings captured by different hosts or process epochs | Do not subtract to derive end-to-end one-way latency |
| BACKWARD_WALL | Local UTC jumps backwards while monotonic receive clock progresses | Quarantine UTC ordering and reset clock health epoch |
| SEQUENCE_GAP | Missing incremental order-book sequence or unknown provider reset | Invalidate book-derived executable edge until verified fresh snapshot |
| THROTTLED_FEED | OANDA-like sampled snapshots rather than full underlying ticks | Retain sampled metadata; do not claim raw tick completeness or a high-frequency reference edge |
| LICENCE_UNKNOWN | Retention or redistribution entitlement absent | No archive/export/public analytics of raw or derived paid-source prices |
| BOOK_UNAVAILABLE | Bid/ask exists but executable size, book depth needed by strategy or fees missing | No actionable net-edge calculation |
| VENUE_QUOTE_INDICATIVE | Price is an indicative reference feed, not an authorized order venue quote | Never submit venue order based on reference-only executability |
| INSTRUMENT_MISMATCH | Spot currency pair vs a CFD, different lot/settlement or denomination | No spread comparison until explicit instrument/FX/carry conversion is proved |
| STALE_FEED | Quote exceeds a venue-specific approved freshness budget | Reject signal and mark relevant feed DEGRADED |
| OUT_OF_ORDER_DUPLICATE | Duplicate event or lower sequence within same sequence epoch | Idempotently flag/drop from live book; preserve licensed diagnostic trace |
| CAPTURE_OVERFLOW | Offline writer backlog overruns bounded capture queue | Mark trace incomplete, disallow full-tick replay benchmark claims |

The expected fixture outcomes are *design obligations*, NOT existing runtime tests. Hosted bootstrap tests may assert documentation/registry invariants only; real behavior waits for per-module implementation WOs and synthetic test fixtures. Never infer a passing strategy or low latency from these document tests.

## 6. Acceptance and handoff to Round 3

Clock activation requires a separate admitted WO with a pure simulated clock (wall jump, drift, clock-domain mismatch), explicit error-bound source, no host time mutation in CI and a no-cross-domain elapsed test. Market-data activation requires separately entitled demo/fixture sources, normalized fixed-decimal envelope, snapshot/sequence recovery, throttled/duplicate/out-of-order fixtures, lossless timestamp transfer and no public price artefacts. Test impact should propagate clock => market-data => risk => execution/integration, while *this planning PR* leaves 20 registered modules with only bootstrap ACTIVE. Advance to real Forex adapter only after the named broker and reference-feed policy decisions, FV-BOOT-001 FULL and independent reviews.

**STOP CONDITION:** this round ends at documentation and planning-harness validation. No source runtime, broker connection, daemon installation, HIVE FULL claim, funded order or checkpoint promotion.