# FV-UI-DEMO-003 | Immutable exact pre-code Context Lock

Date: 2026-09-29
State: LOCKED BEFORE IMPLEMENTATION OR TEST CHANGES
Repository: KayzenRoot/fairview
Branch: `feat/fv-ui-demo-003-incidents-advisory`
Base/source HEAD: `19130b06d05a25f9368a093e37e5f3e5e7fa954a`
First standalone Work Order commit: `d1830b8c8cd18657078bfe04cc7845bc2d5e68fb`
Work Order path: `.engineering/work-orders/FV-UI-DEMO-003.md`
Work Order Git blob at this lock: `9983aad83940fc80561667657765079ed515d373`
Parent of this second commit: the Work Order commit above. No code, test, product, or other file had been changed before this lock.

## Exact source, merge, and gate evidence

- Protected `main`, GitHub API `main`, and local `origin/main` were rechecked at `19130b06d05a25f9368a093e37e5f3e5e7fa954a` before the Work Order and again before this lock. The branch parent is exactly this base; the Work Order commit changes only its own Markdown file. The worktree is otherwise clean.
- GOV-013 PR #52 merged normally from expected feature HEAD `1b6467bcecbc9fb527457ed9269d9ecdf58aeb89` to this base. The PR is MERGED; CodeRabbit reports review completed, no actionable review comments are present, and there are no open PRs at lock time.
- Exact post-merge protected-main Actions run `36629950549`, SHA `19130b06d05a25f9368a093e37e5f3e5e7fa954a`: completed SUCCESS with all four required jobs (Pinned GEF release validation, Source Pack and impact-driven harness, Windows PowerShell parser and harness, Public repository security gate). The `Full active harness (protected main)` step completed SUCCESS. The fourteen actually active suites are strictly synthetic and total 574/574 PASS, as recorded by the exact source evidence and reconciled GOV-013 review.
- Local base preflight passed `node scripts/check-sources.mjs` with Source Pack SHA-256 `decc791a0805815e8bb4604c902ee25892451424e8b64d2c5a50c84f99927055`, `node scripts/security-scan.mjs`, and `node scripts/harness.mjs doctor`. The doctor first identified the managed worktree's missing submodule checkout; `git submodule update --init --recursive` checked out only the existing pin `866fe3af8cccc65c929aaf6a47a924401fa448b3` (`v1.0.0`), after which doctor passed. The submodule gitlink is unchanged.
- Checkpoint `FV-CP-0002-PROPOSED` remains `MIGRATION_DRAFT_NOT_APPROVED`, `independent_approval:false`; D-007 remains OPEN and D-008 remains the public-development/private-before-funded boundary. No financial, production, checkpoint, or module-admission permission follows from this UI Work Order.
- Registry baseline remains twenty module IDs, fourteen ACTIVE only for owned synthetic tests, and six PLANNED. Web is the existing bounded synthetic read-model owner; `integration` is an untested planned reverse dependent and must remain unexecuted.

## Immutable owner, authority, and implementation fingerprints

All Git objects below are read at the exact base SHA above. `vendor/gef-bootstrap` is the submodule gitlink commit; other entries are Git blob IDs.

| Locked base path | Git object |
| --- | --- |
| `AGENTS.md` | `930c04b925aa20672ec984c2227e199017e6c8d3` |
| `.engineering/SOURCE-HIERARCHY.md` | `7b2cb9989d8d3de3ec3396a41fb9fc1675662103` |
| `.engineering/CHECKPOINT.md` | `172bf44f93eda393f3a18ee986e1d669b051242c` |
| `.engineering/CHECKPOINT.json` | `e0a92e29c1987f6c9413ab87e173504ac361d531` |
| `.engineering/DECISIONS-LEDGER.md` | `116b962fbec0b54bdd9d698d15671aba4ab96664` |
| `.engineering/SCOPE.md` | `cdaa3e125e9f2f45ad4dd715bf162831b79e3219` |
| `.engineering/DEFINITION-OF-DONE.md` | `95c19fc925c33a21c0916c3e21ded865e1764dd6` |
| `.engineering/ARCHITECTURE.md` | `5cd8409e64afcae404d7d9c95c881e472b77840a` |
| `.engineering/SECURITY.md` | `1c924baeb56882250e7a03519cb26fd2a01816e4` |
| `.engineering/INTEGRATION-CONTRACTS.md` | `806350eb5df883fa0836aff2c31e540ca43edc6e` |
| `.engineering/REQUIREMENTS.md` | `0dcbdb2e6f63f29b3fc8f9a78f8e04520e7f6039` |
| `.engineering/TEST-BENCHMARK-PLAN.md` | `9a15832e00a57171e81b3104ed55ad4fcb803456` |
| `.engineering/work-orders/FV-GOV-013.md` | `76ff46a0ad80bf49ff5d9718b3c6f5172244a474` |
| `.engineering/context-locks/FV-GOV-013.md` | `65e42caa3d539ec05fa69f3bc2bd857e4f74256e` |
| `.engineering/work-orders/FV-UI-DEMO-002.md` | `b678fc9089b943da3b83dfbe69949c8eb803ea84` |
| `.engineering/context-locks/FV-UI-DEMO-002.md` | `7640f06baafe335d877d812e925c586202c64667` |
| `docs/architecture/modules/web.md` | `55ee0e23a101d17067cd9ae1a80c79f4fe348b2d` |
| `harness/modules.json` | `3514e9ad72f9e095c5cb52dd715223e1fc76de83` |
| `package.json` | `39a235fdb52ea33b402db576def8abb25021de56` |
| `scripts/harness.mjs` | `a716afc8ecb4d4a95657a5efd6e22ded8f114294` |
| `scripts/check-sources.mjs` | `0707aeb4994964ecdf4ca3bc61b71337b2ca3848` |
| `scripts/security-scan.mjs` | `be3fc43e104bfc9e84b41f7a12a9a1f0292eafc1` |
| `.github/workflows/foundation.yml` | `cb374e59b959f9e083fcd2cac9ef96395cdaacbc` |
| `vendor/gef-bootstrap` | `866fe3af8cccc65c929aaf6a47a924401fa448b3` |
| `src/web/read-model.mjs` | `fb408ce92dec2c4a8ddc6a78e3c4c1e1e177ad8f` |
| `tests/web/read-model.test.mjs` | `7757219670bb8c82043d636d4e337d5ca50cb7c3` |
| `src/web/local-demo/server.mjs` | `656251c8baa16b8acbcd94c78ed730f301165f74` |
| `src/web/local-demo/public/index.html` | `bfef772c97ff3aa519b1c6a1254be6899f7c6122` |
| `src/web/local-demo/public/app.css` | `b85c3a45f155f6397e6caed6785db2972feca8f9` |
| `src/web/local-demo/public/app.js` | `b792eb427db766a6b1b991bef76b36a0db53314b` |
| `tests/web/local-demo.test.mjs` | `0a4a9fdaf6dead9ba772d5af714a1a8c9f3e444e` |
| `src/risk/evaluate.mjs` | `322222a28919bdc0d2b0e0e622555fb71f9d56f2` |
| `tests/risk/evaluate.test.mjs` | `40abf57588e24d8f2664c8d416f75b0e8c1cbf8e` |
| `src/portfolio/projection.mjs` | `a01f366228ad180d5715fa47303b179d1dd8b75a` |
| `tests/portfolio/projection.test.mjs` | `accd2f40643926c43a91029d2672bfb27e4ddcd5` |
| `src/observability/diagnostics.mjs` | `ad7bb4dc5b5ccdca0f62b209c62df7dd2a6b186b` |
| `tests/observability/diagnostics.test.mjs` | `dda6ba99a121d1b703e6ffed61882cb7023db2b6` |
| `src/ai/explanation.mjs` | `36153dc22dc8b436853cad15f3274b60917cc140` |
| `tests/ai/explanation.test.mjs` | `43ea5f61a23bf7017f8f0fe79639ec253bc4542d` |

The Work Order and this lock are the only governance paths newly added by this initiative. No product source, browser test, owner file, module registry, dependency, CI, security, decision, or checkpoint file changed before this second commit.

## Frozen seven-path allowlist and product contracts

Exactly these seven tracked paths may change from the base:

1. `.engineering/work-orders/FV-UI-DEMO-003.md`
2. `.engineering/context-locks/FV-UI-DEMO-003.md`
3. `src/web/local-demo/public/index.html`
4. `src/web/local-demo/public/app.css`
5. `src/web/local-demo/public/app.js`
6. `tests/web/local-demo.test.mjs`
7. `docs/architecture/modules/web.md`

Only the existing `GET /api/demo-snapshot?scenario=healthy|degraded|denied` and its one shared validated snapshot may feed Overview, Risk, Portfolio, Incidents, and Advisory. Incidents render literal redacted `incident_banner`/`diagnostic_class` mappings plus a permanent no-real-alert/no-ack/no-monitoring notice. Advisory renders a literal `advisory_class` mapping, statically marks model inference and human review false, and permanently states fixed fictional template/no investment advice/no model/no human approval. No client-calculated owner outcome, alternate fixture, action button, provider, LLM, external service, or new package is allowed.

Keep the existing current-request scenario binding and single monotonic token. Validate the complete envelope, exact model keys and flags, schema/status/internal scenario contract, and the allowlisted requested-versus-returned scenario before rendering. Denied null models, wrong-scenario current bodies, malformed/raw/extra fields, forged `real_alert_delivered`, `mandatory_audit_satisfied`, `model_inference_performed`, `human_review_complete`, invalid enums, current errors, and late fetch/body/error results fail closed and clear values on all five implemented views. View navigation causes no new request. Markets, Strategies, Replay, and Settings stay PLANNED.

No update to `server.mjs`, `read-model.mjs`, owner implementations/tests, `harness/modules.json`, package/dependency files, GEF, CI, security/decision/authority files, checkpoint, or any unlisted path is authorized. If a locked owner fingerprint, base, authority, or gate source drifts, stop and re-admit the affected context before dependent edits. If an additional path becomes necessary, stop and record a narrow same-Work-Order correction before touching it; no unlisted path is authorized by this lock.

## Proof and stop gates

Before the first product/test edit after this second commit, confirm this lock commit is the branch HEAD, its parent is exactly the Work Order commit, the Work Order blob still matches `9983aad83940fc80561667657765079ed515d373`, `main` and `origin/main` remain the exact base, the worktree is clean, the Source Pack and GEF pin remain unchanged, and all locked owner objects still match.

Implementation proof must execute the real public `app.js` through the existing deterministic `node:vm` harness. Retain every existing test; cover all five page navigations and all three synthetic scenarios, shared selector/ARIA state, pending-request navigation without refetch, mismatched valid current scenarios on Incidents and Advisory, old body/error results, invalid new enums, forged alert/model/human-review/audit flags, raw prompt/fixture/extra fields, denied-null data and current errors. Run Web and bootstrap impact proof from base `19130b06d05a25f9368a093e37e5f3e5e7fa954a`; leave planned `integration` unexecuted. Run the named browser suite, `check-sources`, security scan, harness doctor, full `npm run validate` for all currently active modules, and `git diff --check` on the final candidate. Inspect and record exact seven-path diff, exact-head Evidence Bundle and all four hosted checks.

For owner inspection, run the real preview on loopback `127.0.0.1:4173`, inspect all five implemented pages at desktop and mobile sizes with healthy/degraded/denied fixtures, and preserve sanitized screenshots outside Git for the draft PR. Keep author review `NOT_INDEPENDENT`, checkpoint delta `NONE`, and PR status DRAFT. Any unknown path, authority/base drift, gate failure, unresolved blocking review, or request for real finance/monitoring/model behavior is a stop condition. No merge, checkpoint promotion, real financial feature, production authority, or independent approval is authorized.
