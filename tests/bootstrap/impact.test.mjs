import test from "node:test";import assert from"node:assert/strict";import fs from"node:fs";
import{calculateImpact,validateRegistry}from"../../scripts/lib/impact.mjs";
const r=JSON.parse(fs.readFileSync(new URL("../../harness/modules.json",import.meta.url)));
test("valid canonical graph",()=>assert.equal(validateRegistry(r),r));
test("scoped script bug runs only bootstrap harness",()=>{const x=calculateImpact(r,["scripts/harness.mjs"]);assert.deepEqual(x.active,["bootstrap"]);assert.deepEqual(x.planned,[]);assert.equal(x.full,false)});
test("ordinary document change runs bootstrap",()=>{const x=calculateImpact(r,["docs/runbooks/WINDOWS-HIVE.md"]);assert.deepEqual(x.active,["bootstrap"]);assert.equal(x.full,false)});
test("critical security source triggers full active proof",()=>{const x=calculateImpact(r,[".engineering/SECURITY.md"]);assert.equal(x.full,true);assert.deepEqual(x.active,["bootstrap"])});
test("risk module change invokes all dependent planned modules and fails activation",()=>{const x=calculateImpact(r,["src/risk/kill_switch.rs"]);assert(x.planned.includes("risk"));assert(x.planned.includes("forex"));assert(x.planned.includes("integration"))});
test("unknown file fails closed not invisible",()=>{const x=calculateImpact(r,["random/future-code.rs"]);assert.deepEqual(x.unknown,["random/future-code.rs"]);assert.equal(x.full,true)});
test("path traversal and backslash fail closed",()=>{const x=calculateImpact(r,["../escape",".\\windows"]);assert.equal(x.unknown.length,2)});
test("duplicate and cycle reject",()=>{const c=structuredClone(r);c.modules[1].depends_on=["forex"];assert.throws(()=>validateRegistry(c),/CYCLIC_DEPENDENCY/)});
test("active module must have tests",()=>{const c=structuredClone(r);c.modules[1].state="active";assert.throws(()=>validateRegistry(c),/ACTIVE_MODULE_MISSING_TESTS/)});

test("planned map preserves the sole active bootstrap and one charter per module",()=>{
  assert.equal(r.modules.length,20);
  assert.deepEqual(r.modules.filter(m=>m.state==="active").map(m=>m.id),["bootstrap"]);
  for(const mod of r.modules){
    const charter=new URL("../../docs/architecture/modules/"+mod.id+".md",import.meta.url);
    assert(fs.existsSync(charter),"MISSING_MODULE_CHARTER "+mod.id);
    const prose=fs.readFileSync(charter,"utf8");
    assert(prose.includes("module \`"+mod.id+"\`"),"WRONG_MODULE_CHARTER "+mod.id);
    if(mod.id!=="bootstrap"){
      assert.equal(mod.state,"planned","UNEXPECTED_ACTIVE_PRODUCT_MODULE "+mod.id);
      assert.deepEqual(mod.tests,[],"IMPLEMENTATION_TESTS_ADMITTED_WITHOUT_WO "+mod.id);
      for(const prefix of mod.paths.filter(p=>p.startsWith("src/")||p.startsWith("tests/"))){
        assert(!fs.existsSync(new URL("../../"+prefix,import.meta.url)),"UNAPPROVED_PRODUCT_SOURCE "+prefix);
      }
    }
  }
});
test("planning docs remain bootstrap-owned while new source requires activation",()=>{
  const docs=calculateImpact(r,["docs/architecture/modules/strategy-forex.md"]);
  assert.deepEqual(docs.active,["bootstrap"]);
  assert.deepEqual(docs.planned,[]);
  assert.deepEqual(docs.unknown,[]);
  const code=calculateImpact(r,["src/market-data/adapter.rs"]);
  assert(code.planned.includes("market-data"));
  assert(code.planned.includes("risk"));
  assert(code.planned.includes("integration"));
  assert.deepEqual(code.unknown,[]);
});

test("Forex Round 1 keeps unapproved provider research fail-closed",()=>{
  const file=fs.readFileSync(new URL("../../docs/architecture/FOREX-VENUE-POLICY-R1.md",import.meta.url),"utf8");
  const candidates=["cTrader Open API","OANDA v20","LMAX Exchange","TrueFX / Integral"];
  for(const candidate of candidates){
    const record=file.split(/\r?\n/).find(line=>line.startsWith("| "+candidate+" | "));
    assert(record, "MISSING_CANDIDATE "+candidate);
    assert(record.includes("| RESEARCH_ONLY |"),"CANDIDATE_IMPLICITLY_AUTHORIZED "+candidate);
  }
  for(const term of ["commercial","redistribution","DEMO_ELIGIBLE","LIVE_CANDIDATE","INTERNAL","no real orders","STOP"]){
    assert(file.toLowerCase().includes(term.toLowerCase()),"MISSING_POLICY_GATE "+term);
  }
  const adr=fs.readFileSync(new URL("../../docs/architecture/adrs/FV-ADR-001-PROPOSED-FOREX-VENUE-SELECTION.md",import.meta.url),"utf8");
  assert(adr.includes("PROPOSED_NOT_ADOPTED"));
  assert(adr.includes("no automatic live execution permit")||adr.includes("no production selection")||adr.includes("No actual account"));
  assert.equal(r.modules.find(m=>m.id==="policy").state,"planned");
  assert.equal(r.modules.find(m=>m.id==="forex").state,"planned");
});
test("Forex Round 1 research docs route to existing bootstrap harness only",()=>{
  for(const path of ["docs/architecture/FOREX-VENUE-POLICY-R1.md","docs/architecture/adrs/FV-ADR-001-PROPOSED-FOREX-VENUE-SELECTION.md"]){
    const result=calculateImpact(r,[path]);
    assert.deepEqual(result.active,["bootstrap"]);
    assert.deepEqual(result.planned,[]);
    assert.deepEqual(result.unknown,[]);
  }
});

test("Round 2 design keeps clock and market-data PLANNED and prohibits host clock mutation",()=>{
  const design=fs.readFileSync(new URL("../../docs/architecture/CLOCK-MARKET-DATA-R2.md",import.meta.url),"utf8");
  for(const field of ["source_event_utc_ns","local_receive_monotonic_ns","clock_domain_id","local_receive_wall_utc_ns","estimated_clock_error_ns","source_timestamp_semantics","data_usage_scope","ELIGIBLE_FOR_FURTHER_RISK_EVALUATION"]){
    assert(design.includes(field),"R2_MISSING_TYPED_CONTRACT "+field);
  }
  for(const scenario of ["UNKNOWN_CLOCK","CROSS_DOMAIN","BACKWARD_WALL","SEQUENCE_GAP","THROTTLED_FEED","LICENCE_UNKNOWN","BOOK_UNAVAILABLE","VENUE_QUOTE_INDICATIVE","INSTRUMENT_MISMATCH","STALE_FEED","OUT_OF_ORDER_DUPLICATE","CAPTURE_OVERFLOW"]){
    const row=design.split(/\r?\n/).find(line=>line.startsWith("| "+scenario+" | "));
    assert(row&&row.split("|").length>=4,"R2_MISSING_NEGATIVE_FIXTURE "+scenario);
  }
  for(const id of ["clock","market-data"]){
    assert.equal(r.modules.find(m=>m.id===id)?.state,"planned","R2_PRODUCT_MODULE_PREMATURELY_ACTIVATED "+id);
    const moduleDoc=fs.readFileSync(new URL("../../docs/architecture/modules/"+id+".md",import.meta.url),"utf8");
    assert(moduleDoc.includes("PLANNED, NOT IMPLEMENTED"));
    assert(moduleDoc.includes("STOP"));
  }
  assert.equal(r.modules.length,20);
  assert.deepEqual(r.modules.filter(m=>m.state==="active").map(m=>m.id),["bootstrap"]);
});
test("Round 2 time and market-data ADRs are proposed and docs stay bootstrap-owned",()=>{
  const docs=["docs/architecture/CLOCK-MARKET-DATA-R2.md","docs/architecture/adrs/FV-ADR-002-PROPOSED-TIME-INTEGRITY.md","docs/architecture/adrs/FV-ADR-003-PROPOSED-MARKET-DATA-PROVENANCE.md"];
  for(const path of docs){
    const state=calculateImpact(r,[path]);
    assert.deepEqual(state.unknown,[]);
    assert.deepEqual(state.active,["bootstrap"]);
    assert.deepEqual(state.planned,[]);
  }
  for(const name of ["FV-ADR-002-PROPOSED-TIME-INTEGRITY.md","FV-ADR-003-PROPOSED-MARKET-DATA-PROVENANCE.md"]){
    const adr=fs.readFileSync(new URL("../../docs/architecture/adrs/"+name,import.meta.url),"utf8");
    assert(adr.includes("PROPOSED_NOT_ADOPTED"),"ADR_PREMATURELY_ADOPTED "+name);
  }
  const sourceChange=calculateImpact(r,["src/clock/clock.rs"]);
  assert(sourceChange.planned.includes("clock")&&sourceChange.planned.includes("market-data")&&sourceChange.planned.includes("risk"));
});


test("Round 3 ledger-risk-execution contract documents unknown broker effects and 15 adverse fixtures",()=>{
  const design=fs.readFileSync(new URL("../../docs/architecture/LEDGER-RISK-EXECUTION-R3.md",import.meta.url),"utf8");
  for(const token of ["OrderIntentV0","RiskDecisionV0","OrderAttemptV0","VenueExecutionEventV0","ReconciliationReceiptV0","HedgePlanV0","MAY_HAVE_SENT","UNKNOWN_NEEDS_RECONCILIATION","DISCREPANCY_LOCKED","CANCEL_REQUESTED","CANCELED_CONFIRMED"]){
    assert(design.includes(token),"R3_MISSING_CONTRACT_OR_STATE "+token);
  }
  for(const scenario of ["DUPLICATE_INTENT","CRASH_BEFORE_TRANSMIT","LOST_ACK_AFTER_FILL","CANCEL_RACE_FILL","PARTIAL_A_UNKNOWN_B","REJECTED_HEDGE","STALE_FEED","MISSING_PORTFOLIO","KILL_SWITCH_PERSIST","DUPLICATE_FILL_EVENT","ORDER_EVENT_REORDER","SESSION_GAP","QUEUE_BACKPRESSURE","CLOCK_EPOCH_CHANGE","UNLICENSED_RECOVERY"]){
    const row=design.split(/\r?\n/).find(line=>line.startsWith("| "+scenario+" | "));
    assert(row&&row.split("|").length>=4,"R3_MISSING_DESIGN_FIXTURE "+scenario);
  }
  for(const id of ["ledger","risk","execution"]){
    assert.equal(r.modules.find(m=>m.id===id)?.state,"planned","R3_PREMATURE_MODULE_ACTIVATION "+id);
    const charter=fs.readFileSync(new URL("../../docs/architecture/modules/"+id+".md",import.meta.url),"utf8");
    assert(charter.includes("PLANNED, NOT IMPLEMENTED"));
    assert(charter.includes("STOP"));
  }
  assert.equal(r.modules.length,20);
  assert.deepEqual(r.modules.filter(m=>m.state==="active").map(m=>m.id),["bootstrap"]);
});
test("Round 3 ADRs remain proposals and changed future trading source fails closed",()=>{
  const names=["FV-ADR-004-PROPOSED-DURABLE-ORDER-LEDGER.md","FV-ADR-005-PROPOSED-INDEPENDENT-RISK-KERNEL.md","FV-ADR-006-PROPOSED-ORDER-STATE-AND-HEDGE.md"];
  const docs=["docs/architecture/LEDGER-RISK-EXECUTION-R3.md",...names.map(name=>"docs/architecture/adrs/"+name)];
  for(const name of names){
    const adr=fs.readFileSync(new URL("../../docs/architecture/adrs/"+name,import.meta.url),"utf8");
    assert(adr.includes("PROPOSED_NOT_ADOPTED"),"R3_ADR_WRONGLY_ADOPTED "+name);
  }
  for(const path of docs){
    const impacted=calculateImpact(r,[path]);
    assert.deepEqual(impacted.active,["bootstrap"]);
    assert.deepEqual(impacted.planned,[]);
    assert.deepEqual(impacted.unknown,[]);
  }
  for(const id of ["ledger","risk","execution"]){
    const impact=calculateImpact(r,["src/"+id+"/pending.rs"]);
    assert(impact.planned.includes(id),"R3_MISSING_OWNERSHIP "+id);
    assert(impact.planned.includes("integration"),"R3_MISSING_INTEGRATION_IMPACT "+id);
    assert.deepEqual(impact.unknown,[]);
  }
});

test("Round 4 replay design documents reproducibility and all adverse scenario obligations",()=>{
  const design=fs.readFileSync(new URL("../../docs/architecture/REPLAY-BENCHMARK-R4.md",import.meta.url),"utf8");
  for(const field of ["ReplayEventV0","VirtualClockV0","ReplayRunManifestV0","BenchmarkCaseV0","dataset_sha256","data_usage_scope","clock_domain_id","output_canonical_event_hash","INSUFFICIENT_TAIL_SAMPLE","COMPETITOR_NOT_MEASURED"]){
    assert(design.includes(field),"R4_MISSING_DESIGN_CONTRACT "+field);
  }
  for(const scenario of ["FUTURE_LOOKAHEAD","NONDETERMINISTIC_TIE","CROSS_DOMAIN_CLOCK","UNKNOWN_SOURCE_TIME","SNAPSHOT_SEQUENCE_GAP","THROTTLED_REFERENCE","MISSING_DEPTH","MAKER_QUEUE_UNKNOWN","MISSING_COST","CANCEL_FILL_RACE","LOST_ACK_UNKNOWN_LEG","RISK_KILL_RESTART","SEED_OR_MODEL_DRIFT","UNPINNED_DATASET","SELECTIVE_WINNER","THIN_TAIL_SAMPLE","COLLECTOR_OUTAGE","PAPER_LIVE_CONFLATION"]){
    const row=design.split(/\r?\n/).find(line=>line.startsWith("| "+scenario+" | "));
    assert(row&&row.split("|").length>=4,"R4_MISSING_ADVERSE_DESIGN_FIXTURE "+scenario);
  }
  for(const id of ["replay","research"]){
    assert.equal(r.modules.find(m=>m.id===id)?.state,"planned","R4_PREMATURE_PRODUCT_ACTIVATION "+id);
    const charter=fs.readFileSync(new URL("../../docs/architecture/modules/"+id+".md",import.meta.url),"utf8");
    assert(charter.includes("PLANNED, NOT IMPLEMENTED"));
    assert(charter.includes("STOP"));
  }
  assert.equal(r.modules.length,20);
  assert.deepEqual(r.modules.filter(m=>m.state==="active").map(m=>m.id),["bootstrap"]);
});
test("Round 4 research ADRs stay proposed and future source changes require activated harness",()=>{
  const names=["FV-ADR-007-PROPOSED-DETERMINISTIC-REPLAY.md","FV-ADR-008-PROPOSED-BENCHMARK-METHODOLOGY.md"];
  for(const name of names){
    const doc=fs.readFileSync(new URL("../../docs/architecture/adrs/"+name,import.meta.url),"utf8");
    assert(doc.includes("PROPOSED_NOT_ADOPTED"),"R4_ADR_WRONGLY_ADOPTED "+name);
  }
  for(const path of ["docs/architecture/REPLAY-BENCHMARK-R4.md",...names.map(name=>"docs/architecture/adrs/"+name)]){
    const impact=calculateImpact(r,[path]);
    assert.deepEqual(impact.active,["bootstrap"]);
    assert.deepEqual(impact.planned,[]);
    assert.deepEqual(impact.unknown,[]);
  }
  for(const id of ["replay","research"]){
    const impact=calculateImpact(r,["src/"+id+"/future.rs"]);
    assert(impact.planned.includes(id));
    assert(impact.planned.includes("integration"));
    assert.deepEqual(impact.unknown,[]);
  }
});


test("Round 5 Forex one/two/multi-feed proposal has distinct typed contracts and 18 negative design fixtures",()=>{
  const design=fs.readFileSync(new URL("../../docs/architecture/FOREX-STRATEGIES-R5.md",import.meta.url),"utf8");
  for(const name of ["ForexStrategyConfigV0","ForexOpportunityV0","FeedConsensusEvidenceV0","TwoLegIntentPlanV0","StrategyDecisionV0","ONE_LEG","TWO_LEG","MULTI_FEED","CANDIDATE_FOR_RISK","NON_ACTIONABLE","UNKNOWN_NEEDS_RECONCILIATION"]){
    assert(design.includes(name),"R5_MISSING_DESIGN_CONTRACT "+name);
  }
  for(const id of ["REF_FEED_ONLY","BROKER_POLICY_DENY","UNLICENSED_MULTI_FEED","SPOT_CFD_MISMATCH","THROTTLED_REFERENCE","CLOCK_UNCERTAINTY","SOURCE_SEQUENCE_GAP","ZERO_DEPTH_OR_SIZE","HIDDEN_FEES","VENUE_REJECT_OR_LAST_LOOK","LEG_A_PARTIAL_B_UNKNOWN","CANCEL_FILL_RACE","REJECTED_HEDGE","MIRRORED_FEED_QUORUM","STALE_OUTLIER_POISON","DATASET_LOOKAHEAD","DISCONNECT_KILL","MODEL_PARAMETER_DRIFT"]){
    const row=design.split(/\r?\n/).find(line=>line.startsWith("| "+id+" | "));
    assert(row&&row.split("|").length>=4,"R5_MISSING_NEGATIVE_DESIGN_FIXTURE "+id);
  }
  const charter=fs.readFileSync(new URL("../../docs/architecture/modules/strategy-forex.md",import.meta.url),"utf8");
  assert(charter.includes("PLANNED, NOT IMPLEMENTED"));
  assert(charter.includes("STOP"));
  assert.equal(r.modules.length,20);
  assert.deepEqual(r.modules.filter(m=>m.state==="active").map(m=>m.id),["bootstrap"]);
  assert.equal(r.modules.find(m=>m.id==="strategy-forex")?.state,"planned");
  assert.deepEqual(r.modules.find(m=>m.id==="strategy-forex")?.depends_on,["forex","replay","portfolio"]);
});
test("Round 5 Forex ADRs remain proposals and any future strategy source needs an activated harness",()=>{
  for(const name of ["FV-ADR-009-PROPOSED-FOREX-STRATEGY-CONTRACT.md","FV-ADR-010-PROPOSED-MULTI-FEED-SIGNAL-QUALITY.md"]){
    const path="docs/architecture/adrs/"+name;
    const adr=fs.readFileSync(new URL("../../"+path,import.meta.url),"utf8");
    assert(adr.includes("PROPOSED_NOT_ADOPTED"),"R5_ADR_PREMATURE_ADOPTION "+name);
    const docImpact=calculateImpact(r,[path]);
    assert.deepEqual(docImpact.active,["bootstrap"]);
    assert.deepEqual(docImpact.planned,[]);
    assert.deepEqual(docImpact.unknown,[]);
  }
  const designImpact=calculateImpact(r,["docs/architecture/FOREX-STRATEGIES-R5.md"]);
  assert.deepEqual(designImpact.active,["bootstrap"]);
  assert.deepEqual(designImpact.planned,[]);
  assert.deepEqual(designImpact.unknown,[]);
  const srcImpact=calculateImpact(r,["src/strategy-forex/one_leg.rs"]);
  assert(srcImpact.planned.includes("strategy-forex"));
  assert(srcImpact.planned.includes("integration"));
  assert.deepEqual(srcImpact.unknown,[]);
});


test("Round 6 CEX spot adapter and strategy design protects 20 adverse scenarios",()=>{
  const design=fs.readFileSync(new URL("../../docs/architecture/CEX-CONNECTORS-STRATEGIES-R6.md",import.meta.url),"utf8");
  for(const field of ["CexConnectorEvidenceV0","CexSpotInstrumentV0","CexOrderBookIntegrityV0","CexPortfolioReservationV0","CexOpportunityV0","TriangularRouteV0","CrossExchangeHedgePlanV0","BINANCE_SPOT_RESEARCH","KRAKEN_SPOT_RESEARCH","CROSS_EXCHANGE_TAKER","TRIANGULAR_SPOT","XEMM_MAKER_TAKER","UNKNOWN_NEEDS_RECONCILIATION"]){
    assert(design.includes(field),"R6_MISSING_TYPED_CONTRACT_OR_PROFILE "+field);
  }
  for(const scenario of ["BINANCE_SNAPSHOT_GAP","KRAKEN_CRC_MISMATCH","KRAKEN_MULTI_LEVEL_UPDATE","SPOT_FUTURES_MIXUP","SYMBOL_ALIAS_COLLISION","UNLICENSED_FEED_EXPORT","CROSS_HOST_TIME_UNCERTAIN","STALE_BOOK_SIGNAL","MISSING_FEE_TIER","DEPTH_SHORTFALL","LOT_DUST_MIN_NOTIONAL","WRONG_TRADE_DIRECTION","VENUE_BALANCE_SHORTFALL","PARTIAL_LEG_UNKNOWN_HEDGE","MAKER_CANCEL_FILL_RACE","HEDGE_REJECTED","API_RATE_LIMIT","PRIVATE_STREAM_GAP","KILL_SWITCH_NETWORK_SPLIT","MODEL_OR_DATA_LOOKAHEAD"]){
    const row=design.split(/\r?\n/).find(line=>line.startsWith("| "+scenario+" | "));
    assert(row&&row.split("|").length>=4,"R6_MISSING_DESIGN_NEGATIVE_FIXTURE "+scenario);
  }
  for(const id of ["cex","strategy-cex"]){
    assert.equal(r.modules.find(m=>m.id===id)?.state,"planned","R6_PREMATURE_ACTIVATION "+id);
    const charter=fs.readFileSync(new URL("../../docs/architecture/modules/"+id+".md",import.meta.url),"utf8");
    assert(charter.includes("PLANNED, NOT IMPLEMENTED"));
    assert(charter.includes("STOP"));
  }
  assert.equal(r.modules.length,20);
  assert.deepEqual(r.modules.filter(m=>m.state==="active").map(m=>m.id),["bootstrap"]);
});
test("Round 6 ADRs are proposals, and future CEX source remains blocked by planned harness",()=>{
  const names=["FV-ADR-011-PROPOSED-CEX-ORDERBOOK-CONTRACT.md","FV-ADR-012-PROPOSED-CEX-ARBITRAGE-ROUTES.md"];
  for(const name of names){
    const adr=fs.readFileSync(new URL("../../docs/architecture/adrs/"+name,import.meta.url),"utf8");
    assert(adr.includes("PROPOSED_NOT_ADOPTED"),"R6_PREMATURE_ADR "+name);
  }
  for(const path of ["docs/architecture/CEX-CONNECTORS-STRATEGIES-R6.md",...names.map(x=>"docs/architecture/adrs/"+x)]){
    const impact=calculateImpact(r,[path]);
    assert.deepEqual(impact.active,["bootstrap"]);
    assert.deepEqual(impact.planned,[]);
    assert.deepEqual(impact.unknown,[]);
  }
  const adapter=calculateImpact(r,["src/cex/binance_spot.rs"]);
  assert(adapter.planned.includes("cex"));
  assert(adapter.planned.includes("strategy-cex"));
  assert(adapter.planned.includes("integration"));
  assert.deepEqual(adapter.unknown,[]);
  const strategy=calculateImpact(r,["src/strategy-cex/triangular_spot.rs"]);
  assert(strategy.planned.includes("strategy-cex"));
  assert(strategy.planned.includes("integration"));
  assert.deepEqual(strategy.unknown,[]);
});


test("Round 7 DEX and Uniswap documentation preserves chain/pool/block/exposure proofs",()=>{
  const design=fs.readFileSync(new URL("../../docs/architecture/DEX-UNISWAP-FEASIBILITY-R7.md",import.meta.url),"utf8");
  for(const field of ["DexPoolEvidenceV0","DexBlockAnchorV0","DexQuoteEnvelopeV0","DexGasCostV0","DexFeasibilityV0","CexDexExposurePlanV0","CEX_DEX_SPREAD","DEX_POOL_ROUTE","block_hash","parent_hash","UNKNOWN"]){
    assert(design.includes(field),"R7_MISSING_CONTRACT_OR_RISK_FIELD "+field);
  }
  for(const scenario of ["WRONG_CHAIN_ID","FAKE_TOKEN_SYMBOL","WRONG_POOL_VERSION","UNKNOWN_V4_HOOK","MIXED_BLOCK_STATE","BLOCK_PARENT_REORG","RPC_FORK_DISAGREEMENT","STALE_SUBGRAPH","INSUFFICIENT_TICK_LIQUIDITY","POOL_FEE_UNMODELED","TOKEN_TRANSFER_FEE","UNBOUNDED_GAS_COST","BASE_FEE_SPIKE","SWAP_REVERT","SLIPPAGE_STATE_DRIFT","SANDWICH_ADVERSE_SELECTION","CEX_LEG_UNKNOWN","INSTANT_BRIDGE_ASSUMPTION","PREMATURE_FINALITY","UNLICENSED_RPC_ARCHIVE"]){
    const row=design.split(/\r?\n/).find(line=>line.startsWith("| "+scenario+" | "));
    assert(row&&row.split("|").length>=4,"R7_MISSING_ADVERSE_DESIGN_FIXTURE "+scenario);
  }
  for(const id of ["defi","strategy-defi"]){
    assert.equal(r.modules.find(m=>m.id===id)?.state,"planned","R7_PREMATURE_ACTIVATION "+id);
    const charter=fs.readFileSync(new URL("../../docs/architecture/modules/"+id+".md",import.meta.url),"utf8");
    assert(charter.includes("PLANNED, NOT IMPLEMENTED"));
    assert(charter.includes("STOP"));
  }
  assert.equal(r.modules.length,20);
  assert.deepEqual(r.modules.filter(m=>m.state==="active").map(m=>m.id),["bootstrap"]);
});
test("Round 7 proposed DEX ADRs and future source impact remain governed by bootstrap",()=>{
  const names=["FV-ADR-013-PROPOSED-DEX-POOL-OBSERVATION.md","FV-ADR-014-PROPOSED-CEX-DEX-FEASIBILITY.md"];
  for(const name of names){
    const adr=fs.readFileSync(new URL("../../docs/architecture/adrs/"+name,import.meta.url),"utf8");
    assert(adr.includes("PROPOSED_NOT_ADOPTED"),"R7_PREMATURE_ADR "+name);
  }
  for(const path of ["docs/architecture/DEX-UNISWAP-FEASIBILITY-R7.md",...names.map(name=>"docs/architecture/adrs/"+name)]){
    const impact=calculateImpact(r,[path]);
    assert.deepEqual(impact.active,["bootstrap"]);
    assert.deepEqual(impact.planned,[]);
    assert.deepEqual(impact.unknown,[]);
  }
  const adapter=calculateImpact(r,["src/defi/uniswap_pool_observation.rs"]);
  assert(adapter.planned.includes("defi"));
  assert(adapter.planned.includes("strategy-defi"));
  assert(adapter.planned.includes("integration"));
  assert.deepEqual(adapter.unknown,[]);
  const strategy=calculateImpact(r,["src/strategy-defi/cex_dex_spread.rs"]);
  assert(strategy.planned.includes("strategy-defi"));
  assert(strategy.planned.includes("integration"));
  assert.deepEqual(strategy.unknown,[]);
});


test("Round 8 Portfolio and Observability design gates preserve financial truth and 24 adverse fixtures",()=>{
  const design=fs.readFileSync(new URL("../../docs/architecture/PORTFOLIO-OBSERVABILITY-R8.md",import.meta.url),"utf8");
  for(const field of ["BalancePositionObservationV0","ReconciliationCursorV0","InventoryReservationV0","ReconciliationDiscrepancyV0","PortfolioSnapshotV0","PortfolioRiskViewV0","TradingTraceEnvelopeV0","LatencyMeasurementV0","TelemetryQualityV0","IncidentEnvelopeV0","OperatorAlertRouteV0","UNRECONCILED","DISCREPANCY_LOCKED","UNKNOWN_NEEDS_RECONCILIATION"]){
    assert(design.includes(field),"R8_MISSING_DESIGN_CONTRACT_OR_STATE "+field);
  }
  for(const scenario of ["DUPLICATE_EXTERNAL_FILL","CONFLICTING_FILL_IDS","LOST_ACK_OPEN_POSITION","INCOMPLETE_HISTORY_CURSOR","BALANCE_POSITION_DRIFT","CROSS_ACCOUNT_FUNDS","PENDING_WITHDRAWAL","WRONG_ASSET_ISSUER","FX_CONVERSION_STALE","MISSING_FEE_OR_CARRY","RESERVATION_CONFLICT","SERIALIZATION_RETRY_SIDE_EFFECT","STALE_RISK_VIEW","REORGED_CHAIN_RECEIPT","KILL_PERSIST_AFTER_RESTART","PRIVATE_STREAM_GAP","CROSS_CLOCK_LATENCY","THIN_P99_SAMPLE","METRIC_CARDINALITY_SPIKE","EXPORTER_BACKPRESSURE","COLLECTOR_UNAVAILABLE","ALERT_DELIVERY_FAILURE","ALERT_ACK_NOT_RECEIPT","SECRET_OR_TICK_LEAK"]){
    const row=design.split(/\r?\n/).find(line=>line.startsWith("| "+scenario+" | "));
    assert(row&&row.split("|").length>=4,"R8_MISSING_ADVERSE_DESIGN_FIXTURE "+scenario);
  }
  for(const id of ["portfolio","observability"]){
    assert.equal(r.modules.find(m=>m.id===id)?.state,"planned","R8_PREMATURE_ACTIVATION "+id);
    const charter=fs.readFileSync(new URL("../../docs/architecture/modules/"+id+".md",import.meta.url),"utf8");
    assert(charter.includes("PLANNED, NOT IMPLEMENTED"));
    assert(charter.includes("STOP"));
  }
  assert.equal(r.modules.length,20);
  assert.deepEqual(r.modules.filter(m=>m.state==="active").map(m=>m.id),["bootstrap"]);
  assert.deepEqual(r.modules.find(m=>m.id==="portfolio")?.depends_on,["risk","ledger"]);
  assert.deepEqual(r.modules.find(m=>m.id==="observability")?.depends_on,["market-data","clock","execution","ledger","risk"]);
});
test("Round 8 ADR proposals stay nonadopted and planned portfolio/telemetry source impact stays gated",()=>{
  const names=["FV-ADR-015-PROPOSED-PORTFOLIO-RECONCILIATION.md","FV-ADR-016-PROPOSED-TRADING-OBSERVABILITY.md"];
  for(const name of names){
    const adr=fs.readFileSync(new URL("../../docs/architecture/adrs/"+name,import.meta.url),"utf8");
    assert(adr.includes("PROPOSED_NOT_ADOPTED"),"R8_ADR_PREMATURELY_ADOPTED "+name);
  }
  for(const path of ["docs/architecture/PORTFOLIO-OBSERVABILITY-R8.md",...names.map(name=>"docs/architecture/adrs/"+name)]){
    const impact=calculateImpact(r,[path]);
    assert.deepEqual(impact.active,["bootstrap"]);
    assert.deepEqual(impact.planned,[]);
    assert.deepEqual(impact.unknown,[]);
  }
  const portfolioImpact=calculateImpact(r,["src/portfolio/reconciliation.rs"]);
  assert(portfolioImpact.planned.includes("portfolio"));
  assert(portfolioImpact.planned.includes("strategy-forex"));
  assert(portfolioImpact.planned.includes("strategy-cex"));
  assert(portfolioImpact.planned.includes("strategy-defi"));
  assert(portfolioImpact.planned.includes("integration"));
  assert.deepEqual(portfolioImpact.unknown,[]);
  const obsImpact=calculateImpact(r,["src/observability/latency.rs"]);
  assert(obsImpact.planned.includes("observability"));
  assert(obsImpact.planned.includes("web"));
  assert(obsImpact.planned.includes("integration"));
  assert.deepEqual(obsImpact.unknown,[]);
});
