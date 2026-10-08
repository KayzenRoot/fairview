# FairView | Repository executor rules

## Authority and environment
Read the source hierarchy, current actual Git refs, checkpoint and accepted decisions; then the narrow admitted Work Order, exact context lock, module registry and applicable ADRs. Git code, exact-head CI and independent evidence outrank conversation. No external context/index/database tool is a mandatory development dependency. Never treat a proposed checkpoint or successful documentation test as a passed production test.

Use a clean checked-out repository, Node 22+, Git and the pinned GEF source submodule. Run node scripts/check-sources.mjs, node scripts/security-scan.mjs, node scripts/harness.mjs doctor and the impact-driven harness. No Docker, Python or semantic provider is required by FairView's development foundation. Do not install or uninstall other projects' services.

## Work Order and test discipline
Only an admitted, precisely scoped Work Order is executable; document exact repository, branch/base/head, allowed files, risk and STOP. Unknown paths, unexpected dependencies, failure and concurrent ref changes must fail closed. One module at a time with nonempty real deterministic tests, negative/failure injection and truthful CI receipts; never activate planned source by passing only a documentation guard. Work from actual registry dependency and reverse impact closure. Do not force-push, rewrite protected history, silently upgrade SDKs or promote a checkpoint without accepted evidence.

GEF must remain pinned to commit 866fe3af8cccc65c929aaf6a47a924401fa448b3 unless a separately approved upgrade is audited. All new dependencies are candidate technology until individually vetted and version-locked.

## Financial and privacy guardrails
Live execution, privileged wallet actions, fee-tier/data rights, financial secrets, risk-limit modifications or deployments are out of scope unless admitted in independent high-assurance source WOs. Financially funded production requires actual venue and strategy permission, properly reconciled ledger/account state, fail-closed risk, independent review, private repository proof, managed secrets and separately authorized operational release.

The repo stays PUBLIC for non-secret development per D-008, including CI fixtures. Never commit any .env including .env.example, keys, account identifiers, customer data, licensed ticks or production financial logs. A passing scanner is not proof no secret could ever leak.

## Handoff and evidence
Keep full executor/correction/audit prompts sent from chat in polished downloadable PDF format; canonical repo WOs/locks in Markdown. Record exact-head diff, source fingerprint, impacted tests, security checks, CI runs and failure reasons. Owner self-audit must be labeled NOT_INDEPENDENT; a qualified independent security review remains required for high-assurance live trading. Do not claim real-host functionality based solely on hosted unit tests.

## Agent skills

### Matt Pocock skill invocation

When the `mattpocock-skills` plugin is available, automatically use a model-invoked skill whose description matches the current task; these skills do not require the user to type a slash command. Use `/ask-matt` when skill routing is unclear. User-invoked workflows remain user-led. Do not force-fit a skill or let it override the user's request, this repository's governance/security rules, or deterministic evidence.

Prefer deterministic Git, text search, AST, hashes, tests, lint, typecheck, and build checks whenever they are sufficient. Use Jev only when available and useful for bounded context relevance, triage, classification, reranking, claim verification, comparison, or explicit-gate decisions. Jev output is advisory; never send it secrets or credentials.

### Issue tracker

Issues and specs for this repository live in GitHub Issues. Use the `gh` CLI and follow `docs/agents/issue-tracker.md`.

### Triage labels

Use `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix` for the five canonical triage roles. Follow `docs/agents/triage-labels.md`.

### Domain docs

This repository uses a single-context domain layout. Read relevant glossary and ADR material before domain changes; follow the actual paths recorded in `docs/agents/domain.md`.
