# FV-ADR-013 | Exact-block Uniswap pool observation, hook and finality evidence

**Status: PROPOSED_NOT_ADOPTED.** FV-DISC-001 Round 7 is read-only feasibility **planning**. No chain, pool, token, SDK, provider, wallet or account has been selected or accessed.

## Decision proposal
The future `defi` module must require one explicitly approved chain ID plus Uniswap **v3 OR v4** deployment and one exact verified pool/PoolKey. Every observation is pinned to `DexBlockAnchorV0` (chain ID, block number and hash, parent hash, local receive clock domain, node identity and chain-specific finality status) and `DexPoolEvidenceV0` (contract addresses/codehash, token addresses and decimals, pool fee/liquidity/tick context, v4 hook identity/permissions, data/RPC terms and expiry). v4 hooks are optional but can alter swaps/dynamic fees, so unrecognized hook or mismatched codehash invalidates any generic quote. For v3 tick ranges or v4 state, spot price without the liquidity required for the proposed trade does not prove executable output.

Future `DexQuoteEnvelopeV0` must bind all contract/pool state to the **same exact block**, record a quote method and fee/hook version and classify `SIMULATED`, `HISTORICAL` or `OBSERVED`. Quote or `eth_call` simulation is NOT a reservation, fill, actual future gas bill, canonical receipt or production authorization. A conflicting RPC blockHash/parent ancestry, changed chain/contract code or unsupported safe/finalized semantics fails closed and triggers resampling; do not presume Ethereum L1 rules on arbitrary rollups.

## Existing technologies to evaluate, not adopted
- Official Uniswap v4 docs: https://developers.uniswap.org/docs/protocols/v4/overview ; hooks and beforeSwap/afterSwap: https://developers.uniswap.org/docs/protocols/v4/concepts/hooks .
- viem Public Client readContract, multicall and simulateContract: https://viem.sh/docs/contract/readContract ; https://viem.sh/docs/contract/multicall ; https://viem.sh/docs/contract/simulateContract .
- viem conditional safe/finalized block watch and Ethereum reorg references: https://viem.sh/docs/actions/public/watchBlocks ; https://ethereum.org/developers/docs/consensus-mechanisms/pos/attack-and-defense .
- Foundry Anvil *future local* pinned-block fork/synthetic fixture candidate: https://www.getfoundry.sh/anvil/index.html .

## Rejected shortcuts and activation proof
No ticker-only token equivalence, mixed-block pool/gas snapshots, optional-v4-hook blindness, stale subgraph executable quote, archive of unlicensed real RPC data or external RPC use under this proposal. Select one chain/pool/provider and obtain rights before any separately admitted source WO. Synthetic WRONG_CHAIN_ID, FAKE_TOKEN_SYMBOL, UNKNOWN_V4_HOOK, MIXED_BLOCK_STATE, BLOCK_PARENT_REORG, RPC_FORK_DISAGREEMENT, STALE_SUBGRAPH, INSUFFICIENT_TICK_LIQUIDITY and PREMATURE_FINALITY fixtures plus independent R8 FULL review are mandatory before real reads.