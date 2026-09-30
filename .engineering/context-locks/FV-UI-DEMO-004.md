# FV-UI-DEMO-004 — Immutable pre-code Context Lock

Issue: https://github.com/KayzenRoot/fairview/issues/56

## Exact state at lock

- Repository: `KayzenRoot/fairview`.
- Branch: `feat/fv-ui-demo-004-complete-local-nav`.
- Protected GitHub `main` and local `origin/main`: `c3fd830208535502a9cfcc7725b28e82478e6be5`.
- Exact base: `c3fd830208535502a9cfcc7725b28e82478e6be5`.
- Work Order commit, which is the sole parent of this Context Lock commit: `d7c932360516ac757b7a103c206dde1412009069`.
- Work Order path Git blob: `3566ae04805784638919f1880074a0c5fed5419f`.
- Work Order commit changes only `.engineering/work-orders/FV-UI-DEMO-004.md`; this lock commit changes only this lock file. No implementation or test code has changed.
- The worktree was clean before this lock was written. The Work Order parent is the exact base. Protected main and `origin/main` were rechecked at the exact base; no other PR was open.
- Source Pack passed with SHA-256 `c1445cdecc9192ea34c5f64f8257e6307a0855017329cd12c440437191dbcd0f`. Harness doctor passed; pinned GEF is `866fe3af8cccc65c929aaf6a47a924401fa448b3`.
- Required post-merge Actions baseline: run `36661858950` on the exact base, completed success with four of four required jobs and all 14 synthetic owner suites passing 576/576 in the protected-main harness.
- Checkpoint remains `FV-CP-0002-PROPOSED` / `MIGRATION_DRAFT_NOT_APPROVED`, `independent_approval:false`. The UI increment has checkpoint delta `NONE`; D-007/D-008 and production/financial gates remain unchanged.

## Frozen Git object fingerprints at the exact base

These are Git object IDs read at `c3fd830208535502a9cfcc7725b28e82478e6be5`. `vendor/gef-bootstrap` is its pinned submodule commit; the other rows are blobs.

| Path | Base Git object |
| --- | --- |
| `AGENTS.md` | `930c04b925aa20672ec984c2227e199017e6c8d3` |
| `.engineering/SOURCE-HIERARCHY.md` | `7b2cb9989d8d3de3ec3396a41fb9fc1675662103` |
| `.engineering/CHECKPOINT.md` | `f7b9afc513509df5e04ac7a7f5f8ec80cf5ad168` |
| `.engineering/CHECKPOINT.json` | `724907ca393a7a0e4aa1869dc6e6448575f0b495` |
| `.engineering/DECISIONS-LEDGER.md` | `116b962fbec0b54bdd9d698d15671aba4ab96664` |
| `.engineering/SCOPE.md` | `d5b008aaeba64e4b98e2c434befaab630f7ee58e` |
| `.engineering/DEFINITION-OF-DONE.md` | `50dbd65f64284af3cb485f74981f02340d8a9b76` |
| `.engineering/ARCHITECTURE.md` | `4a0bc2a332c560a1ca48c1f77da20701b9361c70` |
| `.engineering/SECURITY.md` | `1c924baeb56882250e7a03519cb26fd2a01816e4` |
| `.engineering/INTEGRATION-CONTRACTS.md` | `19d6fd127f316465c5b06a0ab8819d1a4a36c1c7` |
| `.engineering/REQUIREMENTS.md` | `0dcbdb2e6f63f29b3fc8f9a78f8e04520e7f6039` |
| `.engineering/TEST-BENCHMARK-PLAN.md` | `aa5d316494453036b3749e840859fd103e80c7f4` |
| `.engineering/work-orders/FV-GOV-014.md` | `1ca57d20fba0ca7ea9836585983eb97a716e0781` |
| `.engineering/context-locks/FV-GOV-014.md` | `d2fa5f032161711c2a0920e74847431c52ca3cd6` |
| `docs/architecture/modules/web.md` | `27370bca5324bf15ab9b5272f67f91353773a7d7` |
| `harness/modules.json` | `9a9441bc069bf7b0dc4b27149a8f0e0f0d80314d` |
| `package.json` | `39a235fdb52ea33b402db576def8abb25021de56` |
| `scripts/harness.mjs` | `a716afc8ecb4d4a95657a5efd6e22ded8f114294` |
| `scripts/check-sources.mjs` | `0707aeb4994964ecdf4ca3bc61b71337b2ca3848` |
| `scripts/security-scan.mjs` | `be3fc43e104bfc9e84b41f7a12a9a1f0292eafc1` |
| `.github/workflows/foundation.yml` | `cb374e59b959f9e083fcd2cac9ef96395cdaacbc` |
| `vendor/gef-bootstrap` | `866fe3af8cccc65c929aaf6a47a924401fa448b3` |
| `src/web/read-model.mjs` | `fb408ce92dec2c4a8ddc6a78e3c4c1e1e177ad8f` |
| `src/web/local-demo/server.mjs` | `656251c8baa16b8acbcd94c78ed730f301165f74` |
| `src/web/local-demo/public/index.html` | `06152c417e1e522ed756c08a37f3965cdb0e2535` |
| `src/web/local-demo/public/app.css` | `8f3ba058d6efc4dce16f4baedc66fff92aa3021f` |
| `src/web/local-demo/public/app.js` | `a806fae7b5ebb91280780e088de2d7e663835ce8` |
| `tests/web/local-demo.test.mjs` | `cb6e8fbe71805b09b788be15d5c632b4558a7827` |
| `src/risk/evaluate.mjs` | `322222a28919bdc0d2b0e0e622555fb71f9d56f2` |
| `tests/risk/evaluate.test.mjs` | `40abf57588e24d8f2664c8d416f75b0e8c1cbf8e` |
| `src/portfolio/projection.mjs` | `a01f366228ad180d5715fa47303b179d1dd8b75a` |
| `tests/portfolio/projection.test.mjs` | `accd2f40643926c43a91029d2672bfb27e4ddcd5` |
| `src/observability/diagnostics.mjs` | `ad7bb4dc5b5ccdca0f62b209c62df7dd2a6b186b` |
| `tests/observability/diagnostics.test.mjs` | `dda6ba99a121d1b703e6ffed61882cb7023db2b6` |
| `src/ai/explanation.mjs` | `36153dc22dc8b436853cad15f3274b60917cc140` |
| `tests/ai/explanation.test.mjs` | `43ea5f61a23bf7017f8f0fe79639ec253bc4542d` |

## Frozen seven-path allowlist and implementation contract

Only these seven paths are authorized to change in this Work Order:

1. `.engineering/work-orders/FV-UI-DEMO-004.md`
2. `.engineering/context-locks/FV-UI-DEMO-004.md`
3. `src/web/local-demo/public/index.html`
4. `src/web/local-demo/public/app.css`
5. `src/web/local-demo/public/app.js`
6. `tests/web/local-demo.test.mjs`
7. `docs/architecture/modules/web.md`

The four new pages may render only safe fixed copy and exact allowlisted labels from the existing accepted synthetic snapshot. The page-specific permanent boundaries are defined in the Work Order and issue #56. No invented prices, signals, strategies, performance, historical market data, accounts, authentication, provider settings, or financial data/behavior are allowed.

All nine views share one snapshot and request selector. Navigation must not fetch. Retain the exact current-request monotonic token and requested-versus-returned scenario binding. Preserve all current envelope/model/flag validation. Loading, denied, malformed, unrecognized, raw/extra, forged, stale, error, and mismatch paths clear dynamic fields on all nine pages. Denied never renders as healthy. Do not use untrusted `innerHTML`. Maintain responsive desktop/mobile layout and accessible keyboard/hash/click/ARIA navigation.

Extend the existing deterministic `node:vm` harness to execute the real `app.js`. Retain all prior tests and cover all nine navigations; each allowed scenario on each new view; shared requests with no navigation refetch; denied clearing; both directions of valid but mismatched current scenarios; every authority flag listed in FV-UI-DEMO-004; added/raw keys; malformed mode/session/stream/redaction enums; stale fetch/body/error races; current failure clearing; and absence of unsafe claims. After implementation, inspect the actual server at loopback in desktop/mobile sizes for the four new pages and three scenarios. Keep sanitized image artifacts outside the repository.

The expected changed-surface impact is the existing synthetic `web` module and the applicable local bootstrap/test path, to be confirmed by the required exact-base impact graph after implementation. `integration` remains PLANNED and must not be run. No module status, registry, CI, package/dependency, server/read-model, checkpoint, financial, or GEF path is authorized.

## Exact lock reconfirmation gate

Before any implementation or test edit after this lock commit, verify:

1. This lock commit is the current branch HEAD, and its direct parent is exactly `d7c932360516ac757b7a103c206dde1412009069`.
2. The Work Order still has Git blob `3566ae04805784638919f1880074a0c5fed5419f`.
3. GitHub protected `main`, `origin/main`, and base are still `c3fd830208535502a9cfcc7725b28e82478e6be5`.
4. The worktree is clean; only the Work Order and Context Lock commits exist above base; the seven-path allowlist is exact.
5. Every frozen base object still resolves to the value in this table; Source Pack and pinned GEF remain as recorded; the mandatory exact-base run remains successful.

Any drift, failed gate, new authority ambiguity, or necessary unlisted path invalidates this lock and stops edits until a same-Work-Order correction and fresh exact lock are admitted. This lock does not authorize merge, checkpoint promotion, independent approval, production, live financial capability, authentication, or use of real financial data.
