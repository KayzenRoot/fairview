# FairView | Next Labs

Browser-operated multi-market research and future governed trading platform. **No live-trading runtime has been implemented or authorized.** Development uses GitHub as the source of truth, a local Git checkout, the pinned GEF source-workspace submodule, and the native Node.js harness. There is no external memory service or Docker requirement for the FairView development foundation.

## Source of truth
Read .engineering/SOURCE-HIERARCHY.md, .engineering/CHECKPOINT.md, the accepted decisions, active Work Order and context lock before editing. The no-external-context migration is governed by FV-REMOVE-HIVE-001. Earlier historical commits and issue discussions are evidence of past work, not active software prerequisites.

## Requirements and local Windows setup
- Git, Node.js 22 or later and npm.
- GEF Bootstrap v1.0.0 pinned Git submodule at vendor/gef-bootstrap, exact commit 866fe3af8cccc65c929aaf6a47a924401fa448b3.
- **Not required for developing FairView:** Docker Desktop, Python, database installation, semantic model, external retrieval service, API keys or funded trading account.

Clone using recursive submodules, or initialize the pinned submodule within an existing clean checkout. Never use destructive reset to sync existing work.

```powershell
git clone --recurse-submodules https://github.com/KayzenRoot/fairview.git D:\Projects\Fairview
Set-Location D:\Projects\Fairview
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\local\setup-windows.ps1 -Mode Doctor
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\local\setup-windows.ps1 -Mode Install
npm run validate
```

Doctor checks tools/source and prints missing prerequisites without installing services. Install initializes the GEF submodule only, validates its pinned SHA and uses npm ci, validate and audit within the approved checkout. Neither mode installs or changes external infrastructure.

## Everyday engineering
- npm run doctor; npm run validate; npm run impact -- --base <EXACT_SHA> --head HEAD.
- Every source change needs a narrow admitted Work Order, pinned context lock, registry ownership and nonempty module-specific tests. Impact-driven CI fails closed on unknown paths or premature edits to planned product modules.
- Proposed architecture and initial implementation plans belong in versioned docs, not an invented production-release claim.

## Security and production boundary
This repository is PUBLIC during credential-free development under D-008; it must become independently verified PRIVATE before any funded production deployment. No .env files or examples, real venue keys, wallet seeds, customer data, protected licensed feeds or production logs in Git, CI, prompts or public artifacts. Run node scripts/security-scan.mjs before committing. Product source, venue data rights, risk/ledger recovery, independent financial-security review and owner authorization remain separate future gates.

Full Codex executor/correction/audit prompts issued from chat are polished downloadable PDFs. Canonical Work Orders stay as Markdown under .engineering/work-orders/.
