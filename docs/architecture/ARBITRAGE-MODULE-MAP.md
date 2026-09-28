# Fairview arbitrage platform | Modular map (proposal)

**Planning-only** under `FV-DISC-001`; does NOT activate product source. Base main `9eb01876adf2e1f2408b451e8cc08abb123173a5`. Current accepted official HIVE v1.0.3 pin and FV-BOOT-001 issue #1 remain unchanged. Fairview isolated HIVE FULL was reported FAILED on 2026-09-28.

## Aim and competitive reference
Research a multi-market arbitrage platform drawing on publicly described Westernpips Private 7 behavior, not its code, private protocols, performance figures or concealed execution mechanisms. Vendor marketing lists One Leg, Two Leg Lock, Multi Feed, hidden variants, Trade Copier, backtesting, tick and gap analyzers, FAST/SLOW feeds, FIX/API/ITCH/EA/cTrader, spread/news/drawdown control and visual dashboards. Source: https://westernpips.com/ (checked 2026-09-28). Vendor speed/profit examples are UNVERIFIED for our hardware/venues. Implement only venue-permitted observable behaviors; deliberately EXCLUDE hidden/disguised order origin, circumvention of terms, stale-quote abuse prohibited by the venue and manipulative MEV.

Success is defined by *measured*, independently reproducible matched test conditions: end-to-end p50/p95/p99 market-data-to-fill latency, timestamp uncertainty, throughput under burst, order acceptance/fill/reject/slippage distributions, one-leg loss containment, net executable edge after fees/carry/gas and crash/reconciliation correctness. No guarantee of outperforming any competitor or making money.

## Source-backed existing baseline
Current harness IDs: bootstrap ACTIVE; risk, forex, cex, defi, ai, web, integration PLANNED. Preserve all of them. New PLANNED IDs: policy, clock, market-data, ledger, execution, portfolio, replay, research, strategy-forex, strategy-cex, strategy-defi, observability. Total: 20 registered modules. Each product source path below is RESERVED, not an implemented directory. Module descriptions reside in `docs/architecture/modules/` until admitted WOs activate code paths and nonempty deterministic tests.

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
4. HIVE is optional engineering context only, **not** on any live order path. Existing GEF harness and pinned release survive unchanged.
5. Public development under D-008; repo PRIVATE with independently approved high-assurance gates before any live deployment.

## Planning sequence (one module and one technology ADR per checkpoint)
P0. Finish FV-BOOT-001 R8 FULL semantic/indices/corpus/MCP/durability and independent review, without upgrading official stable pin.
P1. Policy and venue eligibility discovery; settle one Forex authorized feed/venue, two CEX spot pairs and one chain/pool. Resolve license, commercial data redistribution, secrets and test access.
P2. Clock + market-data + canonical contracts; replay fixture collection with provenance and no live credentials.
P3. Ledger + risk + execution, negative fault-injection and reproducible no-order paper mode.
P4. Forex adapter then strategy-forex One Leg/Two Leg/Multi Feed research. Contract-specific strategies only after venue permission.
P5. Two CEX adapters then strategy-cex cross-venue and triangular replay; one-leg hedge safety.
P6. DEX read-only data + strategy-defi gas/reorg simulations, independent signing threat model if expanded.
P7. Portfolio, telemetry, research, bounded AI and operator web; integration, independent audit and phased authorized paper then limited-live admission.

**STOP CONDITION:** This proposal is only documentation and a planned graph. Do not convert planning to admitted source work while R8 FULL/independent gates remain open. Each module gets a separate admitted WO, deterministic harness and exact-head CI before source implementation.