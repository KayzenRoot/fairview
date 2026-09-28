# FV-DISC-001 | Round 9: Secure browser operator console and bounded AI advisory

**PLANNING ONLY, NOT IMPLEMENTED.** This proposal enriches the existing `web` and `ai` module charters without activating them. It does not select a cloud model, install Next.js, add a browser endpoint, configure telemetry, connect to a broker, issue a risk-limit command, create an external account, or promote the canonical checkpoint. FV-BOOT-001 issue #1 remains OPEN; the latest owner-supplied isolated HIVE FULL result was FAILED and independent security review remains outstanding.

## 1. Authority boundaries and visual information architecture

FairView's browser is a **non-authoritative operator client**. The future trading engine and Risk Kernel must continue enforcing permissions, persistent kills, exposure and ledger state independently when the browser, AI service, stream or internet fails. A chart never substitutes for an executable quote or authenticated broker receipt. AI is a *read-only advisory and research proposal* service. HIVE remains local/offline ENGINEERING CONTEXT, never a live trading runtime dependency.

The proposed dashboard layout uses a persistent sidebar, incident/risk status banner, freshness indicator, compact table/chart pages with provenance drill-down and an independently signed command-result panel. Different views use server-produced typed DTOs, not direct SQL/browser brokerage API. Each row that shows financial state must distinguish `SYNTHETIC`, `HISTORICAL`, `DEMO`, `REAL_OBSERVED` and `UNKNOWN` with mode and timestamp.

| Route / view | Useful information | Read-only evidence and safety display |
|---|---|---|
| `/overview` | High-level venue connectivity, strategy research statuses, independent risk and kill state, active incidents, net *mode-labelled* exposure | Read from scoped `OperatorOverviewDTOv0`, with source-watermark, server-as-of, data-age and degraded flags; never green from cached stale Risk state |
| `/markets` | Forex/CEX/DEX source health, feed gap, bid/ask with licensed display rights, exact product contract and depth coverage, Uniswap block anchor | `MarketLensDTOv0`; raw paid feeds hidden unless explicit display and derivative-use rights; do not present reference quote as broker executable |
| `/strategies` | One Leg/Two Leg/Multi Feed, CEX taker/triangular/XEMM and DEX research configuration, current mode, version, last deterministic run and risk eligibility | `StrategySummaryDTOv0`; future control proposal requires server validation and distinct human approvals, NOT an executable "AI trade" action |
| `/portfolio` | Per-venue/account positions and balances, realized/unrealized PnL by documented cost-basis, reserved and worst unknown fill, unsettled transfers and DEX finality | `PortfolioViewDTOv0` from immutable R8 evidence-linked snapshot, not a mutable client-side calculation; UNSYNCED/UNRECONCILED banner on stale cursor |
| `/risk` | Independent effective limit generation, breaker and kill epochs, exposure caps, incident reasons, source staleness and rejected proposal counts | `RiskStatusDTOv0` signed by the actual future Risk service; UI request and authoritative backend receipt shown separately |
| `/replay` | R4 reproducible trace/config hash, strategy/scenario controls in **offline research only**, n, p50/p95/p99 by valid same-clock stage, fees/slippage and losing/adverse runs | `BenchmarkViewDTOv0`; no historical simulated fill relabeled actual, no comparison to Westernpips marketing as measured competitor data |
| `/incidents` | Order/venue source gaps, portfolio discrepancies, stale clock, CEX/DEX reorg, pending unknown fill, kill activation and alert delivery state | `IncidentViewDTOv0` with redacted refs to restricted R3/R8 evidence; alert acknowledged != reconciled venue fill or kill released |
| `/advisory` | Cited explanations of anomalous patterns, research-only sensitivity analysis, prospective tuning proposals and operator questions | `AdvisoryViewDTOv0`: model/schema/config/data-use provenance, cited approved evidence, unknowns and no external trading tools |
| `/settings` | Session-scoped profile, display preferences, immutable policy/version reference, read-only licence applicability and audited future privileged change workflow | `OperatorSettingsDTOv0`; **no** API key/wallet seed entry in the browser and no backend risk override from a settings toggle |

No actual route/component implementation is created under this round; each future page can be independently tested once its source module WO is admitted.

## 2. Proposed typed operator contracts

`OperatorSessionV0`:
- Authenticated server-validated user and session, tenant identity, independent `VIEWER | ANALYST | OPERATOR | SAFETY_OFFICER | AUDITOR` role, eligible venue/account scope, expiry, revocation generation, MFA assurance level for future privileged controls and audit correlation. Never derive this from a query string, browser localStorage or user-submitted role fields.
- Client uses a short-lived secure HttpOnly SameSite session cookie with correctly configured HTTPS, CSRF protection for mutations, idle/absolute timeout, device/session revocation and a trusted auth library. For future production also independently review MFA, step-up, recovery and independent dual approval of risk-increasing commands.
- Server-side Data Access Layer always authorizes action **and** individual resource/tenant/account row, with least-privilege `OperatorViewRequestV0`; no BOLA/IDOR by guessing account IDs. Never rely on hiding a button to provide backend authorization.

`OperatorReadModelV0`:
- `schema_version`, `tenant_scope`, `access_classification`, `source_mode`, `redacted_data` or a typed page DTO, `source_ledger_high_watermark`, `portfolio_reconciliation_state`, `risk_config_generation`, `kill_epoch`, `stream_epoch`, `server_as_of_utc_ns`, `source_clock_domain`, `max_age_policy_ref`, `valid_until`, `licence_scope_refs`, `degradation_reasons` and opaque private provenance references.
- Web cannot extend a DTO's valid_until; unknown status must be exposed as `STALE | UNRECONCILED | UNKNOWN | PAUSED`, not zero positions or a current price. The server excludes unauthorized venue rows and any raw sensitive evidence rather than depending on client masking.

`OperatorStreamEventV0`:
- `stream_epoch`, bounded monotonic `server_sequence` *within that epoch only*, authorized topic, opaque resource scope, versioned DTO delta, `snapshot_watermark`, heartbeat, `as_of`, signed status source and a sequence-gap indicator.
- Server-Sent Events are a **candidate** for one-way read-only updates; WebSocket is an optional separate ADR candidate only if measured two-way necessity. Bounded queues and backpressure; reconnect sends a **read-only fresh snapshot** after authentication and tenant recheck. If gap, switched tenant, expired session or network partition: quarantine old cache and mark STALE, no blind reapplication of deltas or trade intents.
- Stream/cached synthetic/offline mode must never mix into a live financial position page. Query caches are partitioned by tenant/session/access scope, include server watermark and licence rights, and purge on role switch, logout or policy revocation.

`OperatorCommandRequestV0` / `OperatorCommandReceiptV0` (**FUTURE PRIVILEGED DESIGN, NOT AN API**):
- A bounded future request can ask to pause one strategy, request read-only reconciliation or propose a restrictive change; it carries scoped actor/tenant/session/MFA/revision, explicit requested action and expiration, signed unique request ID, human reason, anti-replay nonce and expected current policy/risk generation.
- The independent future control service must recheck authorization, venue policy, kill state, Risk Kernel version and required dual approval; it persists a durable receipt with `REQUESTED | VALIDATED | REJECTED | AUTHORITATIVELY_APPLIED | UNKNOWN_NEEDS_CONFIRMATION`. The UI cannot treat a click, HTTP 200 or lost ACK as applied safety state. A global kill switch is authoritative only after an actual backend receipt; emergency manual fallback and independent watchdog belong to future audited runbooks, not browser code.
- **No generic order placement, raw broker-command proxy, kill reset, venue permission grant, wallet signing, deposit/withdrawal or direct risk-limit increase action is admitted here.** Future emergency controls and approvals are separate high-assurance scoped WOs after independent review.

## 3. Human action permission model (proposed, not admitted)

| Action | VIEWER | ANALYST | OPERATOR | SAFETY_OFFICER | AUDITOR |
|---|---|---|---|---|---|
| View permitted scoped read-only health and redacted market status | READ | READ | READ | READ | READ |
| View redacted permitted portfolio/incident and recorded benchmark results | scoped READ | scoped READ | scoped READ | scoped READ | audit-scoped READ |
| Submit offline R4 strategy replay configuration proposal | DENY | PROPOSE | PROPOSE | PROPOSE | DENY |
| Request read-only authenticated reconciliation | DENY | DENY | REQUEST | REQUEST | REVIEW_ONLY |
| Request future restrictive strategy PAUSE or safety kill | DENY | DENY | REQUEST | REQUEST | REVIEW_ONLY |
| Increase capital/leverage, reset kill, grant account or activate live strategy | DENY | DENY | DENY by default | DENY by default | REVIEW_ONLY |

`REQUEST` is not the actual action; an admitted future service must validate the request and issue an authoritative receipt. Increasing risk or enabling live trading has **no role authorized by this proposal**. The future policy and independent reviewer must adopt an explicit approval workflow before any such action is even exposed. An offline AI suggestion never constitutes a human approval.

## 4. AI advisory data and trust contracts

`AdvisoryRequestV0`: tenant/session scope; `EXPLAIN | ANOMALY_TRIAGE | BENCHMARK_COMPARE | RESEARCH_TUNING_PROPOSAL` intent; bounded model/data-use approved scope; no arbitrary URLs, file system access, shell, broker/RPC endpoint, wallet or trading tool. Natural-language content is user input, not a trust grant.

`EvidencePackV0`: *finite* size-limited pre-filtered rights-checked provenance references and redacted facts, source labels with untrusted status (`MARKET_TEXT | VENDOR_DOC | NEWS | LOG | APPROVED_STRUCTURED`), version/hash, source timestamps and freshness, allowed retention/AI-provider usage, mode (`SYNTHETIC | LICENSED_HISTORICAL | DEMO | REAL_OBSERVED`) and permissioned tenant. No raw licensed tick series sent to an unapproved external model, no customer wallet/API key or user identification in model prompt, and no HIVE private engineering corpus as an accidental production retrieval source.

`AdvisoryFindingV0`: structured `OBSERVATION | HYPOTHESIS | LIMITATION | UNVERIFIED`, cited evidence refs, explanation vs inference label, missing data/clock/cost/venue entitlements, safety caveats, schema validation status, model/version/prompt template hash, run latency and redacted output. If context insufficient or model unavailable, respond `UNAVAILABLE` or `INSUFFICIENT_EVIDENCE`, not a fabricated broker fill or claimed live PnL.

`TuningProposalV0`: suggested offline R4 `strategy_id`, exact `config_base_hash`, bounded hypothetical parameter change and rationale, candidate dataset/fee/latency models, preliminary downside and failure conditions, independent analyst review requirement and `RESEARCH_ONLY` state. Actual parameter adoption follows a separately admitted replay/independent risk-policy pipeline, never AI self-commit, live hot reload or portfolio/risk configuration mutation.

`AdvisoryAuditV0`: private tenant/action/redaction policy, model and prompt template hashes, accepted evidence IDs and classification, generated findings/proposal hashes, refusal and filtered prompt-injection reason codes, timeout, human review/override event and retention limits. Redact and keep out of public CI/HIVE; do not retain unauthorized source data just because a model output quoted it.

### Threat model and anti-injection
Treat every news headline, broker error text, vendor web page, raw quote metadata, backtest note, uploaded reference or model-generated explanation as **untrusted DATA**, not instructions. Forged system/developer messages inside source documents and LLM-produced "tool calls" are content only; no external execution/approval tool is bound to the assistant. Enforce trust labels before context assembly, server-side per-tenant filtering, fixed structured schema, output validation, provider-specific data rights and refusal when the evidence is insufficient. A prompt filter by itself is not a security boundary: capabilities must be removed at the server/tool layer. OWASP's prompt-injection and excessive-agency risk guidance is an evaluation reference, not a guarantee that a prompt alone is secure.

AI may help produce evidence-backed explanations of candidate opportunities, anomaly summaries, versioned research hypotheses and authorized operator reading aids. It MUST NOT sign, trade, submit a kill-reset, call broker APIs, alter financial risk limits, write canonical checkpoints, secretly pull other tenant data, approve its own tuning or classify a simulated fill as real. HIVE remains offline engineering RAG only, never required for a trading Risk Kernel, Market Data/Execution pipeline or dashboard advisory API. If AI is disconnected, only the advisory page degrades, and independent risk/ledger continue per their own state.

## 5. Existing technology candidates and adoption gates (NO installation)

| Candidate | Useful documented capability | Exact candidate role and rejection boundary |
|---|---|---|
| Next.js App Router / React | Server-side route and Server Action patterns, auth library integration, Data Access Layer authorization and minimal DTOs | UI/BFF candidate with per-request server authorization even for route handlers/actions; Next docs explicitly recommend a tested authentication library and DAL. Reject direct browser risk/broker data access. https://nextjs.org/docs/app/guides/authentication |
| TanStack Query React | Fetching, cache, synchronization, background refetch and stale server-state management | Optional typed data cache with tenant-partitioned keys and revocation invalidation. Never use background cache freshness as financial Risk admission or automatically replay offline mutation requests. https://tanstack.com/query/latest/docs/framework/react/overview |
| EventSource/SSE or audited WebSocket | Versioned one-way DTO stream, heartbeat/reconnect and snapshot resync on gap | Proposed SSE first for read-only status, benchmark with candidate stack and host. Never make browser sockets an execution/control transport; no direct live market feed without explicit display/data rights. |
| OpenTelemetry and Grafana | R8 redacted, bounded low-cardinality diagnostic telemetry and incident visualization | Non-authoritative observability source with link to restricted, independently reconciled ledger evidence; no sensitive high-cardinality metric labels or public logs. https://opentelemetry.io/docs/specs/otel/metrics/data-model/ |
| OWASP LLM application risk guidance | Prompt injection, excessive agency, insecure tool-output handling and sensitive information leakage threat scenarios | Remove risky model capabilities by design; use server-side isolation and independent human policy controls. https://owasp.org/www-project-top-10-for-large-language-model-applications/ |
| Open Policy Agent (optional) | Independent generic context-aware API authorization and audited policy bundles | Research only if human-approved tenant/role/resource policy becomes complex; not automatically a mandatory runtime service or a replacement for financial Risk Kernel. https://www.openpolicyagent.org/docs/http-api-authorization ; https://www.openpolicyagent.org/docs/rest-api |

Version, security patch, OSS/transitive licence, auth-provider assurance, privacy/commercial data-use review, performance budget, deployment and rollback choice belong to later separate adoption ADRs. No UI/AI performance, external model accuracy or fraud-prevention benchmark is claimed by this document.

## 6. Twenty-four negative design fixtures (FUTURE tests, not product behavior)

| Scenario ID | Synthetic failure injection | Expected required response |
|---|---|---|
| SESSION_EXPIRED_STREAM | Live read-only stream continues after session expiry | Stop stream, purge scoped cache and require new server auth |
| CROSS_TENANT_IDOR | Viewer requests another account by guessing opaque ID | 403/deny at backend DAL, no cross-tenant DTO or timing leak |
| ROLE_SPOOFING | User submits `SAFETY_OFFICER` string in request | Reject; role from server-trusted session and grants only |
| CSRF_MUTATION | Attacker page attempts future command via victim cookie | Reject missing/invalid server-side CSRF and reauth |
| CROSS_TENANT_CACHE | Browser switches tenant while Query cache contains old data | Purge and partition; no old portfolio row displayed |
| STREAM_SEQUENCE_GAP | Missed SSE delta or stale WebSocket epoch | Mark STALE, request reauthorized fresh snapshot, no action replay |
| RECONNECT_DUPLICATE_ACTION | Browser reconnect resends previously submitted control request | No client auto-resend; independent request-id/nonce and authoritative receipt check |
| CLIENT_FAKED_KILL_ACK | Browser marks safety PAUSE as applied after HTTP 200 | Show REQUESTED/UNKNOWN until independent signed backend receipt |
| KILL_RESET_FROM_UI | Dashboard toggle tries to bypass persistent risk kill | DENY, no direct backend mutation |
| STALE_PORTFOLIO_GREEN | Old cached balanced portfolio shown while broker disconnected | Prominent UNRECONCILED/STALE, no fabricated zero exposure |
| SYNTHETIC_REAL_CONFLATION | Benchmark simulated fill mapped onto live results page | Reject mode mismatch, invalidate performance summary |
| UNLICENSED_TICK_EXPORT | Download/AI prompt includes raw paid source data without rights | DENY export/model transfer with auditable data-rights reason |
| METRIC_LABEL_LEAK | UI/telemetry adds wallet address or account ID to labels | Block and redact, controlled cardinality/incident |
| AI_MARKET_PROMPT_INJECTION | Broker error/news asks model to disable risk or reveal keys | Treat as source data only; no mutation capability |
| AI_FORGED_SYSTEM_MESSAGE | Uploaded report includes forged system or developer instruction | Ignore privilege escalation; cite trusted evidence only |
| AI_TOOL_CALL_LAUNDERING | Model output asks to submit broker REST call | No broker/signing tools exposed and server blocks request |
| AI_CROSS_TENANT_RAG | Advisory requests another tenant's private evidence | Server-side scope filter and DENY without retrieval |
| AI_UNLICENSED_DATA_USE | Cloud model receives a non-approved data-licence class | DENY prompt assembly; retain no unauthorized copy |
| AI_FABRICATED_FILL | LLM invents missing execution receipt/PnL | UNVERIFIED finding, no portfolio or risk mutation |
| AI_SELF_APPROVED_TUNING | LLM proposes and attempts to activate higher leverage | RESEARCH_ONLY proposal, independent replay and reviews required |
| MODEL_SERVICE_OUTAGE | Model endpoint stalls or fails | Advisory UNAVAILABLE; independent risk and live controls unchanged |
| TELEMETRY_OUTAGE | Charts/collector offline while Risk kernel continues | Unknown status displayed; cannot infer trading health from green stale cache |
| ALERT_ACK_NOT_RECONCILED | Operator acknowledges incident but venue ACK/fill unknown | Independent ledger retains UNKNOWN_NEEDS_RECONCILIATION |
| WEB_BROWSER_RESTART | Reopened tab with stale data and old control nonce | Force scoped fresh auth/snapshot, no hidden stateful order send |

These fixtures are **requirements** for separately activated `tests/web/` and `tests/ai/`, not assertions that any UI/service exists today. Hosted bootstrap tests may assert documents, names, proposal markers and planned-module registry/impact only.

## 7. Phased activation and explicit STOP

1. After independently evidenced FV-BOOT-001 FULL and separate admitted `web` WO: static **synthetic** operator layout, typed mock server DTOs and server-side route/resource authorization harness. Test all unauthenticated/cross-tenant/session-stale/cache-reconnect fail-closed cases WITHOUT broker credentials.
2. After separately admitted `ai` WO: no-tools read-only advisory against invented licensed synthetic evidence and fixed-schema prompt-injection harness. Validate no cross-tenant or raw paid-data retrieval. No HIVE runtime connection, external cloud model call or model capability by default.
3. After Portfolio/Observability and selected source module WOs, consider operator read-only dashboard behind audited private infrastructure, actual rights and privacy checks. Separately govern narrowly scoped future command protocol and step-up/dual approvals. No automatic AI-to-risk, AI-to-broker, UI-to-broker bridge.
4. Funded production needs PRIVATE-repository receipt, external secrets, written venue/strategy/data rights and signed independent high-assurance risk/security approvals plus rollback drills. A UI milestone or hosted planning check is not a financial runtime qualification.

**STOP:** R9 ends in docs and deterministic planning-harness assertions within PR #17 OPEN/DRAFT. Do not activate product `src/`, add a real login, run a model, place orders, provision secrets, modify HIVE/GEF pins, publish raw market data, claim market performance or promote canonical CHECKPOINT.