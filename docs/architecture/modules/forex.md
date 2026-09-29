# Forex venue and feed adapters | module `forex`

State: **PLANNED, NOT IMPLEMENTED**. Authority: FV-DISC-001 Round 1 research; original module identity and harness ownership unchanged. Separate admitted implementation Work Order required; FV-FOUNDATION-002 full/independent gates remain open.

Reserved source ownership: `src/forex/`. Harness ownership: `tests/forex/`. Dependency graph: `risk`, `market-data`, `clock`, `execution`. Policy is a cross-cutting eligibility prerequisite through the independent Risk Kernel and strategy admission, not a direct privilege granted by this charter.

## Separation of interfaces
`ReferenceFeedAdapter` may normalize an independently entitled fast/validation feed but cannot claim its quotes are executable at the order venue. `ExecutionVenueAdapter` consumes its own venue's actual executable bid/ask, depth/size, orders, acknowledgments, rejects and fills. `MarketDataNormalizer` and `ClockQuality` own provenance, instrument precision, clock uncertainty, sequence gaps and expiration. Independent `RiskKernel` gates every later order intent; no adapter can authorize itself.

## Official provider research for first adapter selection
- **cTrader Open API:** broker-affiliated OAuth and approved app; JSON/Protobuf, demo/live separate, official C#/Python SDK only, 50 non-historical and 5 historical requests/s/connection. Rust Protobuf via a governed native client is an **evaluation**, not official SDK support. Rate/heartbeat, specific broker strategy terms and actual fill outcomes require explicit evidence.
- **OANDA v20:** REST/practice and stream available under eligible v20 account; at most four account price snapshots per second per symbol means no proof of sub-250ms opportunity or complete tick history. Useful for reproducible contract/replay comparisons, subject to permission.
- **LMAX Exchange:** broker/MTF FIX and market-data endpoints, UAT/demo plus ITCH data options, contingent on actual market-data/order contracts. A paid commercial feed's stated update interval is not measured order/hedge execution latency.
- **TrueFX:** streaming reference-data research only under the published internal-use license unless separately contracted; no raw or derived price redistribution claim.

Detailed sources, explicit negative fixtures and decision evidence: `docs/architecture/FOREX-VENUE-POLICY-R1.md`; `docs/architecture/adrs/FV-ADR-001-PROPOSED-FOREX-VENUE-SELECTION.md`.

## Interface and measurement plan
The first chosen demo adapter must demonstrate identical instrument/CFD/spot settlement and contract semantics when comparing feeds, event and local receive timestamps, bid/ask sizes, fees, rejects/last-look, out-of-order quotes and explicit clock uncertainty. Replay One Leg, Two Leg and Multi Feed with deterministic fault injection before a live route is eligible. Measure at minimum tick-to-risk, risk-to-send, send-to-ack, ack-to-fill p50/p95/p99, observed gap vs realized fee/slippage-adjusted edge, and one-leg loss containment. Keep hosted CI synthetic and public-data-rights clean.

## STOP and external prerequisites
Do not select broker or external reference feed, register application, install runtime SDK or connect an account in this planning PR. Await specific legal entity/jurisdiction, selected broker app/account approval, exact strategy/API and feed licensing, independent risk and security review, and verified FV-FOUNDATION-002 host FULL. A permitted One Leg strategy never implies Two Leg/Multi Feed/copying permission.
