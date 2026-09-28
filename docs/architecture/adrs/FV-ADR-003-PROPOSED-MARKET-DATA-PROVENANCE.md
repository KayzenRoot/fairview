# FV-ADR-003 | Market-data provenance, quote eligibility and offline trace format

**Status: PROPOSED_NOT_ADOPTED.** FV-DISC-001 Round 2; no market-data connector, event store or strategy has been implemented.

## Context
The Westernpips public feature reference includes fast/slow feed and multi-feed comparison. That behavior alone cannot establish executable edge. A raw feed may be indicative, account-linked, sampled, delayed or subject to limited redistribution and may report source event, batch or send timestamps with different meanings. Another venue's order price is a separate contract. Fairview must not hide that gap with a single undifferentiated `timestamp` and `price`.

## Proposed data model
Adopt a future typed `NormalizedQuoteV0` envelope as defined in `docs/architecture/CLOCK-MARKET-DATA-R2.md`: source/connection ID, exact instrument contract, fixed-decimal price and volume, bid/ask and book-depth availability, quote kind (executable vs indicative/sampled), optional provider event UTC/meaning, local monotonic+domain and UTC+error bound, source sequence and epoch, transport, throttle, policy-backed licence scope and private provenance reference. Every field that can be unknown remains explicitly optional or UNKNOWN; no default fabricated fill size, source timestamp or quote executability. Bid/ask should not be priced as tradable at arbitrary size without relevant book depth and fees.

Ordering and recovered book state belong to each provider's published sequence contract: require an authoritative snapshot/reset and mark gaps. Cross-feed comparisons may become `ELIGIBLE_FOR_FURTHER_RISK_EVALUATION` only after policy, instrument, clock, completeness, quantity, fee/slippage and freshness checks. This is NOT an order permit.

For licensed offline replay, evaluate async bounded Arrow in-memory batches and Parquet archival with explicit source terms, retention and capture-overflow markers. Keep archive/dataframe conversion off the proposed real-time quote-to-risk hot path unless separately benchmarked. Never publish raw licensed ticks, customer logs or commercial derived data without granted rights.

## Existing technologies considered
- Documented FIX, WebSocket and, if contract permits, ITCH adapters are provider-specific. Generic transport does not imply standard event timestamps or level-2 depth for every venue.
- Apache Arrow columnar format supports efficient in-memory analytical batches and interoperable IPC; Parquet is an offline columnar storage candidate. Neither is prescribed for every realtime tick or raw paid-data redistribution. https://github.com/apache/arrow/blob/main/docs/source/format/Columnar.rst ; https://arrow.apache.org/docs/python/parquet.html .
- OANDA's public v20 stream is capped at four pricing snapshots/second/instrument, not complete feed-tick capture. https://developer.oanda.com/rest-live-v20/pricing-ep/ .
- Rust typed bounded channels proposed for in-process hot path; broker-specific controls and instrument-appropriate benchmarks needed before choosing transport.

## Required evidence
Per provider: exact entity/account and commercial data rights, quote kind and delivery semantics, timestamp meaning, source accuracy evidence if any, snapshot/sequence behavior, throttling, API limits, fees, rights for private replay and derived output. Per adapter: synthetic negative fixtures for `SEQUENCE_GAP`, `OUT_OF_ORDER_DUPLICATE`, `BOOK_UNAVAILABLE`, `LICENCE_UNKNOWN`, `VENUE_QUOTE_INDICATIVE`, `INSTRUMENT_MISMATCH`, `THROTTLED_FEED`, `CAPTURE_OVERFLOW`; independent risk gate on every order.

## Not adopted
No default archiver, provider, venue, hot-path Arrow, broker adapter or trading API is selected by this ADR. Product activation remains blocked under FV-BOOT-001 FULL/independent review and separately admitted module WOs.