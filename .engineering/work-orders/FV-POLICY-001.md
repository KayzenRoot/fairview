# FV-POLICY-001 | Synthetic policy evaluator

Scope: implement a deterministic, network-free policy engine for invented test fixtures. It must fail closed on missing scope, expired or revoked grants, mismatched permissions and invalid evidence. Every result is labeled synthetic and cannot authorize any external action.

Allowed files: this WO, its context lock, src/policy/eligibility.mjs, tests/policy/eligibility.test.mjs, harness/modules.json, tests/bootstrap/impact.test.mjs, docs/architecture/modules/policy.md, docs/architecture/MODULE-READINESS-AND-IMPLEMENTATION-R10.md. Preserve other modules and GEF. Require real positive/negative tests and four exact-head checks. STOP on out-of-scope edits or failed tests.
