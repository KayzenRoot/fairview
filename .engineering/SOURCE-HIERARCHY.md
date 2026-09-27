# Fairview canonical source hierarchy
1. Latest independently audited and promoted CHECKPOINT.md plus CHECKPOINT.json at exact Git head.
2. DECISIONS-LEDGER.md and accepted ADRs.
3. SCOPE.md, then DEFINITION-OF-DONE.md.
4. ARCHITECTURE.md, SECURITY.md and integration contracts.
5. REQUIREMENTS.md and TEST-BENCHMARK-PLAN.md.
6. Current admitted WORK ORDER, its context lock, Git state, CI and primary evidence.
7. README, runbooks and HIVE retrieval. Derived HIVE summaries never approve changes or override Git evidence.

If sources conflict, stop the affected change, label context STALE, recompile the smallest fresh context. A proposed checkpoint in a PR is not authoritative until exact-head audit approval and promotion. Source Pack prose cannot claim implementation or successful local installation.