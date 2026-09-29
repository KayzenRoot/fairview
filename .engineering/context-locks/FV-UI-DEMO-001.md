# Context Lock | FV-UI-DEMO-001

Date: 2026-09-29
State: LOCKED BEFORE PRODUCT OR TEST CODE
Work Order: `.engineering/work-orders/FV-UI-DEMO-001.md`
Work Order commit: `53e81ba6f563557be24f9e9c9493063dc0fda870`
Work Order Git blob: `3e988e32294f5539da147555aecd8b591bd589c9`

## Exact repository state

- Repository: `KayzenRoot/fairview`.
- Branch: `feat/fv-ui-demo-001-local-preview`.
- Base: `e7e19ef0e505eb62cece8b1cc0d6bb601f9fce48`, merged PR #46.
- Remote `origin/main` was rechecked immediately before locking and equals the exact base SHA above.
- Lock parent HEAD: `53e81ba6f563557be24f9e9c9493063dc0fda870`; parent of the Work Order commit is the exact base.
- The isolated worktree was clean after the Work Order commit. The only staged path for this second commit is this Context Lock. No product or test code exists yet.
- Exact-main baseline CI run [36589991327](https://github.com/KayzenRoot/fairview/actions/runs/36589991327): exact base SHA, completed 4/4 SUCCESS; the issue records 561/561 over 14 mock-only ACTIVE suites and 20 registry IDs (six PLANNED).
- Local baseline `npm run validate`: first attempt stopped because the pinned GEF submodule was uninitialized. Initialized the existing submodule only at `866fe3af8cccc65c929aaf6a47a924401fa448b3` (v1.0.0); the full command then exited 0, including Source Pack/public security, doctor and all active harness suites. Source Pack SHA-256: `70db12aea0fcc953f33886c4c9f3d55be03a87ed8891dd3c5f45fba34b39a15d`.
- Issue #47 is OPEN; no PR was open at the baseline query. User instruction to execute issue #47 is the scoped admission; no checkpoint promotion, merge, or financial authorization.

## Frozen module and dependency boundary

Existing module `web` is ACTIVE only for the bounded synthetic read model and depends exactly on existing `risk`, `portfolio`, `observability`, and `ai` mock owners. Existing tests are included by `tests/web/*.test.mjs`. Registry, owner sources, module graph, package/toolchain, security policy, pinned GEF and CI are read-only. The local demo must call `composeSyntheticOperatorReadModel` in the existing Web source and expose only its fixed redacted enums/false-authority flags. The four direct imported owner implementations are immutable read-only dependencies in this task.

`git rev-parse <base>:<path>` blob IDs for the existing authority, implementation, test and gate inputs:

| Existing file | Git blob |
| --- | --- |
| `.engineering/SOURCE-HIERARCHY.md` | `7b2cb9989d8d3de3ec3396a41fb9fc1675662103` |
| `.engineering/CHECKPOINT.md` | `88dc76000d3f78e2c52fbf28d4d23023cbd73c7d` |
| `.engineering/CHECKPOINT.json` | `2c5c1fd8a38c62c64014d19930d7332d5fea37d0` |
| `.engineering/DECISIONS-LEDGER.md` | `116b962fbec0b54bdd9d698d15671aba4ab96664` |
| `.engineering/SCOPE.md` | `31a09aefc3a8169517e519699b75733d8309fdf9` |
| `.engineering/DEFINITION-OF-DONE.md` | `78447bd7810af1e0d1d2e613578c20788fbbc375` |
| `.engineering/ARCHITECTURE.md` | `b8232f90c4fe24b000757fc6631ab903b6db145b` |
| `.engineering/SECURITY.md` | `1c924baeb56882250e7a03519cb26fd2a01816e4` |
| `.engineering/work-orders/FV-UI-DEMO-001.md` | `3e988e32294f5539da147555aecd8b591bd589c9` |
| `docs/architecture/modules/web.md` (the only pre-existing file authorized for editing) | `a2f67f74c9b9f4ed5d6cd99885ac25687fae251e` |
| `harness/modules.json` | `3e01d6769a5bd799643e0b9a957ed677a4a107c0` |
| `package.json` | `39a235fdb52ea33b402db576def8abb25021de56` |
| `scripts/harness.mjs` | `a716afc8ecb4d4a95657a5efd6e22ded8f114294` |
| `scripts/security-scan.mjs` | `be3fc43e104bfc9e84b41f7a12a9a1f0292eafc1` |
| `.github/workflows/foundation.yml` | `cb374e59b959f9e083fcd2cac9ef96395cdaacbc` |
| `src/web/read-model.mjs` | `fb408ce92dec2c4a8ddc6a78e3c4c1e1e177ad8f` |
| `tests/web/read-model.test.mjs` | `7757219670bb8c82043d636d4e337d5ca50cb7c3` |
| `src/risk/evaluate.mjs` | `322222a28919bdc0d2b0e0e622555fb71f9d56f2` |
| `src/portfolio/projection.mjs` | `a01f366228ad180d5715fa47303b179d1dd8b75a` |
| `src/observability/diagnostics.mjs` | `ad7bb4dc5b5ccdca0f62b209c62df7dd2a6b186b` |
| `src/ai/explanation.mjs` | `36153dc22dc8b436853cad15f3274b60917cc140` |

Pinned read-only GEF submodule: `vendor/gef-bootstrap`, exact gitlink/submodule SHA `866fe3af8cccc65c929aaf6a47a924401fa448b3` (v1.0.0).

## Frozen change allowlist and gates

The only permitted changed paths are the eight listed in the admitted Work Order: this Work Order and this lock; `src/web/local-demo/server.mjs`; its three named public assets; `tests/web/local-demo.test.mjs`; and `docs/architecture/modules/web.md`. No existing module or runtime dependency may drift from the blobs above.

Pre-code sequence is satisfied by the parent Work Order commit followed by this standalone lock commit. Product/test code is allowed only after this lock commit exists as HEAD. The next verification must compare the live base and all locked blobs, then use the issue's exact impacted Web harness and adversarial local HTTP tests. Any base, authority, source-owner, GEF pin, test glob, dependency, or security change invalidates this lock and stops work pending an admitted same-WO correction delta. Do not rewrite this lock after implementation; record later test results and final exact candidate SHA in the PR Evidence Bundle.

## Locked safety verdict

D-007 remains OPEN; D-008 PUBLIC credential-free synthetic development only; FV-CP-0002 remains `MIGRATION_DRAFT_NOT_APPROVED`, `independent_approval:false`. No real market, account, user session, login, external model, order, trading, balance, measured PnL, alert delivery or operational control is authorized. Localhost preview cannot establish any of those properties. Checkpoint delta is none.
