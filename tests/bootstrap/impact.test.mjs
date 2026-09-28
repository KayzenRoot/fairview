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
