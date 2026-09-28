# FV-ADR-007 | Deterministic replay and virtual-time boundaries

**Status: PROPOSED_NOT_ADOPTED.** No simulation engine exists yet. Round 4 planning extends R2 normalized quote/clock contracts and R3 durable-risk/unknown-broker states.

## Decision proposal
For the first separately admitted Replay WO, evaluate a tiny deterministic FairView-native synthetic event loop and virtual clock. Each event retains source optional UTC, local receive monotonic with clock_domain_id, wall UTC with uncertainty, documented provider sequence, legal usage scope and exact-decimal quantities. Explicit versioned same-domain sort and tie policy, immutable at-event snapshots and future-lookahead poison checks are mandatory. Restarted process or different host cannot subtract monotonic readings. No event after the current virtual-clock boundary may be inspected. Synthetic fills use declared model versions and NEVER claim real broker execution.

`ReplayRunManifestV0` must hash dataset/schema, engine commit/version, scenario, config, seeds, models, clock order policy, rights evidence and canonical event/decision output. Reproducibility guarantee applies only to the same pinned trace, engine, configuration and supported environment after actual tests. Do not promise universal cross-platform bitwise identity. Failure/incomplete input makes an INVALID_RUN, not a zero-cost fill.

## Framework alternatives researched
NautilusTrader official architecture and LGPL-3.0 source: https://nautilustrader.io/docs/latest/ ; https://github.com/nautechsystems/nautilus_trader . Its full engine and commercial LGPL compatibility warrant a separate detailed integration decision; prefer independent comparator until adoption is justified.
QuantConnect LEAN Apache-2.0 source: https://github.com/QuantConnect/Lean . A reference backtest may help compare fill/slippage assumptions, but the CLI local-Docker workflow lists a paid-organization eligibility requirement: https://www.quantconnect.com/docs/v2/lean-cli/api-reference/lean-backtest .
Hummingbot Strategy V2 has reusable controllers/executors as a modular strategy reference, not a guarantee of FairView execution fidelity: https://hummingbot.org/strategies/ .

## Rejected shortcuts and required proof
Reject future-data joins, last-trade-price fills when executable bid/ask/depth is needed, floating point rounding without versioned policy, unbounded nondeterministic concurrency and rebranding simulated fills as venue truth. Activation requires dedicated deterministic fixtures for FUTURE_LOOKAHEAD, NONDETERMINISTIC_TIE, CROSS_DOMAIN_CLOCK, UNKNOWN_SOURCE_TIME, SNAPSHOT_SEQUENCE_GAP, LOST_ACK_UNKNOWN_LEG, RISK_KILL_RESTART and SEED_OR_MODEL_DRIFT, plus independent review and FV-BOOT-001 FULL.