# FV-DISC-001 | Round 4: Replay + Benchmark laboratory


## Purpose and evidence boundary

A Westernpips-inspired fast/slow, two-leg or multi-feed arbitrage candidate must be tested with comparable event order, observable executable bid/ask and depth, proven costs, bounded uncertainty and explicit recovery from the Round-3 broker-unknown state. A synthetic replay is a **hypothesis-testing instrument**: neither positive simulated net edge nor a successful in-process risk proof establishes real broker execution, terms-of-service permission or advantage over any competitor.

### Four distinct experiment modes

| Mode | Market data and execution model | Truth boundary |
|---|---|---|
| `SYNTHETIC_REPLAY` | Fully generated or internally invented events; deterministic virtual time, mocked fill/reject/partial rules | Tests **implementation invariants only** and must NOT produce a real-world market performance claim |
| `LICENSED_HISTORICAL_REPLAY` | Historical source with verified licence, valid provenance and known gaps; hypothetical fill and fee models | Counterfactual, not observed broker execution; unknown depth/queue/latency reduces eligible conclusions |
| `PAPER_OR_DEMO` | Separately entitled current market-data feed and simulator or authorized demo broker | Explicitly identify simulated orders versus genuine demo venue ACKs; still no production performance claim |
| `PERMISSIONED_LIMITED_LIVE` | Not authorized under FV-DISC-001 | Separate high-assurance, PRIVATE-repo, independent review, risk and venue approval required |

## 1. Proposed deterministic event contract

`ReplayEventV0` carries `schema_version`, `event_id`, `event_kind`, `source_id`, `instrument_contract_id`, `quote_provenance_ref`, optional `source_event_utc_ns` and documented source timestamp semantics, `local_receive_monotonic_ns`, `clock_domain_id`, `local_receive_wall_utc_ns`, `estimated_clock_error_ns`, `source_sequence_epoch` plus optional source sequence, `data_usage_scope`, exact-decimal quantity/price/fees, `payload_digest` and ordered `insertion_index`. Future event kinds: quote, book snapshot/delta/gap, strategy timer, policy decision, risk decision, intent, broker ACK/reject/fill, cancel attempt, reconciliation/unknown, clock fault, dataset discontinuity, risk kill and incident. Ingestion may preserve an explicit `UNKNOWN` field. Do not derive missing timestamps by copying local time or invent an executable quote from an indicative reference.

`VirtualClockV0` advances only to already-delivered event time **in the selected replay domain**, with provider event UTC used only after compatible timestamp semantics and bounded uncertainty are proved. For distinct local monotonic domains, reconstruct causal order from a recorded capture envelope and explicit source sequence, **not** cross-host monotonic subtraction. The sort key must be explicitly versioned. For equal keys, use persisted insertion index and event ID, never nondeterministic concurrent receipt order. A timer scheduled during an event can fire only after that event and may not access the future input buffer. Clock-step faults change the synthetic wall clock and quality state, not arbitrary monotonic history.

`ReplayRunManifestV0` includes `dataset_sha256`, `dataset_licence_receipt_ref`, `schema_version`, `engine_commit_sha`, `engine_version`, `scenario_id`, `simulation_model_version`, `fee_model_hash`, `slippage_model_hash`, `fill_model_hash`, `latency_model_hash`, `strategy_config_sha256`, `risk_config_sha256`, `seed`, `hardware_os_profile`, `clock_and_sort_policy`, `capture_completeness`, `output_canonical_event_hash`, `run_status` and `invalid_trial_reasons`. Use hashes of redacted metadata, NEVER leak licensed price series or credentials in public CI. Identical manifest, dataset, engine and environment **should produce canonical equal decision/event output**; cross-platform bitwise equality is not promised without test evidence, especially where floating point, OS scheduling or framework versions differ.

### Lookahead barrier

No strategy, AI, risk, limit-fill or post-trade evaluator may read a book delta, fee adjustment, outcome, timestamp or subsequent tick not yet emitted by the virtual clock. Use event-by-event immutable snapshots. Expose an intentionally poisoned future event in a later adversarial test and assert decisions before delivery are unchanged. Reject snapshot joins where provider event time is absent but a later local receive time is silently reordered to a prior event.

## 2. Realistic execution and account models (proposals)

- **Observed quote vs tradable depth:** order size must fit executable depth at the selected licensed venue, with instrument/settlement and book integrity. If a quote is indicative, sampled/throttled or missing executable depth, flag `NON_EXECUTABLE_QUOTE` and never score it as an accepted fill.
- **Marketable and limit orders:** model taker fees, crossing the actual bid/ask ladder and possible price impact. Limit maker queue priority, queue position, cancellations ahead of us and queue depletion are often unknown in aggregate historical books; use conservative bounded scenarios rather than grant instant best-price fills.
- **Network, broker and cancellation uncertainty:** separate observed local quote-to-decision time from synthetic sampled network and venue processing times. Include rejected/last-look outcomes only where venue contract supports those semantics. `CANCEL_REQUESTED` is not `CANCELED_CONFIRMED`; allow an intervening partial/full fill.
- **Two-leg exposure:** replay `MAY_HAVE_SENT`, first-leg partial fill and a second-leg unknown ACK/fill. Unknown possible fills count in worst-case risk; no blind retry or automatic risk-free hedge. Recovery requires independent policy/market-data/portfolio/Risk Kernel admission.
- **Cost and cash-flow:** exact-decimal commissions/fees, spread, realized slippage, currency conversion, financing/carry/funding when instrument relevant, borrow and blockchain gas/revert if eventually in scope, inventory mark-to-market and latency-related opportunity decay. Missing components make realized edge `UNKNOWN`, not zero-cost.
- **Capital and fill constraints:** reserve cash/margin during an unknown outcome, enforce short-sale/product/session limits and a persistent synthetic kill switch. Reset/risk generation and all run inputs are versioned.

Proposed **net executable edge** for a fully reconciled scenario is realized proceeds minus executed acquisition cost minus every applicable modeled fee/carry/financing/hedge/slippage/market-impact component, in a declared settlement currency. Unfilled, unknown or unsupported legs get separate exposure/risk statistics, NOT assigned optimistic zero-cost PnL. No simulated `FILLED` status should be renamed as a real broker fill.

## 3. Independent benchmark methodology

`BenchmarkCaseV0` fixes the same dataset SHA, identical legal instrument, book depth and timestamp semantics, identical strategies/size/risk thresholds, model versions, permitted quote-source rights, host CPU/GPU/RAM/OS, runtime/thermal and network class and trial configuration. For external competitors, only measure with lawful access to documented APIs and *the same actual conditions*; a vendor's advertisement is not measured ground truth. If raw competitor engine metrics are unavailable, compare our own baselines and state `COMPETITOR_NOT_MEASURED`.

Capture separate latencies: `capture_to_normalize`, `normalize_to_signal`, `signal_to_risk`, `risk_to_dispatch` **within one valid monotonic clock domain**. `dispatch_to_ack` and `ack_to_fill` exist only if actually observed with authoritative venue and valid timing evidence; simulation may report modeled equivalents with **SIMULATED** labels. Publish p50/p95/p99 with `n`, sampling and invalid-trial counts, warm/cold groups, outlier/drop policies, failed runs, date/hardware/versions, and bounded uncertainty/CI when appropriate. If the sample is insufficient to estimate p99 reliably, mark `INSUFFICIENT_TAIL_SAMPLE`, not a fabricated p99. Telemetry collection can be asynchronous; its collector outage cannot change fills or risk.

Publish per-run opportunity observability, hypothetical executable opportunity counts, submitted/accepted/rejected/partially filled/unknown/fully reconciled **synthetic** order events, effective spread, fee/slippage costs, gross vs net modeled edge, peak and time-weighted exposure, unhedged duration, max hypothetical drawdown, stress recovery rate and drift between model and separately acquired demo/real observations when authorized. Negative and zero outcomes must remain in datasets and reports; no best-run cherry-picking or treating a favorable sample as a guaranteed rate.

### FairView research-specific hypothesis list
- `ONE_LEG`: venue-permitted reference/execution feed spread, modeled broker rejection/latency and exposure, not an assumption a late venue price will be honored.
- `TWO_LEG`: simultaneous-appearing opportunities with intentionally unequal fill/ACK delays and one-leg risk. Require scenario-bound net cost and reconciliation.
- `MULTI_FEED`: timestamp/clock-uncertainty-consistent consensus under explicit source ordering and independent entitlement; one old source must not contaminate majority voting.
- `CEX_CROSS_VENUE` and `TRIANGULAR`: optional later synthetic separate hypotheses with executable multi-level depth, tick/lot rounding and all fees; no automatic extension of Forex data licences.
- `DEX_FEASIBILITY`: future gas/revert/reorg/contract and MEV risk simulation, NO unapproved signing or predatory MEV.

## 4. Existing technology evaluation (no dependency installed)

| Candidate | Documented reusable function | Risk, commercial and integration gate |
|---|---|---|
| NautilusTrader | Event-oriented historical market-data replay and shared strategy architecture for backtest/live comparison | **LGPL-3.0** source: https://github.com/nautechsystems/nautilus_trader ; official docs: https://nautilustrader.io/docs/latest/ . Commercial redistribution/in-process integration needs legal ADR; reference comparator first. Its outputs are not FairView-equivalent without identical model/data. |
| QuantConnect LEAN | Open source research/backtest engine with configurable fees/slippage and reported fill-model limitations | Upstream **Apache-2.0**: https://github.com/QuantConnect/Lean . CLI local backtest docs note paid-organization-tier eligibility and Docker requirements: https://www.quantconnect.com/docs/v2/lean-cli/api-reference/lean-backtest . Official documentation warns default/live models diverge and market impact must be modeled: https://www.quantconnect.com/docs/v1/live-trading/live-reconciliation . Separate reference, NOT copy of their fill assumptions. |
| Hummingbot Strategy V2 | Controllers and Executors for modular strategy workflows; open reference for CEX/DEX scenarios | Upstream Apache-2.0 https://github.com/hummingbot/hummingbot and docs https://hummingbot.org/strategies/ ; connector capabilities, paper-model fidelity and commercial data rights require separate audit. Not a generic Forex engine. |
| Apache Arrow + Parquet | Typed columnar analytical batches and interoperable offline storage | Official specs https://arrow.apache.org/docs/format/Columnar.html and https://arrow.apache.org/docs/python/parquet.html ; ensure source-data contract allows retention/replay. Avoid synchronous hot-path conversion, keep raw licensed ticks off public Git/CI/public artifacts. |
| OpenTelemetry | Explicitly specified histograms and trace-linked exemplars for statistical distributions | Official https://opentelemetry.io/docs/specs/otel/metrics/data-model/ . Redacted async telemetry is a comparison diagnostic only, not an authoritative fill/reconciliation event. |

No one vendor framework becomes an automatically adopted dependency. A future ADR must pin source tag/SHA and transitive licences, test supported platform, quantify integration/maintenance overhead and decide whether using a reference executable comparator adds value over a small deterministic FairView-native synthetic event engine.

## 5. Negative scenario matrix (design obligations, not runtime tests)

| Scenario ID | Stimulus | Mandatory expected classification |
|---|---|---|
| FUTURE_LOOKAHEAD | Adversarial profitable tick exists only after strategy decision | No earlier decision may change or see future payload |
| NONDETERMINISTIC_TIE | Multiple same-time events inserted concurrently | Persisted insertion-index tie rule reproduces event/decision order |
| CROSS_DOMAIN_CLOCK | Receive times from different monotonic domains | No global subtraction, preserve uncertainty and reject false edge |
| UNKNOWN_SOURCE_TIME | Source sends no documented event timestamp | Retain optional UNKNOWN; no invented source delay |
| SNAPSHOT_SEQUENCE_GAP | Missing order-book delta | Mark book non-executable until valid resnapshot |
| THROTTLED_REFERENCE | Four-samples-per-second style snapshot feed labeled as full ticks | Mark sampled, not raw tick-complete |
| MISSING_DEPTH | Fill size exceeds available book or no executable quantity | No full immediate best-price fill |
| MAKER_QUEUE_UNKNOWN | Limit fill would rely on unavailable queue position | Pessimistic scenario interval or no claimed fill |
| MISSING_COST | Fee, conversion, financing or applicable gas absent | Mark net edge UNKNOWN, not zero-cost profit |
| CANCEL_FILL_RACE | Fill arrives after cancel request | Maintain fill and risk exposure until reconciliation |
| LOST_ACK_UNKNOWN_LEG | Leg A partial, leg B may have filled but ACK lost | Freeze risk increase, count unknown exposure, no automatic duplicate |
| RISK_KILL_RESTART | Persistent kill activation then simulated crash | No replayed stale admission after restart |
| SEED_OR_MODEL_DRIFT | Same dataset but seed/model changes | Distinct run manifest and outputs, no false reproducibility assertion |
| UNPINNED_DATASET | Fixture missing digest, source scope or retention right | INVALID_RUN, no performance claim or public export |
| SELECTIVE_WINNER | Benchmark report silently drops failed/adverse trials | Report INVALID, include all trials and selection policy |
| THIN_TAIL_SAMPLE | Too few timings for reliable p99 | INSUFFICIENT_TAIL_SAMPLE, expose n and uncertainty |
| COLLECTOR_OUTAGE | OpenTelemetry export fails mid-run | Keep core decisions deterministic, declare missing telemetry |
| PAPER_LIVE_CONFLATION | Simulated fill is labeled actual production execution | Block report as invalid, never claim real observed profit |

## 6. Planned activation WOs and STOP

2. Then Research WO: reproducible deterministic metrics, matched-run protocol and adversarial negative fixture selection; no vendor comparison claims without actual matched access.
3. Future Paper/Demo WO: selected lawful provider/rights, realistic venue-specific queue/fee/slippage behavior, independent risk and ledger/execution fault-injection. Still not live production.


**Current foundation boundary (owner D-009):** Git/Source Pack/Node 22 and the pinned GEF submodule are the only development foundation dependencies. Foundation migration PR #18 was merged at `694fe60c759ab5a5f91ffaa32b599899bc614f83`; its exact-main CI completed 4/4 successfully. There is no separate host retrieval/indexing prerequisite for a narrowly admitted pure synthetic module Work Order. All product modules in this planning PR remain PLANNED; real provider permissions, financial security review and actual runtime tests are still distinct gates. **STOP:** no product code activation or financial operation is authorized by these design documents.


## FV-REPLAY-001 | Narrow synthetic-only source historically proposed, NOW MERGED (full R4 future)

Reviewed GOV-005 protected main `4f5a4ae2d18b7cccda222eeaee4836fab9469166`, [main CI 36566796296](https://github.com/KayzenRoot/fairview/actions/runs/36566796296) **4/4** and all eight accepted exclusively fictional source suites **388/388**. Separately admitted docs-first Work Order and exact lock provide ONE local self-generated `SYNTHETIC_REPLAY` owner: pure Node22 `src/replay/deterministic.mjs` with real adversarial `tests/replay/deterministic.test.mjs`. Fixed engine `fv-replay-001-v0`, model `mock-ledger-risk-execution-v0` and `SAME_CAPTURE_DOMAIN_MONOTONIC_INSERTION_V0`; caller must supply matching canonical invented dataset SHA-256 and seed. Only 1–64 invented source-local events, same domain/epoch/instrument; actual accepted Mock Clock, Market Data, Risk, Ledger and Execution are imported, not forged policy passes or external broker receipts. Events expose only already DELIVERED quote when mocked Risk/Execution evaluates; unknown source-event time is marked UNKNOWN instead of invented, cross-domain/backward clock and stale/noncontiguous quote block, equal receive time ties by persisted insertion index, partial/cancel/lost ACK keep conservative no blind retry. Output includes only metadata trace and canonical output event hash, no raw price/profit/latency assertions.

Historical `ReplayEventV0`, `VirtualClockV0`, `ReplayRunManifestV0`, `BenchmarkCaseV0`, all 18 listed R4 negative DESIGN obligations, cross-host causal ordering, independently licensed historical dataset records, realistic maker queue/fee/slippage/gas/real venue models, statistically supported latency p99 and comparable performance against real competitors remain FUTURE and NOT claimed by this narrow prototype. No new vendor toolkit or local host service is installed. Every result `fixture_only:true`, `execution_authorized:false`, `network_performed:false`, `persisted:false`, `authenticated_provider_evidence:false`, `kill_durable:false`, `financial_reconciliation_complete:false`, `real_market_performance_established:false`, `comparative_benchmark_supported:false`. Proposed ADR-007/008 remain NOT ADOPTED; real D-007/D-008 provider rights, PRIVATE-before-funded and financial HIGH_ASSURANCE gates remain OPEN. Nine ACTIVE strictly invented-only / eleven PLANNED is branch CANDIDATE until actual hosted PR HEAD 4/4, scoped review, normal merge and new postmerge exact-main CI; no independent checkpoint promotion.


## FV-GOV-006 | Latest exact-source Replay acceptance receipt (strictly synthetic only)

Reviewed PR #35 FV-REPLAY-001 (with documented same-WO CORR-001) merged normally into protected main `7ba98d9a0a81f2b85de89ce9c86e38356cd34487`. Exact-main post-merge [GitHub Actions 36569462331](https://github.com/KayzenRoot/fairview/actions/runs/36569462331) completed **4/4 SUCCESS**, including hosted Windows PowerShell 5.1, unchanged GEF pin, public tracked-tree security and all NINE ACTIVE exclusively in-memory fictional source harnesses: bootstrap 78, Risk 39, Policy 57, Clock 56, Market Data 79, Ledger 27, Execution 27, Portfolio 27, Replay 30 = **420/420 PASS**. The 20 registered IDs, ALL literal dependencies, paths and owned test globs remain unchanged; **9 ACTIVE STRICTLY SYNTHETIC source only / 11 PLANNED**. Replay imports and actually exercises accepted synthetic Clock/Market Data/Risk/non-durable Ledger/Execution inside a 64-event-max invented single-domain canonical SHA-256 metadata test engine. It offers NO real historical/licensed feed, broker, account, verified venue fill, cross-domain market benchmark or genuine PnL/latency. Each public Replay result keeps `fixture_only:true`, `execution_authorized:false`, `network_performed:false`, `persisted:false`, `authenticated_provider_evidence:false`, `kill_durable:false`, `financial_reconciliation_complete:false`, `real_market_performance_established:false`, `comparative_benchmark_supported:false`. Full Round-4 historical/multi-host and statistically supported comparative benchmark remain PROPOSED, not implemented. The preceding GOV-005 accepted source base `4f5a4ae2d18b7cccda222eeaee4836fab9469166` and 8-owner run 36566796296 388/388 are accurate **historical** snapshots. `FV-CP-0002-PROPOSED` stays `MIGRATION_DRAFT_NOT_APPROVED`, `independent_approval=false`. D-007 real venue/account/data/reviewer entitlement OPEN; D-008 repository PUBLIC fictional development and verifiably PRIVATE before funded; independently transactional durable Ledger, persistent Risk/kill, authenticated complete provider history, qualified external financial HIGH_ASSURANCE and proposed ADR-004/005/006/007/008 remain NOT SATISFIED/UNADOPTED.

FV-REPLAY-001 was docs-first: WO `89dccc27052cf5d5ef0aa184d08011473d354fb0` then exact Context Lock `0bd3447236195c1fd3e5def2def21695232fb8f0` before code. Initial PR [CI 36569112260](https://github.com/KayzenRoot/fairview/actions/runs/36569112260) FAIL: bootstrap 78/78 but Replay 12/30, eighteen failures from cloned canonical fixtures not recursively frozen as actual mock Risk's accepted injected portfolio/limits/kill contract requires. Correction in SAME WO/PR `FV-REPLAY-001-CORR-001` froze ONLY locally detached canonical copies, retained all adverse tests and denied untrusted sources. Final exact PR HEAD `88439d0b3122371bbed7e9e5e8384120914a5f56` [CI 36569215231](https://github.com/KayzenRoot/fairview/actions/runs/36569215231) **4/4 SUCCESS**, bootstrap **78/78**, Replay **30/30**. Normal merge then exact main `7ba98d9a0a81f2b85de89ce9c86e38356cd34487` run 36569462331 **4/4** with nine-suite **420/420**. Historical failed and corrected runs remain explicitly documented, never erased or presented as independent review.

The preceding R4 eighteen-adverse **design** matrix remains a FUTURE set of research/financial obligations; the current narrow 30-own-test corpus does not claim full provider-licensed historical replay, interhost causal timestamp proof, real maker priority/cost model, statistically adequate p99 or any actual comparison with competitors. Proposed ADR-007/008 remain NOT ADOPTED, and no future R4 architecture is silently activated by GOV-006 docs.


## FV-RESEARCH-001 | Historical invented A/A source proposal, now MERGED PR #39 (full R4 future)

Frozen protected source main `358a7e94600113bd1e1cca0d745800de3f31c03c`, [exact CI 36572663541](https://github.com/KayzenRoot/fairview/actions/runs/36572663541) 4/4 and ten exclusively synthetic source suites 448/448. A separately admitted Research source directly invokes accepted fabricated Market Data and pinned existing Replay twice on the IDENTICAL 1–4 small invented event cases with a shared quote-quality policy. Failures and uncertain mock effects remain visible as inconclusive. It tests only deterministic local model metadata, never financial performance, a strategic winner or measured production latency. All eighteen original R4 negative design cases, lawful historical market-data rights, realistic comparative fill/cost benchmark, externally observed p99 and qualified independent review remain FUTURE. Proposed ADR-007/008 are not adopted and D-007/D-008 and actual durable Ledger/Risk/kill gates remain open. Candidate eleven ACTIVE strictly synthetic source / nine PLANNED only following exact HEAD verified CI, NOT_INDEPENDENT audit and normal guarded merge; no change to financial checkpoint approval.


## FV-GOV-008 | Latest accepted mock Research evidence

Reviewed Research PR #39 exact source main `ddfcccd8ac104c3e6f0c5078e723380e09ecdbc4`, [push CI36575588876](https://github.com/KayzenRoot/fairview/actions/runs/36575588876) passed 4/4 and ALL eleven only-fabricated owned suites 474/474. Its real accepted mock Market Data and Replay are invoked twice on identical fake inputs, with incomplete/unknown cases counted. Earlier PR runs failed bootstrap81/82 from own obsolete documentation wording, then Research22/24 owing to two owned fixture setup errors; same-PR corrections fixed only those docs/tests. Final exact PR head `9b999735e349ae3b24a1a50c29371b0b06277000` run36575259756 4/4 Research24/24. Original eighteen Round-4 research negative design cases, lawfully licensed historical data, matched financial fill/cost model and valid external comparative benchmarks remain FUTURE. ADR-007/008 not adopted and no real provider/financial authority or checkpoint promotion occurs in GOV008.
