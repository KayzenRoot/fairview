# FairView GitHub governance | native Git/Node development

Four named required check contexts in .github/workflows/foundation.yml:
1. Source Pack and impact-driven harness.
2. Pinned GEF release validation.
3. Windows PowerShell parser and harness.
4. Public repository security gate.

The GEF job verifies immutable exact gitlink v1.0.0 and runs its full npm validate/audit when the submodule or .gitmodules changes; the fast path reuses prior approved source proof when unchanged. Windows parses the current native Doctor/checkpoint scripts and executes actual Windows PowerShell 5.1 no-service Doctor; Ubuntu checks source pack, security, exact-base/head impact and active module harness. Product-specific full integrations require admitted separate WOs, not bootstrap documentation tests.

Keep protected main with required PR, these exact four checks, no force push/delete and an independently reviewed release for high-assurance financial changes. Observe actual rulesets and status instead of guessing admin settings. Owner decision D-008 allows PUBLIC non-secret development/CI but requires actual PRIVATE visibility before any funded financial release. GitHub CI must not contain broker/private-wallet credentials, paid raw data or customer information, even if private later.

A green foundation CI proves repository-tooling scope only; it does not prove Forex/CEX/DEX trading, independently verified risk, profitable performance or live deployment safety.
