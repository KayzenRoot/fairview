# Policy, licensing and safety | module `policy`

State: **ACTIVE SYNTHETIC-ONLY MODULE** on FV-POLICY-001. Authority: R1 planning plus the narrowly scoped FV-POLICY-001 implementation and its real deterministic fixture tests. This activation is exclusively a no-network research fixture engine. It cannot authenticate venue contracts, broker accounts or external data entitlements, and it never authorizes orders. Real provider integration and production rights require separate WOs, signed evidence, independent Risk Kernel and qualified financial-security review.

Source ownership: `src/policy/eligibility.mjs`. Actual isolated test harness: `tests/policy/eligibility.test.mjs`. Registry remains 20 entries with bootstrap and synthetic policy ACTIVE, 18 other product modules PLANNED. Policy has no direct module dependencies.

## Responsibility and trust boundary
The policy module is the **eligibility decision boundary**, not a runtime substitute for the independent Risk Kernel. A provider API's public availability is not permission for a specific user, region, strategy, instrument, reference-data use or commercial redistribution. The module must preserve document provenance, explicit human authorization and expiry. No AI, web UI, active strategy or replay result may override permission gates.

## First technology research round
The first implemented evaluator uses dependency-free Node 22 ES modules, exact scoped fictional grant records, canonical millisecond UTC, immutable output and exhaustive fail-closed cases. `SYNTHETIC_FIXTURE` can classify five research statuses, but always returns `fixture_only:true`, `execution_authorized:false` and `risk_kernel_gate_required:true`. `REAL_VENDOR` is unconditionally DENY because there is no trusted external contract verifier. Rust, a generic rule engine or PostgreSQL evidence storage remain *unadopted future options*, to be evaluated only after a new WO and data/legal/security review.

Official eligibility reference review: Spotware https://help.ctrader.com/open-api/terms-of-use/ ; OANDA https://developer.oanda.com/rest-live-v20/introduction/ ; LMAX https://www.lmax.com/exchange/market-data-access ; TrueFX https://www.truefx.com/truefx-terms-and-conditions/ . Vendor docs are not customer-specific contracts.

## Planned decision contract
`DENY | RESEARCH_ONLY | DEMO_ELIGIBLE | PAPER_ELIGIBLE | LIVE_CANDIDATE`. **None is an automatic live execution permit.** Inputs include named entity/jurisdiction, account kind, instrument contract, strategy family, app auth, exact vendor ToS and data rights, provenance, expiration, independent human approval references. Outputs include reason codes, valid scope and expiry. Missing, stale or contradicted evidence means fail closed.

## Enforced synthetic safety invariants and executable deterministic fixtures
1. No broker/account strategy authorization: no execution; no default inference from a public API page.
2. cTrader app approval alone cannot grant broker permission; commercial feed use requires a separate licence.
3. OANDA max four prices/second/instrument stream is not unthrottled FAST-feed evidence.
4. TrueFX standard internal-use data cannot become publicly redistributable through a settings toggle.
5. LMAX institutional FIX/ITCH availability cannot create an account/market-data entitlement.
6. A stale document, revoked OAuth, changed regional eligibility, new strategy or missing operator evidence invalidates an earlier approval.
7. Production risk-kernel admission and private-repo/independent-audit gates remain separately authoritative.

## Implemented boundary and STOP
The actual `evaluateSyntheticEligibility` function is exercised by `node --test tests/policy/*.test.mjs`. It requires exact fictional scope, canonical timestamps, unexpired nonrevoked distinct evidence, data-use rights and a documented mock feed delivery class. Both malformed objects and throwing getters are denied. Cross-check the independent research constraints in `docs/architecture/FOREX-VENUE-POLICY-R1.md` and proposed ADR-001, which remain design proposals, not a production provider selection.

**STOP:** synthetic classification must never be consumed as a signed entitlement or execution authorization. No actual broker, wallet, real customer account, paid market data, secret, external networking or production regulatory conclusion is present in this module. Any real entitlement verifier needs a separate reviewed WO with authoritative venue contracts, expiry/revocation synchronization, independent risk and operator approval.
