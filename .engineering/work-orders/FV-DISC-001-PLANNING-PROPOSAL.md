# FV-DISC-001 | Modular arbitrage product discovery | PLANNING PROPOSAL ONLY

Date: 2026-09-28. Repository: KayzenRoot/fairview. Base main: `9eb01876adf2e1f2408b451e8cc08abb123173a5`.
Owner request: organize the Fairview product modules now, then plan each module and research reusable licensed technology. Benchmark Westernpips-published capabilities without claiming equivalence or superior performance.

## Authority and explicit gate separation
- This is a documentation/PLANNED-harness proposal in a DRAFT PR, **not** an admitted implementation Work Order.
- `FV-BOOT-001` issue #1 remains OPEN: local Fairview precheck PASS, but the reported isolated HIVE FULL gate FAILED. The actual semantic provider was disabled/unconfigured, index was at prior main, corpus BLOCKED with zero chunks and complete restart durability unverified. Evidence is the owner's private 2026-09-28 R8 report; it is not independent audit.
- Current canonical `.engineering/CHECKPOINT.md` and `CHECKPOINT.json` remain unchanged; official HIVE v1.0.3 pin remains immutable; isolated candidate `f51c13487a21f22c7c8e873c42722bfac5fd88f8` remains dev-only and unreleased.
- Do not activate modules, modify production systems, trade, connect funded accounts, deploy wallets, obtain secrets, run experimental broker protocol workarounds, promise profits or bypass broker/exchange restrictions. No source runtime or test placeholders under `src/` until a separate admitted implementation WO and executable deterministic harness.
- All canonical code/docs English; operator review and future Codex prompts pt-BR. Complete chat executor prompts require polished downloadable PDFs per D-003.

## Allowed change surface
1. This planning-only WO and context lock.
2. `docs/architecture/ARBITRAGE-MODULE-MAP.md`, `docs/architecture/TECHNOLOGY-LANDSCAPE.md` and per-module responsibility charters in `docs/architecture/modules/`.
3. `harness/modules.json`: retain all existing module IDs and existing ownership; add only `state=planned` module entries and dependency edges, never activate or leave unmapped planned source paths.
4. `tests/bootstrap/impact.test.mjs`: only if an existing invariant needs stronger deterministic coverage.
No `src/`, trade code, live connectors, credential config, CI workflow, gitlink, official pin, checkpoint or production release change.

## Product capability reference
Westernpips's public marketing site advertises 1 LEG, 2 LEG LOCK, 1 LEG MULTI FEED, hidden variations, trade copier, backtester, tick analyzer, multi-provider/gap/spread charts, FIX/API/ITCH/EA/cTrader connectivity, spread/drawdown/news/execution controls. This is vendor description, NOT independently verified performance or product license to copy internals. Fairview's planned feature parity target is a documented behavioral specification: one-leg and two-leg research, multi-feed analysis, tick traces, replay, copier-like allocation only if authorized, full operator visualization and risk control. NO evasion, concealment of order origin, disallowed stale-quote execution or manipulative MEV.

## New research directions
- Bitemporal tick provenance + event-time normalization, clock uncertainty and feed/venue skew; each adapter provides verifiable freshness and sequence-gap contracts.
- Opportunity scoring based on *executable* bid/ask depth, fees, slippage, market impact, latency distribution, partial-fill and hedge exposure; fail closed on unknown inputs.
- Deterministic single-/two-leg state machines and crash-only reconciliation with independent risk admission and persistent idempotency.
- Cross-CEX spot and triangular arbitrage in REPLAY first; DEX/Uniswap quotes and gas-aware CEX/DEX feasibility later; no unapproved atomic execution or signing.
- Isolated strategy harnesses, adverse scenario libraries, packet/tick replayer, p50/p95/p99 end-to-end telemetry, provenance and post-trade attribution.
- Bounded AI advisory for regime classification and operator evidence only, never a risk-gate override or direct wallet/order authority.

## Design questions and exit criteria
For EACH module establish: user capability, explicit boundaries/owner, candidate OSS technologies + exact license/legal review, contracts and data schema, failure modes, independent risk controls, fixtures, replay cases, benchmark baseline, ADR and approved activation WO. Selected Forex execution venue/market data feed, two compatible CEX venues, Uniswap deployment, commercial data rights, execution permissions, threat model, capital limits and independent reviewer remain OPEN (D-007).

Planning exit only: module map and research sources committed to an exact-head DRAFT PR; registry validates, existing active bootstrap tests/CI remain green, no secrets, no mutations or product claims. Product implementation remains BLOCKED until FV-BOOT-001's FULL/independent gates and separate WO admission. Keep issue #1 open.

## Round 1 | Forex venue and reference-data eligibility | 2026-09-28 | PLANNING ONLY
The owner requested continuing the existing same-draft FV-DISC-001 module plan, beginning with the `policy` module and Forex venue research. Add a sourced, read-only/documentary analysis; do **not** select a permitted production venue from generic provider marketing, grant API privileges, trade, create a product implementation, or claim speed/profit relative to Westernpips. `FV-BOOT-001` remains the gate for product source activation.

**Allowed incremental paths after this docs-first amendment:** `docs/architecture/FOREX-VENUE-POLICY-R1.md` (candidate comparison, official source URLs, operator decisions and STOP conditions), `docs/architecture/adrs/FV-ADR-001-PROPOSED-FOREX-VENUE-SELECTION.md` (proposed, not accepted), the existing `docs/architecture/modules/policy.md` and `docs/architecture/modules/forex.md` charters and `tests/bootstrap/impact.test.mjs` for deterministic documentation/registry guard only; this WO and context lock may be updated. Do not change any other file, module activation, harness registry state, production connector, dependency or runtime source in Round 1.

**Research decision gates:** declared deployment jurisdictions, venue account eligibility, venue contract explicitly allowing each intended automation/arbitrage strategy, developer application/API consent, permitted reference feed and intended internal/commercial redistribution of tick and derived data, symbol/product comparability (spot FX vs CFD), verified feed rate and throttling, rate and order limits, fee schedule, adverse slippage and last-look exposure, timestamps, evidence/receipt custody, external independent security review. All unknowns remain OPEN and fail closed to RESEARCH_ONLY. No brokerage claim can grant another broker's permission.

**Proof boundary:** compare documented provider API capabilities and explicit limitations; no real external credentials or broker creation. Synthetic fixture test must catch a candidate erroneously marked LIVE_APPROVED, a data source erroneously marked REDISTRIBUTABLE without documented license, absence of a formal authorization gate and any product module moved ACTIVE. Exact-head four hosted CI checks and self-audit required; keep draft and no checkpoint promotion. Source research: https://help.ctrader.com/open-api/ ; https://help.ctrader.com/open-api/terms-of-use/ ; https://developer.oanda.com/rest-live-v20/pricing-ep/ ; https://www.lmax.com/connectivity-guide ; https://www.lmax.com/exchange/market-data-access ; https://www.truefx.com/truefx-terms-and-conditions/ .
