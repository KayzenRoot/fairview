# FV-ADR-009 | Three explicit Forex signal families with a single risk admission boundary

**Status: PROPOSED_NOT_ADOPTED.** FV-DISC-001 Round 5 strategy architecture only, no runtime or selected broker.

## Decision proposal
Keep existing `strategy-forex` module with **three separately configured internal strategy families** (`ONE_LEG`, `TWO_LEG`, `MULTI_FEED`) rather than creating three new registry entries. Share typed `ForexStrategyConfigV0` and immutable `ForexOpportunityV0`; independent Round-1 eligibility and Round-2 market/clock provenance; pure Round-4 replay; Round-3 Risk Kernel and Ledger/Execution boundaries. Each profile has separately versioned thresholds, permitted accounts, feed rights, cost model, depth model, exit-risk budget, clock budget and negative fixtures.

Every strategy returns `StrategyDecisionV0` of `OBSERVE_ONLY | NO_SIGNAL | NON_ACTIONABLE | CANDIDATE_FOR_RISK | STOP`; **none** can transmit an order or turn a reference quote into a venue fill. One Leg inventory exposure is explicit, Two Leg carries per-leg uncertainty and separate hedge risk, and Multi Feed consensus needs independent sources plus a real executable venue quote. Missing rights/depth/costs/clock proof means NO actionable candidate.

## Research basis and technology
The Westernpips public documentation identifies OneLeg, Two Leg Lock, One Leg Multi and tick/backtester features as vendor offerings; this is a capability reference without independent performance proof. https://westernpips.com/ ; https://docs.westernpips.com/documentation/westernpips-private-7/westernpips-private-7-algos/ .
NautilusTrader official FX tick backtest https://nautilustrader.io/docs/latest/getting_started/backtest_high_level/ and historical book granularity https://nautilustrader.io/docs/latest/concepts/backtesting/data-and-venues/ inform independent comparator research. Upstream LGPL-3.0 compliance and exact versions need a separate adoption decision. Hummingbot Strategy V2 controllers/executors https://hummingbot.org/strategies/v2-strategies/controllers/ illustrate a related modular design for CEX/DEX, not an off-the-shelf Forex adapter. cTrader documented application approval and SDK/rate limits https://help.ctrader.com/open-api/ ; https://help.ctrader.com/open-api/api-application/ do not imply the selected broker permits these strategies.

## Rejected alternatives
- A single opaque monolithic "autopilot" directly ordering on any price gap: rejected.
- Hidden/masquerading TCP or FIX order origins or copying proprietary Westernpips methods: excluded.
- Treating positive synthetic profit as superiority over marketed vendor speed or live profitability: rejected.
- Assuming an unknown second leg is absent or can be blindly resubmitted: rejected.

**Activation requires** selected permitted venue/feed contracts, accepted current exact-main Git-only foundation and independent financial-security review before privileged activation, separate admitted source WO with deterministic strategy fixtures, and no external order capability in initial pure evaluator tests.

**Foundation amendment D-009:** the accepted Git/Node22/pinned GEF foundation in protected main replaces previous host-service prerequisites. A future pure synthetic source Work Order requires its own admitted scope and actual nonempty deterministic tests; order-capable financial deployment still requires independent security review and exact provider legal rights.
