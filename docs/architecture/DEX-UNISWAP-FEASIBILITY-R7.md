# FV-DISC-001 | Round 7: DEX/Uniswap read-only pool observation and arbitrage feasibility

**PLANNING ONLY, NOT IMPLEMENTED.** No chain, deployment, pool, RPC service, CEX account, data rights or signing authority has been selected or granted. No live/paper swap, call to a real blockchain, deployed hook, smart-contract approval or wallet connection is performed by this documentation. Existing `defi` and `strategy-defi` modules remain PLANNED; `harness/modules.json` still has 20 modules with bootstrap the sole ACTIVE one. FV-BOOT-001 #1 remains OPEN; latest owner-provided HIVE FULL evidence was FAILED and independent security review remains outstanding.

## 1. Research targets and intentionally narrow chain scope

The first **future** read-only DEX experiment must select ONE formally permitted EVM chain, its exact Uniswap deployment and ONE confirmed pool (v3 OR v4), with proven token identities and RPC/data rights. v3 and v4 are different liquidity/quote and contract paths; v4 `PoolKey` includes the hook address and pool fee/tick-spacing settings. A v4 pool's hook can alter swap behavior and fees, so never feed generic constant-product or hook-free v3 price assumptions into an unknown v4 pool. v4 hooks are optional, but a hook-enabled pool cannot be treated as hook-free simply because a quote API returns a number. Official v4 hook documentation: https://developers.uniswap.org/docs/protocols/v4/concepts/hooks ; protocol overview: https://developers.uniswap.org/docs/protocols/v4/overview .

Two *separate* internal research profiles under EXISTING `strategy-defi`:
- `CEX_DEX_SPREAD`: compare one authorized CEX spot account's actually executable bid/ask/depth and **already present venue inventory** against read-only, block-anchored Uniswap pool swap feasibility, exact token identity and all costs. CEX orders and chain transactions are independent; no claim of atomic cross-venue hedge or immediate bridge/deposit.
- `DEX_POOL_ROUTE`: compare a proposed directed route across eligible compatible pools **on the same chosen chain**, with per-hop v3/v4 fee/hook/exact-token handling, gas and reversion/ordering risk. No cross-chain atomicity or deployed arbitrage contract is assumed. Pool-to-pool gross spread is not executable net profit.

No flash-loan, own v4 hook, custom router, bridge, mainnet fork operation, nonpublic mempool interception, predatory MEV or signing is within V1 Round-7 scope. Any eventual on-chain atomic router or trusted simulation is a separately audited future ADR and WO; v4 flash accounting is NOT an execution guarantee outside its actual contract boundary.

## 2. Typed, provenance-rich contracts (design, not code)

| Proposed type | Minimum mandatory evidence and explicit unknowns |
|---|---|
| `DexPoolEvidenceV0` | `chain_id`, specific network genesis/deployment proof, `protocol_version` v3/v4, exact factory/PoolManager and pool/poolKey, codehash/address, token0/token1 contract addresses, decimals and token-behavior risk, fee tier or documented dynamic-fee state, tick spacing, v4 hook address+codehash+permissions or NONE, verified `licence_and_rpc_terms_ref`, supported read/quote ABI version, chain-specific finality model |
| `DexBlockAnchorV0` | exact chain ID, `block_number`, `block_hash`, `parent_hash`, UTC chain timestamp with semantics, `rpc_endpoint_id`, `observed_receive_monotonic_ns`, `clock_domain_id`, `observed_receive_utc_ns` and error bound, `finality_status` = HEAD/SAFE/FINALIZED/UNKNOWN according to selected chain and provider, `canonicality_status`, source age and expiry |
| `DexQuoteEnvelopeV0` | `pool_evidence_ref`, `block_anchor_ref`, exact-decimal token-in/out amount and decimals, v3 tick/liquidity snapshot or v4 PoolManager/StateView+hook context, pool fee and price impact, slippage bound, quoted route, quote/contract SDK provenance, `SIMULATED | HISTORICAL | OBSERVED` evidence class, `quote_validity` and failure reason |
| `DexGasCostV0` | target chain/network, `estimated_gas_units` if actually simulated, block-specific base fee and priority fee or chain-specific pricing scheme, relevant L1 data/rollup cost if applicable, max-fee cap and conversion price source/time, gas-denomination asset, model confidence and `UNKNOWN` on any missing dimension |
| `DexFeasibilityV0` | route ID and mode, exact pool and block anchors, CEX inventory/source refs if used, deterministic quote and gas model hashes, price-impact/slippage/hook behavior, fee/revert/MEV exposure intervals, chain confirmation/reorg assumptions, hypothetical net-edge **interval**, residual exposure, policy/risk decision requirement and reason codes |
| `CexDexExposurePlanV0` | distinct CEX venue/account and on-chain read-only wallet/balance observations (no keys), inventory already available at each side, worst possible unknown CEX fill and chain inclusion state, block/receipt evidence, separate independent risk scopes and **separate** future recovery admissions, no automatic transfer/bridge/withdrawal |

**Never** identify a token by `symbol()` alone. Verify actual chain ID, contract address, decimals, asset issuer/bridge form and quote-unit conversion, including any fee-on-transfer, rebasing, pause or denylist behavior. Such behavior can invalidate vanilla pool math and future swap success. Synthetic tests must use exact integer token units and explicit rounding; no JS floating-point token math as authoritative accounting.

## 3. Read-only observation workflow proposal

1. Verify a future operator-approved chain, public RPC/provider licence and known block/chain identity with a health-checked Public Client. `readContract` and `multicall` are read-only candidate interfaces; consistent **same-block** anchoring is mandatory if combining multiple state reads. A third-party indexer/subgraph may aid discovery but cannot substitute for an exact-block proof or be assumed fresh/canonical. Official docs: https://viem.sh/docs/contract/readContract ; https://viem.sh/docs/contract/multicall .
2. Fetch the exact v3 pool state (sqrt price, active liquidity, tick and relevant initialized ticks when required), **or** the verified v4 PoolManager/StateView state with pool key and hook codehash. Reads must be from the same block anchor or explicitly mark a mixed-block invalid sample. No assumption that concentrated-liquidity current spot rate is sufficient to price a finite trade across ticks.
3. Build an exact token-in route with documented fee and hook behavior. A properly licensed Quoter or `simulateContract` on a pinned block **may** test a hypothetical call and reveal a revert, but it never reserves liquidity, ensures actual next-block ordering or guarantees transaction gas/fill. `simulateContract` is a non-state-changing `eth_call`-style simulation; do NOT send its returned write request in this research. Official viem: https://viem.sh/docs/contract/simulateContract .
4. Observe parent-linked block updates and explicitly track `HEAD`, `SAFE`, `FINALIZED` or `UNKNOWN` **only** where the chosen chain/provider supports their real meanings. A new competing block or missing ancestor invalidates orphaned quotes and requires resampling. Ethereum PoS reorg/finality background: https://ethereum.org/developers/docs/consensus-mechanisms/pos/attack-and-defense ; viem `watchBlocks` documents `safe`/`finalized` support when the transport/chain allows: https://viem.sh/docs/actions/public/watchBlocks .
5. Feed immutable, rights-checked pool snapshots and simulated reorg/gas changes into R4 deterministic Replay; do not archive proprietary RPC/subgraph data or publish derived values without explicit usage rights. The future read-only adapter must carry blockHash and local observation times rather than a bare timestamp.

## 4. Price impact, gas and asymmetric execution model

For a given exact token-in amount, a feasible quote requires sufficient **actual** pool liquidity across ticks or v4 hook-adjusted execution path, explicit pool/hook dynamic fees where applicable, slippage intervals, token transfer behavior, gas consumed by the *whole route*, price impact, and a gas-cost conversion to the same settlement currency as the CEX leg. A changing EIP-1559 base fee, priority fee and gas units are different inputs. A selected L2 may additionally charge L1-data or other chain-specific costs. Unknown gas/fee conversion, revert risk or hook behavior => `NON_ACTIONABLE`, not zero cost. A high-level quoter gas estimate may be incomplete for actual transaction costs.

`CEX_DEX_SPREAD` models **two non-atomic systems**: CEX order ACK/fill may be lost or arrive late; DEX transaction may remain pending, revert, be replaced, land at a different block/price or be reorged. Neither leg can be assumed to fill instantly or at the same price. Distinct venue/on-chain balances and settlement constraints mean the spread cannot rely on instant bridge/deposit/withdrawal. A delayed or failed leg preserves unhedged asset and fee exposure under a separate R3 ledger/independent-risk process.

`DEX_POOL_ROUTE` models explicit hop-by-hop output with exact tokens and slippage; if a future protocol transaction can execute some route atomically that must be separately proved by actual deployed contract semantics and simulation. Round-7 research does not design a signing router or contract. Potential backrun/sandwich/censoring risk is modeled **defensively** (adverse execution), not as an aggressive/front-running strategy.

## 5. Existing technology candidates, NOT installed

| Candidate | Documented capability | Adoption condition and non-guarantee |
|---|---|---|
| Uniswap official v3/v4 SDKs and deployed contracts | Concentrated-liquidity pool paths; v4 PoolManager, pool keys and optional hooks may customize execution | Choose exact chain+version+pool and verify contract addresses, hook fee semantics, applicable SDK/API license and upstream version before ADR approval. https://developers.uniswap.org/docs/protocols/v4/overview ; https://developers.uniswap.org/docs/protocols/v4/concepts/hooks |
| viem Public Client | `readContract`, `multicall`, `simulateContract`, `watchBlocks` with block tags and conditional finalized/safe support | Initial **future** read-only TypeScript reference client, pinned version/ABI/license/provider quota. `simulateContract` doesn't change state and is not proof that a signed transaction will succeed later. https://viem.sh/docs/contract/simulateContract |
| Foundry Anvil | Local in-memory EVM, optional pin-to-block fork, controllable mining/time and state for reproducible **future** tests | Do not run now or embed public RPC/live keys in hosted CI. Later pin chain, block number+hash, upstream archive terms, tool version and synthetic fixtures; a fork does not predict real mempool ordering or reorg outcomes. https://www.getfoundry.sh/anvil/index.html |
| Ethereum chain-finality references | Canonical block-parent ancestry and PoS finality/reorg treatment | The eventual chain could be an L2 with different soft/final settlement rules: obtain *that chain's* official finality docs and signed safety budgets. https://ethereum.org/developers/docs/consensus-mechanisms/pos/attack-and-defense |

**OSS/license review is OPEN**, including selected deployed contracts, vendor APIs, indexers/subgraphs, viem/Anvil exact versions, RPC commercial rights and whether a pool's v4 hook code can be trusted. No DEX dependency has been added by this PR.

## 6. Twenty future adverse fixture obligations (DESIGN ONLY)

| Scenario ID | Synthetic or later pinned-fork fault | Expected fail-closed research result |
|---|---|---|
| WRONG_CHAIN_ID | Same token symbol exists on another chain | Reject route and asset equivalence |
| FAKE_TOKEN_SYMBOL | Two contracts share symbol/decimals but differ in address/issuer | No symbol-only asset match |
| WRONG_POOL_VERSION | v3 quote method applied to v4 pool | Quote INVALID, do not infer v4 fee behavior |
| UNKNOWN_V4_HOOK | Hook or fee logic unverified or changed codehash | Quarantine pool, no actionable quote |
| MIXED_BLOCK_STATE | v3/v4 state, token balances and gas read from mismatched blocks | INVALID quote; re-anchor |
| BLOCK_PARENT_REORG | Parent hash discontinuity or orphaned observed block | Invalidate old quote/receipt assumptions, reconcile ancestry |
| RPC_FORK_DISAGREEMENT | Authorized RPCs disagree on blockHash | Canonicality UNKNOWN, stop inferred profit |
| STALE_SUBGRAPH | Indexed price at older block than authoritative RPC | No executable pool quote |
| INSUFFICIENT_TICK_LIQUIDITY | Finite swap crosses unknown/uninitialized liquidity ticks | No optimistic spot-price fill |
| POOL_FEE_UNMODELED | Dynamic v4 hook fee or pool fee unknown | Net edge UNKNOWN |
| TOKEN_TRANSFER_FEE | Fee-on-transfer, rebasing or denylist token | Vanilla swap model invalid until independently proved |
| UNBOUNDED_GAS_COST | Simulated gas/currency conversion stale or missing L2 overhead | NON_ACTIONABLE |
| BASE_FEE_SPIKE | Base or priority fee spikes before simulated inclusion | Reject optimistic modeled edge |
| SWAP_REVERT | Quoted call reverts or future inclusion assumptions break | No successful fill claim |
| SLIPPAGE_STATE_DRIFT | Pool changed between quote block and hypothetical inclusion | Invalidate or conservatively reprice |
| SANDWICH_ADVERSE_SELECTION | External ordering worsens hypothetical execution | Model risk defensively, never claim risk-free quote |
| CEX_LEG_UNKNOWN | CEX may have filled while DEX state uncertain | Freeze new exposure, authenticate venue and chain receipts |
| INSTANT_BRIDGE_ASSUMPTION | Strategy assumes transfer between CEX and chain before hedge | Deny invalid available inventory |
| PREMATURE_FINALITY | Pending/head transaction treated as finalized despite chain rules | Keep exposure unconfirmed; reconcile reorg |
| UNLICENSED_RPC_ARCHIVE | No permitted retention/derived data terms for provider snapshot | No data dump or public performance report |

All are **planned** acceptance fixtures for separately admitted `tests/defi/` and `tests/strategy-defi/`, not tests of working product code.

## 7. Roadmap and STOP

Future independently gated WO A: select ONE supported chain/deployment/pool plus exact RPC and token licence, then implement a pure synthetic block-anchored v3 OR v4 observation model with all R7 negative fixtures, no wallet or network I/O. WO B: read-only reference adapter using specific approved RPC, exact contract state and reorg invalidation with no signer. WO C: DEX pool-route and CEX/DEX *simulated* feasibility through R4 replay with independent R3 risk/ledger and full gas/exposure model. Only later consider audited signing/router architecture as a new security design and owner decision; no guarantee of atomic CEX/DEX hedging, low gas or profitability.

**STOP:** This PR remains a documentation-only DRAFT. No source implementation, real RPC read, keys, transaction simulation on real networks, hook deployment, signing, actual CEX hedge, official pin or canonical checkpoint change. FV-BOOT-001 R8 FULL and independent high-assurance review are still external blockers.