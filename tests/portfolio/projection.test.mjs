import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {deriveSyntheticPortfolio,probeSyntheticPortfolioRisk} from "../../src/portfolio/projection.mjs";
import {evaluateSyntheticRisk} from "../../src/risk/evaluate.mjs";
import {createSyntheticLedger,appendSyntheticLedgerEvent} from "../../src/ledger/simulation.mjs";

const s=Object.freeze({tenant_id:"MOCK_T",account_id:"MOCK_A",venue_id:"MOCK_V",
 instrument_contract_id:"MOCK_FX",strategy_family:"MOCK_ONE"});
const policyScope=()=>({venue_id:s.venue_id,legal_entity:"MOCK_E",jurisdiction:"TEST_R",
 account_ref:s.account_id,account_kind:"DEMO",instrument_contract_id:s.instrument_contract_id,
 strategy_family:s.strategy_family,api_protocol:"MOCK"});
const grant=type=>({type,ref:"REF_"+type,proof_sha256:"a".repeat(64),reviewer_ref:"TEST_REVIEWER",
 scope:policyScope(),revoked:false,verified_at_utc:"2026-09-01T00:00:00.000Z",
 expires_at_utc:"2026-10-01T00:00:00.000Z",
 ...(type==="DATA_USE"?{data_scopes:["INTERNAL"],delivery:"TICK_COMPLETE"}:{})});
const policy=(p={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",scope:policyScope(),
 mode:"DEMO",data_use:"INTERNAL",now_utc:"2026-09-29T00:00:00.000Z",
 grants:["ACCOUNT_API","STRATEGY_PERMISSION","DATA_USE","OPERATOR_APPROVAL"].map(grant),...p});
const intent=(p={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 tenant_id:s.tenant_id,account_id:s.account_id,venue_id:s.venue_id,
 instrument_contract_id:s.instrument_contract_id,intent_key:"INT_1",side:"BUY",
 quantity_units:"10",created_at_utc:"2026-09-29T00:00:00.000Z",policy_request:policy(),...p});
const event=(n,type,p={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 intent_key:"INT_1",event_id:"EV_"+n,sequence:String(n),
 captured_at_utc:"2026-09-29T00:00:00.000Z",type,
 attempt_id:"ATT_1",quantity_units:null,execution_id:null,receipt:null,...p});
const receipt=(p={})=>({source_class:"SYNTHETIC_FIXTURE",complete:true,
 account_id:s.account_id,venue_id:s.venue_id,instrument_contract_id:s.instrument_contract_id,
 cursor:"MOCK_CURSOR",reported_filled_units:"0",order_status:"OPEN",...p});
const balance=(p={})=>Object.freeze({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 scope:Object.freeze({...s}),version:"BAL_V1",observed_at_utc:"2026-09-29T00:00:00.000Z",
 valid_until_utc:"2026-10-01T00:00:00.000Z",complete:true,transfer_state:"NONE",
 available_quote_minor:"100000",available_base_units:"1000",known_exposure_units:"2",
 daily_loss_minor:"0",drawdown_minor:"0",recent_order_count:0,
 seen_intent_keys:Object.freeze([]),expected_filled_units:"0",...p});
const input=(p={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 scope:{...s},balance:balance(),ledger_intent:intent(),ledger_events:[],
 run_at_utc:"2026-09-29T00:00:01.000Z",...p});
const noAuthority=x=>{assert.equal(x.fixture_only,true);assert.equal(x.execution_authorized,false);
 assert.equal(x.persisted,false);assert.equal(x.authenticated_provider_evidence,false);
 assert.equal(x.real_balance_verified,false);
 assert.equal(x.financial_reconciliation_complete,false);assert(Object.isFrozen(x));return x;};
const verify=(i,status,reason)=>{const x=deriveSyntheticPortfolio(i);
 assert.equal(x.status,status,JSON.stringify(x));if(reason)assert.equal(x.reason_code,reason,JSON.stringify(x));
 return noAuthority(x);};
const deny=(i,why)=>verify(i,"DENY",why);
const send=()=>event(1,"MAY_HAVE_SENT");
const ack=()=>event(2,"ACK");
const fill=(n,quantity,execution_id)=>event(n,"FILL",{quantity_units:quantity,execution_id});

test("empty invented Ledger has typed frozen mock Risk seam, NEVER a real spendable balance",()=>{
 const r=verify(input(),"MOCK_CONSISTENT","INVENTED_LEDGER_AND_BALANCE_MATCH_ONLY");
 assert.equal(r.snapshot.ledger_phase,"INTENT_DURABLE");
 assert.equal(r.snapshot.ledger_event_count,0);
 assert.equal(r.snapshot.ledger_filled_units,"0");
 assert.equal(r.snapshot.possible_unknown_fill_units,"0");
 assert.equal(r.snapshot.worst_case_exposure_units,"2");
 assert.equal(r.mock_risk_view.complete,true);assert.equal(r.mock_risk_view.unknown_effects,false);
 assert.deepEqual(r.mock_risk_view.seen_intent_keys,["INT_1"]);
 assert(Object.isFrozen(r.mock_risk_view));assert(Object.isFrozen(r.mock_risk_view.scope));
 assert(Object.isFrozen(r.mock_risk_view.seen_intent_keys));assert(Object.isFrozen(r.snapshot.scope));
 assert.equal(r.snapshot.financial_reconciliation_complete,false);
 assert.equal(JSON.parse(JSON.stringify(r)).execution_authorized,false);
});
test("no host clock or external balance is used; same input is deterministic",()=>{
 const a=verify(input(),"MOCK_CONSISTENT"),b=verify(input(),"MOCK_CONSISTENT");
 assert.deepEqual(a,b);
 const i=input();const r=verify(i,"MOCK_CONSISTENT");
 i.scope.tenant_id="FORGED";i.ledger_intent.tenant_id="FORGED";
 assert.equal(r.snapshot.scope.tenant_id,s.tenant_id);
});
test("the actual Ledger is used, never caller-supplied claimed phase/filled totals",()=>{
 const created=createSyntheticLedger(intent());assert.equal(created.status,"CREATED");
 const sent=appendSyntheticLedgerEvent(created.ledger,send());assert.equal(sent.status,"APPLIED");
 const r=verify(input({ledger_events:[send()]}),"REQUIRES_RECONCILIATION");
 assert.equal(r.snapshot.ledger_phase,sent.ledger.phase);
 assert.equal(r.snapshot.possible_unknown_fill_units,"10");
 assert.equal(r.mock_risk_view,null);
});
test("ACK does not clear worst possible unfilled units",()=>{
 const r=verify(input({ledger_events:[send(),ack()]}),"REQUIRES_RECONCILIATION");
 assert.equal(r.snapshot.ledger_phase,"ACKNOWLEDGED");
 assert.equal(r.snapshot.possible_unknown_fill_units,"10");
});
test("partial fictional fill is counted exactly and remaining qty is conservatively reserved",()=>{
 const r=verify(input({ledger_events:[send(),fill(2,"4","EXEC_1")],
  balance:balance({expected_filled_units:"4"})}),"REQUIRES_RECONCILIATION");
 assert.equal(r.snapshot.ledger_filled_units,"4");
 assert.equal(r.snapshot.possible_unknown_fill_units,"6");
 assert.equal(r.snapshot.worst_case_exposure_units,"12");
 assert.equal(r.mock_risk_view,null);
});
test("a fabricated full fill has zero further units but is not real authenticated venue proof",()=>{
 const r=verify(input({ledger_events:[send(),fill(2,"4","EXEC_1"),fill(3,"6","EXEC_2")],
  balance:balance({expected_filled_units:"10"})}),"MOCK_CONSISTENT");
 assert.equal(r.snapshot.ledger_phase,"FILLED");
 assert.equal(r.snapshot.possible_unknown_fill_units,"0");
 assert.equal(r.mock_risk_view.known_exposure_units,"12");
 assert.equal(r.mock_risk_view.unknown_possible_fill_units,"0");
 assert.equal(r.authenticated_provider_evidence,false);
});
test("fake cancel request and fake cancel confirmation alone cannot establish remote no-fill",()=>{
 const ev=[send(),ack(),event(3,"CANCEL_REQUESTED"),event(4,"CANCEL_CONFIRMED")];
 const r=verify(input({ledger_events:ev}),"REQUIRES_RECONCILIATION");
 assert.equal(r.snapshot.ledger_phase,"CANCELED_CONFIRMED");
 assert.equal(r.snapshot.possible_unknown_fill_units,"10");
 const resolved=verify(input({ledger_events:[...ev,event(5,"RECONCILE",
  {receipt:receipt({order_status:"CANCELED"})})]}),"MOCK_CONSISTENT");
 assert.equal(resolved.snapshot.possible_unknown_fill_units,"0");
 assert.equal(resolved.financial_reconciliation_complete,false);
});
test("fabricated fully paginated REJECTED receipt clears only mock remaining units",()=>{
 const r=verify(input({ledger_events:[send(),event(2,"RECONCILE",
  {receipt:receipt({order_status:"REJECTED"})})]}),"MOCK_CONSISTENT");
 assert.equal(r.snapshot.ledger_phase,"REJECTED");
 assert.equal(r.snapshot.possible_unknown_fill_units,"0");
 assert.equal(r.authenticated_provider_evidence,false);
});
test("fabricated COMPLETE but still OPEN receipt never clears a pending synthetic order",()=>{
 const r=verify(input({ledger_events:[send(),event(2,"RECONCILE",{receipt:receipt()})]}),
  "REQUIRES_RECONCILIATION");
 assert.equal(r.snapshot.possible_unknown_fill_units,"10");
});
test("lost ACK freezes even a fully observed local fake fill until mock reconciliation",()=>{
 const ev=[send(),event(2,"LOST_ACK"),fill(3,"10","EXEC_1")];
 const unknown=verify(input({ledger_events:ev,balance:balance({expected_filled_units:"10"})}),
  "REQUIRES_RECONCILIATION");
 assert.equal(unknown.snapshot.possible_unknown_fill_units,"0");
 assert.equal(unknown.snapshot.ledger_phase,"UNKNOWN_NEEDS_RECONCILIATION");
 const r=verify(input({ledger_events:[...ev,event(4,"RECONCILE",
  {receipt:receipt({reported_filled_units:"10",order_status:"FILLED"})})],
  balance:balance({expected_filled_units:"10"})}),"MOCK_CONSISTENT");
 assert.equal(r.snapshot.ledger_phase,"FILLED");
 assert.equal(r.authenticated_provider_evidence,false);
});
test("incomplete invented provider history is a hard local discrepancy",()=>{
 verify(input({ledger_events:[send(),event(2,"LOST_ACK"),
  event(3,"RECONCILE",{receipt:receipt({complete:false})})]}),
  "DISCREPANCY_LOCKED","MOCK_LEDGER_INCOMPLETE_SYNTHETIC_HISTORY");
});
test("contradictory invented terminal fill history locks instead of fabricating money",()=>{
 verify(input({ledger_events:[send(),event(2,"RECONCILE",
  {receipt:receipt({reported_filled_units:"0",order_status:"FILLED"})})]}),
  "DISCREPANCY_LOCKED","MOCK_LEDGER_CONFLICTING_SYNTHETIC_RECONCILIATION");
});
test("invented duplicate event conflict locks, exact duplicate cannot extend local history",()=>{
 verify(input({ledger_events:[send(),event(1,"ACK",{event_id:"EV_1"})]}),
  "DISCREPANCY_LOCKED","MOCK_LEDGER_CONFLICTING_DUPLICATE_EVENT_ID");
 deny(input({ledger_events:[send(),send()]}),"INVALID_MOCK_EVENT_SAME_EVENT_ID_SAME_FACTS");
});
test("gapped, mismatched or real-vendor Ledger events are denied",()=>{
 deny(input({ledger_events:[send(),event(3,"ACK")]}),"INVALID_MOCK_EVENT_EVENT_SEQUENCE_GAP");
 deny(input({ledger_events:[send(),event(2,"ACK",{intent_key:"ANOTHER"})]}),
  "INVALID_MOCK_EVENT_INVALID_EVENT");
 deny(input({ledger_events:[send(),event(2,"ACK",{source_class:"REAL_VENDOR"})]}),
  "INVALID_MOCK_EVENT_REAL_VENUE_NOT_SUPPORTED");
});
test("mismatched mock balances never claim a filled position or allow Risk probing",()=>{
 const r=verify(input({ledger_events:[send(),fill(2,"4","EXEC_1")]}),
  "DISCREPANCY_LOCKED","MOCK_BALANCE_LEDGER_FILL_MISMATCH");
 assert.equal(r.mock_risk_view,undefined);
});
test("no cross tenant/account/venue/instrument/strategy can join a foreign mock Ledger or cash",()=>{
 for(const k of ["tenant_id","account_id","venue_id","instrument_contract_id","strategy_family"]){
  const other={...s,[k]:"FOREIGN"};
  deny(input({balance:balance({scope:Object.freeze(other)})}),"BALANCE_SCOPE_MISMATCH");
 }
 for(const k of ["tenant_id","account_id","venue_id","instrument_contract_id"]){
  deny(input({ledger_intent:intent({[k]:"FOREIGN"})}),"LEDGER_SCOPE_MISMATCH");
 }
 const q=intent();q.policy_request.scope.strategy_family="FOREIGN";
 deny(input({ledger_intent:q}),"LEDGER_SCOPE_MISMATCH");
});
test("fake balance must be frozen, bounded, fresh, exact, scoped and source-only",()=>{
 deny(input({balance:{...balance()}}),"INVALID_FROZEN_MOCK_BALANCE");
 deny(input({balance:balance({scope:{...s}})}),"INVALID_FROZEN_MOCK_BALANCE");
 deny(input({balance:balance({source_class:"REAL_VENDOR"})}),"INVALID_FROZEN_MOCK_BALANCE");
 deny(input({balance:balance({available_quote_minor:100})}),"INVALID_FROZEN_MOCK_BALANCE");
 deny(input({balance:balance({available_quote_minor:"1e3"})}),"INVALID_FROZEN_MOCK_BALANCE");
 deny(input({balance:balance({available_base_units:"-1"})}),"INVALID_FROZEN_MOCK_BALANCE");
 deny(input({balance:balance({seen_intent_keys:[]})}),"INVALID_FROZEN_MOCK_BALANCE");
 deny(input({balance:balance({recent_order_count:-1})}),"INVALID_FROZEN_MOCK_BALANCE");
 deny(input({balance:balance({observed_at_utc:"yesterday"})}),"INVALID_FROZEN_MOCK_BALANCE");
 deny(input({balance:balance({valid_until_utc:"2026-09-01T00:00:00.000Z"})}),
  "INVALID_FROZEN_MOCK_BALANCE");
});
test("mock expiry and future observations are compared only with injected fictional run time",()=>{
 deny(input({run_at_utc:"2026-10-01T00:00:00.000Z"}),"STALE_OR_FUTURE_MOCK_BALANCE");
 deny(input({run_at_utc:"2026-09-28T00:00:00.000Z"}),"STALE_OR_FUTURE_MOCK_BALANCE");
 deny(input({run_at_utc:"yesterday"}),"INVALID_RUN_TIME");
 deny(input({ledger_intent:intent({created_at_utc:"2026-09-30T00:00:00.000Z"})}),
  "FUTURE_LEDGER_INTENT");
 deny(input({ledger_events:[event(1,"MAY_HAVE_SENT",{captured_at_utc:"2026-09-30T00:00:00.000Z"})]}),
  "FUTURE_LEDGER_EVENT");
});
test("mock missing pages or unknown transfer denies use of a hypothetical Risk view",()=>{
 const incomplete=verify(input({balance:balance({complete:false})}),"REQUIRES_RECONCILIATION");
 assert.equal(incomplete.mock_risk_view,null);
 for(const transfer_state of ["PENDING","UNKNOWN"]){
  const r=verify(input({balance:balance({transfer_state})}),"REQUIRES_RECONCILIATION");
  assert.equal(r.mock_risk_view,null);
 }
});
test("duplicate fictitious intent references cannot be reused across mock projection",()=>{
 deny(input({balance:balance({seen_intent_keys:Object.freeze(["INT_1"])})}),
  "DUPLICATE_SCOPED_INTENT");
 deny(input({balance:balance({seen_intent_keys:Object.freeze(["X","X"])})}),
  "INVALID_FROZEN_MOCK_BALANCE");
});
test("exact integer arithmetic survives beyond Number.MAX_SAFE_INTEGER without PnL assumptions",()=>{
 const big="9007199254740993";
 const r=verify(input({balance:balance({known_exposure_units:big})}),"MOCK_CONSISTENT");
 assert.equal(r.snapshot.worst_case_exposure_units,big);
 assert.equal(r.mock_risk_view.known_exposure_units,big);
 const over=balance({known_exposure_units:"18446744073709551615"});
 deny(input({ledger_events:[send(),fill(2,"10","EXEC_1")],balance:balance({
  known_exposure_units:over.known_exposure_units,expected_filled_units:"10"})}),
  "MOCK_EXPOSURE_OVERFLOW");
 assert.equal(Object.hasOwn(r.snapshot,"realized_pnl"),false);
 assert.equal(Object.hasOwn(r.snapshot,"real_available_balance"),false);
});
test("strict input schemas and real provider attempts DENY with no authority",()=>{
 for(const value of [null,undefined,{},[],"invented",Object.create(null)]){
  deny(value,"INVALID_PROJECTION_REQUEST");
 }
 deny({...input(),source_class:"REAL_VENDOR"},"REAL_PROVIDER_NOT_IMPLEMENTED");
 deny({...input(),financial_reconciliation_complete:true},"INVALID_PROJECTION_REQUEST");
 deny({...input(),ledger_events:null},"INVALID_EVENT_STREAM");
 deny({...input(),ledger_events:Array.from({length:129},()=>event(1,"ACK"))},
  "INVALID_EVENT_STREAM");
 deny(input({ledger_intent:intent({source_class:"REAL_VENDOR"})}),
  "INVALID_SYNTHETIC_LEDGER_REAL_VENUE_NOT_SUPPORTED");
});
test("throwing accessors and hostile objects cannot escape with a fake positive result",()=>{
 const i=input();Object.defineProperty(i,"balance",{get(){throw Error("hostile");}});
 deny(i,"INVALID_PROJECTION_REQUEST");
 deny(new Proxy(input(),{get(){throw Error("proxy");}}),"INVALID_PROJECTION_REQUEST");
 const bad=input();Object.defineProperty(bad.ledger_intent,"tenant_id",
  {get(){throw Error("hostile intent");}});deny(bad,"INVALID_PROJECTION_REQUEST");
});
const capture=(p={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",clock_domain_id:"MOCK_D",
 receive_epoch_id:"MOCK_BOOT",instrument_contract_id:s.instrument_contract_id,
 local_receive_monotonic_ns:"1000000000",local_receive_wall_utc_ns:"1700000000000000000",
 estimated_clock_error_ns:"100",sync_state:"HEALTHY",source_event_utc_ns:"1700000000000000000",
 source_event_uncertainty_ns:"50",source_timestamp_semantics:"EVENT",...p});
const quote=(p={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 quote_id:"Q_1",provider_id:"FAKE_PROVIDER",feed_id:"FAKE_FEED",venue_id:s.venue_id,
 instrument_contract_id:s.instrument_contract_id,bid:"1.2300",ask:"1.2400",price_scale:4,
 bid_size:"100.00",ask_size:"100.00",quantity_scale:2,book_depth_level:2,
 quote_kind:"EXECUTABLE",data_use_scope:"SYNTHETIC_INTERNAL",data_rights_ref:"FAKE_RIGHTS",
 delivery:"NORMAL",transport_kind:"REPLAY",source_sequence_epoch:"MOCK_SEQ",provider_sequence:"10",
 full_snapshot:true,synthetic_fee_known:true,capture:capture(),...p});
const quality=Object.freeze({max_receive_age_ns:"1000",max_local_clock_error_ns:"1000",
 min_depth_levels:1,require_source_event_time:true});
const limits=()=>Object.freeze({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 scope:Object.freeze({...s}),version:"L_V1",notional_scale:2,max_order_notional_minor:"1000",
 max_total_exposure_units:"1000",max_daily_loss_minor:"1000",max_drawdown_minor:"1000",
 max_orders_per_window:5,worst_case_cost_bps:100});
const kill=()=>Object.freeze({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 scope:Object.freeze({...s}),epoch:"K_V1",state_known:true,engaged:false,mock_replayed_after_restart:true});
const riskRequest=(p={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 intent:{schema_version:0,intent_key:"INT_2",scope:{...s},side:"BUY",purpose:"OPEN",
 quantity_units:"10",limit_price:"1.2400",quote_id:"Q_1",portfolio_version:"BAL_V1",
 limits_version:"L_V1",kill_epoch:"K_V1"},
 policy_request:policy(),quote:quote(),quality_policy:quality,
 now_capture:capture({local_receive_monotonic_ns:"1000000100",
  local_receive_wall_utc_ns:"1700000000000000100"}),
 previous_quote:null,portfolio:{malicious_override:true},limits:limits(),kill:kill(),...p});
test("actual Risk integration uses ONLY internally derived module-private frozen mock portfolio",()=>{
 const p=verify(input(),"MOCK_CONSISTENT");
 const model=probeSyntheticPortfolioRisk(p,riskRequest());
 noAuthority(model);
 assert.equal(model.status,"MOCK_RISK_MODEL_PASS");
 assert.equal(model.risk_result.status,"SYNTHETIC_MODEL_PASS");
 assert.equal(model.risk_result.execution_authorized,false);
 assert.deepEqual(model.risk_result.scope,s);
 assert.equal(model.risk_result.portfolio_version,"BAL_V1");
 assert.equal(evaluateSyntheticRisk(riskRequest()).status,"DENY");
});
test("module-private provenance rejects forged/cloned caller projection and cannot elevate Risk",()=>{
 const original=verify(input(),"MOCK_CONSISTENT");
 for(const fake of [null,{},Object.freeze({...original}),
  JSON.parse(JSON.stringify(original)),original.snapshot,original.mock_risk_view]){
  const result=probeSyntheticPortfolioRisk(fake,riskRequest());
  noAuthority(result);assert.equal(result.status,"DENY");
  assert.equal(result.reason_code,"UNTRUSTED_MOCK_PROJECTION");
 }
});
test("Risk probe preserves deny on duplicate intent, stale quote, missing/engaged kill and unknown portfolio",()=>{
 const p=verify(input(),"MOCK_CONSISTENT");
 const duplicate=riskRequest();duplicate.intent.intent_key="INT_1";
 assert.equal(probeSyntheticPortfolioRisk(p,duplicate).status,"DENY");
 const stale=riskRequest({now_capture:capture({local_receive_monotonic_ns:"1000005000",
  local_receive_wall_utc_ns:"1700000000000005000"})});
 assert.equal(probeSyntheticPortfolioRisk(p,stale).status,"DENY");
 const engaged=riskRequest({kill:Object.freeze({...kill(),engaged:true})});
 assert.equal(probeSyntheticPortfolioRisk(p,engaged).status,"DENY");
 const unknown=verify(input({ledger_events:[send()]}),"REQUIRES_RECONCILIATION");
 assert.equal(probeSyntheticPortfolioRisk(unknown,riskRequest()).status,"DENY");
});
test("source has no side effects, no real persistence or other module source modifications",()=>{
 const src=fs.readFileSync(new URL("../../src/portfolio/projection.mjs",import.meta.url),"utf8");
 for(const forbidden of ["Date.now(", "process.hrtime(", "fetch(", "node:fs",
  "node:http","node:net","child_process","signTransaction","node:crypto",
  "execution_authorized:true","persisted:true"])
  assert(!src.includes(forbidden),"FORBIDDEN_PORTFOLIO_OPERATION "+forbidden);
 assert(src.includes("../ledger/simulation.mjs"));
 assert(src.includes("../risk/evaluate.mjs"));
});
