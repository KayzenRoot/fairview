# Fairview | Forex venue eligibility and reference-feed research | Round 1


Checked official primary-provider descriptions on 2026-09-28. The purpose of this decision inventory is to document the facts that are known, classify the unknowns that can invalidate a latency-arbitrage deployment, and define safe evaluation. The broker/account, residency, selected instruments and funding permissions are deliberately not assumed.

## 1. Separate the four market-data and execution roles

1. **Reference feed:** a permitted price/data feed with timestamp provenance and known delivery cadence. It may be indicative, delayed, throttled or non-executable. It cannot make a third-party broker quote executable.
2. **Execution venue quote:** a bid/ask, size, product, fee model, account authorization, actual stream/sequence and endpoint at the specific broker where orders could eventually be submitted.
3. **Independent validation feed:** a separate, licensed source used for skew/outlier analysis, not a guarantee that either primary quote is valid.
4. **Replay fixture:** synthetic or properly licensed historic ticks paired with actual observation timestamps, not live data reproduced in GitHub.

A One-Leg gap is **not** an executable opportunity until legal usage, comparable instrument, freshness, available liquidity, accepted orders, realized slippage/fee/financing, partial fills and broker rejection/last-look are accounted for. Two-Leg strategies introduce unhedged exposure and distinct counterparties. Multi-Feed consensus must reject clock uncertainty and mismatched instrument contracts.

## 2. Official provider candidate facts (not offers or benchmark results)

| Candidate | Planning state | Documented integration/use | Material technical or permission constraint | Research role |
|---|---|---|---|---|
| cTrader Open API | RESEARCH_ONLY | Broker-affiliated OAuth 2.0 applications; JSON or Protobuf; official Python/C# SDKs; demo and live endpoints | App review required. 50 non-historical requests/sec/connection and 5 historical requests/sec/connection per Spotware docs; heartbeat at least once per 10 seconds. Broker-specific arbitrage policies, applicable region, fee schedule and order semantics NOT verified. | Candidate demo execution adapter and local typed FIX-vs-Protobuf timing comparison; Rust/Protobuf implementation would be own unsupported-SDK integration |
| OANDA v20 | RESEARCH_ONLY | Separate practice/live REST and pricing-stream URLs; real-time account-linked prices; market/order APIs | Account availability differs by OANDA division. REST documentation: 120 requests/sec/IP, 20 streams/IP, 2 new connections/sec. Pricing stream emits **at most four prices per second per instrument**, not every quote. Not evidence of millisecond reference latency, no confirmed permission for contemplated arbitrage. | Practice-account functional contract and deliberately rate-limited comparison baseline, NOT unthrottled FAST-feed proof |
| LMAX Exchange | RESEARCH_ONLY | Publicly documented FIX order and market-data connectivity, UAT/demo endpoints; market-data descriptions include depth and ITCH | Actual access, entity eligibility, commercial FIX/ITCH agreements, market-data licence/fees and distribution terms MUST be verified. Published optional 1ms data updates are a commercial product setting, NOT measured end-to-end latency or current entitlement. | Contract-dependent low-latency institutional research, FIX vs ITCH delivery and depth model |
| TrueFX / Integral | RESEARCH_ONLY | Real-time FX streaming and historical download for viewing/analysis | Standard terms grant internal-purpose access; prohibit redistribution of prices/content other than specifically permitted unmodified widget. Does NOT establish entitlement to distribute ticks, charts containing original data or derived commercial products. | Internal-only reference-feed research pending interpretation of actual agreement; NOT a default commercial data source |

**Primary official references:**
- cTrader Open API overview/rates: https://help.ctrader.com/open-api/
- cTrader app review: https://help.ctrader.com/open-api/api-application/
- cTrader network/demo: https://help.ctrader.com/open-api/proxies-endpoints/
- cTrader terms: https://help.ctrader.com/open-api/terms-of-use/
- cTrader OAuth: https://help.ctrader.com/open-api/account-authentication/
- OANDA v20 guide/rates: https://developer.oanda.com/rest-live-v20/development-guide/
- OANDA pricing-stream cadence: https://developer.oanda.com/rest-live-v20/pricing-ep/
- OANDA v20 division caveat: https://developer.oanda.com/rest-live-v20/introduction/
- LMAX FIX endpoints: https://www.lmax.com/connectivity-guide
- LMAX data/availability: https://www.lmax.com/exchange/market-data-access
- TrueFX binding standard terms: https://www.truefx.com/truefx-terms-and-conditions/

No independently observed latency, 99th-percentile delivery, slippage, profitability, account approval, broker suitability or contractual permission has been established for any candidate.

## 3. Policy admission ladder (design-time contract, NOT runtime implementation)

Candidate evaluation state is **RESEARCH_ONLY** by default and MUST NOT be upgraded through this document or automatically inferred from a vendor API page.

- **DENY:** explicit legal/policy prohibition; unsigned execution, concealed order origin, unlicensed commercial redistribution, disallowed instrument/region, missing source provenance or strategy prohibited by the chosen venue.
- **RESEARCH_ONLY:** public documentation analysis, synthetic replay, fixture-only feed normalization without real accounts or real price redistribution; current state for all four candidates.
- **DEMO_ELIGIBLE (future conditional):** specific approved application, named broker, test-account entitlement, explicit strategy and quote-data rights, documented demo order permissions and fully isolated secrets.
- **PAPER_ELIGIBLE (future conditional):** fee/slippage/book model and replay validity, paper-market-data rights and synthetic order receipts, risk negative tests. This is not live permission.
- **LIVE_CANDIDATE (future conditional):** venue and jurisdiction contract, explicit strategy/API permissions, commercial market-data licences, legal and independent security review, separated managed secrets, tested independent Risk Kernel, constrained approval signed by the operator, incident/drill proof and limited funded scope. Even this is not LIVE_APPROVED and cannot place an order.
- **Live execution** requires a separate high-assurance work order plus operator authorization, PRIVATE repo visibility proof, independent review, venue/account entitlement and independent risk-kernel admission on every order.

A policy record expires on a changed vendor ToS, revoked app, venue symbol/instrument or region, new strategy, changed data product or expired evidence. Unknown and stale evidence reverts to RESEARCH_ONLY or DENY without automatic fallback.

## 4. Proposed typed contracts for later ADR (examples without code)

**VenueEligibilityEvidence**: `candidate_id`, `venue_legal_entity`, `country_and_client_jurisdiction`, `account_kind`, `permitted_instruments`, `permitted_strategies`, `permitted_API_protocols`, `api_app_status`, `data_licence_and_use_scope`, `redistribution_permission`, `market_data_cadence_evidence`, `fee_and_spread_model`, `last_look_or_rejection_policy`, `source_document_url`, `document_version_and_hash`, `verified_at_utc`, `expires_at_utc`, `reviewer_identity`, `operator_approval_ref`, `redaction_classification`. Missing permission is NOT a yes.

**PolicyDecision**: `DENY | RESEARCH_ONLY | DEMO_ELIGIBLE | PAPER_ELIGIBLE | LIVE_CANDIDATE`; mandatory `reason_codes[]`, affected `strategy_id`, `venue_id`, `feed_id`, `authorization_evidence_refs[]`, `data_rights_scope`, `expiry`, `risk_kernel_gate_required=true`. Strategy/risk/execution must never trust market data from one venue to infer permission at another.

**FeedQuote** (planned owner: market-data/clock): `source_id`, `account_or_venue_id`, `instrument_contract_id`, `currency_pair`, `bid`, `ask`, `available_size`, `event_time_utc`, `receive_monotonic_ns`, `clock_uncertainty_ns`, `feed_sequence_or_gap_status`, `quote_executable`, `licence_usage_scope`, `fees_version`, `provenance_hash`; never imply venue event time exists if unavailable. Tick replay records event/receive time separately.

## 5. Deterministic negative fixture design for a later activated policy harness

- Candidate with public API but no confirmed broker strategy permission MUST NOT become DEMO/PAPER/LIVE eligible.
- Candidate TrueFX standard internal-use agreement and no additional rights MUST NOT be listed as redistributable.
- OANDA 250ms-at-best pricing stream MUST NOT be labeled an unthrottled fast-feed or used to infer sub-250ms edge.
- LMAX FIX or ITCH product advertising without granted agreement MUST NOT open a live adapter.
- Broker's 1 LEG permission does not grant 2 LEG or Multi Feed or trade copier for separate clients.
- Cross-venue quote mismatch (spot FX vs CFD, contract notional, trading hours, currency conversion or different bid/ask source) MUST invalidate a signal.
- Missing depth, uncertain clock, sequence gap, stale feed, unmodeled fees/slippage or unknown order acknowledgement MUST deny an actionable opportunity.
- Revoked or stale permission/replay source MUST fail closed even when previous fixture permitted it.
- UI or LLM advice, a marketing speed claim, passed hosted CI or green development CI MUST NOT promote any venue policy state.

## 6. Open decision form for the owner and eventual legal/venue confirmation

| Required decision | Current state | Evidence before advancement |
|---|---|---|
| Client/deployment jurisdiction and exact trading legal entity | OPEN | Actual jurisdiction, account entitlement and regulatory review; no inferred country based solely on language |
| Named execution broker and eligible demo account | OPEN | Official contract, API app approval, test-account entitlement, instrument details |
| Strategy-specific permission: One Leg, Two Leg, Multi Feed | OPEN | Written broker terms/approval for the exact intended algorithm; no circumvention |
| Independent reference feed and commercial data license | OPEN | Data-vendor contract, internal/non-display/derived/redistribution entitlements |
| Symbols and instrument identity | OPEN | Same legal instrument, book/fees/settlement/product specification |
| Expected geography and hardware/network | OPEN | Actual physical host and legally permitted infrastructure; synthetic test baseline |
| Budget and exchange/broker/data fees | OPEN | Itemized recurring fee, initial integration cost and licence obligations |
| Authorized loss/notional limits and independent auditor | OPEN | Separate signed operator scope, high-assurance gate and negative tests |

### Round 1 STOP / handoff


**Current foundation boundary (owner D-009):** Git/Source Pack/Node 22 and the pinned GEF submodule are the only development foundation dependencies. Foundation migration PR #18 was merged at `694fe60c759ab5a5f91ffaa32b599899bc614f83`; its exact-main CI completed 4/4 successfully. There is no separate host retrieval/indexing prerequisite for a narrowly admitted pure synthetic module Work Order. All product modules in this planning PR remain PLANNED; real provider permissions, financial security review and actual runtime tests are still distinct gates. **STOP:** no product code activation or financial operation is authorized by these design documents.
