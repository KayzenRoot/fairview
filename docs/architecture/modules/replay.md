# Replay, paper and failure injection | module `replay`

**PLANNED, NOT IMPLEMENTED.** FV-DISC-001 Round 4 documentation. Reserved paths: `src/replay/`, `tests/replay/`; existing dependencies `market-data`, `clock`, `execution`, `ledger`, `risk`. Keep HIVE outside any future live risk or event path.

## Responsibility and proposed interfaces
Propose `ReplayEventV0`, `ReplayRunManifestV0` and `VirtualClockV0` described in `docs/architecture/REPLAY-BENCHMARK-R4.md`. The replay engine must preserve source event time (optional), local receive monotonic domain, UTC error bounds, licensed provenance and sequence faults; apply an explicit deterministic tie rule and NO future-event lookahead. Simulated decision/intent/fill events retain independent Risk Kernel admission and Round-3 UNKNOWN_NEEDS_RECONCILIATION semantics. A synthetic broker ACK is not a real broker receipt.

## Candidate reusable technology
A minimal FairView-native deterministic synthetic event engine is a proposal, NOT a dependency decision. Compare externally with NautilusTrader's event-driven research architecture (LGPL-3.0 commercial review; https://nautilustrader.io/docs/latest/), QuantConnect LEAN (Apache-2.0; separate CLI entitlement/fees; https://github.com/QuantConnect/Lean), Hummingbot V2 controller/executor pattern for CEX/DEX (Apache-2.0; https://hummingbot.org/strategies/), and Arrow/Parquet for licensed offline input archive (https://arrow.apache.org/docs/python/parquet.html). Do not vendor or install any framework here.

## Future activated harness
FUTURE_LOOKAHEAD, NONDETERMINISTIC_TIE, CROSS_DOMAIN_CLOCK, UNKNOWN_SOURCE_TIME, SNAPSHOT_SEQUENCE_GAP, MAKER_QUEUE_UNKNOWN, CANCEL_FILL_RACE, LOST_ACK_UNKNOWN_LEG, RISK_KILL_RESTART, SEED_OR_MODEL_DRIFT and UNPINNED_DATASET. First WO must use synthetic fixture with canonical output hash, negative fixtures and no external credentials or prices.

**STOP:** missing dataset hash, data licence, event-time provenance, bounded fill model or inconsistent run manifest invalidates comparative profit/speed statements. Remain planned pending admitted WO and FV-BOOT-001 FULL/independent evidence.