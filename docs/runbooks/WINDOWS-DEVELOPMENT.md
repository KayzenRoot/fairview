# Windows Git/Node/GEF development | no external services

**Only FairView checkout is touched.** Prerequisites: Git for Windows, Node.js >=22, npm and PowerShell 5.1+. No Python, Docker, database, embedding model, cloud service or funded broker account is required to develop the foundation. Do not uninstall other applications, stop other projects' processes or delete their data.

## New clone

```powershell
git clone --recurse-submodules https://github.com/KayzenRoot/fairview.git D:\Projects\Fairview
Set-Location D:\Projects\Fairview
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\local\setup-windows.ps1 -Mode Doctor
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\local\setup-windows.ps1 -Mode Install
npm run validate
```

Doctor checks repository origin, tools, Node >=22, initialized GEF and its immutable v1.0.0 SHA only. It makes no package installation or external service mutation. Install only initializes this repository's submodule, verifies the exact GEF pin, runs npm ci/validate/audit inside that submodule and runs FairView's local Source Pack, security and native bootstrap harness. Use a separate approved GEF-upgrade WO before changing the gitlink.

## Existing checkout
First run git status --short and git log --graph --decorate --all -n 15. Preserve local work; do not reset --hard, delete untracked work, force-push or reclone over a nonempty directory. Resolve branch/remote divergence through explicit new branch and reviewed PR, then re-run Doctor. Native check: node scripts/harness.mjs doctor, node scripts/harness.mjs verify --all and node scripts/security-scan.mjs.

## Optional main receipt preflight
scripts/local/verify-checkpoint.ps1 compares clean local HEAD against fetched origin/main and GitHub API main, four exact-main completed successful hosted CI job names, Source Pack and security. This is a non-destructive exact-source **LOCAL_DEV_PRECHECK** only. It neither grants module activation, product account access nor qualified independent security acceptance.

## Failure labels
Missing Git/Node/GEF, bad repository identity, wrong pin, unsupported Node, CI failure, dirty/divergent checkout or failed security scan means BLOCKED. Fix only the affected source under a separately authorized WO. No other machine-level setup is a prerequisite.
