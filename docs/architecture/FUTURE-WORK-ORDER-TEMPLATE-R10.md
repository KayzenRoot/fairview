# FV-DISC-001 | Round 10: future narrowly scoped module Work Order template

**Status: PROPOSAL ONLY, NOT ADMITTED.** This document is a repeatable *review checklist* to prepare separately admitted implementation WOs once FV-BOOT-001 FULL and independent audit are verified. It is NOT a Codex executor prompt, active module WO, GitHub issue assignment, checkpoint promotion, trading authorization, production deployment approval, or an exception to the chat-origin executor PDF rule D-003. Never paste live secrets or customer data into its fields.

## Before writing ANY product-source WO

Verify against authoritative GitHub and source hierarchy, rather than relying on old chat, HIVE retrieval or green planning CI:

- [ ] **G0 / G1 FULL:** inspect exact isolated-host FV-BOOT-001 HIVE R8 FULL evidence (semantic provider enabled, correct indexed head, nonempty allowed corpus, MCP retrieval and restart/durability) and an **actual named independent** source/host approval. If FAILED, INCOMPLETE or reviewer missing, STOP and continue documentation or separate FV-BOOT-001 remediation only.
- [ ] **Repo and governance:** read current canonical promoted checkpoint, decisions ledger, scope, DoD, security, impact registry and Git branch/head. Record signed base and exact relevant SHA; ensure planned product work doesn't alter accepted pins/main by side effect.
- [ ] **Owner and dependency:** choose **exactly one** primary registered module and its owning reserved `src/<module>/` + `tests/<module>/` (or `src/contracts/`, `tests/integration/` for the very LAST integration module). Check every literal `depends_on` is already ACTIVE and accepted; no fabricated active status. Review R10 graph waves and any still PROPOSED_NOT_ADOPTED ADRs; get a separately accepted decision before code depends on them.
- [ ] **Scope and legal:** for pure synthetic WOs, forbid all real brokerage/RPC/network and use invented dummy accounts/feeds. For any read-only/demo connection obtain and store approved exact legal entity, jurisdiction, instrument, account/app entitlement, fee tier, market-data usage and data retention grants in PRIVATE managed evidence outside public Git. Separately independently review external runtime capability and threat model.
- [ ] **Security boundary:** public dev repo allows only unprivileged synthetic CI. Never commit ANY Fairview `.env`, including `.env.example`; never place API keys, signing material, customer records or real trade logs in repository, CI, PDFs, screenshots, issue comments or HIVE. PRIVATE visibility is mandatory **before financially funded production**, as are external managed runtime secrets and documented rotation.

## Proposed WO header fields (to complete in future independently admitted artifact)

| Field | Required exact value |
|---|---|
| Proposed WO identifier | `FV-<MODULE>-NNN` (reserve only when owner actually approves; R10 candidate IDs are not issued WOs) |
| Principal module + charter | EXACT registry ID, `docs/architecture/modules/<id>.md`, governing R1-R9 document and accepted scoped ADR |
| Current main, target branch and exact starting SHA | Fetched at future WO start; fail if changed or stale |
| Required active direct dependencies | Literal `depends_on` IDs verified as ACTIVE with exact evidence; global FV-BOOT-001 independent gate separate |
| Allowed paths | Exact limited source + module-owned nonempty `tests/<id>/` + explicitly named doc/fixtures, nothing else |
| Excluded paths and privileges | No unrelated modules, accepted pin, main, canonical CHECKPOINT, secret file, real order/wallet/API by default |
| Operation mode | `SYNTHETIC_ONLY`, or independently approved `READ_ONLY`/`DEMO`; `LIVE` is an entirely different HIGH_ASSURANCE release decision |
| Input and output schema | Immutable typed versioned contract, explicit provenance, freshness/clock, precision, order/outcome/unknown states as applicable |
| Safety and independent authorization | Policy scope, independent Risk Kernel, kill epochs, bounded unknown order exposure, read-only broker reconciliation where relevant |
| Dependency / OSS decisions | Exact upstream source tag/SHA, transitive licences, applicable legal data rights and performance reason with fallback |
| Negative fixture IDs | All mandatory named R1-R9 cases relevant to module, chosen adverse boundary and exact expected FAIL-CLOSED outcome |
| Acceptance and STOP | Deterministic tests, exact-head CI/security, reproducible proof, owner and independent reviewer receipts, freeze/rollback behavior |
| Evidence bundle | Base/head, changes, ownership/impact closure, test commands/results, skipped tests + reasons, open risks, source and dataset digests |
| Recovery | Rollback/roll-forward plan without retrying UNKNOWN external sends, durable incident evidence and independent kill restoration |

## Standard admitted-WO execution checkpoints (FUTURE only)

**CP0: exact source admission.** A reviewer verifies FULL host and independent approval, opens a narrow accepted WO and immutable context lock, pins SHA and approves the precise module owner and path allowlist. A planned document or suggested WO number is not admission.

**CP1: contract and fixtures first.** Write module-owned deterministic unit/negative fixtures and versioned synthetic evidence manifest before adding the smallest product source slice. Keep all other registry states unchanged. Do not create or consume a live secret in a CI environment.

**CP2: bounded implementation.** Implement only exact admitted paths and technology ADRs, always behind existing independent Risk/Policy boundary for any order-capable code. Every uncertain external side effect remains `UNKNOWN_NEEDS_RECONCILIATION`, not silent retry. Retry SQLSTATE 40001 local DB work only.

**CP3: local affected and dependency proof.** Execute new module harness including negative fixtures, type/static/security checks and upstream seam tests; selected impact closure must include dependent PLANNED modules as a *review/activation block*, not assume their tests exist. Any unknown changed path broadens the harness and requires explicit approval.

**CP4: exact hosted evidence.** Run defined hosted CI against the **same exact PR head**, capture all jobs, failure logs and unchanged protection/pin proof. Every HIGH/CRITICAL unresolved issue stops promotion. Compare diff against exact allowlist and check that no secret or real dataset entered public Git.

**CP5: independent review and checkpoint.** Named independent reviewer confirms actual scoped tests and threat/permission evidence, identifies any unmet action, and only then considers the module state/harness registry update as a separately reviewed scoped decision with real nonempty test-owner path. The canonical promoted checkpoint follows source hierarchy, not an owner self-audit alone. A module may stay PLANNED despite code having been proposed.

**CP6: mode-specific operational release (if separately requested).** Real provider connections and demo accounts require specific external evidence and separate approval. A funded production route is NOT inherited from research/demo and needs independent HIGH_ASSURANCE acceptance, PRIVATE repository proof, runtime secret store, loss/kill/reconciliation drills and an explicitly bounded owner's go/no-go record. Do not assume a profitable or low-latency outcome from an offline replay.

## Planned first candidates after FV-BOOT-001 external PASS

As R10 graph wave 1, propose two separate narrow, source-free planning handoffs for **`policy`** and **`clock`**. Once each is admitted and can activate with real, nonempty deterministic fixtures, wave 2 can consider `market-data` and `ledger`, and only then wave 3 independent `risk`. Do not issue these as existing approved WOs in Round 10. If the product owner later requests a complete executable Codex or reviewer handoff, produce a polished downloadable PDF following accepted D-003 and point it at the reviewed repo Markdown WO.

**STOP:** This template only organizes future independent decisions. It does not change module state or execute product code, and cannot override a FAILED FV-BOOT-001 FULL gate.