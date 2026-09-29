# FV-ADR-012 | Cross-venue, triangular and maker/taker CEX strategy contracts

**Status: PROPOSED_NOT_ADOPTED.** Same existing `strategy-cex` identity, no implemented source or actual trading.

## Proposed decision
Three separately versioned internal strategy research profiles share `CexOpportunityV0` and segregated `CexPortfolioReservationV0`, R2 clocks, R3 Risk Kernel/immutable Ledger and R4 replay. `CROSS_EXCHANGE_TAKER` models an actual executable ask on venue A and bid on venue B with pre-funded **account-local** inventory, depth, maker/taker fees and possible asynchronous partial/unknown fills. `TRIANGULAR_SPOT` models three directed trades on *one spot venue*: A->B->C->A using actual bid or inverse ask at each leg, fee-currency, size/lot/min-notional rounding and residual inventory after incomplete fills. `XEMM_MAKER_TAKER` models maker quotes on venue A and later separately risk-gated taker hedging on venue B when an authoritative maker fill is confirmed. A cancel request can race with a fill; the hedge is neither atomic nor necessarily profitable.

An unknown second-leg broker response becomes `UNKNOWN_NEEDS_RECONCILIATION`, freezing new risk-increasing orders and requiring authenticated venue order/fill/position history. No blind retry or instant transfer assumption. Independent Risk Kernel admission is mandatory for every later execution and permitted recovery. Withdrawal permission is never a prerequisite for spread analysis and must not be granted by default.

## Research reference
Hummingbot documents public XEMM maker/taker fill hedging, not guaranteed atomic execution: https://hummingbot.org/strategies/v1-strategies/cross-exchange-market-making/ . CCXT REST/Pro provide candidate adapters subject to exact exchange semantics/rights: https://docs.ccxt.com/docs/manual ; https://docs.ccxt.com/docs/pro-manual .

**Not adopted:** no profit/latency comparison, production venue, SDK, real accounts or three-leg live trades. Future activations require a separate admitted pure synthetic strategy WO, adverse tests and exact permissions/independent review.