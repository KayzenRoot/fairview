# Policy, licensing and safety | module `policy`

State: **PLANNED, NOT IMPLEMENTED**. Authority: FV-DISC-001 Round 1 research. Official hosted bootstrap proof and policy planning do not approve execution, accounts or a production venue. Separate admitted Work Order and an independent review are required before source/tests.

Reserved source ownership: `src/policy/`. Harness ownership: `tests/policy/`. Dependency graph: independent planned module. `harness/modules.json` remains 20 entries with bootstrap as sole active module.

## Responsibility and trust boundary
The policy module is the **eligibility decision boundary**, not a runtime substitute for the independent Risk Kernel. A provider API's public availability is not permission for a specific user, region, strategy, instrument, reference-data use or commercial redistribution. The module must preserve document provenance, explicit human authorization and expiry. No AI, web UI, active strategy or replay result may override permission gates.

## First technology research round
Use typed, versioned evidence manifests with an independent legal/venue approval receipt, and a pure fail-closed evaluator. Do not adopt a complex general-purpose rule engine until policies and change rate warrant it. Candidate implementation later: a small Rust policy library with exhaustive negative fixtures and well-defined FFI/service boundaries (architecture ADR required). Storage/review later: PostgreSQL evidence metadata and externally secured signed approval receipts, with originals restricted to approved private storage, never public Git, CI artifacts or withdrawn developer context tooling.

Official eligibility reference review: Spotware https://help.ctrader.com/open-api/terms-of-use/ ; OANDA https://developer.oanda.com/rest-live-v20/introduction/ ; LMAX https://www.lmax.com/exchange/market-data-access ; TrueFX https://www.truefx.com/truefx-terms-and-conditions/ . Vendor docs are not customer-specific contracts.

## Planned decision contract
`DENY | RESEARCH_ONLY | DEMO_ELIGIBLE | PAPER_ELIGIBLE | LIVE_CANDIDATE`. **None is an automatic live execution permit.** Inputs include named entity/jurisdiction, account kind, instrument contract, strategy family, app auth, exact vendor ToS and data rights, provenance, expiration, independent human approval references. Outputs include reason codes, valid scope and expiry. Missing, stale or contradicted evidence means fail closed.

## Safety invariants and deterministic fixtures
1. No broker/account strategy authorization: no execution; no default inference from a public API page.
2. cTrader app approval alone cannot grant broker permission; commercial feed use requires a separate licence.
3. OANDA max four prices/second/instrument stream is not unthrottled FAST-feed evidence.
4. TrueFX standard internal-use data cannot become publicly redistributable through a settings toggle.
5. LMAX institutional FIX/ITCH availability cannot create an account/market-data entitlement.
6. A stale document, revoked OAuth, changed regional eligibility, new strategy or missing operator evidence invalidates an earlier approval.
7. Production risk-kernel admission and private-repo/independent-audit gates remain separately authoritative.

## Design-only completion and STOP
Cross-check `docs/architecture/FOREX-VENUE-POLICY-R1.md` and proposed `docs/architecture/adrs/FV-ADR-001-PROPOSED-FOREX-VENUE-SELECTION.md`. Draw the typed evidence schema and 100% of named negative fixtures **before** admitting source. No default account, secret, unapproved runtime dependency or actual venue connection.
