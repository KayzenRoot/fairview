# FV-DISC-001 | Round 6: CEX spot adapter pair and strategy architecture

**PLANNING ONLY.** The `cex` and `strategy-cex` modules remain PLANNED; no two production CEXs are selected, no exchange account is accessed, and no strategy is implemented. FV-BOOT-001 R8 FULL and independent audit remain OPEN. No HIVE pin or canonical checkpoint change.

## Research pair and protocol constraints

`BINANCE_SPOT_RESEARCH` and `KRAKEN_SPOT_RESEARCH` are candidate *documentation examples*, not eligible account selections. Their geographic availability, exchange terms, spot asset/quote pairs, exact fee tiers, automated trading permissions, commercial data usage and authenticated reconciliation rights require later written proof. No API call, broker registration, credential or live data collection is authorized here.

- Binance **SPOT** diff-depth WebSocket uses first update `U`, last update `u` and REST snapshot `lastUpdateId`: buffer updates before snapshot, match snapshot boundary, discard outdated deltas, reject a gap and obtain a new snapshot. A bounded depth snapshot does not prove knowledge beyond returned levels. Source: https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md .
- Kraken **SPOT** WebSocket v2 `book` sends aggregated L2 snapshot and updates with **CRC32 of top-ten bid/ask levels**. Apply multiple same-price updates in a single message in published order and retain exact decimal formatting for checksum calculation. Its authenticated `executions` channel reports account order/status/fills, but missing account history still requires authoritative reconciliation. Sources: https://docs.kraken.com/exchange/api-reference/spot-websocket-v2/book ; https://docs.kraken.com/exchange/api-reference/spot-websocket-v2/executions .
- Never substitute Binance derivatives or Kraken futures message contracts for Spot. A common `watchOrderBook` shape from CCXT Pro does not erase venue-specific snapshot/sequence/checksum or private execution semantics: https://docs.ccxt.com/docs/pro-manual .

## Proposed typed contracts (not code)

`CexConnectorEvidenceV0`: exact entity/jurisdiction, user account scope, spot instrument and strategy permissions, public/private REST/WS entitlements, commercial data/derived-use licence, maker/taker fee tier and version, rate/connection quotas, order identifiers and reconciliation endpoints, signed operator approval and expiry.

`CexSpotInstrumentV0`: exact base and quote asset/issuer identifiers (not just ticker aliases), trading symbol, spot settlement, asset network if relevant, fixed-decimal price tick, lot/quantity step, min notional, fee asset, maintenance status and legal account eligibility.

`CexOrderBookIntegrityV0`: venue-specific snapshot/delta scheme, update sequence/epoch where present, checksum scope/algorithm if supported, last verified snapshot ref, source event UTC optional, receive monotonic clock/domain and UTC error, actual per-level depth, provider rate/throttle state, licence and quality `RESYNCING | READY | GAP | CHECKSUM_FAILED | STALE | UNKNOWN`. Never invent the same sequence semantics for every venue.

`CexPortfolioReservationV0`: segregated venue/account/asset reconciled balances and version, available/reserved cash and inventory, fees and worst-case possible fills on uncertain external orders. Funds at venue A cannot automatically back an order at venue B, and a pending transfer is not instantaneous.

`CexOpportunityV0`: strategy family, exact instrument and actual venue depth refs, per-venue account/entitlement and clocks, executable size, cost/slippage/rounding/fees and conversion bounds, pre-funded inventory/hedge reachability, cost-model/data hash, conservative net-edge interval, expiry and NON_ACTIONABLE reasons. A positive model output is not an order approval.

`TriangularRouteV0`: single-venue 3 directed edges `A->B->C->A`, bid when selling base and **inverse ask** when buying base, precise per-leg depth, lot/min-notional/fee asset rules, reserve and resulting inventory *after* every simulated fill, maximum possible unfinished residual inventory.

`CrossExchangeHedgePlanV0`: maker/taker or taker/taker accounts and separately approved strategy rights, per-leg durable intent/possible `MAY_HAVE_SENT` effects, partial/unknown fill bounds, permitted hedge quote and balance, new independent risk admission, authenticated venue reconciliation and STOP state. No blind retry after unknown ACK/fill.

## Three separate research strategy profiles in the EXISTING strategy-cex module

| Profile | Mechanism | Fail-closed condition |
|---|---|---|
| `CROSS_EXCHANGE_TAKER` | Buy actual account-executable asks on venue A, sell account-executable bids on venue B, same exact asset/quote and settlement, independent authorized cash/inventory on both venues, full depth and fees. | Order legs are **not atomic**. One accepted/partial leg and unknown second leg require conservative inventory and authenticated reconciliation, never an assumed instant transfer. |
| `TRIANGULAR_SPOT` | Three directed spot pairs on one permitted venue. Execute a hypothetical A->B->C->A walk at valid bid/inverse ask with fee-currency and lot/min-notional rounding **after every leg**. | Three last/mid prices multiplied are NOT an executable return. A partially filled leg, dust balance or min-notional failure leaves exposure, not a guaranteed full loop. |
| `XEMM_MAKER_TAKER` | Maker limit quotes at venue A; following confirmed maker fill, propose a *separately policy and risk admitted* taker hedge at venue B. Study queue position and adverse selection. | Maker cancel may race with fill, and hedge may be delayed, rejected, unknown or loss-making. A maker quote and a taker hedge are not an atomic risk-free pair. |

Hummingbot's public XEMM strategy describes placing maker quotes and hedging filled trades on the taker side; it is an architecture and benchmark reference, not proof of FairView or customer authorization: https://hummingbot.org/strategies/v1-strategies/cross-exchange-market-making/ .

## Existing technology candidates, not adopted

| Candidate | Proposed reuse | Why further proof is essential |
|---|---|---|
| CCXT REST / CCXT Pro | Unified market/research interfaces, `watchOrderBook`, account/order adapters subject to actual venue support. https://docs.ccxt.com/docs/manual ; https://docs.ccxt.com/docs/pro-manual | Unified names/precision are not legally or technically interchangeable instruments. Preserve native rate limits, book integrity and private fill semantics; pin version/licence before adoption. |
| Native Binance Spot | U/u diff depth and snapshot plus official authenticated order history. https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md | Venue-specific exact docs, fees, API scopes and legal region proof. Native adapter only after measured benefit on identical entitled traces. |
| Native Kraken Spot v2 | CRC32 top-ten L2 book and authenticated executions. https://docs.kraken.com/exchange/api-reference/spot-websocket-v2/book | Need correct decimal canonicalization and full reconciliation beyond incomplete execution-stream snapshots. |
| Hummingbot XEMM | Maker/taker/controller separation to evaluate under synthetic benchmark. https://hummingbot.org/strategies/v1-strategies/cross-exchange-market-making/ | Its hedge policy cannot override FairView independent Risk Kernel or assume profits and API rights. |
| R2/R3/R4 proposed FairView infrastructure | Typed clock/feed, independently admitted risk, durable order effects and deterministic replay. | Not active product source under this draft. The first WOs will prove synthetic correctness before permitted demo connections. |

## Twenty future negative fixture obligations (NOT runtime tests)

| Scenario ID | Synthetic defect | Required reaction |
|---|---|---|
| BINANCE_SNAPSHOT_GAP | `U > lastUpdateId + 1` after buffer/snapshot | Invalidate book and resnapshot; no signal |
| KRAKEN_CRC_MISMATCH | Wrong L2 top-ten CRC32 | Quarantine book/resubscribe |
| KRAKEN_MULTI_LEVEL_UPDATE | Duplicate price levels updated within one event | Apply sequentially then checksum |
| SPOT_FUTURES_MIXUP | Futures message mistaken as spot | Reject incompatible protocol/instrument |
| SYMBOL_ALIAS_COLLISION | Identical ticker maps to different assets | Reject venue pair |
| UNLICENSED_FEED_EXPORT | No data retention/redistribution grant | No public archive/report |
| CROSS_HOST_TIME_UNCERTAIN | No bounded clock error between captures | No false latency edge |
| STALE_BOOK_SIGNAL | One old source in two-venue comparison | NON_ACTIONABLE |
| MISSING_FEE_TIER | Unknown fee asset/tier or rebate assumptions | Net edge UNKNOWN, not zero fee |
| DEPTH_SHORTFALL | Candidate size exceeds available book | Reject optimistic fill |
| LOT_DUST_MIN_NOTIONAL | Triangular later leg fails size precision | Unfinished route and residual inventory |
| WRONG_TRADE_DIRECTION | Triangular leg uses mid rather than inverse ask | Reject route |
| VENUE_BALANCE_SHORTFALL | Venue A funds assumed available at B | Deny second order |
| PARTIAL_LEG_UNKNOWN_HEDGE | First leg partial; hedge ACK lost | UNKNOWN_NEEDS_RECONCILIATION, no resend |
| MAKER_CANCEL_FILL_RACE | Maker filled after cancel was requested | Exposure persists, independently gate hedge |
| HEDGE_REJECTED | Taker hedge cannot execute | Incident and open exposure, no flat-book claim |
| API_RATE_LIMIT | Exchange-specific quota exceeded | Safe adapter backoff, no evasion |
| PRIVATE_STREAM_GAP | Authenticated order stream disconnect | Reconcile venue order/fill/position history |
| KILL_SWITCH_NETWORK_SPLIT | Independent risk offline | Stop risk-increasing orders |
| MODEL_OR_DATA_LOOKAHEAD | Replay reads future tick/model drift | INVALID_RUN, no performance claim |

## Measurement and future activation

R4 replay requires fixed data/engine/fee/strategy/risk/seed hashes, identical entitled venue and instrument conditions, full test population including losses, separated simulated and observed execution. Measure p50/p95/p99 valid same-clock local stages, depth-integrity resync time, full and partial fill distribution, rejected and UNKNOWN rates, realized/modelled fees/slippage and peak/unhedged exposure. A marketed Westernpips number, a CCXT example or Hummingbot tutorial is not a matched benchmark.

**Future independently gated work orders:** CEX pure synthetic per-venue L2 and CRC32/snapshot tests; separate pure synthetic `strategy-cex` cross-venue and triangular depth/fee/asset-edge tests; XEMM cancel/fill/risk-bound hedge failures; only then customer-entitled read-only/demo adapter integration. Do not activate `src/`, public real tick data, real accounts, API keys, transfers, production deployment, stable pin or checkpoint under this proposal. R8 FULL and independent high-assurance gate remain external blockers.