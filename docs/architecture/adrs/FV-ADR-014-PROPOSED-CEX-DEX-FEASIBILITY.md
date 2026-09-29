# FV-ADR-014 | CEX/DEX and same-chain DEX route feasibility with full gas/exposure models

**Status: PROPOSED_NOT_ADOPTED.** The existing `strategy-defi` module remains PLANNED; no signing, swap, cross-chain settlement or real CEX hedge is authorized.

## Decision proposal
Keep two explicit internal research families: `CEX_DEX_SPREAD` and `DEX_POOL_ROUTE`. Both depend on verified `DexPoolEvidenceV0`, same-block `DexBlockAnchorV0`, exact-decimal `DexQuoteEnvelopeV0`, chain-aware `DexGasCostV0` and `DexFeasibilityV0` in the Round-7 main design document. Every net-edge interval must include actual route/pool fees, v4 hook effects where applicable, tick/liquidity price impact, slippage and reserve uncertainty, base/priority gas plus selected chain-specific/L2 costs, native-gas-to-settlement conversion, reverted transaction losses and defensive adverse ordering/reorg risks. Any unknown needed dimension => `NON_ACTIONABLE`, not zero expense.

`CEX_DEX_SPREAD` explicitly uses actual pre-funded *separate* venue CEX balances and on-chain read-only balance observations with `CexDexExposurePlanV0`; it must NOT assume an atomic two-leg execution, immediate deposit/withdrawal/bridge, guaranteed token parity or a DEX simulated swap equals a real fill. A future chain pending transaction and external CEX ACK can both be UNKNOWN. `DEX_POOL_ROUTE` stays on ONE selected chain and models each hop's exact contracts, direction and output; any future atomic router is a separate high-assurance smart-contract ADR and audited WO, not a property inferred from a research simulator.

## Reusable technology constraints
Uniswap v3/v4 SDK **must match the selected actual pool**, and v4 hooks can modify swap behavior: https://developers.uniswap.org/docs/protocols/v4/concepts/hooks . viem `simulateContract` can test hypothetical calldata without writing chain state but does not reserve liquidity or ensure inclusion: https://viem.sh/docs/contract/simulateContract . Foundry Anvil can fork a pinned block for **later** deterministic local tests but cannot reproduce uncertain future mempool ordering by itself: https://www.getfoundry.sh/anvil/index.html . Exact upstream versions, ABI, commercial licences, RPC quotas and chain finality model remain OPEN.

## Required future negative tests and stop
POOL_FEE_UNMODELED, TOKEN_TRANSFER_FEE, UNBOUNDED_GAS_COST, BASE_FEE_SPIKE, SWAP_REVERT, SLIPPAGE_STATE_DRIFT, SANDWICH_ADVERSE_SELECTION, CEX_LEG_UNKNOWN, INSTANT_BRIDGE_ASSUMPTION, PREMATURE_FINALITY and UNLICENSED_RPC_ARCHIVE as pure synthetic tests first. No predatory MEV or signing. A later risk-limited approved demo/real route needs independent security review, contract and token audit, actual venue/pool and legal rights, R8 withdrawn external development tooling FULL and separate owner approval.

**Accepted foundation D-009:** pure synthetic module admission depends on current Git-only source governance, exact-head CI and real module-owned tests. Financially privileged operation additionally requires independent security and actual provider/data-use rights. No separate background host acceptance is required.
