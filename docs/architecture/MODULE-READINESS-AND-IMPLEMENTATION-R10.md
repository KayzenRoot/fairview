# FV-DISC-001 | Round 10: canonical 20-module readiness and proposed admission order

**Status: PROPOSED / PLANNING ONLY.** Snapshot of the exact `harness/modules.json` at Round-9 reviewed PR head `d4db94106f1a7cdde75d3aa2ba8beb192b1c749e`, main `9eb01876adf2e1f2408b451e8cc08abb123173a5`. FV-BOOT-001 #1 and FV-DISC-001 #16 remain OPEN, draft PR #17 is NOT accepted product code. The 20 module IDs, reserved ownership, dependency edges, currently active tests and source state are taken from the repo registry, **not** proposed new IDs. The existing bootstrap module is ACTIVE for development-harness selection but its external isolated-host R8 HIVE FULL gate and independent approval were FAILED/PENDING in the latest supplied evidence. All **19 product modules are PLANNED with no source or owning product tests**. No live, demo or paper trading components have been implemented.

## 1. Exact graph-derived module inventory

All `depends_on` values and owned paths below are **literal from the registered source**, not the desired business sequence. A wave means topological *eligibility AFTER prior independently admitted dependencies*, not a batch approval or permission to code now. Source path reservations are NOT existing implementation files.

| Canonical ID | Current registry state | Earliest graph wave | Exact registered dependencies | Reserved source / harness ownership | Governing design round |
|---|---|---:|---|---|---|
| `bootstrap` | ACTIVE | 0 | none | `bootstrap-owned existing paths` / `tests/bootstrap/` | FV-BOOT-001 / bootstrap charter |
| `risk` | PLANNED | 3 | `market-data`, `clock`, `policy` | `src/risk/` / `tests/risk/` | R3 Ledger/Risk/Execution; ADR-005 |
| `forex` | PLANNED | 5 | `risk`, `market-data`, `clock`, `execution` | `src/forex/` / `tests/forex/` | R1 provider contract; ADR-001 |
| `cex` | PLANNED | 5 | `risk`, `market-data`, `clock`, `execution` | `src/cex/` / `tests/cex/` | R6 CEX connectors; ADR-011 |
| `defi` | PLANNED | 5 | `risk`, `market-data`, `execution`, `policy` | `src/defi/` / `tests/defi/` | R7 DEX/Uniswap; ADR-013 |
| `ai` | PLANNED | 7 | `risk`, `research` | `src/ai/` / `tests/ai/` | R9 secure Web/AI; ADR-018 |
| `web` | PLANNED | 8 | `risk`, `portfolio`, `observability`, `ai` | `src/web/` / `tests/web/` | R9 secure Web/AI; ADR-017 |
| `integration` | PLANNED | 9 | `risk`, `forex`, `cex`, `defi`, `ai`, `web`, `policy`, `clock`, `market-data`, `ledger`, `execution`, `portfolio`, `replay`, `research`, `strategy-forex`, `strategy-cex`, `strategy-defi`, `observability` | `src/contracts/` / `tests/integration/` | R0 Architecture + R10 ADR-020 |
| `policy` | PLANNED | 1 | none | `src/policy/` / `tests/policy/` | R1 Forex venue policy and ADR-001 |
| `clock` | PLANNED | 1 | none | `src/clock/` / `tests/clock/` | R2 clock/market-data; ADR-002 |
| `market-data` | PLANNED | 2 | `clock` | `src/market-data/` / `tests/market-data/` | R2 provenance; ADR-003 |
| `ledger` | PLANNED | 2 | `policy` | `src/ledger/` / `tests/ledger/` | R3 Ledger/Risk/Execution; ADR-004 |
| `execution` | PLANNED | 4 | `risk`, `market-data`, `clock`, `ledger` | `src/execution/` / `tests/execution/` | R3 order-state/hedge; ADR-006 |
| `portfolio` | PLANNED | 4 | `risk`, `ledger` | `src/portfolio/` / `tests/portfolio/` | R8 Portfolio/Observability; ADR-015 |
| `replay` | PLANNED | 5 | `market-data`, `clock`, `execution`, `ledger`, `risk` | `src/replay/` / `tests/replay/` | R4 Replay/Benchmark; ADR-007 |
| `research` | PLANNED | 6 | `market-data`, `replay` | `src/research/` / `tests/research/` | R4 Replay/Benchmark; ADR-008 |
| `strategy-forex` | PLANNED | 6 | `forex`, `replay`, `portfolio` | `src/strategy-forex/` / `tests/strategy-forex/` | R5 Forex strategies; ADR-009/010 |
| `strategy-cex` | PLANNED | 6 | `cex`, `replay`, `portfolio` | `src/strategy-cex/` / `tests/strategy-cex/` | R6 CEX strategies; ADR-012 |
| `strategy-defi` | PLANNED | 6 | `defi`, `replay`, `portfolio` | `src/strategy-defi/` / `tests/strategy-defi/` | R7 DEX feasibility; ADR-014 |
| `observability` | PLANNED | 5 | `market-data`, `clock`, `execution`, `ledger`, `risk` | `src/observability/` / `tests/observability/` | R8 Portfolio/Observability; ADR-016 |

The `integration` module's literal 18 dependencies are not simplified away. `bootstrap` is not listed as a dependency of each product module in the registry, but **FV-BOOT-001 FULL and independent review are a GLOBAL governance gate**, not a graph edge. Per-module `paths` in the registry remain reserved and untouched. No `src/` or planned `tests/<module>/` directory is created by this planning PR.

## 2. Proposed implementation waves extracted from the existing DAG

| Wave | Dependency-eligible modules | Candidate future milestone, NEVER automatic admission |
|---:|---|---|
| 0 | `bootstrap` | External FV-BOOT-001 independent FULL, no product admission |
| 1 | `policy`, `clock` | Two independent pure cores and negative harnesses |
| 2 | `market-data`, `ledger` | Proof-based normalized data plus local durable events |
| 3 | `risk` | Independent risk admissions and persistent kill under uncertainty |
| 4 | `execution`, `portfolio` | Transport state machine and separately versioned portfolio projection |
| 5 | `forex`, `cex`, `defi`, `replay`, `observability` | Parallel market/venue adapters and deterministic replay/telemetry, each licensed independently |
| 6 | `research`, `strategy-forex`, `strategy-cex`, `strategy-defi` | Benchmark lab and three separately licensed family strategy harnesses |
| 7 | `ai` | Redacted bounded no-tools advisory in sandbox only |
| 8 | `web` | Server-side authenticated scoped UI, no client-controlled trading |
| 9 | `integration` | Full integration after all 18 product dependencies are ACTIVE |

These waves permit independent WOs within one layer where dependencies are already ACTIVE. They **do not require** all market product paths to be completed before the next *unrelated* WOs can be written or researched, but any module activation must prove its literal dependencies. The business P0–P7 grouping in `docs/architecture/ARBITRAGE-MODULE-MAP.md` remains the broad product workstream order; this exact DAG is the implementation gate order. If a proposed early deliverable conflicts with the graph, the conflict is recorded and resolved by a **separate** admitted governance/ADR/registry change and full impact evidence, not a hidden exception.

**Important graph constraints discovered by consolidation:**
- `risk` depends ONLY `market-data`, `clock`, `policy`. `portfolio` currently depends `risk` and `ledger`. R8 proposes a `PortfolioRiskViewV0` eventually consumed by Risk, but adding `risk -> portfolio` now makes a cycle. Initial Risk proof MUST consume a synthetic, versioned immutable portfolio-view input supplied by its module harness; later the integration seam can bind an authenticated Portfolio snapshot, without changing this registry. More invasive graph changes require separate ADR and tests.
- `replay` explicitly depends on `execution` and `ledger`, so an ACTIVE replay engine cannot precede their accepted implementation under the current graph. **Earlier module-local synthetic mocks** used to test Market Data/Risk/Execution are not a secretly activated Replay module.
- `web` depends `ai` along with `risk`, `portfolio`, `observability`. A standalone read-only dashboard could be a useful product slice, but it is **NOT activation-eligible before AI** under this exact graph. A different minimal UI rollout would require a separate accepted dependency change, not this planning round.
- `integration` depends on every other product module and therefore activates LAST. Upstream WOs MUST include **module-owned interface/contract tests early**. Do not place required early tests solely under an inactive `tests/integration/` harness and then claim a green release.
- `defi` and `strategy-defi` can do only a future gated read-only and synthetic first slice before any independently reviewed wallet signing. `forex`, `cex` and their strategies need exact provider/account/strategy rights before permitted external adapters, independent from a pure synthetic evaluator.

## 3. Proposed per-module technology, acceptance proof and open external decision

All third-party entries here are **carried forward from R1–R9 and the repo's TECHNOLOGY-LANDSCAPE.md**. These were evaluated in earlier planning, not freshly installed, version-pinned or retested in Round 10. Each one still requires upstream exact-version, licence/transitive review, vendor/API and data-rights evidence, rollback and a measured reason for adoption. Alternatives that add extra queues, runtimes or distributed services by default are NOT assumed to improve latency.

| Module | Candidate technology, NOT adopted | First dedicated negative-proof focus | Still open |
|---|---|---|---|
| `risk` | Pure exact-decimal Rust deterministic Risk Kernel (candidate) | Default DENY, worst possible unknown fills, local mock immutable risk snapshot, kill persistence | Signed per-account/notional/loss limits and independent financial approval |
| `forex` | One future approved cTrader/OANDA/LMAX adapter candidate; FIX only if entitled | Synthetic broker-specific quotes/ticks, ACK/partial/reject/last-look and contract parity | Named Forex broker, account, strategy and independent fast-feed rights |
| `cex` | CCXT Pro reference; possible native Binance/Kraken Spot adapters | U/u snapshot gap, CRC32/orderbook resync, issuer/tick/lot/fee and private status mock | TWO exact eligible CEX spot entities, account/API/data permissions |
| `defi` | v3/v4-specific Uniswap SDK, viem read-only, optional future Anvil | Synthetic wrong-chain/hook, same-block state, reorg ancestry, gas and token identity | ONE selected chain/pool/token/hook, RPC terms and finality |
| `ai` | No-tools read-only structured AI advisory; model unspecified | Prompt injection, forged role, cross-tenant/rights leak, fabricated fill and model outage | Data-use consent, model/privacy/retention and independent redaction tests |
| `web` | Next.js App Router DAL + optional TanStack Query, read-only SSE | Server RBAC/BOLA, stale stream/cache, kill ACK ambiguity, UI offline | Auth provider, tenant scope, private deployment, control-plane approval |
| `integration` | Typed contracts + module-owned seam tests; full release harness LAST | All dep modules ACTIVE, cross-domain adverse replay, independent full suite and signed release | All 18 graph dependencies and exact approved deployment/security/venue receipts |
| `policy` | Pure Rust fail-closed policy/evidence receipt (candidate) | Unapproved region/account/strategy/feed and expired rights DENY in dedicated harness | Exact legal venue, feed redistribution rights and reviewer |
| `clock` | Rust Instant/SystemTime; conditional chrony/PTP after host proof | UNKNOWN_CLOCK, CROSS_DOMAIN, backward wall and epoch failures, clock error bounds | Target host/NIC/cross-host uncertainty budget |
| `market-data` | Typed Rust in-process normalization; optional rights-checked Arrow/Parquet | Sequence gaps/out-of-order/stale/throttled feeds, rights/precision and fail-closed book state | Actual data licence, feed semantics and rights |
| `ledger` | Separate PostgreSQL immutable event ledger/unique local intent/WAL (candidate) | Duplicate-concurrent intent, MAY_HAVE_SENT crash, lost ACK, duplicate fill, recovery | Separate owned product DB, scoped IDs/retention and backup policy |
| `execution` | Rust/Tokio bounded routing with durable Ledger and mock venue | No blind retry on lost ACK, cancel/fill race, partial leg and rejected hedge, safe reboot | Per-venue status, idempotency and strategy permissions |
| `portfolio` | Exact-decimal PostgreSQL versioned read model and scoped local reservations | Complete authenticated synthetic cursor, duplicate fill, absent balance, 40001 LOCAL retry | Real broker history/positions and cost-basis policy |
| `replay` | Small deterministic virtual-time native engine; compare NautilusTrader/LEAN separately | Poisoned future-event, ordering tie, same manifest canonical hash, conservative fills | Synthetic owned dataset/rights, versioned latency/fee model |
| `research` | Offline Python/Pandas/rights-checked Parquet and optional LEAN comparator | Matched trace/cost model, failed trials included, insufficient p99 handled | Lawful historical rights, baseline/hardware and statistical acceptance |
| `strategy-forex` | Pure typed native One Leg/Two Leg/Multi Feed evaluators | Reference not executable, mirrored-feed quorum, partial leg, cost/clock mismatches | Specific Forex strategy grants, valid independent sources |
| `strategy-cex` | Native synthetic cross-venue, triangular and XEMM; Hummingbot comparison | Inverse ask, dust/min notional, venue-local funds, maker cancel/fill race | Both permitted venues, product parity, exact fee tiers |
| `strategy-defi` | Pure simulated CEX/DEX spread and same-chain route model | Hook/gas/reorg/revert/CEX leg unknown, no instant bridge or atomic hedge | Licensed chain/RPC, pool, selected CEX and route permissions |
| `observability` | Async redacted OTel, Prometheus histograms, Grafana alerts as candidates | Same-domain timing, label/privacy guard, collector outage and alert ACK not receipt | Private operations retention, thresholds and mandatory alert route |

The **first candidate implementation work orders after external P0 approval** are narrow and synthetic: `FV-POLICY-001` (pure policy evidence and denial rules) and `FV-CLOCK-001` (pure same-domain clock normalization and uncertainty), in either order. These identifiers are PLANNED references only, not existing admitted issue/PR/WO or a release commitment. `FV-DATA-001` as described in the existing governed backlog may later encompass normalized data and replay, but this table's graph requires separately scoped `market-data` and `ledger` source admissions before `risk` and `execution`. Any issue-numbering/WO mapping must be explicitly reconciled in a future reviewed planning update rather than silently rewriting the canonical backlog.

## 4. Mandatory external blockers and independent approval chain

| Gate | Verified source status at this planning snapshot | Required evidence to unlock NEXT activity |
|---|---|---|
| G0: existing FV-BOOT-001 host FULL | **OPEN / latest owner report FAILED** despite FairView precheck PASS | Isolated HIVE semantic provider configured, fresh index, nonempty authorized corpus, MCP/context delivery and restart/durability results on the user's machine. Maintain official published HIVE v1.0.3 pin unless a separately reviewed stable release is explicitly adopted. |
| G1: independent exact-head source and host audit | **NOT SUPPLIED**. Owner self-audit and 4/4 docs CI are not independent acceptance | Named independent auditor, verified exact SHA/base/status evidence, HIGH/CRITICAL defects closed, signed opinion scoped to FV-BOOT-001 FULL; canonical checkpoint promotion ONLY through existing source hierarchy. |
| G2: per-module WO and harness admission | **19 PLANNED, zero active product test owners** | One independently admitted scope/branch/allowlist, dependencies active, actual nonempty deterministic negative tests under that module, typed contracts, failure-state and kill/recovery proof, exact-head CI plus human sign-off. |
| G3: venue/chain and legal data/account rights | **D-007 OPEN** | One qualified Forex broker and separately licensed reference feed, TWO authorized CEX spot venue accounts and a compatible instrument/fee schedule, ONE permitted chain and exact Uniswap deployment/pool/RPC licence; operator region, strategy and redistribution rights per source. Do not assume Binance/Kraken or cTrader/OANDA are selected. |
| G4: safety limits / runtime secrecy / deployment | **NOT ADMITTED** | Independent financial risk limits, external managed secret-store and incident/rotation/rollback plan, venue-specific account permission and observed mock/demo fail-closed evidence. Public-dev repo MUST have authoritatively verified PRIVATE visibility before any financial production deployment; past public history is still public. Never commit any FairView `.env` (including `.env.example`) or raw real financial data. |
| G5: production acceptance / matched benchmark | **NOT IMPLEMENTED OR MEASURED** | Whole-pipeline authenticated fill and reconciliation proof, independent Risk Kernel/kill, one-leg failure and restart drills, licensed matched historical + controlled demo, observed p50/p95/p99 with valid sample/clock domains and all costs/losses, HIGH_ASSURANCE independent audit, runbooks and signed conditional limited-live rollout. No profit/outperformance guarantee. |

**G0/G1 block all new PRODUCT SOURCE admission under the present decision hierarchy**, despite the HIVE architecture being strictly engineering context and **not** a live trading runtime dependency. This is a project-governance gate, not a technical claim that a future risk service needs HIVE to stay online. Documentation-only research may proceed safely in the currently authorized PR under its explicit scope.

## 5. Module acceptance gates inherited from R1–R9

Every independently admitted source WO must enforce the exact version and fail-closed contracts in the linked governing document and not discard its negative fixtures. R1: venue policy/research-only. R2: three timestamp categories and data provenance. R3: durable `MAY_HAVE_SENT` vs unknown remote broker truth and persistent independent kill. R4: virtual-clock replay with no future data and cost-complete simulated labels. R5: permitted Forex strategies and independent-source Multi Feed. R6: venue-specific CEX orderbook recovery, venue-local balances and non-atomic route/hedge. R7: chain ID, contract/hook, same-block/hash, chain-specific finality and full gas. R8: complete external portfolio reconciliation, redacted asynchronous observability and incident escalation. R9: server-authorized Web/operator view and no-tools, untrusted-evidence AI.

The first activated source module harness must run true deterministic unit/negative tests. The current bootstrap tests are **documentary design assertions**; they do not validate any product execution, API adapter, runtime latency, correctness of backtest assumptions or production account permissions. An independent reviewer must be able to reproduce source fixtures from an immutable manifest and inspect every fail-closed outcome; unknown changed paths and shared contracts expand impact rather than silently skip tests.

## 6. Required per-module future Work Order and evidence envelope

An independently approved module WO must spell out: exactly ONE primary owner and target harness; known canonical base/head, expected dependency states and exact allowed source/test/doc paths; accepted governing ADRs and typed interface; exact versions/licences; all legally scoped external entitlements; deterministic positive and negative fixtures including crash/timeout/unauthorized/invalid data; prevention of accidental live order/signature; credible test commands/expected outputs; latency/data-rights/privacy proof appropriate to that module; exact-head CI/security review, independently signed evidence bundle, rollback and concrete STOP CONDITION. A human can reuse the *proposal* in `docs/architecture/FUTURE-WORK-ORDER-TEMPLATE-R10.md`; it is **NOT** an admitted executor prompt or a substitute for the PDF rule D-003.

### No premature acceptance shortcuts

A 4/4 hosted bootstrap CI or owner-only PR comment is not FULL host pass, independent audit, production DoD or an execution license. An apparently favorable modelled spread isn't a risk-admitted executable net opportunity. A local DB exactly-once key isn't broker exactly-once effect. The Web and AI cannot bypass Risk/Policy. Future integration must preserve these properties in negative tests, not merely display green dashboards.

## 7. Round 10 STOP CONDITION

This document is a DRAFT **readiness plan** at a verified repo baseline, with **zero product source or module-status changes**. Keep PR #17 OPEN/DRAFT; hold accepted pins, main, canonical CHECKPOINT and the 20-module registry unchanged. FV-BOOT-001 #1 stays OPEN until independently evidenced G0/G1. No credential, signed wallet action, data-rights assumption, production or even demo order, host HIVE mutation, live benchmark, source-activation or claimed competitor superiority is authorized.