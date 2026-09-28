# Policy, licensing and safety | module `policy`

State: **PLANNED, NOT IMPLEMENTED**. Authority: proposed FV-DISC-001 modular map; separate admitted Work Order required to add source/tests.

Reserved source ownership: `src/policy/`.
Harness ownership: `tests/policy/`.
Dependency graph: independent planning boundary.

## Responsibility and scope
Venue- and strategy-specific permissions; data-license eligibility; forbid non-authorized protocols and prohibited execution patterns; security and privacy gates; model controls for policy evidence.

## Candidate existing technology to evaluate
Typed policy manifests; non-secret mock fixtures; candidate policy engine only after threat modeling.

## First activation proof / STOP
Denied venue/strategy must fail closed; no hidden order-origin spoofing.

### Design-time interface contract
Produce a typed input/output specification, ownership and failure-state table, fixture/provenance specification, numerical acceptance metrics if appropriate, upstream license/terms record, rollback/reconciliation requirements and one narrowly scoped WO before implementing. Default mode: documentation or deterministic offline research. No live credentials or orders, no trading implementation under this proposal.
