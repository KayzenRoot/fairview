# Fairview arbitrage platform | Modular map (proposal)


## Aim and competitive reference
Research a multi-market arbitrage platform drawing on publicly described Westernpips Private 7 behavior, not its code, private protocols, performance figures or concealed execution mechanisms. Vendor marketing lists One Leg, Two Leg Lock, Multi Feed, hidden variants, Trade Copier, backtesting, tick and gap analyzers, FAST/SLOW feeds, FIX/API/ITCH/EA/cTrader, spread/news/drawdown control and visual dashboards. Source: https://westernpips.com/ (checked 2026-09-28). Vendor speed/profit examples are UNVERIFIED for our hardware/venues. Implement only venue-permitted observable behaviors; deliberately EXCLUDE hidden/disguised order origin, circumvention of terms, stale-quote abuse prohibited by the venue and manipulative MEV.

Success is defined by *measured*, independently reproducible matched test conditions: end-to-end p50/p95/p99 market-data-to-fill latency, timestamp uncertainty, throughput under burst, order acceptance/fill/reject/slippage distributions, one-leg loss containment, net executable edge after fees/carry/gas and crash/reconciliation correctness. No guarantee of outperforming any competitor or making money.

## Source-backed existing baseline
Observed merged protected main at `3bc582a259077e137e4227ef4e40cad8ff186fb6`: 20 module IDs, five ACTIVE including bootstrap and four invented-only kernels (policy, clock, market-data and non-durable in-memory ledger); 15 other owners PLANNED. Ledger source and real owned negative tests merged via PR #25, provenance guard corrected in PR #27, exact-main CI 4/4. All other product source/test paths remain reserved; charters live under `docs/architecture/modules/` pending their own admitted WOs, real owned tests and correct dependency order.

## Workstreams
| Layer | Modules | Responsibility |
|---|---|---|
| Foundation and safety | bootstrap, policy, clock, risk | Dev gates, signed permissions, clock quality, deterministic fail-closed decisions |
| Data and connectors | market-data, forex, cex, defi | Authorized multi-feed/venue connectivity and canonical event contracts |
| Execution and state | ledger, execution, portfolio | Idempotent orders, one-leg recovery and reconciled balances |
| Strategies | strategy-forex, strategy-cex, strategy-defi | Separate Forex latency, CEX routes and gas-aware DeFi research |
| Proof and intelligence | replay, research, observability, ai | Deterministic simulation, benchmark lab, incident telemetry and bounded advisory |
| Operator and release | web, integration | Browser control plane, contract/integration proofs and release gate |

### Expected data flow
Authorized reference and venue feeds -> provenance/clock/sequence normalization -> opportunity model -> risk/policy admission -> durable intent ledger -> execution adapters -> fills/unknown-state reconciliation -> portfolio/telemetry. The SAME normalized traces must feed replay and paper modes; AI and the web UI have advisory/operator authority only, never bypass independent execution/risk.

### Westernpips reference coverage and deliberate additions
| Publicly marketed feature | Fairview research target | Difference to test |
|---|---|---|
| One Leg / fast-slow quotes | Explicitly permitted reference-vs-executable bid/ask signal | Fee/depth/staleness/last-look-adjusted executable opportunity |
| Two Leg Lock / Standard | Explicit two-leg intent with bounded recovery | Deterministic crash/partial-fill/one-leg-negative fixtures |
| Multi Feed | Timestamped multi-source consensus and skew gates | Source provenance and measurable false-signal rejection |
| Tick/Gap/Spread charts, Analyzer | Trace/replay/opportunity and fill attribution dashboards | Same trace links observed spread to actual order receipts |
| Trade Copier | Optional controlled multi-account allocation (post-permission) | Per-account risk and idempotency, never covert duplication |
| Backtester | Deterministic replay with orderbook and fees | Reproducible pessimistic fill/slippage scenarios |
| FIX/API/ITCH and terminal adapters | Only documented approved FIX/API/WebSocket adapters | Per-venue permission check and contract fixtures |
| Hidden/masking variants | EXCLUDED | No concealment or policy evasion |
| Beyond Westernpips marketing scope | CEX triangle, gas-aware DEX research, isolated AI advisory | Compare only after legal, licensing and measured tests |

## Mandatory cross-cutting requirements
1. Every module gets a charter, typed input/output contracts, owning test harness, adversarial failure matrix and measurable STOP condition before activation.
2. Risk Kernel is isolated and authoritative for all trade intents. No LLM-driven direct trading, unrestricted signing, credential publication, profit guarantees or default-live mode.
3. Closed safety surface: stale/unproven data, unconfigured venue, absent balance, conflicting state or new unexplained sequence gap means STOP.
5. Public development under D-008; repo PRIVATE with independently approved high-assurance gates before any live deployment.

## Planning sequence (one module and one technology ADR per checkpoint)
P1. Policy and venue eligibility discovery; settle one Forex authorized feed/venue, two CEX spot pairs and one chain/pool. Resolve license, commercial data redistribution, secrets and test access.
P2. Clock + market-data + canonical contracts; replay fixture collection with provenance and no live credentials.
P3. Ledger + risk + execution, negative fault-injection and reproducible no-order paper mode.
P4. Forex adapter then strategy-forex One Leg/Two Leg/Multi Feed research. Contract-specific strategies only after venue permission.
P5. Two CEX adapters then strategy-cex cross-venue and triangular replay; one-leg hedge safety.
P6. DEX read-only data + strategy-defi gas/reorg simulations, independent signing threat model if expanded.
P7. Portfolio, telemetry, research, bounded AI and operator web; integration, independent audit and phased authorized paper then limited-live admission.

**STOP CONDITION:** Planning PR #17 was merged after native foundation PR #18, followed by four individually admitted invented-only product source WOs (policy, clock, market-data and non-durable ledger), plus a separate Ledger state-provenance correction. None qualifies a real financial venue or durable storage. The former external local-service prerequisite was withdrawn by D-009. Any remaining product owner still requires a separate admitted WO, proven direct dependencies, owned adversarial harness and exact-head CI; external/privileged financial work remains blocked by independent security and actual provider-rights gates.

**Current foundation boundary (owner D-009):** Git/Source Pack/Node 22 and the pinned GEF submodule are the only development foundation dependencies. Foundation migration PR #18 was merged at `694fe60c759ab5a5f91ffaa32b599899bc614f83`; its exact-main CI completed 4/4 successfully. There is no separate host retrieval/indexing prerequisite for a narrowly admitted pure synthetic module Work Order. The original planning PR did not itself activate any product module; later separately admitted fictional-only source PRs did activate three isolated harness owners. Real provider permissions, financial security review and actual runtime tests remain distinct gates. **STOP:** no product code activation or financial operation is authorized by these design documents.
