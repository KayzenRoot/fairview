import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {evaluateSyntheticRisk} from "../../src/risk/evaluate.mjs";

const scope=Object.freeze({tenant_id:"invented-tenant",account_id:"synthetic_acct_01",
 venue_id:"fake-venue-A",instrument_contract_id:"FICTIONAL_EURUSD_SPOT",
 strategy_family:"SIMULATED_ONE_LEG"});
const policyScope={venue_id:scope.venue_id,legal_entity:"fictional_entity_01",
 jurisdiction:"ZZ_TEST_ONLY",account_ref:scope.account_id,account_kind:"SIMULATED",
 instrument_contract_id:scope.instrument_contract_id,strategy_family:scope.strategy_family,
 api_protocol:"SIMULATED_NO_NETWORK"};
const TYPES=["ACCOUNT_API","STRATEGY_PERMISSION","DATA_USE","OPERATOR_APPROVAL"];
const grant=(type,i)=>({type,ref:"fictional-grant-"+i,proof_sha256:String(i+1).padStart(64,"0"),
 reviewer_ref:"fictional-reviewer",scope:{...policyScope},revoked:false,
 verified_at_utc:"2026-09-01T00:00:00.000Z",expires_at_utc:"2026-10-01T00:00:00.000Z",
 ...(type==="DATA_USE"?{data_scopes:["INTERNAL"],delivery:"TICK_COMPLETE"}:{})});
const policy=(p={})=>({schema_version:0,scope:{...policyScope},mode:"DEMO",data_use:"INTERNAL",
 source_class:"SYNTHETIC_FIXTURE",now_utc:"2026-09-15T12:00:00.000Z",
 grants:TYPES.map(grant),...p});
const capture=(p={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 clock_domain_id:"invented-domain-1",receive_epoch_id:"invented-boot-1",
 instrument_contract_id:scope.instrument_contract_id,
 local_receive_monotonic_ns:"10000000000000001",local_receive_wall_utc_ns:"1700000000000000000",
 estimated_clock_error_ns:"100",sync_state:"HEALTHY",
 source_event_utc_ns:"1700000000000000000",source_event_uncertainty_ns:"50",
 source_timestamp_semantics:"EVENT",...p});
const quote=(p={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 quote_id:"invented-quote-1",provider_id:"fake-provider-A",feed_id:"mock-channel-1",
 venue_id:scope.venue_id,instrument_contract_id:scope.instrument_contract_id,
 bid:"1.2300",ask:"1.2400",price_scale:4,bid_size:"100.00",ask_size:"120.00",
 quantity_scale:2,book_depth_level:2,quote_kind:"EXECUTABLE",data_use_scope:"SYNTHETIC_INTERNAL",
 data_rights_ref:"invented-rights-1",delivery:"NORMAL",transport_kind:"REPLAY",
 source_sequence_epoch:"mock-seq-1",provider_sequence:"10",full_snapshot:true,
 synthetic_fee_known:true,capture:capture(),...p});
const quality=Object.freeze({max_receive_age_ns:"1000",max_local_clock_error_ns:"1000",
 min_depth_levels:1,require_source_event_time:true});
const now=(p={})=>capture({local_receive_monotonic_ns:"10000000000000101",
 local_receive_wall_utc_ns:"1700000000000000100",...p});
const portfolio=(p={})=>Object.freeze({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 scope:Object.freeze({...scope}),version:"p-v1",complete:true,unknown_effects:false,
 known_exposure_units:"100",unknown_possible_fill_units:"0",
 available_quote_minor:"100000",available_base_units:"10000",
 daily_loss_minor:"0",drawdown_minor:"0",recent_order_count:0,
 seen_intent_keys:Object.freeze([]),...p});
const limits=(p={})=>Object.freeze({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 scope:Object.freeze({...scope}),version:"l-v1",notional_scale:2,
 max_order_notional_minor:"1000",max_total_exposure_units:"1000",
 max_daily_loss_minor:"1000",max_drawdown_minor:"1000",
 max_orders_per_window:5,worst_case_cost_bps:100,...p});
const kill=(p={})=>Object.freeze({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 scope:Object.freeze({...scope}),epoch:"k-v1",state_known:true,engaged:false,
 mock_replayed_after_restart:true,...p});
const intent=(p={})=>({schema_version:0,intent_key:"invented-intent-1",scope:{...scope},
 side:"BUY",purpose:"OPEN",quantity_units:"100",limit_price:"1.2400",
 quote_id:"invented-quote-1",portfolio_version:"p-v1",limits_version:"l-v1",
 kill_epoch:"k-v1",...p});
const input=(p={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 intent:intent(),policy_request:policy(),quote:quote(),quality_policy:quality,
 now_capture:now(),previous_quote:null,portfolio:portfolio(),limits:limits(),kill:kill(),...p});
function outcome(i,status,why){
 const r=evaluateSyntheticRisk(i);assert.equal(r.status,status,JSON.stringify(r));
 if(why)assert.equal(r.reason_code,why,JSON.stringify(r));
 assert.equal(r.fixture_only,true);assert.equal(r.execution_authorized,false);
 assert.equal(r.persisted,false);assert.equal(r.real_account_verified,false);
 assert.equal(r.kill_durable,false);assert(Object.isFrozen(r));return r;
}
const deny=(i,reason)=>outcome(i,"DENY",reason);

test("valid invented BUY has deterministic exact cents/ceil cost but NEVER financial authority",()=>{
 const a=outcome(input(),"SYNTHETIC_MODEL_PASS","INVENTED_BOUND_CHECKS_ONLY");
 const b=outcome(input(),"SYNTHETIC_MODEL_PASS");
 assert.deepEqual(a,b);assert.equal(a.worst_case_notional_minor,"124");
 assert.equal(a.worst_case_cost_minor,"2");assert.equal(a.worst_case_exposure_units,"200");
 assert.equal(a.observed_elapsed_ns,"100");assert(Object.isFrozen(a.scope));
 assert.equal(JSON.parse(JSON.stringify(a)).execution_authorized,false);
});
test("valid invented SELL uses synthetic bid and base balance",()=>{
 const a=outcome(input({intent:intent({side:"SELL",limit_price:"1.2200"})}),"SYNTHETIC_MODEL_PASS");
 assert.equal(a.worst_case_notional_minor,"123");assert.equal(a.worst_case_cost_minor,"2");
});
test("mock RECOVERY never skips policy, kill or balance gates",()=>{
 const r=input({intent:intent({purpose:"RECOVERY"})});
 outcome(r,"SYNTHETIC_MODEL_PASS");
 deny({...r,kill:kill({engaged:true})},"KILL_ENGAGED");
 deny({...r,portfolio:portfolio({unknown_effects:true})},"UNRESOLVED_POSSIBLE_FILL");
});
test("pure outcomes are detached from caller source references",()=>{
 const i=input();const a=outcome(i,"SYNTHETIC_MODEL_PASS");
 i.intent.scope.tenant_id="tampered";i.intent.intent_key="tampered";
 assert.equal(a.scope.tenant_id,scope.tenant_id);assert.equal(a.intent_key,"invented-intent-1");
 assert(Object.isFrozen(a.scope));
});
for(const [label,value,reason] of [
 ["null",null,"INVALID_REQUEST"],["empty",{},"INVALID_REQUEST"],["array",[],"INVALID_REQUEST"],
 ["unknown source",{...input(),source_class:"OTHER"},"INVALID_REQUEST"],
 ["actual vendor",{...input(),source_class:"REAL_VENDOR"},"TRUSTED_RISK_NOT_IMPLEMENTED"],
 ["extra forged permit",{...input(),execution_authorized:true},"INVALID_REQUEST"]
])test("request malformed or untrusted "+label,()=>deny(value,reason));
for(const [label,bad] of [
 ["null",null],["bad ID",intent({intent_key:"*"})],["unrecognized side",intent({side:"SHORT"})],
 ["bad purpose",intent({purpose:"BYPASS"})],["wrong schema",intent({schema_version:1})]
])test("invalid intent "+label,()=>deny(input({intent:bad}),"INVALID_INTENT"));
for(const qty of ["0","01","-1","1.0","1e4",1,{}, "340282366920938463463374607431768211456"])
 test("strict quantity denies "+JSON.stringify(qty),()=>deny(input({intent:intent({quantity_units:qty})}),"INVALID_QUANTITY"));
test("missing, mutable, incomplete and real portfolio views cannot grant authority",()=>{
 deny(input({portfolio:null}),"MISSING_PORTFOLIO");
 deny(input({portfolio:{...portfolio()}}),"INVALID_PORTFOLIO");
 deny(input({portfolio:portfolio({complete:false})}),"INVALID_PORTFOLIO");
 deny(input({portfolio:portfolio({source_class:"REAL_VENDOR"})}),"INVALID_PORTFOLIO");
 deny(input({portfolio:portfolio({scope:{...scope}})}),"INVALID_PORTFOLIO");
 deny(input({portfolio:portfolio({seen_intent_keys:[]})}),"INVALID_PORTFOLIO");
 deny(input({portfolio:portfolio({available_quote_minor:null})}),"INVALID_PORTFOLIO");
 deny(input({portfolio:portfolio({recent_order_count:-1})}),"INVALID_PORTFOLIO");
});
test("unresolved and possible unknown fills freeze fresh and recovery intents",()=>{
 for(const purpose of ["OPEN","RECOVERY"]){
  deny(input({intent:intent({purpose}),portfolio:portfolio({unknown_effects:true})}),"UNRESOLVED_POSSIBLE_FILL");
  deny(input({intent:intent({purpose}),portfolio:portfolio({unknown_possible_fill_units:"1"})}),"UNRESOLVED_POSSIBLE_FILL");
 }
});
test("a duplicate scoped fictional intent is detected in injected immutable snapshot",()=>{
 deny(input({portfolio:portfolio({seen_intent_keys:Object.freeze(["invented-intent-1"])})}),"DUPLICATE_INTENT");
 deny(input({portfolio:portfolio({seen_intent_keys:Object.freeze(["same","same"])})}),"INVALID_PORTFOLIO");
});
test("missing/mutable/unrestored kill cannot masquerade as persistent kill proof",()=>{
 deny(input({kill:null}),"UNKNOWN_KILL_STATE");
 deny(input({kill:{...kill()}}),"UNKNOWN_KILL_STATE");
 deny(input({kill:kill({state_known:false})}),"UNKNOWN_KILL_STATE");
 deny(input({kill:kill({mock_replayed_after_restart:false})}),"UNKNOWN_KILL_STATE");
 deny(input({kill:kill({engaged:true})}),"KILL_ENGAGED");
 deny(input({intent:intent({kill_epoch:"old"})}),"KILL_EPOCH_MISMATCH");
});
test("all injected scope and version mismatches fail before risk math",()=>{
 deny(input({portfolio:portfolio({scope:Object.freeze({...scope,tenant_id:"other"})})}),"SCOPE_MISMATCH");
 deny(input({limits:limits({scope:Object.freeze({...scope,account_id:"other"})})}),"SCOPE_MISMATCH");
 deny(input({kill:kill({scope:Object.freeze({...scope,strategy_family:"other"})})}),"SCOPE_MISMATCH");
 deny(input({intent:intent({portfolio_version:"old"})}),"STALE_PORTFOLIO_VERSION");
 deny(input({intent:intent({limits_version:"old"})}),"STALE_LIMITS_VERSION");
});
test("all limits must be frozen complete positive explicit and versioned",()=>{
 deny(input({limits:{...limits()}}),"INVALID_LIMITS");
 deny(input({limits:limits({worst_case_cost_bps:0})}),"INVALID_LIMITS");
 deny(input({limits:limits({max_total_exposure_units:"0"})}),"INVALID_LIMITS");
 deny(input({limits:limits({max_order_notional_minor:"1e9"})}),"INVALID_LIMITS");
 deny(input({limits:limits({notional_scale:19})}),"INVALID_LIMITS");
});
test("loss, drawdown and order frequency all stop the same simulated intent",()=>{
 deny(input({portfolio:portfolio({recent_order_count:5})}),"ORDER_RATE_LIMIT");
 deny(input({portfolio:portfolio({daily_loss_minor:"1000"})}),"DAILY_LOSS_LIMIT");
 deny(input({portfolio:portfolio({drawdown_minor:"1000"})}),"DRAWDOWN_LIMIT");
});
test("model refuses forged policy scope, research and LIVE_CANDIDATE even as simulation pass",()=>{
 deny(input({policy_request:policy({scope:{...policyScope,venue_id:"another"}})}),"POLICY_SCOPE_OR_MODE");
 deny(input({policy_request:policy({mode:"RESEARCH",grants:[]})}),"POLICY_SCOPE_OR_MODE");
 deny(input({policy_request:policy({mode:"LIVE_CANDIDATE"})}),"POLICY_SCOPE_OR_MODE");
 deny(input({policy_request:policy({source_class:"REAL_VENDOR"})}),"POLICY_DENY");
 const g=TYPES.map(grant);g[0].revoked=true;
 deny(input({policy_request:policy({grants:g})}),"POLICY_DENY");
 const g2=TYPES.map(grant);g2[0].expires_at_utc="2026-09-01T00:00:00.000Z";
 deny(input({policy_request:policy({grants:g2})}),"POLICY_DENY");
});
test("actual Policy PAPER classification is still non-authoritative simulated gate",()=>{
 const r=outcome(input({policy_request:policy({mode:"PAPER"})}),"SYNTHETIC_MODEL_PASS");
 assert.equal(r.policy_classification,"PAPER_ELIGIBLE");assert.equal(r.execution_authorized,false);
});
test("malformed/real/wrong quote cannot become model pass",()=>{
 deny(input({quote:quote({source_class:"REAL_VENDOR"})}),"INVALID_QUOTE_TRUSTED_PROVIDER_NOT_IMPLEMENTED");
 deny(input({quote:quote({data_use_scope:"REDISTRIBUTION"})}),"INVALID_QUOTE_RIGHTS_UNVERIFIED");
 deny(input({quote:quote({venue_id:"another"})}),"QUOTE_SCOPE_MISMATCH");
 deny(input({quote:quote({quote_id:"other"})}),"QUOTE_SCOPE_MISMATCH");
 deny(input({quote:quote({capture:capture({source_class:"REAL_VENDOR"})})}),"INVALID_QUOTE_INVALID_CAPTURE_TRUSTED_CLOCK_NOT_IMPLEMENTED");
});
test("stale, cross-epoch, unknown clock, sampled and indicative quotes are rejected",()=>{
 deny(input({now_capture:now({local_receive_monotonic_ns:"10000000000002001"})}),"QUOTE_QUALITY_STALE_FEED");
 deny(input({now_capture:now({receive_epoch_id:"boot2"})}),"QUOTE_QUALITY_CROSS_DOMAIN");
 deny(input({now_capture:now({sync_state:"UNKNOWN"})}),"QUOTE_QUALITY_UNKNOWN_CLOCK");
 deny(input({quote:quote({delivery:"THROTTLED"})}),"QUOTE_QUALITY_SAMPLED_THROTTLED_OR_UNKNOWN");
 deny(input({quote:quote({quote_kind:"INDICATIVE"})}),"QUOTE_QUALITY_VENUE_QUOTE_NOT_EXECUTABLE");
 deny(input({quote:quote({synthetic_fee_known:false})}),"QUOTE_QUALITY_FEE_MODEL_UNKNOWN");
 deny(input({quote:quote({book_depth_level:0})}),"INVALID_QUOTE_INVALID_QUOTE_SCHEMA");
 deny(input({quote:quote({ask_size:null})}),"QUOTE_QUALITY_EXECUTABLE_SIZE_UNKNOWN");
});
test("source sequence must have initial full snapshot or exact contiguous event",()=>{
 deny(input({quote:quote({full_snapshot:false})}),"QUOTE_SEQUENCE_INITIAL_SNAPSHOT_REQUIRED");
 deny(input({quote:quote({provider_sequence:null})}),"QUOTE_SEQUENCE_UNKNOWN_SEQUENCE");
 const before=quote(),after=quote({quote_id:"invented-quote-2",provider_sequence:"11",full_snapshot:false});
 outcome(input({previous_quote:before,quote:after,intent:intent({quote_id:"invented-quote-2"})}),"SYNTHETIC_MODEL_PASS");
 deny(input({previous_quote:before,quote:quote({quote_id:"invented-quote-2",provider_sequence:"12",full_snapshot:false}),
  intent:intent({quote_id:"invented-quote-2"})}),"QUOTE_SEQUENCE_SEQUENCE_GAP");
 deny(input({previous_quote:before,quote:quote({quote_id:"invented-quote-2",provider_sequence:"10",full_snapshot:false}),
  intent:intent({quote_id:"invented-quote-2"})}),"QUOTE_SEQUENCE_OUT_OF_ORDER_DUPLICATE");
});
test("limit prices and invented book depth cannot be ignored",()=>{
 deny(input({intent:intent({limit_price:"1.2300"})}),"LIMIT_PRICE_OUTSIDE_QUOTE");
 deny(input({intent:intent({limit_price:"1e3"})}),"INVALID_LIMIT_PRICE");
 deny(input({intent:intent({quantity_units:"12001"})}),"INSUFFICIENT_SYNTHETIC_DEPTH");
 deny(input({intent:intent({side:"SELL",limit_price:"1.2400"})}),"LIMIT_PRICE_OUTSIDE_QUOTE");
});
test("notional ceil cost, exposure, buying power and sell inventory are exact and bounded",()=>{
 deny(input({limits:limits({max_order_notional_minor:"125"})}),"ORDER_NOTIONAL_OR_COST_LIMIT");
 deny(input({limits:limits({max_total_exposure_units:"199"})}),"TOTAL_EXPOSURE_LIMIT");
 deny(input({portfolio:portfolio({available_quote_minor:"125"})}),"INSUFFICIENT_SYNTHETIC_BALANCE");
 deny(input({intent:intent({side:"SELL",limit_price:"1.2200"}),portfolio:portfolio({available_base_units:"99"})}),"INSUFFICIENT_SYNTHETIC_BALANCE");
 const x=outcome(input({limits:limits({max_order_notional_minor:"126"}),portfolio:portfolio({available_quote_minor:"126"})}),"SYNTHETIC_MODEL_PASS");
 assert.equal(x.worst_case_notional_minor,"124");assert.equal(x.worst_case_cost_minor,"2");
});
test("hostile getters/proxies deny instead of throwing or returning stale caller state",()=>{
 const i=input();Object.defineProperty(i,"intent",{get(){throw Error("hostile");}});
 deny(i,"INVALID_REQUEST");
 const proxy=new Proxy(input(),{get(){throw Error("proxy trap")}});
 deny(proxy,"INVALID_REQUEST");
});
test("invented Risk is pure: no host clock, signing, persistence, network or imports from Ledger/Portfolio",()=>{
 const src=fs.readFileSync(new URL("../../src/risk/evaluate.mjs",import.meta.url),"utf8");
 for(const bad of ["Date.now(", "process.hrtime(", "fetch(", "node:fs","node:net","node:http",
  "child_process","signTransaction","../ledger/","../portfolio/","execution_authorized:true",
  "persisted:true","kill_durable:true"])
   assert(!src.includes(bad),"UNAPPROVED_RISK_AUTHORITY "+bad);
});
