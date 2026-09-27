# Requirements | Proposed V1 baseline
R-001 Users access a responsive authenticated web console for accounts, venue health, opportunities, orders, portfolio, risk, strategy config, audit and incidents.
R-002 Separate execution process handles live market data, normalized Bid/Ask, tick timestamps and deterministic risk pretrade admission; UI disconnect must not stop risk controls.
R-003 Forex: integrate one licensed/authorized programmatic execution venue and an eligible reference feed; implement one bounded OneLeg-style strategy after venue contract verification.
R-004 Crypto: integrate two centralized venues via documented official market data/order APIs; support cross-venue spot two-leg strategy with one-leg-failure recovery.
R-005 DeFi: select a verified chain and Uniswap deployment; bounded position observation and audited lifecycle for a supported pool; no unrestricted contract approvals.
R-006 AI generates sourced analysis and operator suggestions. Autopilot may execute only tested strategies in user-authorized scopes with independent risk enforcement; generative AI cannot override risk gates or directly sign transactions.
R-007 Deterministic replay and paper trading precede restricted live execution, with execution receipts and realistic cost/slippage models.
R-008 Durable order state, idempotency, reconcile on restart, feed staleness gates, telemetry and incident response.
R-009 Secrets externalized; key permissions minimized, wallets appropriately safeguarded; never give wallet withdrawal privileges to ordinary CEX API connectors.
R-010 Source Pack, checkpoints, Work Orders, PDFs, modular harnesses, exact-head evidence and CI are required before implementation.
All market partners, thresholds, supported chain, contractual permissions and deployment regions remain open decisions to be resolved before live release. These requirements are planning proposals, not claims of existing functionality.