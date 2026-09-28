# FV-ADR-008 | Matched benchmark methodology and evidence rights

**Status: PROPOSED_NOT_ADOPTED.** No measured competitive speed or real profits exist under this ADR.

## Decision proposal
Adopt a reproducible protocol in future Research WO: fix dataset/instrument, executable depth, quote and model semantics, fee schedule, strategy config, risk limits, engine version, seed, hardware/OS and network conditions. Report synthetic replay, permitted historical replay, demo and observed authorized live trials in strictly separate columns; never infer a competitor's measured speed from advertising or compare mismatched deployments.

Measure same-domain local pipeline p50/p95/p99 by stage and venue ACK/fill only when genuinely observed with credible time provenance. Always include trial count, dropped/failed/unknown rates, warm/cold classification, source licence, clock error bounds and tail uncertainty. Mark INSUFFICIENT_TAIL_SAMPLE rather than publishing a meaningless p99. Publish expected/realized edge with full fee, slippage, carry, funding or applicable gas and residual/unhedged exposure, including zero and losing outcomes. Missing costs -> UNKNOWN, never assumed zero.

## Candidate reuse and limits
Apache Arrow columnar type and Parquet licensed replay archives: https://arrow.apache.org/docs/format/Columnar.html ; https://arrow.apache.org/docs/python/parquet.html . OpenTelemetry histogram and exemplar specification for asynchronous redacted trace-linked distributions: https://opentelemetry.io/docs/specs/otel/metrics/data-model/ . LEAN official reconciliation docs state that default slippage/fill models may diverge from live execution and market impact needs custom modeling: https://www.quantconnect.com/docs/v1/live-trading/live-reconciliation . Vendor framework output comparisons require matched datasets and disclosed differing assumptions; Hummingbot (https://hummingbot.org/strategies/) is a CEX/DEX architectural research reference, not a Forex speed benchmark.

## Reject misleading evidence
No vendor marketing point estimate is a FairView result; no selecting just profitable runs, treating a sampled stream as full ticks, estimating remote one-way latency without cross-clock bound, or claiming historical counterfactual net edge equals actual deployable profit. Adoption/activation require independent review, legal venue/feed rights, and actual adverse-case runtime tests.