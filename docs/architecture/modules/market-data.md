# Authorized multi-feed market data | module `market-data`

**PLANNED, NOT IMPLEMENTED.** FV-DISC-001 Round 2 planning only; no live prices or product runtime, and no change to the 20-module registry. Source reservation `src/market-data/`; harness reservation `tests/market-data/`; dependency `clock`.

## Single responsibility
Normalize separately licensed and independently identified reference feeds, executable venue quotes, source sequences, precise instrument/contract IDs, fixed-decimal bid/ask and available size, provider-supplied optional event timestamps, capture clock domain, sampling and connection-quality state. A fast indicative price and a slow executable quote must never be treated as directly fungible without policy, instrument conversion and quantified timing/fee error.

## Proposed interfaces
- `NormalizedQuoteV0`: documented field matrix in `docs/architecture/CLOCK-MARKET-DATA-R2.md`. `source_event_utc_ns` is nullable with declared provider semantics. `local_receive_monotonic_ns` belongs to an explicit `clock_domain_id`. Wall UTC and `estimated_clock_error_ns` separate. JSON transport of 64-bit nanoseconds must be lossless, and prices/sizes must carry exact decimal scale.
- `MarketDataPolicy`: accepted provider account, exact instrument and quote use/redistribution rights from the `policy` module; no permission inferred from public API docs or setting toggles.
- `SequenceState`: source-specific snapshot, epoch, gap and reset handling. `SEQUENCE_GAP` invalidates derived L2 book until fresh authoritative recovery; `OUT_OF_ORDER_DUPLICATE` cannot create another trade signal.
- `SignalEligibility`: only `ELIGIBLE_FOR_FURTHER_RISK_EVALUATION` when quote kind, execution venue entitlement, size/depth, fees, source rate, freshness, clock status and instrument compatibility pass. Risk and execution still separately authorize every future intent.
- `ReplayTraceWriter`: an independently licensed, bounded async export interface with `CAPTURE_OVERFLOW` recorded on loss; Parquet/Arrow candidates for offline research only, never a required critical execution dependency.

## Existing technology evaluation
Official provider WebSocket/FIX/ITCH where selected venue licenses them; CCXT Pro for CEX research and non-critical adapter comparison. Arrow plus Parquet for lawfully retained offline traces. Rust in-process bounded typed channels for the hypothetical quote-to-risk pipeline only after detailed ADR. Candidate official docs in `docs/architecture/adrs/FV-ADR-003-PROPOSED-MARKET-DATA-PROVENANCE.md`.

## Activated harness design, not current tests
Synthetic `SEQUENCE_GAP`, `OUT_OF_ORDER_DUPLICATE`, `THROTTLED_FEED`, `LICENCE_UNKNOWN`, `BOOK_UNAVAILABLE`, `VENUE_QUOTE_INDICATIVE`, `INSTRUMENT_MISMATCH` and `CAPTURE_OVERFLOW`, with per-provider deterministic sequence fixtures, no third-party prices in Git or hosted CI. Verify quoted `size` vs depth, stale/unknown UTC and channel overflow behavior before activation.

**STOP:** absent licence, clock proof, authoritative book snapshot or explicit executable venue identity, the quote is research/non-actionable only. Actual connector implementation requires FV-BOOT-001 FULL/independent gates and a separate admitted activation WO.