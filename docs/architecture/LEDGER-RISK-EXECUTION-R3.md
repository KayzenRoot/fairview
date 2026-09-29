# FV-DISC-001 | Round 3: Ledger, Risk and Execution architecture


## Central safety invariant
A locally unique and durable intent is not an exactly-once external execution. If an order might have crossed the broker boundary and its result is unknown, mark it `UNKNOWN_NEEDS_RECONCILIATION`, stop new risk-increasing orders for the affected scope, query authoritative broker order/fill/position state, and NEVER blindly resend. Cancellation requested is not cancellation confirmed. PostgreSQL and Tokio cannot close this nontransactional broker boundary.

## Data flow and independent authorization
1. Strategy proposes a candidate with a provenance-backed venue quote, exact instrument, timestamp/clock evidence and entitlement.
2. Risk Kernel independently checks policy, portfolio/balance generation, exposure including possible unknown fills, notional, drawdown, allowed leverage, slippage, feed freshness, kill switch and configuration generation. Result is `DENY` or short-lived exact-intent `ADMIT`.
3. Ledger durably creates one scoped local intent (`intent_key` + account + venue) under a unique DB constraint, with an immutable risk receipt and trace. Immediately before possible network dispatch it durably records `MAY_HAVE_SENT`.
4. Execution validates admission and kill epoch, transmits at most one authorized attempt per venue contract, and stores all confirmed ACK, fill, reject, cancel and reconciliation evidence via Ledger.
5. On timeout, restart or a lost acknowledgement, freeze new exposure until authenticated order, execution and account history proves what occurred. A locally committed record and externally applied order cannot share one PostgreSQL transaction.

## Proposed typed contracts
| Type | Required semantics |
|---|---|
| `OrderIntentV0` | `intent_key`, tenant/account/venue, strategy and instrument, exact-decimal side/size/limit, `risk_admission_id`, policy and source-quote evidence, `clock_domain_id`, expiry and config generation |
| `RiskDecisionV0` | `DENY | ADMIT`, reason codes, exact intent/account/venue/instrument/quantity scope, independent limits version, portfolio version, expiry and kill-switch epoch |
| `OrderAttemptV0` | exact intent key, attempt ID, venue-specific client-order-ID semantics, durable `MAY_HAVE_SENT` flag before potential transmit, redacted private provenance |
| `VenueExecutionEventV0` | account/venue/order and scoped execution IDs, event type and sequence, cumulative/leaves quantity, exact-decimal fill amount/price, optional source UTC plus local timestamp and clock domain |
| `ReconciliationReceiptV0` | authenticated venue query scope, account and instrument, complete order/fill/position cursor or watermark, discrepancies and independent reviewer evidence |
| `HedgePlanV0` | independent recovery intent, confirmed and worst-case unknown exposure, executable depth and fee bounds, authorized account/venue, independent risk receipt and expiration |

Store operational evidence in properly scoped, non-public financial audit storage, never in public Git, CI or PDF artifacts.

## Durable order lifecycle
`PROPOSED` -> `RISK_ADMITTED` -> `INTENT_DURABLE` -> `MAY_HAVE_SENT` -> `ACKNOWLEDGED` -> `PARTIALLY_FILLED` or `FILLED`, with separate `REJECTED`, `CANCEL_REQUESTED`, `CANCELED_CONFIRMED`, `EXPIRED_CONFIRMED`, `UNKNOWN_NEEDS_RECONCILIATION` and `DISCREPANCY_LOCKED`.

Persist events as immutable facts, not merely the latest mutable status string. A late reject or cancel cannot erase an authoritative fill. A venue execution ID is deduplicated only when the venue documents its uniqueness scope; missing or conflicting IDs require reconciliation. Restart restores state and a persistent kill epoch, then requires a complete authenticated venue order/fill/position snapshot before dispatch resumes. Broker session gaps and incomplete history are blockers.

## Risk Kernel: fail-closed controls
Independently evaluate each **new AND hedge/recovery** intent against: named legal/policy entitlement, account and instrument, fresh executable venue quote, source/receive clock and sequence quality, available reconciled cash/margin, known filled and maximum plausible unknown exposure, per-account and portfolio notional/leverage/concentration, max daily loss and drawdown, fee/slippage bound, order rate, news/event pause, durable kill-switch scope/epoch, credentials capability and intent idempotency.

DENY when evidence is missing or outdated. The AI, strategy, UI or operator reconnect cannot override the independent risk engine. Emergency unwind is a separately bounded, contract-permitted, risk-admitted operation, not a blanket exception or a guarantee of fills. Persist global/account/strategy kill switches with immutable actor/reason and revocation generation; reject tokens minted before activation. When the risk engine cannot be reached, do not transmit new exposure.

## Synthetic two-leg failure walkthrough
Leg A BUY is independently admitted, persisted and partly filled. Leg B SELL may have been transmitted, but its connection times out. Leg B becomes `UNKNOWN_NEEDS_RECONCILIATION` and its worst plausible fill is reserved conservatively; A's partial fill is real exposure. Freeze affected scopes, reconcile B using authenticated order, execution and position history and separately reconcile A. Only when B is resolved can an independent policy and Risk Kernel evaluate a new hedge for confirmed residual exposure. If B is unqueryable, leave `DISCREPANCY_LOCKED`, preserve the incident and make no duplicate send. A rejected hedge does not make exposure disappear.

## Existing technology candidates, not installed
| Candidate | Supported feature | Important limitation |
|---|---|---|
| PostgreSQL unique constraints, `INSERT ... ON CONFLICT` and WAL | Local scoped idempotent record creation, transaction commit and crash recovery | No guarantee that an external broker received or executed the order. https://www.postgresql.org/docs/18/sql-insert.html ; https://www.postgresql.org/docs/18/wal-intro.html |
| Rust/Tokio bounded `mpsc` + `oneshot` | Typed in-memory routing and backpressure with application-specific queue capacity | The channels are not persistent order ledgers; queue saturation must block new orders without blocking kill control. https://tokio.rs/tokio/tutorial/channels |
| OpenTelemetry | Trace and metric correlation between market data, risk decisions and execution | Asynchronous, redacted off-hot-path telemetry is not authoritative broker proof. https://opentelemetry.io/docs/concepts/signals/ |
| Contract-authorized FIX/REST venue APIs | External order and reconciliation interactions | Client order IDs, ACK, cancel semantics, status history, rate limits and execution identifiers vary by venue. Do not assume a generic broker exactly-once API. |

No default Kafka/Aeron/Redis source of truth. If deterministic benchmarks later justify a second transport or outbox, approve it through a separate ADR with measured failure and recovery behavior.

## Proposed negative synthetic fixture matrix (future module tests, not executed now)
| Scenario ID | Fault injection | Expected invariant |
|---|---|---|
| DUPLICATE_INTENT | Concurrent duplicate scoped key | Exactly one durable local intent; no second broker attempt |
| CRASH_BEFORE_TRANSMIT | MAY_HAVE_SENT durable then process dies | Restart marks uncertain, reads venue before any resend |
| LOST_ACK_AFTER_FILL | Broker filled then ACK lost | UNKNOWN freezes new exposure until authoritative reconciliation |
| CANCEL_RACE_FILL | Fill received during cancel request | Do not erase fill or claim cancel before confirmation |
| PARTIAL_A_UNKNOWN_B | A partly filled; B send timed out | Bound worst possible exposure; reconcile B; separate hedge admission |
| REJECTED_HEDGE | Recovery hedge rejected | Preserve open original exposure and incident |
| STALE_FEED | Quote becomes stale at dispatch | Risk DENY, despite observed price gap |
| MISSING_PORTFOLIO | Available balance or version unavailable | Risk DENY new exposure |
| KILL_SWITCH_PERSIST | Restart after kill and UI disconnect | Dispatch remains stopped, old permits revoked |
| DUPLICATE_FILL_EVENT | Same documented scoped execution ID twice | Apply fill once, preserve audit evidence |
| ORDER_EVENT_REORDER | Late reject after trusted fill | Do not regress reconciled fill or position |
| SESSION_GAP | Missing messages or incomplete broker history | DISCREPANCY_LOCKED until complete reconciliation |
| QUEUE_BACKPRESSURE | Bounded execution queue full | Reject new intents, preserve kill/control priority |
| CLOCK_EPOCH_CHANGE | Previous-boot risk receipt reused | Reject stale authorization and re-evaluate clocks |
| UNLICENSED_RECOVERY | Venue does not permit proposed hedge | Do not dispatch; continue incident management |

## Activation plan and STOP

**Current foundation boundary (owner D-009):** Git/Source Pack/Node 22 and the pinned GEF submodule are the only development foundation dependencies. Foundation migration PR #18 was merged at `694fe60c759ab5a5f91ffaa32b599899bc614f83`; its exact-main CI completed 4/4 successfully. There is no separate host retrieval/indexing prerequisite for a narrowly admitted pure synthetic module Work Order. All product modules in this planning PR remain PLANNED; real provider permissions, financial security review and actual runtime tests are still distinct gates. **STOP:** no product code activation or financial operation is authorized by these design documents.
