# FV-LEDGER-001 | Context lock

**Source:** protected main 8da9fc71e35d25cef8849db5d7c218f69875faad. Same branch as matching FV-LEDGER-001 WO. Scope only its WO/lock, src/ledger/simulation.mjs, tests/ledger/simulation.test.mjs, harness/modules.json (ledger state and nonempty owned test only), tests/bootstrap/impact.test.mjs and tests/bootstrap/evidence-contract.test.mjs, ledger module charter, R10 matrix and R3 design status amendment. All other 19 module IDs, graph edges, source, workflows and pinned GEF immutable.

**Safety:** only invented local fixtures and the active synthetic policy evaluator. Source-class REAL_VENDOR or unknown policy input DENY; results explicitly fixture_only true, persisted false and execution_authorized false. Exact-head nonempty real tests for duplicate/conflicting events, may-have-sent, lost ACK, cancel/fill, incomplete reconciliation and replay; all affected active harnesses run. Proposed ADR-004 remains unadopted for actual PostgreSQL financial storage. Other modules remain as recorded. No broker, RPC, funded account, secrets, network, host database or physical environment change.

**Acceptance/STOP:** 4/4 exact-head CI, objective changed-file and graph/test audit, owner self-audit explicitly NOT independent, standard review and merge only. Red gate or uncertainty STOP.
