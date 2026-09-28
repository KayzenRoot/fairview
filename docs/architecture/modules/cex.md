# CEX Spot adapter pair | module `cex`

**PLANNED, NOT IMPLEMENTED.** Existing module preserved. Reserved paths: `src/cex/`, `tests/cex/`. Existing dependencies: `risk`, `market-data`, `clock`, `execution`.

## Single responsibility
Two *separately eligible* spot exchange adapters with distinct `CexConnectorEvidenceV0`, `CexSpotInstrumentV0`, `CexOrderBookIntegrityV0` and `CexPortfolioReservationV0` typed contracts. Preserve exact issuer/base/quote, venue-local cash/inventory, contract tick/lot/min-notional and actual maker/taker fee tier. Exact Binance Spot U/u depth resnapshot and Kraken Spot v2 CRC32 top-ten book behavior require per-provider negative harnesses, not a generic CCXT-only accuracy claim.

## Candidate existing technology
CCXT REST/CCXT Pro research adapter and their documented per-exchange stream limitations: https://docs.ccxt.com/docs/manual ; https://docs.ccxt.com/docs/pro-manual . Native Binance Spot official depth https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md and Kraken Spot v2 book/executions https://docs.kraken.com/exchange/api-reference/spot-websocket-v2/book ; https://docs.kraken.com/exchange/api-reference/spot-websocket-v2/executions are documentary candidates ONLY. No exact provider entitlements or accounts selected.

## Activation harness and STOP
Later pure mock BINANCE_SNAPSHOT_GAP, KRAKEN_CRC_MISMATCH, KRAKEN_MULTI_LEVEL_UPDATE, SYMBOL_ALIAS_COLLISION, PRIVATE_STREAM_GAP, API_RATE_LIMIT, SPOT_FUTURES_MIXUP and UNLICENSED_FEED_EXPORT before any approved read-only/demo adapter. Full 20-case design matrix in `docs/architecture/CEX-CONNECTORS-STRATEGIES-R6.md`. **STOP** on stale/unverified book, incomplete permissions/data rights, missing account reconciliation or risk deny. No runtime implementation in this planning PR.