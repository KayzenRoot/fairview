# FV-LEDGER-001 | Exact-context source lock

- Repository: KayzenRoot/fairview; branch: feat/fv-ledger-001-synthetic-lifecycle; frozen base `37ab859aa8e2d8fff02ab910ac7e948ce331e0ca`. Merged docs PR #24, exact push run 36558015617: 4/4 success.
- Current checkpoint: FV-CP-0002-PROPOSED / MIGRATION_DRAFT_NOT_APPROVED; independent_approval=false. It is NOT product approval; new ledger source cannot promote it.
- Canonical base blob fingerprints: DECISIONS-LEDGER.md `116b962fbec0b54bdd9d698d15671aba4ab96664`; SCOPE.md `5ad5221653cf87e940784c1d8e7d03728f4ca451`; DEFINITION-OF-DONE.md `43c26d77c32035e5821454af05b0f5bbda3343b8`; ARCHITECTURE.md `9f125a37026a10d7a66db21f23e1a5cee90e3136`; R3 `52fcc9ea137972bd696620a852b19f264b863346`; R10 `8e4862bda23ea5859090e7353e7b40f435b784f2`; charter ledger `068ff6132a7660586a43dc85a06009748defa003`; registry `aba31a88a8c422dc91a73a476c8ad661362e8151`; check actual Git before each write.
- Direct dependency `policy` ACTIVE; `src/policy/eligibility.mjs` is the only accepted synthetic eligibility function. Ledger currently PLANNED with no implementation and zero owned tests.
- GEF v1.0.0 gitlink `866fe3af8cccc65c929aaf6a47a924401fa448b3` fixed. R3/ADR-004 are **PROPOSED**, not adopted external runtime.
- Change only allowlisted owned source/test/docs. Keep all other 19 module IDs and dependencies unchanged. No vendor, real orders, I/O, storage, network, credentials, host service, checkpoint promotion or live authorization.
- Context becomes STALE if main SHA, security/accepted decision, Scope, DoD, Architecture or relevant active policy implementation changes; stop and redo normal merge-base/evidence, no force-push.
