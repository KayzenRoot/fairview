# Forex One Leg, Two Leg and Multi Feed | module `strategy-forex`

**PLANNED, NOT IMPLEMENTED.** FV-DISC-001 Round 5. Reserved source `src/strategy-forex/`, harness `tests/strategy-forex/`, existing dependencies `forex`, `replay`, `portfolio` unchanged. Policy, clock, market-data, ledger, execution and independent Risk Kernel remain separately authoritative via existing integration contracts, not implicitly implemented in this charter.

## Three internal strategy profiles
- `ONE_LEG`: compare legally entitled fast/reference observations with actual approved venue account executable bid/ask, depth and exact units; include spread, fees, slippage/last-look if applicable, exit cost/carry and unhedged inventory. It proposes an opportunity, never a guaranteed favorable fill.
- `TWO_LEG`: independently licensed and authorized venue/account per leg, actual executable depth and comparable instrument settlement; bounded worst-case fill and residual exposure, deterministic ACK/cancel races; if one leg is unknown, freeze risk-increasing intents, reconcile authoritative venue records and separately admit any legal recovery.
- `MULTI_FEED`: robust synthetic research on independently verified source groups, freshness and clock uncertainty, gap and throttling status; stale mirror outliers cannot dominate a signal. Any consensus must be compared to a distinct authorized actual executable venue quote before a separately risk-gated One Leg candidate.

## Planned immutable contracts
`ForexStrategyConfigV0`, `ForexOpportunityV0`, `FeedConsensusEvidenceV0`, `TwoLegIntentPlanV0` and `StrategyDecisionV0` as defined in `docs/architecture/FOREX-STRATEGIES-R5.md`. Decisions `OBSERVE_ONLY | NO_SIGNAL | NON_ACTIONABLE | CANDIDATE_FOR_RISK | STOP`. All thresholds and data rights require versioned evidence and scope. Neither AI nor web may place orders.

## Existing technology to evaluate
Rust typed, testable state machines and shared R2 market/clock and R3 risk/ledger, R4 virtual replay. NautilusTrader tick-level FX backtest as independent LGPL-3.0 license-gated comparator, Hummingbot Strategy V2 controller/executor pattern as Apache-2.0 CEX/DEX analogy, cTrader officially documented demo and approved app only if selected broker's strategy permissions allow it. Official sources in proposed FV-ADR-009 and FV-ADR-010; no SDK is installed under this proposal.

## First real harness and STOP
Later separately admitted activation must implement the 18 synthetic adverse fixtures in R5, match full costs and actual venue quotes, preserve one-/two-leg uncertainty and protect independent source quorum. Initially pure synthetic evaluators with NO external order connection; selected broker strategy authorization, feed-data rights, R8 FULL/independent and signed financial limits precede any real venue adapter or trading. **STOP** on missing policy/clock/fees/depth/venue, uncertain second leg, unlicensed feed or risk deny.