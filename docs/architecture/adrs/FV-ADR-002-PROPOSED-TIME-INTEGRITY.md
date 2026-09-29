# FV-ADR-002 | Time integrity, monotonic domains and optional synchronization

**Status: PROPOSED_NOT_ADOPTED.** Research-only architectural decision under FV-DISC-001 Round 2; neither OS clock configuration nor source activation is approved.

## Context
Fairview needs to distinguish a provider's possibly absent or batched event timestamp from the moment our application receives a quote. Apparent cross-feed advantage is uninterpretable when clock uncertainty, provider event-time meaning, clock steps or monotonic-domain boundaries are unknown. Fairview's initial development host is not proof of PTP hardware or sub-millisecond cross-host accuracy.

## Proposal
Use Rust `Instant` for same-domain local elapsed durations and `SystemTime` for a separately observed, health-checked UTC wall reference. Serialise `local_receive_monotonic_ns` only together with an explicit `clock_domain_id` and process/boot reference; never treat it as a globally comparable UTC value. Use explicit optional `source_event_utc_ns` plus provider timestamp semantics. Carry local and, only where justified, remote UTC uncertainty bounds with each quote. Unknown bounds, clock step or mismatched domains make apparent cross-feed timing non-actionable and require synthetic negative tests. A monotonic origin at process start does NOT make different process domains directly comparable.

Propose chrony as an optional NTP sync/health-observation candidate on permitted Linux research hosts. If measured need and infrastructure justify it, evaluate linuxptp `ptp4l` plus `phc2sys` with hardware timestamps, NIC PHC and a known network grandmaster. PTP vs UTC timescale offset must be managed, not assumed equal. Neither technology is installed by this proposal; Windows developer host is not assumed to offer PTP hardware.

## Evaluated alternatives
1. Wall clock for every latency measurement: rejected because system UTC may jump and durations can become negative.
2. Pure monotonic clock with no UTC and provenance: rejected because it cannot validate provider timestamp or relate cross-host capture.
3. Unconditional PTP hardware/colocation purchase: deferred pending actual broker/feed contract, transport, available NIC/PHC and measured NTP error.
4. Client-side JavaScript `Date` millisecond timestamp for market events: rejected for critical capture precision and safe i64 nanosecond transfer.

## Source verification and limitations
- Rust documentation distinguishes non-monotonic `SystemTime` and opaque `Instant`, and warns about rare monotonic bugs, suspend and OS-specific behavior: https://doc.rust-lang.org/std/time/struct/Instant.html ; https://doc.rust-lang.org/std/time/struct/SystemTime.html .
- chrony `tracking` provides root delay, dispersion, remaining system-clock correction and error estimates; no installed configuration implies a particular bound: https://chrony-project.org/faq.html .
- linuxptp documents hardware/software timestamp modes and `phc2sys` PHC/system time synchronization and UTC/PTP timescale handling: https://www.linuxptp.org/documentation/ptp4l/ ; https://www.linuxptp.org/documentation/phc2sys/ .

## Acceptance prerequisites and negative tests
Per selected instrument/venue agree clock-error, feed-freshness and maximum cross-host uncertainty budgets; capture measured sync/health receipts; validate `UNKNOWN_CLOCK`, `CROSS_DOMAIN`, `BACKWARD_WALL`, `STALE_FEED` and restart epoch behavior in deterministic module harness; independently review performance and clock authority before enabling any order-facing service.

This ADR is design-only, **not** a mandate to enable PTP, mutate a host clock, grant execution permissions or choose an exchange.