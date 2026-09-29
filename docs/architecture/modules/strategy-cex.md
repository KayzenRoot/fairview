# CEX cross-venue, triangular and maker/taker strategies | module `strategy-cex`

**PLANNED, NOT IMPLEMENTED.** Same existing module, not three new registry modules. Reserved `src/strategy-cex/` and `tests/strategy-cex/`, existing dependencies `cex`, `replay`, `portfolio`.

## Three internal profile boundaries
- `CROSS_EXCHANGE_TAKER`: two independently entitled venues and matching spot assets, actual executable bid/ask depth, fully costed fees and pre-funded **venue-local** inventory. Independent per-leg risk admission and unknown-fill reconciliation.
- `TRIANGULAR_SPOT`: three directed spot edges on one entitled exchange with bid or inverse ask chosen by actual direction, min notional, lot/tick and fee-asset rounding **after every leg** and nonzero residual inventory on a partial leg.
- `XEMM_MAKER_TAKER`: maker venue quotes with explicit queue uncertainty and cancel/fill races; propose a separately licensed and independently risk-approved taker hedge only after a confirmed maker fill. A rejected/unknown hedge leaves an incident, not a flat book.

## Typed design, reference and first future harness
`CexOpportunityV0`, `TriangularRouteV0` and `CrossExchangeHedgePlanV0` integrate R2/R3/R4 clock, policy, risk, ledger and deterministic replay. Reusable architecture reference: Hummingbot XEMM https://hummingbot.org/strategies/v1-strategies/cross-exchange-market-making/ ; unified adapter baseline CCXT Pro https://docs.ccxt.com/docs/pro-manual . Future synthetic LOT_DUST_MIN_NOTIONAL, WRONG_TRADE_DIRECTION, VENUE_BALANCE_SHORTFALL, PARTIAL_LEG_UNKNOWN_HEDGE, MAKER_CANCEL_FILL_RACE, HEDGE_REJECTED and MODEL_OR_DATA_LOOKAHEAD. **STOP** if actual quote/depth/fees/asset identity/venue balances/independent risk cannot be proved. An actual order, paper connector or source implementation requires later approved WOs and independent FV-FOUNDATION-002 FULL.