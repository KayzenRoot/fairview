# FV-ADR-010 | Multi-feed signal independence and uncertainty

**Status: PROPOSED_NOT_ADOPTED.** No real feeds, selected weights or approved confidence threshold.

## Decision proposal
Every reference source exposes its source ID, known upstream liquidity affiliation or UNKNOWN correlation group, account/data licence, instrument contract, source event timestamp semantics, receive clock domain, bounded error, quote-kind/executability and gap/throttle states. Distinct TCP connections or broker names do **not** prove source independence. A signal quorum must be evaluated against distinct *verified* source-independence groups rather than raw number of feeds; unknown upstream correlation prevents a claimed independent quorum.

For future synthetic research, compare robust median, trimmed consensus intervals and freshness/error-weighted intervals with controlled stale-outlier poisoning. An uncertain source time, duplicate mirror, unequal contract or unlicensed quote is excluded with a reason and cannot be resuscitated by a high ML-assigned weight. Strategy emits only `FeedConsensusEvidenceV0` and a possible separately checked `ForexOpportunityV0`, never a venue-executable order or client fill. AI may propose testable weight hypotheses in research but may not change active weights without signed configuration, exact-head replay and independent risk review.

## Evidence and framework references
Round-2 `NormalizedQuoteV0`, Round-4 `ReplayRunManifestV0` and source rights in Round-1 FOREX-VENUE-POLICY-R1.md are required. NautilusTrader's public backtest data guide differentiates L3, L2, L1 quote, trade and bar granularity; fewer levels increase execution simulation assumptions: https://nautilustrader.io/docs/latest/concepts/backtesting/data-and-venues/ . Hummingbot V2 separates reusable market data providers and controller action planning, useful as an independent modular-architecture reference (not a Forex microsecond benchmark): https://hummingbot.org/strategies/v2-strategies/controllers/ .

## Proof obligations
Synthetic mirrored-feed quorum, stale-outlier poisoning, cross-domain clock interval ambiguity, missing source timestamps, sampled/throttled feed, source gap/restart, spot/CFD contract mismatch, license denial, insufficient independent quorum and benchmark run drift. No default global source count or claim that three feeds are always better than one. Exact venue- and instrument-specific measured calibration and data-licence approval are future work only.