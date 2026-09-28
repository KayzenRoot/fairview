# FV-ADR-011 | Venue-specific CEX Spot L2 book integrity

**Status: PROPOSED_NOT_ADOPTED.** FV-DISC-001 Round 6, no product connector or selected customer-entitled exchange.

## Proposed decision
Maintain one normalized `CexOrderBookIntegrityV0` interface but enforce each exchange's *own documented* snapshot, delta, checksum and recovery semantics. Binance Spot uses `U`/`u` diff-depth with buffered events and REST snapshot `lastUpdateId`. A missed update must invalidate the book and require a fresh aligned snapshot. Kraken Spot WebSocket v2 L2 `book` uses snapshot and sequential updates, sometimes repeating the same price in one message, and a **CRC32 checksum of top-ten levels**. Retain source-provided decimal precision during canonical checksum construction; a correct top-ten CRC is not proof of complete deeper depth. Never reuse Binance Futures/Kraken Futures protocols for these spot adapters.

Both candidate providers require individually evidenced legal region, exact spot product and strategy terms, commercial data/retention rights, rate/connection limits, account scope, symbol issuer identity, fee-tier version, local receive timing and approved private order/fill history semantics. CCXT Pro `watchOrderBook` may expedite research, but its common schema is not proof of per-provider book integrity or order-reconciliation correctness.

## Primary sources
- https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md
- https://docs.kraken.com/exchange/api-reference/spot-websocket-v2/book
- https://docs.kraken.com/exchange/api-reference/spot-websocket-v2/executions
- https://docs.ccxt.com/docs/pro-manual

**Not adopted:** no venue selected, no native SDK installed, no REST/WS call executed or order key granted. Activation requires distinct synthetic Binance-gap and Kraken-CRC/same-price fixtures, per-venue permission evidence, separately admitted WOs, FV-BOOT-001 FULL and independent security approval.