# Context Lock | FV-BOOT-001 R8 | Freshness proof

Status: ACTIVE for a narrowly scoped R8 source correction. Base main: `8d5c55bdcbd6812a4b3de3fd7f3b060b9bfefdef`; branch: `fix/fv-boot-001-r8-freshness-proof`; issue #1. Published v1.0.3 HIVE source contract inspected in `backend/app/registry.py`, `repository_indexer.py`, `retrieval.py`: ProjectResponse includes `project_id, relative_path, git_head_sha, state, repository_accessible, working_tree_clean`; IndexRunSummary includes `project_id, run_id, repository_head_sha`; CorpusRunSummary includes `project_id, repository_index_run_id, status, chunk_count, repository_reference_count`. Candidate PR #169 changes index timeout and gitlink handling, NOT these response fields.

Canonical blob fingerprints checked at branch creation:
- `.engineering/SOURCE-HIERARCHY.md`: `f1902d83d2d6e004fa290c007b0eeb7ed64ca40f`
- `.engineering/CHECKPOINT.md`: `dc17d75ed62e693847de9b5622b9827d3798792c`
- `.engineering/CHECKPOINT.json`: `44b1b4d767f6b97dbbd486f7b2cf14b966bfe339`
- `.engineering/DECISIONS-LEDGER.md`: `cbc84f6ed97fa906ac9d8031aeed133e290a3930`
- `.engineering/SCOPE.md`: `dbdebaf97fd12b1c1c1f09cc4984b07dc0f677f7`
- `.engineering/DEFINITION-OF-DONE.md`: `962ed363c70e547132654431a3707eb05b53ab74`
- `.engineering/ARCHITECTURE.md`: `5d8ffc5269a04809461716e0670c43709040bd17`
- `.engineering/SECURITY.md`: `4c9184d05cc89048db5f7914a61f35825b553507`

Allowed correction: same FV-BOOT-001 R8, `scripts/local/check-hive.ps1` + existing sourced assertions + existing Windows 5.1 fixture/static contract + Windows runbook; R8 Work Order appendix and this context lock. No HIVE upstream writes, global Docker access, env, secret, checkpoint promotion, new product increment or changed acceptance gate. Actual Windows host evidence remains required separately. If one critical canonical blob differs at review time mark STALE and re-evaluate. Tests: actual Windows PowerShell 5.1 fixture, all four exact PR-head jobs, affected bootstrap module, public scanner and owner self-audit (not independent). After normal merge verify postmerge exact-main 4 jobs, publish external receipt to issue #1, and keep issue OPEN for true local HIVE functional proof.
