# Opportunity and benchmark laboratory | module `research`

**PLANNED, NOT IMPLEMENTED.** FV-DISC-001 Round 4 documentation. Reserved paths: `src/research/`, `tests/research/`; existing dependencies `market-data`, `replay`. It is an independent analytics and measurement boundary, never a live risk or broker authority.

## Responsibility and proposed interfaces
`BenchmarkCaseV0` in `docs/architecture/REPLAY-BENCHMARK-R4.md` requires matched trace/instrument, quote rights, price/depth, fee and latency model, source clocks, strategy/risk config, engine SHA, trial seed, hardware/OS/network and invalid-trial policies. Outputs explicitly label SYNTHETIC_REPLAY vs LICENSED_HISTORICAL_REPLAY vs PAPER_OR_DEMO and forbid inferring real observed fills from synthetic data. Record p50/p95/p99 only with observed scope, trial count and tail uncertainty; `INSUFFICIENT_TAIL_SAMPLE` when unsupported. Score net modeled edge after relevant spread, fees, impact, slippage, carry, conversions and unhedged exposure, including zero/losing trials.

## Candidate reusable technology
Python/Pandas for offline analysis and Arrow/Parquet for lawfully archived columnar fixtures, LEAN configurable slippage and fill-model benchmark comparator (https://www.quantconnect.com/docs/v1/live-trading/live-reconciliation), NautilusTrader independent backtest comparator (https://nautilustrader.io/docs/latest/), Hummingbot V2 reference (https://hummingbot.org/strategies/), and async/redacted OpenTelemetry metric histograms with exemplars (https://opentelemetry.io/docs/specs/otel/metrics/data-model/). None are automatically adopted or measured here.

## Future activated harness
MISSING_DEPTH, MISSING_COST, SELECTIVE_WINNER, THIN_TAIL_SAMPLE, COLLECTOR_OUTAGE and PAPER_LIVE_CONFLATION. Require baseline-vs-candidate matched inputs and documented sample and loss/recovery statistics. Do not compare to Westernpips's marketed latency or profit without actual lawful, same-condition benchmark evidence.

**STOP:** no competition winner or profitability claim from synthetic fixtures, model assumptions, paid-data leaks or unreviewed source versions. Separate admitted implementation WO and independent R8 FULL gates required.