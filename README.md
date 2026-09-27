# Fairview | Next Labs
Browser-operated algorithmic trading platform for a governed V1 product. **No live-trading engine exists yet.** GEF/HIVE bootstrap is a separate preparation increment, not production admission.

**Authority:** [.engineering/SOURCE-HIERARCHY.md](.engineering/SOURCE-HIERARCHY.md) -> [CHECKPOINT.md](.engineering/CHECKPOINT.md) -> [FV-BOOT-001](.engineering/work-orders/FV-BOOT-001.md). The active branch is a reviewed proposal, not an approved checkpoint.

## Foundation
- GEF Bootstrap v1.0.0 pinned source submodule under `vendor/gef-bootstrap`, not a published global CLI.
- HIVE v1.0.3 separately installed and pinned on a Windows machine; Fairview lives at `D:\Projects\Fairview`, with read-only project mount `D:/Projects` and HIVE durable `D:/HIVE`.
- Dependency-aware harness: `node scripts/harness.mjs doctor`, `node scripts/harness.mjs verify --all`, `node scripts/harness.mjs impact --base <SHA> --head HEAD`. Unknown paths and unimplemented module edits fail closed.
- Source integrity: `node scripts/check-sources.mjs`. Security baseline: `node scripts/security-scan.mjs`.
- Windows guide: [HIVE local runbook](docs/runbooks/WINDOWS-HIVE.md). No local install is asserted until the actual host passes every required check.

## Setup after this PR is accepted
```powershell
git clone --recurse-submodules https://github.com/KayzenRoot/fairview.git D:\Projects\Fairview
Set-Location D:\Projects\Fairview
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\local\setup-windows.ps1 -Mode Install
```
The installer never silently upgrades an existing HIVE or deletes state. A semantic-search embedding provider is not bundled; `-RequireSemantic` explicitly gates verified semantic capability.

Review in pt-BR; all chat-issued executor/audit/correction prompts are downloadable PDFs only. Never put trading secrets into this public repository.

## Public development security
By owner decision D-008, this repository remains **PUBLIC for development and credential-free CI/CD**. It must become **PRIVATE before financial production launch**, with independent runtime approval. No Fairview `.env` files or examples, API/venue credentials, wallet keys, customer data, or production logs are allowed, including after the visibility change. Existing public Git history/forks cannot be recalled by switching visibility. See `.engineering/SECURITY.md` and `docs/runbooks/GITHUB-GATES.md`.
Run `node scripts/security-scan.mjs` before any PR. Opt-in local staged-file hook: `git config core.hooksPath .githooks`. A passing scanner reduces accidental leakage but is not proof that arbitrary secrets could never be disclosed.
