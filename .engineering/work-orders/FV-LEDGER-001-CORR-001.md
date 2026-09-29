# FV-LEDGER-001-CORR-001 | Trusted in-memory ledger state

**Status: CORRECTION REQUIRED under the already merged FV-LEDGER-001.** This correction never admits a new product module or a financial execution capability. **Exact parent main:** `6b5a8ff3bdae612722a0109d84a0249e80378cd5`, merged PR #25; its actual postmerge push run 36559002676 four required jobs SUCCESS. Source scope is fictional-only Node22, ELEVATED mock-control safety proof. Financial HIGH_ASSURANCE release is separately BLOCKED.

## OBJECTIVE / DISCOVERED GAP
The existing `appendSyntheticLedgerEvent` checks user-supplied state fields but not state provenance. A caller can supply a plain forged object with syntactically valid `intent`, `events`, `policy_evidence_refs`, `fixture_only=true`, `persisted=false`, `execution_authorized=false`, and arbitrary phase/attempt/fill values, bypassing real `createSyntheticLedger` policy evaluation. It can also inject `blocked_new_exposure=false` and subsequent reducer copies preserve that field. While there is no real order or durable financial authority, this corrupts the *synthetic model's own fail-closed test contract*. Add an in-process producer-identity guard and adversarial evidence before any downstream synthetic Risk module.

## CONTEXT / FILES AND SOURCES TO READ
Read current main Git tree, canonical checkpoint (still FV-CP-0002-PROPOSED/NOT_INDEPENDENT), D-009, Scope, Architecture, DoD, accepted FV-LEDGER-001 WO and context lock, actual ledger source/tests, `harness/modules.json` (20 IDs, five active including ledger), R3 proposal and ADR-004 PROPOSED_NOT_ADOPTED. Source lock in companion file with immutable blob hashes. If main/security/accepted decision/ledger source changes, STOP and recreate fresh context; no force-push.

## SCOPE / OUT OF SCOPE
Allowed: this correction WO, its context lock, `src/ledger/simulation.mjs`, `tests/ledger/simulation.test.mjs`, a one-paragraph factual guard clarification in `docs/architecture/modules/ledger.md`. No registry/graph change, accepted ADR, checkpoint promotion, project-wide cleaning, Source Pack status promotion, unrelated source, CI workflow, external service, financial DB, broker/order capability, new dependency or GEF pin change.

## REQUIREMENTS / ARCHITECTURE RULES
- Module-private `WeakSet` tracks only immutable source states produced by `createSyntheticLedger` and each successful reducer/LOCKED state transition. Require identity membership plus frozen nested source structures and `blocked_new_exposure===true` before accepting next event; reject untrusted clone/prototype and caller-constructed state fail-closed with no exposure authority.
- Every legitimate successful state emitted by `createSyntheticLedger`, `next`, duplicate conflict/lock and synthetic reconciliation must remain tracked. Preserve existing deterministic duplicate handling, immutable nested receipts, all event and policy contracts, event/fill sequence and 20-ID graph. `WeakSet` is in-process fixture provenance ONLY, never cross-process uniqueness, cryptographic authenticity or durable proof.
- Unknown external effect remains simulated and risk blocked; no successful event can set blocked_new_exposure=false or authorize real execution. Error outcomes should not return forged state as valid.
- No new I/O, network, DB, external timestamps, credentials or real financial operations. Do not silently adopt ADR-004.

## ACCEPTANCE CRITERIA / TESTS
1. Adversarial tests: correctly shaped **forged state** with fake MAY_HAVE_SENT/attempt and fabricated policy refs rejected; forged state with `blocked_new_exposure=false` rejected without laundering it through a denial result; structuredClone of a real legitimate state rejected; prototype/throwing getter safe; legitimate creation/ACK/fill/unknown/cancel/reconciliation still passes; successful locked state is owned and permits only already allowed fictional reconciliation.
2. Existing owned 21 tests, added negative tests, bootstrap/Policy/Clock/Market Data scoped graph checks and all four hosted exact-PR-head required jobs SUCCESS (Windows PS5.1, GEF, Source Pack/harness, public security). No tests suppressed.
3. Diff only allowlisted paths. Full code/audit checks ensure immutable fixtures and no high/critical; record exact base/head, hosted log, unchanged real financial gates. Owner self-audit labeled NOT_INDEPENDENT.

## DELIVERABLES / REVIEW FORMAT / STOP CONDITION
Versioned docs-first correction lock, narrow source + owned tests, exact-head hosted Evidence Bundle, pt-BR audit and normal PR merge on verified main only if all checks pass. On stale main, red CI, missing provenance path, false financial authority, any unrelated file or unresolved severity HIGH/CRITICAL, STOP and issue Correction Delta in same PR. No downstream Risk module until correction is objectively audited.
