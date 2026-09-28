# FV-ADR-001 | Forex venue and reference-feed eligibility

**Status: PROPOSED_NOT_ADOPTED**. Date: 2026-09-28. Scope: research and first module design under FV-DISC-001; no change to accepted D-007 and no production selection.

## Context
Fairview aims to evaluate permitted Forex one-leg/two-leg/multi-feed arbitrage. The execution venue and reference feed must be modeled as distinct, independently licensed integrations with different timing, executable order semantics and data rights. Public Westernpips feature descriptions are a behavioral research reference, not benchmark evidence or authorization.

## Candidate options and tradeoffs
- **cTrader Open API (conditional demo adapter):** documented OAuth, broker-affiliated accounts, official C# and Python SDKs, JSON/Protobuf and regional proxies. Application is subject to review. Rates currently documented at 50 non-historical/5 historical requests per second per connection. Its chosen broker's account/regional and arbitrage permissions are open. The official SDK list does not include Rust, so any Rust Protobuf bridge demands separate compatibility and maintenance proof. Sources: https://help.ctrader.com/open-api/ ; https://help.ctrader.com/open-api/api-application/ ; https://help.ctrader.com/open-api/terms-of-use/
- **OANDA v20 (conditional REST/practice reference):** practice/live REST and streaming are documented, but the account price stream delivers no more than four snapshots/second/instrument, dropping intervening updates. It is unsuitable as a claim of full-tick or microsecond reference fidelity without a distinct licensed feed. Account divisions, strategy permission and data rights remain open. Sources: https://developer.oanda.com/rest-live-v20/development-guide/ ; https://developer.oanda.com/rest-live-v20/pricing-ep/
- **LMAX Exchange (contract-dependent institutional candidate):** FIX order and market data, UAT/demo and advertised ITCH order-book data. Venue/account entitlements, exact instrument, market-data licence and commercial infrastructure terms must be obtained; advertised 1ms updates do not prove our round-trip execution latency. Sources: https://www.lmax.com/connectivity-guide ; https://www.lmax.com/exchange/market-data-access
- **TrueFX / Integral (conditional internal-only data comparator):** standard terms prohibit commercial redistribution of FX prices/content. Include only in internal research with appropriate terms and no publishing of raw ticks or displays/derived data without further licence review. Source: https://www.truefx.com/truefx-terms-and-conditions/

## Decision proposal, not vendor selection
Maintain a plugin interface for EXACTLY one first **approved** demo Forex execution broker and one independently entitled internal reference feed, selected later from documented eligible options. Model each feed's timing and license independently; data-provenance and risk are separate from connection logic. Do not pick a universally fastest/best broker from API marketing. A candidate can enter `DEMO_ELIGIBLE` only upon specific approved account/API/strategy evidence and an admitted implementation WO; NONE has crossed that gate.

## Alternatives considered
Embedding an opaque Westernpips binary or reverse engineering its concealed execution methods: rejected as a product architecture dependency. Assuming one broker's data redistribution licence covers another: rejected. Treating OANDA's throttled pricing stream as an unthrottled fast feed: rejected. Adding native low-latency FIX/ITCH from day one without a real agreement: defer until the selected venue makes it actionable.

## Consequences and validation
First produce a synthetic contract schema, negative policy fixtures, a repeatable source-license inventory, and a vendor RFI with specific arbitrage permission and non-display-data questions. Compare end-to-end p50/p95/p99 on *matched, lawfully sourced input traces* and test stale feed, gap, throttling, rejects, partial fills and kill switches. No actual account, live traffic or order authorization follows from this ADR.

**Acceptance prerequisites:** owner-selected jurisdiction, legal review of account and commercial data agreements, independent security approval, FV-BOOT-001 R8 FULL verified and a separate admitted activation WO. Keep this ADR PROPOSED_NOT_ADOPTED until formal evidence-bound decision.
