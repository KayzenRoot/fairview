# Isolated HIVE R6 runbook | local development only
**Never operate the existing HIVE deployment at `D:/HIVE`.** This runbook is for the already separate `hive-fairview-dev` container group installed in the R5 Codex run.

## First, preserve and identify
Obtain the R5 evidence file from the host and independently discover the actual isolated HIVE checkout path, its isolated durable data root, Compose working directory/config files, exact API loopback port and project labels. The existing global HIVE instance at `D:/HIVE` and any `D:/Projects/hive` checkout are excluded. Read only Docker metadata for `hive-fairview-dev`; never print `.Config.Env`, `.env`, providers, credentials or raw user data.
Before upgrading the isolated image, prove the data root is distinct from `D:/HIVE`, that `/workspace/projects` is a bind mount to `D:/Projects` and has `RW=false`, and that the API's published loopback port matches the explicitly supplied API URL. Make a verified isolated backup of PostgreSQL and CAS before changing the source/image. Do not change the DB schema and never run `docker compose down -v`.

## HIVE source correction
Unpatched HIVE v1.0.3 has indexer 5-second Git timeout and rejects Git gitlinks, so retrying the old image is not a fix. The HIVE-FV-001 maintenance candidate in upstream PR #169 introduces typed bounded indexer Git timeout (default 30 seconds, allow 5..120), avoids recursively scanning GEF's submodule worktree and excludes gitlink *content* while retaining its pointer SHA in the index fingerprint. Only use the immutable SHA actually recorded in the **separate** candidate lock after exact-head hosted tests. This is an unpublished development-only candidate; do not falsely call it published HIVE v1.0.4 or merge upstream through an unauthorized Work Order.
Checkout the exact candidate into the **isolated** HIVE source, after preserving any dirty local work, and rebuild only the already-isolated Compose API from that exact checkout/config. Prove the rebuild took effect by recording the old and new API image IDs plus sanitized build receipt, source Git HEAD, identical isolated mount labels/ports and actual API health. The base v1.0.3 tag and user-owned global HIVE remain untouched. If isolation, backup or source/build link is uncertain, STOP without rebuilding.

## Fairview-only real proof
Only once above gates PASS, run `scripts/local/check-hive-isolated.ps1` with explicit `-HiveCheckout`, `-IsolatedDataRoot`, `-ApiBaseUrl` and `-ComposeProject hive-fairview-dev` from verified host observations. This validates mount/checkout/API before invoking existing Fairview `check-hive.ps1` for Fairview relative path ONLY: READY, index COMPLETED, corpus COMPLETED, lexical nonempty, hybrid nonempty. The isolated source mounted `D:/Projects` read-only and other existing project records must remain unchanged.
HIVE semantic embeddings are OFF until a real approved OpenAI-compatible local provider is configured and its actual provider, dimensions and profile are verified; lexical-only fallback is not semantic CURRENT. An optional local Ollama OpenAI-compatible embedding endpoint may be used only if already installed/explicitly authorized, accessible from the isolated Docker API through `host.docker.internal`, non-secret and its vector dimensions validated before `-RequireSemantic` is attempted. A disabled or absent embedding provider is an explicit open subgate.
Verify real HIVE v1.0.3 read-only MCP stdio handshake separately, with project.list and project.status bound to the *isolated* instance. A REST health check does not prove MCP connectivity in the Codex Desktop host surface. Report each outcome separately.

## Gate order
1. Candidate commit hosted CI/harness evidence
2. Fairview PR exact-head CI/normal merge/external receipt
3. Local checkout and Docker provenance + non-secret isolated backup proof
4. Isolated API-only rebuild
5. Real Fairview READY/index/corpus/lexical/hybrid
6. Optional real semantic CURRENT, MCP handshake
7. Owner self-audit noting lack of independent review, final checkpoint proposal only after evidence.

Do not start future Forex/CEX/DEX trading development or claim product production from bootstrap outcomes.
