# GitHub governance | FV-BOOT-001
Workflow: .github/workflows/foundation.yml has three required candidate check names:
- Source Pack and impact-driven harness
- Pinned GEF release validation
- Windows PowerShell parser and harness
- Public repository security gate
The GEF full npm suite must execute when its pinned gitlink/.gitmodules changes; otherwise a fast pin check and the source/harness controls suffice. Main or release boundaries may run broad integration proofs through a separate admitted WO.
Public development is **owner-approved**. Do not attempt to make Fairview private yet; a verified PRIVATE visibility change is a mandatory PRE-PRODUCTION gate and will not conceal earlier public clones/forks. No production keys even in the future private repo. The fourth required check is `Public repository security gate`, added in the public-security delta.

Protection desired immediately during public development: pull request required; these three exact check contexts required; no force push/delete; stale review invalidation as appropriate; CODEOWNERS. The read-only GitHub connector currently cannot change branch protection or repository visibility. Do not claim those admin settings are installed without an authoritative GET/receipt.
Repo remains PUBLIC by deliberate owner decision D-008. Never commit Fairview `.env` or `.env.example`, credentials, customer data, private keys or private algorithms. Public CI is unprivileged and credential-free apart from its ephemeral read-only checkout token. Branch protection requires an authenticated administration capability unavailable in the present GitHub connector. Issue #3 tracks immediate branch protection and later private visibility verification. GitHub secret scanning and push protection should be enabled through repository settings if available; our custom scanner is an additional fallible layer.
CI proves only repository/bootstrap properties; not Windows Docker startup nor semantic embeddings or any trading correctness.