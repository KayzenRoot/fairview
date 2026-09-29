# FairView architecture | current engineering baseline

FairView is a browser-operated, server-executed multi-market research and potential authorized trading system. Trading-oriented product modules remain PLANNED, not implemented: independent Risk/Policy, exact source clocks, licensed market data, durable local Ledger and externally reconciled venue order/fill/position state; separate Forex, CEX and DEX connectors; deterministic Replay/Research; bounded advisory AI and permissioned operator Web UI. No backend account or live execution is authorized by a planning document.

Development architecture: versioned repository Source Pack, accepted ADRs and WOs, context locks, pinned GEF source-workspace Git submodule, Node22 dependency-aware registry/harness and GitHub exact-head CI/Evidence Bundle. Developers read the Git repo directly and use narrowly scoped files, tests and checkpoints. No auxiliary memory server, database, Docker installation or semantic service is needed to build or test the engineering foundation.

Risk must fail closed on permissions, source age/clock, inventory and uncertain external fills. The browser and AI never override risk or directly issue broker/wallet commands. PostgreSQL, Rust/Tokio, CCXT, Uniswap tooling and observability stacks are future separately evaluated options, not installed or adopted under the current no-context-service migration.
