# FairView canonical source hierarchy

1. Latest independently audited, explicitly promoted checkpoint (.engineering/CHECKPOINT.md and CHECKPOINT.json) at the actual accepted Git head.
2. Accepted owner decisions in DECISIONS-LEDGER.md and explicitly adopted ADRs; PROPOSED_NOT_ADOPTED is not accepted.
3. Current SCOPE.md and DEFINITION-OF-DONE.md.
4. ARCHITECTURE.md, SECURITY.md and INTEGRATION-CONTRACTS.md.
5. REQUIREMENTS.md and TEST-BENCHMARK-PLAN.md.
6. Current specifically admitted Work Order plus exact context lock, Git HEAD/diff, actual deterministic tests, CI and reviewer evidence.
7. README and current runbooks as supporting operational guides.

Read fresh, scoped source files directly from the repository. Rebuild the smallest sufficient context from the Source Pack and referenced ADR/WO. No background index or network-based memory application is required or authoritative. Conflicting or stale claims STOP the affected change, never silently grant approval. This migration PR is PROPOSED, not an independently promoted checkpoint; earlier audit records remain in immutable Git history and issue logs.
