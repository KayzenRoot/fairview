# FV-BOOT-001 R6 | Isolated HIVE Windows indexing recovery (same Work Order)
**Status:** PROPOSED / NOT PROMOTED. **Fairview base:** `c79551d4ee4656d266a0c0a8260643921d13eb8c`. Fairview issue #1; consumer of HIVE issue #168 / maintenance candidate PR #169. This is a tightly bounded corrective dependency of the admitted bootstrap, not a new product increment.

## Diagnosis / external host evidence
Codex R5 reports: separate Compose project `hive-fairview-dev` with HIVE v1.0.3 on immutable base `52bd3dab54dd4f16264072e198ed1fc23168f7fa`; Fairview registered READY and correct read-only `D:/Projects` mount, but index failed `git_status_unavailable` after 6.87 sec command vs HIVE indexer's 5 sec timeout. Fairview contains a GEF Git submodule (mode 160000), which unpatched HIVE rejects. Semantics is disabled and no real embedding model/configured sync exists. This is user-provided local evidence, not CI proof.

## Source selection
Immutable published HIVE v1.0.3 remains canonical in `.integrations/hive.lock.json`. A separate isolated-development-only maintenance lock MAY pin the exact passing PR #169 candidate commit, with its test receipts and candid `UNPUBLISHED_PATCH_CANDIDATE` status. Do not mislabel this an official v1.0.4 or silently upgrade the standalone HIVE project. HIVE repo has its own canonical checkpoint and protected-main Work Order governance; never bypass its Review Evidence or merge an unapproved HIVE PR merely to satisfy Fairview.

## Allowed work
1. Add a dev-only candidate lock after HIVE's exact-head backend validation and integration proof are inspected (or explicitly record missing integration proof and STOP).
2. Add a non-destructive PowerShell diagnostic for an **already isolated** Docker Compose API. Require actual checkout path, isolated data root, Compose project and exact localhost API URL. Verify HIVE candidate checkout SHA, unchanged proper source origin, unique API container, correct read-only project bind and distinct data-root bind; validate API port maps to that service before calling Fairview-only HIVE smoke.
3. Operator/Codex performs a verified backup of *isolated* instance before rebuilding **only** its API image from the pinned candidate. Preserve its PostgreSQL, Redis, CAS, .env and Compose labels. Existing `D:/HIVE`, `D:/Projects/hive`, and other Compose projects remain absolutely untouched. No migrations or broad reinstall.
4. After verified rebuild, run actual Fairview-only project READY, index and corpus, lexical/hybrid retrieval, optionally semantic CURRENT only after a **real** locally approved embeddings provider is configured, and read-only MCP handshake in the same local isolation context. Collect category-only, non-secret Evidence Bundle off Git.
5. Test script parser on hosted Windows and focused dependency-aware bootstrap harness and publish exact-head GitHub evidence.

## Forbidden
Deleting/moving data, `docker compose down -v`, unapproved schema changes, changing other HIVE container volumes, running Fairview legacy `setup-windows.ps1 -Mode Install` over pre-existing `D:/HIVE`, silently changing official HIVE v1.0.3 pin, claiming disabled semantic as CURRENT, copying .env/API tokens into public Fairview, authorizing live trading.

## Acceptance and STOP
Only an observed real Windows isolated instance with independently bound source and Docker container identity, Fairview READY/index COMPLETED/corpus COMPLETED/nonempty lexical+hybrid and actual MCP handshake can change FV-BOOT-001 LOCAL_VALIDATION_PENDING. If semantic is not configured, report `SEMANTIC_DISABLED` separately and leave full semantic requirement open; never synthesize a PASS. This maintenance candidate supports only development, and upstream HIVE publication remains its own approval gate. New main commit requires exact-head CI and a fresh external owner receipt before using the Fairview checkpoint preflight.
