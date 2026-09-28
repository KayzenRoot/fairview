# FV-DISC-001 | Round 5: permissioned Forex strategy families

**Status: PLANNING ONLY, NOT IMPLEMENTED.** All candidate venues and feeds remain RESEARCH_ONLY, `strategy-forex` remains PLANNED, official HIVE v1.0.3 remains pinned, the canonical checkpoint is unchanged and FV-BOOT-001 issue #1 is still OPEN (latest owner-supplied isolated HIVE FULL FAILED). This round does not open demo accounts, connect market data, install a trading SDK, implement strategies or approve actual orders.

## 1. Source-derived competitor capabilities versus FairView hypotheses

Westernpips' public Private 7 product/docs describe OneLeg, Two Leg Lock, One Leg Multi and related multi-feed/backtester/tick-analyzer tools. These are vendor feature claims, **not** proof of actual speed, fills or profitability on our venues. Its public descriptions also market "hidden"/manual-appearing order approaches. FairView deliberately **excludes** masking origin, concealed proprietary protocol paths, unauthorized stale-quote exploitation and ToS circumvention. Functional reference: https://westernpips.com/ ; https://docs.westernpips.com/documentation/westernpips-private-7/westernpips-private-7-algos/ ; https://westernpips.com/wp7-back-tester.html .

| Strategy family | Vendor-described reference | FairView permissible research target and actual differentiation to measure |
|---|---|---|
| `ONE_LEG` | Fast-reference-versus-slower-venue quote divergence, one-venue action | Compare a separately licensed reference against the **actual** authorized venue's executable quote, applicable depth and published rejection/last-look semantics; measure net realized/simulated edge after all execution costs and open exposure. No promise that a quote will be honored. |
| `TWO_LEG` | Two-account or two-venue hedge/lock variants | Two separate venue/account intents with independent strategy permission and risk admission; model ACK asymmetry, partial fills, unknown broker state and independently approved recovery. No zero-risk assumption. |
| `MULTI_FEED` | Multiple fast reference sources for One Leg signal validation | Classify source identity, correlated upstream liquidity, event-time/clock uncertainty, source freshness and sequence gaps before robust consensus. Consensus is an **observation**, never an executable broker bid/ask or license grant. |

No market, broker, instrument or deployment topology was selected in this document. D-007 remains OPEN. Even Spotware's public cTrader Open API, with documented approved apps, demo/live accounts and per-connection limits, does not prove permission for a user's intended arbitrage strategy with a particular broker. Sources https://help.ctrader.com/open-api/ ; https://help.ctrader.com/open-api/api-application/ ; https://help.ctrader.com/open-api/terms-of-use/ .

## 2. Strategy boundary and proposed typed contracts

The `strategy-forex` module consumes immutable, versioned market snapshots produced by Round-2 `market-data`/`clock` and Round-1 `policy`. It may output a **candidate** with evidence; **only** the independent Round-3 Risk Kernel may admit an actual intent, and only Ledger/Execution can persist and route it in a separately approved future runtime. AI and web modules may analyze or display but cannot directly submit orders, silently adjust limits or override a stop.

`ForexStrategyConfigV0`:
- `strategy_id`, `strategy_family` = `ONE_LEG | TWO_LEG | MULTI_FEED`, `revision_hash`, `risk_policy_ref`, `venue_permission_ref`, `data_licence_refs`, `account_scope`, `instrument_contract_id` with exact spot/CFD/settlement and tick/lot precision, permitted order/hedge types.
- Optional source IDs and `source_independence_evidence` per reference feed; `clock_and_freshness_policy_ref`, `event_time_requirement`, `sequence_policy_ref`, `cost_model_hash`, `latency_model_hash`, `depth_and_impact_policy_ref`, `minimum_modelled_net_edge`, `valid_until`, config and Risk Kernel version, and explicit operating mode (`SYNTHETIC_REPLAY` by default).
- No globally invented staleness, slippage, threshold, volatility or acceptable unhedged-duration constant. Values require benchmark evidence and instrument/venue-specific risk sign-off.

`ForexOpportunityV0`:
- `candidate_id`, `strategy_id`, `strategy_family`, immutable `config_hash` and replay run ref, exact instrument/settlement conversion ref; `reference_quote_refs` and actual `execution_venue_quote_ref`; feed license and permission receipt refs, optional source event UTC and `local_receive_monotonic_ns` with `clock_domain_id` and bounded uncertainty; bid/ask, executable depth and exact notional; fees/spread/slippage/market-impact/financing/carry estimates with uncertainty bounds; `modelled_net_edge_interval`, `expiry`, `nonactionable_reason_codes`; `evidence_hash`.
- No `executable=true` based solely on a fast/indicative reference feed. Missing executable order size, total cost or instrument comparability means `NON_ACTIONABLE`. A modelled positive interval is never a guaranteed fill.

`FeedConsensusEvidenceV0`:
- `source_ids`, `upstream_liquidity_or_correlation_groups`, `source_event_time_semantics`, `receive_clock_domains`, `clock_error_bounds`, `valid_source_count`, `effective_independent_source_count`, `freshness_and_sequence_status`, `outlier_rule_revision`, `consensus_price_interval` in exact instrument units, `dispersion`, `excluded_sources_with_reasons`, `data_licence_refs`, `consensus_status` = `USABLE_FOR_RESEARCH | AMBIGUOUS | INVALID`.
- Repeated feeds from the same upstream LP must not be falsely counted as independent; independent-source minimum is an explicitly approved policy, never a hardcoded "two sources = proof" assertion.

`TwoLegIntentPlanV0`:
- Unique strategy run and prospective leg A/B identity; each leg's legally approved broker/account/instrument, side/quantity/lot rounding, source executable quote, independent `policy_ref` and independent future `risk_admission_ref`, order validity and time budget, full fee/slippage/conversion/financing model, projected worst plausible fill/hedge exposure, `MAY_HAVE_SENT` and UNKNOWN branch, `max_unhedged_exposure`, `reconciliation_procedure_ref`, and separately gated recovery/hedge criteria.
- This is design-only, not a pair of automatically authorized external orders. Hedging priority and exposure budgets belong to separately approved Risk Kernel configuration.

`StrategyDecisionV0`:
- `OBSERVE_ONLY | NO_SIGNAL | NON_ACTIONABLE | CANDIDATE_FOR_RISK | STOP`, reason codes and exact immutable evidence refs. `CANDIDATE_FOR_RISK` is **not** an order permit. Strategies cannot create ledger ACKs or venue fill receipts.

## 3. ONE_LEG signal design (permissioned research)

1. Compare a separately entitled reference-feed **bid/ask pair** against the selected venue's own account-linked, currently executable bid/ask, using the same legal instrument and valid source/receive timestamp semantics. Opposite sides of the spread matter: buy at venue ask and sell/exposure-mark with a model backed by that venue's bid, not the reference mid-price.
2. Enforce source sequence completeness, age and sync-quality budgets, round the proposed size to the selected venue's tick/lot precision and cap it by actually available permitted liquidity; a sampled feed is not proof of raw-tick freshness.
3. Compute an **interval** for potential net edge in settlement currency that includes spread, commissions, expected and adverse slippage, order rejection/last-look if applicable, position funding/carry and plausible liquidation cost. The reference source is not a guaranteed destination to exit; treat all single-leg inventory as open exposure.
4. Return `CANDIDATE_FOR_RISK` only if documented policy and conservative cost/depth evidence meet a future approved threshold. Otherwise `NO_SIGNAL` or `NON_ACTIONABLE`.
5. Once an intent is someday admitted, the independent Ledger/Execution/Risk chain handles it; strategy cannot assume instant fill, zero-slippage exit or attempt resale based on an unauthorized reference-feed price.

## 4. TWO_LEG signal design and failure topology

1. Require distinct **actual** executable venue quotes with comparable instruments/contracts and separately authorized API and strategy permissions. Model both directions under the actual matching currency, lot sizes, market hours, commissions, conversion, collateral and carry.
2. Compute the worst plausible residual notional, not only a best-case pair spread. A pair of candidate intents must carry individual risk scopes; strategy does not bypass pretrade admission by labeling the pair "market neutral".
3. Plan legal leg dispatch and hedge coordination for later replay. Unknown fill on leg B after a possible send is `UNKNOWN_NEEDS_RECONCILIATION`; conservatively bound B's potential fill and A's known partial exposure, freeze new risk-increasing intents and query B's authoritative order/fill/position history before ANY proposed retry.
4. Cancellation request is not cancellation confirmation; a fill racing cancel updates exposure. Any subsequent permitted recovery/hedge requires its **own** fresh policy, depth, cost and independent risk admission. A rejected hedge leaves an unresolved incident; zero residual cannot be asserted without venue reconciliation.

## 5. MULTI_FEED signal design

- Normalize each source's instrument contract, provider timestamp semantics (event, batch, send, unknown), local receive monotonic domain, UTC and uncertainty, licensing, quote kind and sampling rate. Reject invalid/mismatched sources before aggregation.
- Maintain explicit groups of correlated upstream liquidity or mirrored feeds. Use robust median, trimmed interval or freshness-weighted consensus **as research candidates**, never auto-adopt a statistical winner. Weights and independence minimum are calibrated and signed off in a future ADR against known synthetic poisoning and lawful historic traces.
- Require a consensus **interval** that honestly includes source clock error, provider dispersion and age, not an unjustified single-price certainty estimate. One delayed high-price source must not create a false consensus against the actual executable venue.
- No valid independent quorum, unresolved clock domains, upstream duplication, loss/gap, incomplete history or unlicensed feed => `AMBIGUOUS` / `INVALID`, NO action. One Leg may only receive a separately evaluated candidate signal with a real authorized venue quote and independent Risk Kernel decision.
- Cache, hot-path queues and feed weighting must be observable and bounded. AI's inferred weights may be research suggestions only, never dynamically applied to a live strategy without separately audited deterministic configuration.

## 6. Technology reuse and no-default-dependency rule

| Candidate | Officially documented capability | Scope and constraint for FairView |
|---|---|---|
| Rust native typed strategy plugin | Deterministic state machines with fixed-decimal data and explicit bounded channel interfaces | Proposed architecture **only**; do not introduce native code or unsafe plugin loading in this planning PR. Reuse Round-2 event/clock and Round-3 risk/ledger contracts. |
| NautilusTrader | Event-driven FX quote-tick high-level backtest and Parquet data catalog; backtest engine orders historic streams by timestamps | Optional **independent comparator** for benchmark assumptions, not automatically a copied runtime. Upstream LGPL-3.0/commercial-compliance review and exact version pin required. Docs: https://nautilustrader.io/docs/latest/getting_started/backtest_high_level/ ; https://nautilustrader.io/docs/latest/concepts/backtesting/data-and-venues/ ; https://github.com/nautechsystems/nautilus_trader |
| Hummingbot Strategy V2 | Reusable controller + executor architecture for strategies and market-data providers, including CEX cross-exchange examples | Apache-2.0/source and connector licensing review; architecture inspiration for CEX strategy integration later, **not** an off-the-shelf Forex arb or evidence of profitability. https://hummingbot.org/strategies/v2-strategies/controllers/ ; https://github.com/hummingbot/hummingbot |
| cTrader Open API | Official C#/Python SDK and JSON/Protobuf with approved application; demo and live endpoints | Possible separately approved Forex demo venue research, NOT chosen here. Max 50 nonhistorical requests/s/connection, max 5 historical requests/s/connection per official getting-started docs; selected broker's strategy permissions OPEN. https://help.ctrader.com/open-api/ ; https://help.ctrader.com/open-api/api-application/ ; https://help.ctrader.com/open-api/terms-of-use/ |
| FairView R4 lab | Proposed exact SHA run manifest, virtual clock, lookahead barrier and matched hardware/data/cost benchmark protocol | Required source-of-truth for future strategy tests. Synthetic model does not reproduce unknown broker fills or prove vendor relative performance. Internal: `docs/architecture/REPLAY-BENCHMARK-R4.md`. |

## 7. Design-only adverse fixtures (actual runtime tests NOT yet executed)

| Scenario ID | Synthetic fault | Expected decision |
|---|---|---|
| REF_FEED_ONLY | Strong gap exists only on indicative source | No executable quote inference; NON_ACTIONABLE |
| BROKER_POLICY_DENY | Selected broker/strategy or account entitlement missing | STOP regardless of spread |
| UNLICENSED_MULTI_FEED | One input lacks internal/derived retention rights | Exclude, do not publicly export or count |
| SPOT_CFD_MISMATCH | Reference spot and executable CFD differ in settlement/units | NON_ACTIONABLE without proven conversion and costs |
| THROTTLED_REFERENCE | Sampled 4 Hz reference mislabeled full ticks | No raw-tick latency claim or false signal |
| CLOCK_UNCERTAINTY | Source event-time meaning/UTC bounds incompatible | AMBIGUOUS or NON_ACTIONABLE |
| SOURCE_SEQUENCE_GAP | L2 delta missed before signal | No executable depth inference until resnapshot |
| ZERO_DEPTH_OR_SIZE | Apparent spread but no executable quantity | NON_ACTIONABLE |
| HIDDEN_FEES | Model lacks commission, carry or realistic exit slippage | Net edge UNKNOWN; no positive signal |
| VENUE_REJECT_OR_LAST_LOOK | One Leg rejected or price changed | No claimed fill; inventory and realized cost based on receipts |
| LEG_A_PARTIAL_B_UNKNOWN | A partly fills, B send timed out | Freeze new exposure, no blind retry, reconcile broker |
| CANCEL_FILL_RACE | One leg fills after cancellation requested | Update exposure; no cancel-confirmed assumption |
| REJECTED_HEDGE | Recovery route rejects permitted hedge | Incident stays open; risk remains bounded |
| MIRRORED_FEED_QUORUM | Three IDs share one upstream provider | Effective independent source count stays one |
| STALE_OUTLIER_POISON | Stale outlier tries to dominate median/weight | Quarantine stale source; no false actionable consensus |
| DATASET_LOOKAHEAD | Reference future tick visible before virtual time | Early strategy decision invariant |
| DISCONNECT_KILL | Execution or risk process unreachable | STOP new risk-increasing intents |
| MODEL_PARAMETER_DRIFT | New strategy thresholds or weights lack signed version | Distinct run hash, no reused performance proof |

These scenarios are **acceptance obligations** for future `tests/strategy-forex/`, not proof of trading behavior from bootstrap documentation tests.

## 8. Future one-module implementation ladder

Phase A (after external gates): independently admitted `strategy-forex` WO for **pure synthetic typed signal evaluators**, three separate deterministic strategy families, fixed-decimal cost/depth models, feed uncertainty, explicit STOP and no broker adapter calls. Dedicated nonempty tests and exact-head CI.
Phase B: first select one *actual* legally entitled demo Forex venue and separately licensed fast reference feed with specific strategy written approval, then run R4 matched-replay and controlled demo experiments under independent Risk Kernel and Ledger/Execution proof.
Phase C: expand approved Multi Feed source independence, then Two Leg only if second actual venue and hedge rights are verified. Compare expected vs observed fill/reject/slippage and one-leg exposure; keep all losses/adverse runs and tail sample limitations.
Phase D: financial production would require separate high-assurance work order, PRIVATE repository receipt, secrets manager, independent review, risk incident and rollback/drill proof and explicit user authorization. None are granted by this planning document.

**STOP CONDITION:** keep PR #17 DRAFT, 20 modules and bootstrap only ACTIVE. Do not activate source, connect broker, create real/demo funded accounts, store paid ticks publicly, change HIVE pin/host, promote canonical checkpoint or advertise superiority until independently measured against a lawfully accessed, matched alternative.