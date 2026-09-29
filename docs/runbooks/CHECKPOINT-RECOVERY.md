# FairView exact-main development checkpoint and recovery

A checkpoint JSON file cannot embed the SHA of its own enclosing Git commit; treat historical audit hashes as immutable provenance and only promote a new checkpoint through a reviewed exact-head PR and explicit receipt. Current migration baseline is PROPOSED until its own CI and normal merge. An owner's self-audit is not an independent qualified financial-security review.

Run scripts/local/verify-checkpoint.ps1 for an OPTIONAL non-destructive exact-main preflight on Windows. It validates clean local HEAD = refreshed origin/main = GitHub API main, exact-main completed successful GitHub push CI with all four required job names, Source Pack and tracked-tree security. It does not require stale historical issue comments, machine-level services or any external retrieval credentials.

If HEAD differs, do not force reset, rebase with unreviewed working changes or delete files. Record git log --graph --decorate --all -n 15, git merge-base HEAD origin/main and redacted git status --short; coordinate a new scoped branch/PR and fresh CI evidence. A green local preflight authorizes ordinary Git/Node source work ONLY within an admitted Work Order; production runtime depends on real module tests, independent review, venue/strategy/data rights, private repository and separately approved financial controls.
