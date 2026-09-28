# Browser operator control plane | module `web`

**PLANNED, NOT IMPLEMENTED.** FV-DISC-001 Round 9 preserves this original module, its reserved `src/web/` and `tests/web/`, and existing dependencies `risk`, `portfolio`, `observability`, `ai`. No user login, dashboard app or privileged endpoint has been implemented here.

## Single responsibility and future UI
Secure authenticated read-only console with persistent sidebar/header and risk/incident/freshness strip: Overview, Markets, Strategies, Portfolio, Risk, Replay, Incidents, Advisory and Settings. Show mode-labelled SYNTHETIC/HISTORICAL/DEMO/REAL_OBSERVED/UNKNOWN data; per-venue order-book and licence-safe charts, provably scoped positions and unknown possible fills, kill epoch and incidents, matched R4 benchmark evidence and redacted AI explanations. Dashboard read models are **not** a substitute for immutable R3 Ledger, independent Risk Kernel or R8 complete Portfolio reconciliation.

## Typed boundaries
`OperatorSessionV0`, `OperatorReadModelV0`, `OperatorStreamEventV0` for per-tenant/per-role/per-resource server authorization and lossless versioned stale/gap handling. `OperatorCommandRequestV0`/`OperatorCommandReceiptV0` design only for future separately approved restrictive actions: a click/HTTP 200/alert ACK is not actual independent Risk/venue receipt. UI reconnect may request read-only snapshot, NEVER auto-resend broker intents or reset kill. No risk-increasing mutation is approved by this charter.

## Existing technology candidates
Next.js/React App Router/BFF with official server-side DAL and per-route/action access checks https://nextjs.org/docs/app/guides/authentication ; optional TanStack Query for tenant-partitioned, time-bounded async *display* cache https://tanstack.com/query/latest/docs/framework/react/overview ; read-only SSE with bounded heartbeat/gap recovery, or WS only if later benchmarked; R8 redacted OTel and Grafana incident views, not financial authority. Exact versions, auth provider, privacy/OSS licences, server hosting and rollback require separate adoption ADR.

## Future harness and STOP
SESSION_EXPIRED_STREAM, CROSS_TENANT_IDOR, ROLE_SPOOFING, CSRF_MUTATION, CROSS_TENANT_CACHE, STREAM_SEQUENCE_GAP, RECONNECT_DUPLICATE_ACTION, CLIENT_FAKED_KILL_ACK, KILL_RESET_FROM_UI, STALE_PORTFOLIO_GREEN, SYNTHETIC_REAL_CONFLATION, UNLICENSED_TICK_EXPORT, TELEMETRY_OUTAGE, ALERT_ACK_NOT_RECONCILED and WEB_BROWSER_RESTART, plus all 24 R9 fixtures. **STOP:** no authorized endpoint without admitted WO, FV-BOOT-001 FULL/independent security gate, rights/role review and real server-side tests.