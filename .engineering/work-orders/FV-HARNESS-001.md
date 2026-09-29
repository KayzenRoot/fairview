# FV-HARNESS-001: Gradual module admission

Scope: bootstrap impact selector and its tests only. Preserve the 20-module registry and GEF pin. Distinguish directly modified planned modules from planned reverse dependents of a changed active module. Direct edits to unadmitted planned modules must fail; active upstream changes can run their real tests while inactive downstream remain reported as untested. Validate active dependency readiness and nonempty module tests. No product source or live trading is authorized by this work order.

Allowed changes: this work order, its matching context lock, scripts/lib/impact.mjs, scripts/harness.mjs, tests/bootstrap/impact.test.mjs. Four exact-head CI checks and normal PR review are required. STOP on scope or test failures.
