# GitHub governance | FV-BOOT-001
Workflow: .github/workflows/foundation.yml has three required candidate check names:
- Source Pack and impact-driven harness
- Pinned GEF release validation
- Windows PowerShell parser and harness
The GEF full npm suite must execute when its pinned gitlink/.gitmodules changes; otherwise a fast pin check and the source/harness controls suffice. Main or release boundaries may run broad integration proofs through a separate admitted WO.
Protection desired before future product runtime: pull request required; these three exact check contexts required; no force push/delete; stale review invalidation as appropriate; CODEOWNERS. The read-only GitHub connector currently cannot change branch protection or repository visibility. Do not claim those admin settings are installed without an authoritative GET/receipt.
Repo currently public: never store credentials, customer data, private keys or commercial secrets. Privacy and branch protection require an authenticated administration capability outside this Work Order.
CI proves only repository/bootstrap properties; not Windows Docker startup nor semantic embeddings or any trading correctness.