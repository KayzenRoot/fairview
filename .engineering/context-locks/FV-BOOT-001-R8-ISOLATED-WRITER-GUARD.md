# Context lock | FV-BOOT-001 R8 exclusive isolated writer safety

Status: ACTIVE, bounded post-R8 Codex STOP correction. Base main `bcf8a990b542b247848e177b49b23c71461a723f`; branch `fix/fv-boot-001-r8-isolated-writer-guard`; issue #1. Source of reported local symptoms: owner-supplied screenshot only, not primary PDF/JSON.

Published HIVE source inspected: `backend/app/project_discovery.py` invokes `register_project`, `index_project` and `sync_corpus` for multiple projects when `HIVE_AUTO_DISCOVERY_ENABLED` is on. `backend/app/main.py` schedules discovery on startup. Fairview's existing isolated doctor is read-only in Inspect, but its Verify calls a mutating smoke without a machine-verifiable exclusive-writer preflight. The proposed delta prevents that unsafe path; it does NOT auto-pause another program or operate on global HIVE.

Canonical blob fingerprints at branch creation:
- `.engineering/SOURCE-HIERARCHY.md`: `f1902d83d2d6e004fa290c007b0eeb7ed64ca40f`
- `.engineering/CHECKPOINT.md`: `dc17d75ed62e693847de9b5622b9827d3798792c`
- `.engineering/CHECKPOINT.json`: `44b1b4d767f6b97dbbd486f7b2cf14b966bfe339`
- `.engineering/DECISIONS-LEDGER.md`: `cbc84f6ed97fa906ac9d8031aeed133e290a3930`
- `.engineering/SCOPE.md`: `dbdebaf97fd12b1c1c1f09cc4984b07dc0f677f7`
- `.engineering/DEFINITION-OF-DONE.md`: `962ed363c70e547132654431a3707eb05b53ab74`
- `.engineering/ARCHITECTURE.md`: `5d8ffc5269a04809461716e0670c43709040bd17`
- `.engineering/SECURITY.md`: `4c9184d05cc89048db5f7914a61f35825b553507`

Allowed files: `scripts/local/check-hive-isolated.ps1`, new pure testable `scripts/local/hive-window-assertions.ps1`, `tests/bootstrap/hive-window-assertions-ps51.ps1`, `tests/bootstrap/isolated-hive-contract.test.mjs`, `.github/workflows/foundation.yml`, `docs/runbooks/WINDOWS-HIVE.md`, R8 WO appendix and this lock. No HIVE repo changes, shell lifecycle mutation, secrets, Docker write, checkpoint, runtime trading or deployment. Existing API/PG IDs, backup/CAS, SQL safety and observed no writes must be backed by operator-host off-Git evidence, not CI alone. A host without explicit exclusive proof must fail safely. The single existing R8 final gate remains unchanged.

Tests: exact PR-head four foundation jobs; real Windows PowerShell 5.1 positive/negative receipt, auto-discovery and stats fixtures; affected-module Node harness; public source scanner. Scoped owner audit is NOT INDEPENDENT. Revalidate critical canonical blobs before merge and publish postmerge exact-main receipt only after 4/4 PASS.
