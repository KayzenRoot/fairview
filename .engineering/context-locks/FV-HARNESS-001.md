# FV-HARNESS-001 | Context lock

Base main: 858c12538df93a51d4faed50a7f4faa5e08be50d. Allowed paths: the matching work order and this lock, scripts/lib/impact.mjs, scripts/harness.mjs, tests/bootstrap/impact.test.mjs. The existing 20 IDs, their states and GEF commit 866fe3af8cccc65c929aaf6a47a924401fa448b3 remain unchanged.

Reject unknown paths, edits directly owned by a planned module and active modules with inactive direct dependencies or missing real tests. Run every impacted active harness; retain planned dependents as explicit untested evidence rather than a blocking condition on an already active upstream module. Four exact-head checks, scoped review, no trading source or financial credentials. STOP if scope or CI fails.
