# FV-DISC-001 | Round 10: canonical 20-module readiness and proposed admission order

**Status: R10 graph-derived planning baseline updated for FV-LEDGER-001.** Protected main already has accepted Git/Node22/pinned GEF, R0-R10 planning and active synthetic policy, clock and market-data. This separate ledger WO admits a fourth fictional product harness, making five ACTIVE modules including bootstrap and 15 PLANNED. Ledger source is an immutable in-memory reducer only, NOT PostgreSQL persistence or authenticated venue event history.

## 1. Exact graph-derived module inventory

All `depends_on` values and owned paths below are **literal from the registered source**, not the desired business sequence. A wave means topological *eligibility AFTER prior independently admitted dependencies*, not a batch approval or permission to code now. Source path reservations are NOT existing implementation files.

| Canonical ID | Current registry state | Earliest graph wave | Exact registered dependencies | Reserved source / harness ownership | Governing design round |
|---|---|---:|---|---|---|
| `bootstrap` | ACTIVE | 0 | none | `bootstrap-owned existing paths` / `tests/bootstrap/` | Accepted native Git/Node22/GEF foundation and bootstrap charter |
| `risk` | PLANNED | 3 | `market-data`, `clock`, `policy` | `src/risk/` / `tests/risk/` | R3 Ledger/Risk/Execution; ADR-005 |
| `forex` | PLANNED | 5 | `risk`, `market-data`, `clock`, `execution` | `src/forex/` / `tests/forex/` | R1 provider contract; ADR-001 |
| `cex` | PLANNED | 5 | `risk`, `market-data`, `clock`, `execution` | `src/cex/` / `tests/cex/` | R6 CEX connectors; ADR-011 |
| `defi` | PLANNED | 5 | `risk`, `market-data`, `execution`, `policy` | `src/defi/` / `tests/defi/` | R7 DEX/Uniswap; ADR-013 |
| `ai` | PLANNED | 7 | `risk`, `research` | `src/ai/` / `tests/ai/` | R9 secure Web/AI; ADR-018 |
| `web` | PLANNED | 8 | `risk`, `portfolio`, `observability`, `ai` | `src/web/` / `tests/web/` | R9 secure Web/AI; ADR-017 |
| `integration` | PLANNED | 9 | `risk`, `forex`, `cex`, `defi`, `ai`, `web`, `policy`, `clock`, `market-data`, `ledger`, `execution`, `portfolio`, `replay`, `research`, `strategy-forex`, `strategy-cex`, `strategy-defi`, `observability` | `src/contracts/` / `tests/integration/` | R0 Architecture + R10 ADR-020 |
| `policy` | ACTIVE | 1 | none | `src/policy/` / `tests/policy/` | FV-POLICY-001 implemented fictional-only Node22 evaluator; R1 and ADR-001 remain provider-research proposals |
| `clock` | ACTIVE | 1 | none | `src/clock/` / `tests/clock/` | FV-CLOCK-001 implemented fictional nanosecond/uncertainty comparisons; R2 and ADR-002 remain real-capture research proposals |
| `market-data` | ACTIVE | 2 | `clock` | `src/market-data/` / `tests/market-data/` | FV-MARKET-DATA-001 fictional fixed-decimal quote + synthetic sequence/freshness tests; R2 and ADR-003 still require separate real provider approval |
| `ledger` | ACTIVE | 2 | `policy` | `src/ledger/` / `tests/ledger/` | FV-LEDGER-001 pure in-memory synthetic event reducer; real R3 PostgreSQL ledger and ADR-004 remain future |
| `execution` | PLANNED | 4 | `risk`, `market-data`, `clock`, `ledger` | `src/execution/` / `tests/execution/` | R3 order-state/hedge; ADR-006 |
| `portfolio` | PLANNED | 4 | `risk`, `ledger` | `src/portfolio/` / `tests/portfolio/` | R8 Portfolio/Observability; ADR-015 |
| `replay` | PLANNED | 5 | `market-data`, `clock`, `execution`, `ledger`, `risk` | `src/replay/` / `tests/replay/` | R4 Replay/Benchmark; ADR-007 |
| `research` | PLANNED | 6 | `market-data`, `replay` | `src/research/` / `tests/research/` | R4 Replay/Benchmark; ADR-008 |
| `strategy-forex` | PLANNED | 6 | `forex`, `replay`, `portfolio` | `src/strategy-forex/` / `tests/strategy-forex/` | R5 Forex strategies; ADR-009/010 |
| `strategy-cex` | PLANNED | 6 | `cex`, `replay`, `portfolio` | `src/strategy-cex/` / `tests/strategy-cex/` | R6 CEX strategies; ADR-012 |
| `strategy-defi` | PLANNED | 6 | `defi`, `replay`, `portfolio` | `src/strategy-defi/` / `tests/strategy-defi/` | R7 DEX feasibility; ADR-014 |
| `observability` | PLANNED | 5 | `market-data`, `clock`, `execution`, `ledger`, `risk` | `src/observability/` / `tests/observability/` | R8 Portfolio/Observability; ADR-016 |

The `integration` module's literal 18 dependencies remain unchanged. `bootstrap` is an existing, independently checked native source-tooling foundation in protected main; it is not a registered graph dependency of each product module. Every future active module still needs its own admitted Work Order, real nonempty owned tests, dependency impact evidence and current exact-head CI. Only the narrowly scoped FV-POLICY-001 and FV-CLOCK-001 synthetic cores and their dedicated test directories now exist; the other product source/test directories remain reserved, not created.

## 2. Proposed implementation waves extracted from the existing DAG

| Wave | Dependency-eligible modules | Candidate future milestone, NEVER automatic admission |
|---:|---|---|
| 0 | `bootstrap` | Native Git/Node22/GEF source foundation already merged on main with exact-main 4/4 CI; not product admission |
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
| `policy` | Dependency-free Node22 synthetic evaluator implemented in FV-POLICY-001; Rust remains an unadopted option | Exact fictional scope, expired/revoked rights, malformed evidence and all real-vendor inputs DENY in the owned harness | Any external entitlement verifier still requires real legal venue/feed rights and qualified review |
| `clock` | Dependency-free Node22 lossless i64/u64 synthetic time evaluator implemented in FV-CLOCK-001. Rust/chrony/PTP remain candidate, not adopted | UNKNOWN_CLOCK, CROSS_DOMAIN, BACKWARD_WALL, process epoch, overlapping conservative source error windows and malformed input exercised without OS clock capture | Actual provider sync/error semantics and approved per-instrument uncertainty budget belong to separate reviewed work |
| `market-data` | FV-MARKET-DATA-001 dependency-free Node22 quote schema and real synthetic clock-based quality/sequence tests; native Rust + rights-checked Arrow remain future optional candidates | Fictional exact prices/sizes and trusted clock schema, THROTTLED_FEED, stale source, snapshot/epoch/gap, no real provider authority | Actual data licence, book protocol/checksum, venue account and rights |
| `ledger` | Separate PostgreSQL immutable event ledger/unique local intent/WAL (candidate) | Duplicate-concurrent intent, MAY_HAVE_SENT crash, lost ACK, duplicate fill, recovery | Separate owned product DB, scoped IDs/retention and backup policy |
| `execution` | Rust/Tokio bounded routing with durable Ledger and mock venue | No blind retry on lost ACK, cancel/fill race, partial leg and rejected hedge, safe reboot | Per-venue status, idempotency and strategy permissions |
| `portfolio` | Exact-decimal PostgreSQL versioned read model and scoped local reservations | Complete authenticated synthetic cursor, duplicate fill, absent balance, 40001 LOCAL retry | Real broker history/positions and cost-basis policy |
| `replay` | Small deterministic virtual-time native engine; compare NautilusTrader/LEAN separately | Poisoned future-event, ordering tie, same manifest canonical hash, conservative fills | Synthetic owned dataset/rights, versioned latency/fee model |
| `research` | Offline Python/Pandas/rights-checked Parquet and optional LEAN comparator | Matched trace/cost model, failed trials included, insufficient p99 handled | Lawful historical rights, baseline/hardware and statistical acceptance |
| `strategy-forex` | Pure typed native One Leg/Two Leg/Multi Feed evaluators | Reference not executable, mirrored-feed quorum, partial leg, cost/clock mismatches | Specific Forex strategy grants, valid independent sources |
| `strategy-cex` | Native synthetic cross-venue, triangular and XEMM; Hummingbot comparison | Inverse ask, dust/min notional, venue-local funds, maker cancel/fill race | Both permitted venues, product parity, exact fee tiers |
| `strategy-defi` | Pure simulated CEX/DEX spread and same-chain route model | Hook/gas/reorg/revert/CEX leg unknown, no instant bridge or atomic hedge | Licensed chain/RPC, pool, selected CEX and route permissions |
| `observability` | Async redacted OTel, Prometheus histograms, Grafana alerts as candidates | Same-domain timing, label/privacy guard, collector outage and alert ACK not receipt | Private operations retention, thresholds and mandatory alert route |

Four separately scoped synthetic product WOs now exist: `FV-POLICY-001`, `FV-CLOCK-001`, `FV-MARKET-DATA-001` and this `FV-LEDGER-001`. Each has a real owned, invented-fixture test suite. Remaining `risk` depends on admitted policy, clock and market-data, but cannot enable real exposure without independently audited portfolio, kill and provider entitlement evidence.

## 4. Mandatory external blockers and independent approval chain

| Gate | Verified source status at this planning snapshot | Required evidence to unlock NEXT activity |
|---|---|---|
| G0: native Git-only foundation exact-main | **ACCEPTED ON PROTECTED MAIN** PR #18 merge `694fe60c759ab5a5f91ffaa32b599899bc614f83`, 4/4 exact-main push CI `36507914601` | Git, current accepted Source Pack, Node22, pinned GEF and real narrow WO/test harness. No local machine-indexing prerequisite. |
| G1: risk-appropriate review | **PURE-SYNTHETIC:** per-WO exact-head source review and tests; **PRIVILEGED FINANCIAL:** independent qualified security review still required | Real nonempty module tests, objective reviewer evidence and approved contract; high-assurance live capability additionally needs qualified independent audit. |
| G2: per-module WO and harness admission | **15 PLANNED; 4 ACTIVE fictional-only product harnesses (policy, clock, market-data, ledger)** | Further modules each require their own scoped WO, ACTIVE dependencies, real nonempty owned fixture suite, exact-head CI and review. Financial integration remains a separate independent security, clock-calibration and provider-rights gate. |
| G3: venue/chain and legal data/account rights | **D-007 OPEN** | One qualified Forex broker and separately licensed reference feed, TWO authorized CEX spot venue accounts and a compatible instrument/fee schedule, ONE permitted chain and exact Uniswap deployment/pool/RPC licence; operator region, strategy and redistribution rights per source. Do not assume Binance/Kraken or cTrader/OANDA are selected. |
| G4: safety limits / runtime secrecy / deployment | **NOT ADMITTED** | Independent financial risk limits, external managed secret-store and incident/rotation/rollback plan, venue-specific account permission and observed mock/demo fail-closed evidence. Public-dev repo MUST have authoritatively verified PRIVATE visibility before any financial production deployment; past public history is still public. Never commit any FairView `.env` (including `.env.example`) or raw real financial data. |
| G5: production acceptance / matched benchmark | **NOT IMPLEMENTED OR MEASURED** | Whole-pipeline authenticated fill and reconciliation proof, independent Risk Kernel/kill, one-leg failure and restart drills, licensed matched historical + controlled demo, observed p50/p95/p99 with valid sample/clock domains and all costs/losses, HIGH_ASSURANCE independent audit, runbooks and signed conditional limited-live rollout. No profit/outperformance guarantee. |

**G0 is satisfied by the merged Git-only foundation.** G1 is tailored to actual work risk: separately admitted pure synthetic WOs may start after reviewed scope, literal dependency gates and executable module-owned tests; financial read-only/demo/live provider operations require their own specific account/data/chain permissions and high-assurance independent review before privileged release. The existing draft planning CI is still not runtime test evidence.

## 5. Module acceptance gates inherited from R1–R9

Every independently admitted source WO must enforce the exact version and fail-closed contracts in the linked governing document and not discard its negative fixtures. R1: venue policy/research-only. R2: three timestamp categories and data provenance. R3: durable `MAY_HAVE_SENT` vs unknown remote broker truth and persistent independent kill. R4: virtual-clock replay with no future data and cost-complete simulated labels. R5: permitted Forex strategies and independent-source Multi Feed. R6: venue-specific CEX orderbook recovery, venue-local balances and non-atomic route/hedge. R7: chain ID, contract/hook, same-block/hash, chain-specific finality and full gas. R8: complete external portfolio reconciliation, redacted asynchronous observability and incident escalation. R9: server-authorized Web/operator view and no-tools, untrusted-evidence AI.

The first four product modules have isolated nonempty invented-only policy, time-domain, quote and in-memory ledger tests. Bootstrap's documentary design assertions do not validate any other product execution, API adapter, runtime latency, correctness of backtest assumptions or production account permissions. An independent reviewer must be able to reproduce source fixtures from an immutable manifest and inspect every fail-closed outcome; unknown changed paths and shared contracts expand impact rather than silently skip tests.

## 6. Required per-module future Work Order and evidence envelope

An independently approved module WO must spell out: exactly ONE primary owner and target harness; known canonical base/head, expected dependency states and exact allowed source/test/doc paths; accepted governing ADRs and typed interface; exact versions/licences; all legally scoped external entitlements; deterministic positive and negative fixtures including crash/timeout/unauthorized/invalid data; prevention of accidental live order/signature; credible test commands/expected outputs; latency/data-rights/privacy proof appropriate to that module; exact-head CI/security review, independently signed evidence bundle, rollback and concrete STOP CONDITION. A human can reuse the *proposal* in `docs/architecture/FUTURE-WORK-ORDER-TEMPLATE-R10.md`; it is **NOT** an admitted executor prompt or a substitute for the PDF rule D-003.

### No premature acceptance shortcuts

A 4/4 native source-foundation CI proves repository tooling only, not module runtime tests, independent financial security, production DoD or an execution licence. A favorable modeled spread isn't an executable profit; a local DB idempotency key isn't broker exactly-once. Web and AI cannot bypass Risk/Policy.

## 7. Round 10 STOP CONDITION

R10 remains graph-derived product architecture; it does not approve genuine financial operations. Keep any proposed ADR marked PROPOSED_NOT_ADOPTED; preserve accepted Git/GEF foundation, protected main and unpromoted planning checkpoint. Real provider permissions, exact-head source tests, qualified independent financial-security review for privileged activation and PRIVATE repository receipt before funded production remain distinct. No secrets, signing, orders or outperformance claim are authorized.

### FV-MARKET-DATA-001 incremental admission

This separate module admission adds one **strictly fictional** pure `src/market-data/quote.mjs` and a real isolated `tests/market-data/quote.test.mjs`, importing the already admitted `src/clock/time.mjs` rather than treating local/remote times as interchangeable. No real quote feed, provider account, top-of-book/L2 recovery, paid data or order authorization is implemented. The actual registered market-data owner becomes ACTIVE solely in this test-harness sense, with 4 total ACTIVE IDs including bootstrap, policy and clock; 16 other modules remain PLANNED. This does not adopt FV-ADR-003 or qualify any future financial source, replay claim or strategy.

### FV-LEDGER-001 incremental admission

The accepted source graph now has five ACTIVE modules including the non-financial bootstrap and four **fictional-only** product kernels. `src/ledger/simulation.mjs` and `tests/ledger/simulation.test.mjs` implement immutable in-memory synthetic intent/event and unknown-outcome exercises under the active synthetic policy evaluator. This is not a durable real-world order ledger: output `persisted=false`, `execution_authorized=false`; no PostgreSQL, actual account, API, authenticated venue fill, real recovery or production kill has been installed. All 15 other product modules remain PLANNED; proposed ADR-004 requires a separate implementation and independent high-assurance review before any financial exposure.
