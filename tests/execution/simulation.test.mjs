import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {createSyntheticExecution,advanceSyntheticExecution,summarizeSyntheticLegs}
 from "../../src/execution/simulation.mjs";
import {evaluateSyntheticRisk} from "../../src/risk/evaluate.mjs";
import {createSyntheticLedger} from "../../src/ledger/simulation.mjs";
const scope=Object.freeze({tenant_id:"invented-tenant",account_id:"synthetic_acct_01",
 venue_id:"fake-venue-A",instrument_contract_id:"FICTIONAL_EURUSD_SPOT",
 strategy_family:"SIMULATED_ONE_LEG"});
const policyScope=()=>({venue_id:scope.venue_id,legal_entity:"fictional_entity_01",
 jurisdiction:"ZZ_TEST_ONLY",account_ref:scope.account_id,account_kind:"SIMULATED",
 instrument_contract_id:scope.instrument_contract_id,strategy_family:scope.strategy_family,
 api_protocol:"SIMULATED_NO_NETWORK"});
const grant=(type,i)=>({type,ref:"fictional-grant-"+i,
 proof_sha256:String(i+1).padStart(64,"0"),reviewer_ref:"fictional-reviewer",
 scope:policyScope(),revoked:false,verified_at_utc:"2026-09-01T00:00:00.000Z",
 expires_at_utc:"2026-10-01T00:00:00.000Z",
 ...(type==="DATA_USE"?{data_scopes:["INTERNAL"],delivery:"TICK_COMPLETE"}:{})});
const policy=(p={})=>({schema_version:0,scope:policyScope(),mode:"DEMO",
 data_use:"INTERNAL",source_class:"SYNTHETIC_FIXTURE",
 now_utc:"2026-09-15T12:00:00.000Z",
 grants:["ACCOUNT_API","STRATEGY_PERMISSION","DATA_USE","OPERATOR_APPROVAL"].map(grant),...p});
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
 quantity_scale:2,book_depth_level:2,quote_kind:"EXECUTABLE",
 data_use_scope:"SYNTHETIC_INTERNAL",data_rights_ref:"invented-rights-1",
 delivery:"NORMAL",transport_kind:"REPLAY",source_sequence_epoch:"mock-seq-1",
 provider_sequence:"10",full_snapshot:true,synthetic_fee_known:true,
 capture:capture(),...p});
const quality=Object.freeze({max_receive_age_ns:"1000",
 max_local_clock_error_ns:"1000",min_depth_levels:1,require_source_event_time:true});
const now=(p={})=>capture({local_receive_monotonic_ns:"10000000000000101",
 local_receive_wall_utc_ns:"1700000000000000100",...p});
const portfolio=(p={})=>Object.freeze({schema_version:0,
 source_class:"SYNTHETIC_FIXTURE",scope:Object.freeze({...scope}),
 version:"p-v1",complete:true,unknown_effects:false,known_exposure_units:"100",
 unknown_possible_fill_units:"0",available_quote_minor:"100000",
 available_base_units:"10000",daily_loss_minor:"0",drawdown_minor:"0",
 recent_order_count:0,seen_intent_keys:Object.freeze([]),...p});
const limits=(p={})=>Object.freeze({schema_version:0,
 source_class:"SYNTHETIC_FIXTURE",scope:Object.freeze({...scope}),version:"l-v1",
 notional_scale:2,max_order_notional_minor:"1000",max_total_exposure_units:"1000",
 max_daily_loss_minor:"1000",max_drawdown_minor:"1000",max_orders_per_window:5,
 worst_case_cost_bps:100,...p});
const kill=(p={})=>Object.freeze({schema_version:0,
 source_class:"SYNTHETIC_FIXTURE",scope:Object.freeze({...scope}),epoch:"k-v1",
 state_known:true,engaged:false,mock_replayed_after_restart:true,...p});
const intent=(p={})=>({schema_version:0,intent_key:"invented-intent-1",
 scope:{...scope},side:"BUY",purpose:"OPEN",quantity_units:"100",
 limit_price:"1.2400",quote_id:"invented-quote-1",portfolio_version:"p-v1",
 limits_version:"l-v1",kill_epoch:"k-v1",...p});
const risk=(p={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 intent:intent(),policy_request:policy(),quote:quote(),quality_policy:quality,
 now_capture:now(),previous_quote:null,portfolio:portfolio(),limits:limits(),kill:kill(),...p});
const ledgerIntent=(p={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 tenant_id:scope.tenant_id,account_id:scope.account_id,venue_id:scope.venue_id,
 instrument_contract_id:scope.instrument_contract_id,intent_key:"invented-intent-1",
 side:"BUY",quantity_units:"100",created_at_utc:"2026-09-15T12:00:00.000Z",
 policy_request:policy(),...p});
const input=(p={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 leg_id:"mock-leg-A",risk_request:risk(),ledger_intent:ledgerIntent(),
 mock_queue_capacity:2,...p});
const event=(n,type,p={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 intent_key:"invented-intent-1",event_id:"mock-event-"+n,sequence:String(n),
 captured_at_utc:"2026-09-15T12:00:00.001Z",type,attempt_id:"mock-attempt-1",
 quantity_units:null,execution_id:null,receipt:null,...p});
const receipt=(p={})=>({source_class:"SYNTHETIC_FIXTURE",complete:true,
 account_id:scope.account_id,venue_id:scope.venue_id,
 instrument_contract_id:scope.instrument_contract_id,cursor:"fictional-cursor",
 reported_filled_units:"0",order_status:"OPEN",...p});
const action=(e,p={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 event:e,fresh_risk_request:e.type==="MAY_HAVE_SENT"?risk():null,
 mock_now_utc:"2026-09-15T12:00:00.002Z",mock_queue_free_slots:1,...p});
const noAuthority=x=>{assert.equal(x.fixture_only,true);
 assert.equal(x.execution_authorized,false);assert.equal(x.network_performed,false);
 assert.equal(x.persisted,false);assert.equal(x.authenticated_provider_evidence,false);
 assert.equal(x.kill_durable,false);assert.equal(x.financial_reconciliation_complete,false);
 assert(Object.isFrozen(x));return x;};
const created=(p={})=>{const r=createSyntheticExecution(input(p));
 assert.equal(r.status,"READY_MOCK_ONLY",JSON.stringify(r));noAuthority(r);noAuthority(r.state);
 assert.equal(r.state.ledger.blocked_new_exposure,true);
 assert.equal(r.state.ledger.persisted,false);return r.state;};
const apply=(s,e,p={})=>{const a=advanceSyntheticExecution(s,action(e,p));
 assert(["MOCK_ONLY","REQUIRES_RECONCILIATION","DISCREPANCY_LOCKED"].includes(a.status),
  JSON.stringify(a));noAuthority(a);noAuthority(a.state);noAuthority(a.leg);
 return a.state;};
const sent=(p={})=>apply(created(p),event(1,"MAY_HAVE_SENT"));
const deny=(r,code)=>{assert.equal(r.status,"DENY",JSON.stringify(r));
 if(code)assert.equal(r.reason_code,code,JSON.stringify(r));noAuthority(r);};

test("initial mock Risk and accepted Ledger are actually evaluated, never a real Risk ADMIT",()=>{
 const s=created();assert.equal(s.phase,"PREPARED_MOCK_ONLY");
 assert.equal(s.ledger.phase,"INTENT_DURABLE");assert.equal(s.ledger.events.length,0);
 assert.equal(s.initial_mock_risk.status,"SYNTHETIC_MODEL_PASS");
 assert.equal(s.initial_mock_risk.execution_authorized,false);
 assert.equal(s.scope.tenant_id,scope.tenant_id);assert(Object.isFrozen(s.scope));
 assert(Object.isFrozen(s.ledger.intent));assert(Object.isFrozen(s.ledger.events));
 const direct=evaluateSyntheticRisk(risk()),local=createSyntheticLedger(ledgerIntent());
 assert.equal(direct.status,s.initial_mock_risk.status);
 assert.equal(local.status,"CREATED");assert.deepEqual(local.ledger,s.ledger);
});
test("two independent executions with identical input are deterministic in process",()=>{
 assert.deepEqual(createSyntheticExecution(input()),createSyntheticExecution(input()));
 const s=created();const i=input();i.leg_id="tampered";i.ledger_intent.tenant_id="tampered";
 assert.equal(s.scope.tenant_id,scope.tenant_id);
 assert.equal(s.leg_id,"mock-leg-A");
});
test("fabricated pre-send requires independent fresh Risk and a bounded available mock queue",()=>{
 const s=sent();assert.equal(s.ledger.phase,"MAY_HAVE_SENT");
 assert.equal(s.ledger.attempt_id,"mock-attempt-1");
 assert.equal(s.ledger.events.length,1);
 assert.equal(s.initial_mock_risk.execution_authorized,false);
 const z=advanceSyntheticExecution(created(),action(event(1,"MAY_HAVE_SENT"),
  {mock_queue_free_slots:0}));
 deny(z,"MOCK_QUEUE_BACKPRESSURE");
});
test("ACK never clears simulated possible external effect or grants resend",()=>{
 const s=apply(sent(),event(2,"ACK"));
 assert.equal(s.ledger.phase,"ACKNOWLEDGED");
 const r=advanceSyntheticExecution(s,action(event(3,"MAY_HAVE_SENT",
  {attempt_id:"another-attempt"})));
 deny(r,"MOCK_ATTEMPT_ALREADY_RECORDED");
 const sum=summarizeSyntheticLegs([s,created({leg_id:"mock-leg-B",
  ledger_intent:ledgerIntent({intent_key:"second-intent"}),
  risk_request:risk({intent:intent({intent_key:"second-intent"})})})]);
 assert.equal(sum.status,"REQUIRES_RECONCILIATION");
 assert.equal(sum.legs[0].possible_unknown_fill_units,"100");
 assert.equal(sum.mock_hedge_permitted,false);noAuthority(sum);
});
test("partial fill keeps conservative full remaining hypothetical units",()=>{
 const s=apply(sent(),event(2,"FILL",{quantity_units:"40",execution_id:"invented-fill-1"}));
 assert.equal(s.ledger.phase,"PARTIALLY_FILLED");
 assert.equal(s.ledger.filled_units,"40");
 const other=created({leg_id:"mock-leg-B",risk_request:risk({
  intent:intent({intent_key:"invented-intent-2"})}),
  ledger_intent:ledgerIntent({intent_key:"invented-intent-2"})});
 const r=summarizeSyntheticLegs([s,other]);
 assert.equal(r.status,"REQUIRES_RECONCILIATION");
 assert.equal(r.legs[0].known_mock_filled_units,"40");
 assert.equal(r.legs[0].possible_unknown_fill_units,"60");
 assert.equal(r.legs[1].possible_unknown_fill_units,"0");
 noAuthority(r);
});
test("full fictional fill is counted but never authenticated provider proof",()=>{
 const s=apply(apply(sent(),event(2,"FILL",
  {quantity_units:"40",execution_id:"invented-fill-1"})),event(3,"FILL",
  {quantity_units:"60",execution_id:"invented-fill-2"}));
 assert.equal(s.ledger.phase,"FILLED");assert.equal(s.ledger.filled_units,"100");
 assert.equal(s.network_performed,false);assert.equal(s.persisted,false);
 deny(advanceSyntheticExecution(s,action(event(4,"MAY_HAVE_SENT",
  {attempt_id:"attempt-2"}))),"MOCK_ATTEMPT_ALREADY_RECORDED");
});
test("cancel request then cancel confirmed never clears possible remaining without fake reconciliation",()=>{
 let s=sent();s=apply(s,event(2,"ACK"));s=apply(s,event(3,"CANCEL_REQUESTED"));
 assert.equal(s.ledger.phase,"CANCEL_REQUESTED");
 s=apply(s,event(4,"FILL",{quantity_units:"40",execution_id:"invented-fill-1"}));
 assert.equal(s.ledger.filled_units,"40");
 s=apply(s,event(5,"CANCEL_CONFIRMED"));
 assert.equal(s.ledger.phase,"CANCELED_CONFIRMED");
 const pair=summarizeSyntheticLegs([s,created({leg_id:"mock-leg-B",
  risk_request:risk({intent:intent({intent_key:"invented-intent-2"})}),
  ledger_intent:ledgerIntent({intent_key:"invented-intent-2"})})]);
 assert.equal(pair.legs[0].possible_unknown_fill_units,"60");
 s=apply(s,event(6,"RECONCILE",{receipt:receipt({
  order_status:"CANCELED",reported_filled_units:"40"})}));
 assert.equal(s.ledger.phase,"CANCELED_CONFIRMED");
 assert.equal(s.authenticated_provider_evidence,false);
 const r=summarizeSyntheticLegs([s,created({leg_id:"mock-leg-B",
  risk_request:risk({intent:intent({intent_key:"invented-intent-2"})}),
  ledger_intent:ledgerIntent({intent_key:"invented-intent-2"})})]);
 assert.equal(r.legs[0].possible_unknown_fill_units,"0");noAuthority(r);
 deny(advanceSyntheticExecution(s,action(event(7,"MAY_HAVE_SENT",
  {attempt_id:"retry-after-fake-reconcile"}))),"MOCK_ATTEMPT_ALREADY_RECORDED");
});
test("lost ACK after partial fill, late ACK, and fake incomplete history never unlock",()=>{
 let s=sent();s=apply(s,event(2,"FILL",
  {quantity_units:"40",execution_id:"invented-fill-1"}));
 s=apply(s,event(3,"LOST_ACK"));s=apply(s,event(4,"ACK"));
 assert.equal(s.ledger.phase,"UNKNOWN_NEEDS_RECONCILIATION");
 assert.equal(s.ledger.unknown_external_effect,true);
 const fail=advanceSyntheticExecution(s,action(event(5,"RECONCILE",
  {receipt:receipt({complete:false,reported_filled_units:"40"})})));
 assert.equal(fail.status,"DISCREPANCY_LOCKED");noAuthority(fail);
 assert.equal(fail.state.ledger.phase,"DISCREPANCY_LOCKED");
 deny(advanceSyntheticExecution(fail.state,action(event(6,"MAY_HAVE_SENT",
  {attempt_id:"blind-retry"}))),"MOCK_ATTEMPT_ALREADY_RECORDED");
});
test("incomplete fake provider history and contradictory filled amounts discrepancy lock",()=>{
 const a=advanceSyntheticExecution(sent(),action(event(2,"RECONCILE",
  {receipt:receipt({complete:false})})));
 assert.equal(a.status,"DISCREPANCY_LOCKED");
 assert.equal(a.state.ledger.unknown_external_effect,true);noAuthority(a);
 const b=advanceSyntheticExecution(sent(),action(event(2,"RECONCILE",
  {receipt:receipt({order_status:"FILLED",reported_filled_units:"0"})})));
 assert.equal(b.status,"DISCREPANCY_LOCKED");noAuthority(b);
});
test("fake lost ACK then complete invented reconciliation does not authorize a fresh attempt",()=>{
 let s=sent();s=apply(s,event(2,"LOST_ACK"));
 s=apply(s,event(3,"RECONCILE",{receipt:receipt()}));
 assert.equal(s.ledger.phase,"ACKNOWLEDGED");
 assert.equal(s.ledger.unknown_external_effect,false);
 const pair=summarizeSyntheticLegs([s,created({leg_id:"mock-leg-B",
  risk_request:risk({intent:intent({intent_key:"invented-intent-2"})}),
  ledger_intent:ledgerIntent({intent_key:"invented-intent-2"})})]);
 assert.equal(pair.legs[0].possible_unknown_fill_units,"100");
 deny(advanceSyntheticExecution(s,action(event(4,"MAY_HAVE_SENT",
  {attempt_id:"retry-after-mock-open-receipt"}))),"MOCK_ATTEMPT_ALREADY_RECORDED");
});
test("mock crash/restart after possible pre-send is uncertain, NOT proof of persistence",()=>{
 const s=apply(sent(),event(2,"CRASH_RESTART"));
 assert.equal(s.ledger.phase,"UNKNOWN_NEEDS_RECONCILIATION");
 assert.equal(s.persisted,false);assert.equal(s.kill_durable,false);
 const r=summarizeSyntheticLegs([s,created({leg_id:"mock-leg-B",
  risk_request:risk({intent:intent({intent_key:"invented-intent-2"})}),
  ledger_intent:ledgerIntent({intent_key:"invented-intent-2"})})]);
 assert.equal(r.legs[0].possible_unknown_fill_units,"100");
});
test("Risk rejection at creation refuses stale feed, missing/engaged kill and missing balances",()=>{
 const stale=risk({now_capture:now({
  local_receive_monotonic_ns:"10000000000010000"})});
 deny(createSyntheticExecution(input({risk_request:stale})),
  "MOCK_RISK_QUOTE_QUALITY_STALE_FEED");
 deny(createSyntheticExecution(input({risk_request:risk({kill:kill({engaged:true})})})),
  "MOCK_RISK_KILL_ENGAGED");
 deny(createSyntheticExecution(input({risk_request:risk({kill:null})})),
  "MOCK_RISK_UNKNOWN_KILL_STATE");
 deny(createSyntheticExecution(input({risk_request:risk({portfolio:null})})),
  "MOCK_RISK_MISSING_PORTFOLIO");
});
test("fresh Risk is re-evaluated at pre-send; stale feed, kill, epoch and limits stop",()=>{
 const s=created();const e=event(1,"MAY_HAVE_SENT");
 deny(advanceSyntheticExecution(s,action(e,{fresh_risk_request:risk({
  now_capture:now({local_receive_monotonic_ns:"10000000000010000"})})})),
  "FRESH_MOCK_RISK_QUOTE_QUALITY_STALE_FEED");
 deny(advanceSyntheticExecution(s,action(e,{fresh_risk_request:risk({
  kill:kill({engaged:true})})})),"FRESH_MOCK_RISK_KILL_ENGAGED");
 deny(advanceSyntheticExecution(s,action(e,{fresh_risk_request:risk({
  kill:kill({mock_replayed_after_restart:false})})})),
  "FRESH_MOCK_RISK_UNKNOWN_KILL_STATE");
 deny(advanceSyntheticExecution(s,action(e,{fresh_risk_request:risk({
  limits:limits({max_order_notional_minor:"1"})})})),
  "FRESH_MOCK_RISK_ORDER_NOTIONAL_OR_COST_LIMIT");
});
test("different risk intent, quote generation or policy grants cannot be smuggled at presend",()=>{
 const s=created(),e=event(1,"MAY_HAVE_SENT");
 deny(advanceSyntheticExecution(s,action(e,{fresh_risk_request:risk({
  intent:intent({quantity_units:"99"})})})),
  "MOCK_RISK_SUBJECT_OR_POLICY_CHANGED");
 deny(advanceSyntheticExecution(s,action(e,{fresh_risk_request:risk({
  intent:intent({portfolio_version:"different"})})})),
  "MOCK_RISK_SUBJECT_OR_POLICY_CHANGED");
 const rr=risk();rr.policy_request.grants[0].revoked=true;
 deny(advanceSyntheticExecution(s,action(e,{fresh_risk_request:rr})),
  "MOCK_RISK_SUBJECT_OR_POLICY_CHANGED");
 deny(advanceSyntheticExecution(s,action(e,{fresh_risk_request:risk({
  intent:intent({quote_id:"q2"}),quote:quote({quote_id:"q2"})})})),
  "MOCK_RISK_SUBJECT_OR_POLICY_CHANGED");
});
test("policy expiration at simulated pre-send cannot reuse original positive fiction",()=>{
 const r=risk();r.policy_request.now_utc="2026-10-01T00:00:00.000Z";
 deny(advanceSyntheticExecution(created(),action(event(1,"MAY_HAVE_SENT"),
  {fresh_risk_request:r})),"FRESH_MOCK_RISK_POLICY_DENY");
});
test("creation binds risk and actual accepted Ledger identity, scope, side and policy",()=>{
 for(const patch of [{tenant_id:"OTHER"},{account_id:"OTHER"},
  {venue_id:"OTHER"},{instrument_contract_id:"OTHER"},
  {intent_key:"OTHER"},{side:"SELL"},{quantity_units:"99"}])
  deny(createSyntheticExecution(input({ledger_intent:ledgerIntent(patch)})),
   "INTENT_SCOPE_OR_QUANTITY_MISMATCH");
 const changed=ledgerIntent();changed.policy_request.grants[0].revoked=true;
 deny(createSyntheticExecution(input({ledger_intent:changed})),
  "POLICY_FACTS_MISMATCH");
 const wrongStrategy=ledgerIntent();wrongStrategy.policy_request.scope.strategy_family="OTHER";
 deny(createSyntheticExecution(input({ledger_intent:wrongStrategy})),
  "INTENT_SCOPE_OR_QUANTITY_MISMATCH");
});
test("real vendor creation and real vendor injected event always denied",()=>{
 deny(createSyntheticExecution(input({source_class:"REAL_VENDOR"})),"REAL_VENUE_NOT_IMPLEMENTED");
 deny(createSyntheticExecution(input({ledger_intent:ledgerIntent({source_class:"REAL_VENDOR"})})),
  "INTENT_SCOPE_OR_QUANTITY_MISMATCH");
 deny(advanceSyntheticExecution(sent(),action(event(2,"ACK"),
  {source_class:"REAL_VENDOR"})),"REAL_VENUE_NOT_IMPLEMENTED");
 deny(advanceSyntheticExecution(sent(),action(event(2,"ACK",
  {source_class:"REAL_VENDOR"}))),"MOCK_LEDGER_REAL_VENUE_NOT_SUPPORTED");
});
test("missing or malformed creation and queue requests fail closed",()=>{
 for(const x of [null,{},[],"request",Object.create(null)])
  deny(createSyntheticExecution(x),"INVALID_CREATION_REQUEST");
 deny(createSyntheticExecution({...input(),execution_authorized:true}),"INVALID_CREATION_REQUEST");
 for(const n of [0,-1,33,1.5,"2",null])
  deny(createSyntheticExecution(input({mock_queue_capacity:n})),"INVALID_MOCK_QUEUE");
 deny(advanceSyntheticExecution(created(),action(event(1,"MAY_HAVE_SENT"),
  {mock_queue_free_slots:3})),"INVALID_MOCK_QUEUE");
});
test("untrusted forged, cloned, JSON-deserialized or mutated Ledger state cannot dispatch",()=>{
 const s=created();
 for(const bad of [{...s},JSON.parse(JSON.stringify(s)),s.ledger,Object.freeze({...s}),
  null,undefined])
  deny(advanceSyntheticExecution(bad,action(event(1,"MAY_HAVE_SENT"))),
   "UNTRUSTED_EXECUTION_STATE");
 const owned=sent();assert(Object.isFrozen(owned.ledger));
 assert(Object.isFrozen(owned.ledger.events[0]));
});
test("duplicates, gaps, conflicting IDs and overfill are rejected or discrepancy locked",()=>{
 const s=sent();
 deny(advanceSyntheticExecution(s,action(event(1,"MAY_HAVE_SENT"))),
  "MOCK_ATTEMPT_ALREADY_RECORDED");
 deny(advanceSyntheticExecution(s,action(event(3,"ACK"))),
  "MOCK_LEDGER_EVENT_SEQUENCE_GAP");
 const conflict=advanceSyntheticExecution(s,action(event(1,"ACK")));
 assert.equal(conflict.status,"DISCREPANCY_LOCKED");noAuthority(conflict);
 let filled=apply(s,event(2,"FILL",{quantity_units:"40",execution_id:"fill-1"}));
 const dup=advanceSyntheticExecution(filled,action(event(3,"FILL",
  {quantity_units:"20",execution_id:"fill-1"})));
 assert.equal(dup.status,"DISCREPANCY_LOCKED");
 const over=advanceSyntheticExecution(filled,action(event(3,"FILL",
  {quantity_units:"80",execution_id:"fill-2"})));
 assert.equal(over.status,"DISCREPANCY_LOCKED");
});
test("event timestamp and invented clock order must be explicit, ordered and nonfuture",()=>{
 const s=sent();
 deny(advanceSyntheticExecution(s,action(event(2,"ACK",
  {captured_at_utc:"2026-09-15T12:00:00.000Z"}))),
  "STALE_OR_FUTURE_MOCK_EVENT_TIME");
 deny(advanceSyntheticExecution(s,action(event(2,"ACK",
  {captured_at_utc:"2026-09-15T12:00:00.003Z"}))),
  "STALE_OR_FUTURE_MOCK_EVENT_TIME");
 deny(advanceSyntheticExecution(s,action(event(2,"ACK"),
  {mock_now_utc:"2026-09-15T12:00:00.000Z"})),
  "STALE_OR_FUTURE_MOCK_EVENT_TIME");
 deny(advanceSyntheticExecution(s,action(event(2,"ACK"),
  {mock_now_utc:"tomorrow"})),"INVALID_MOCK_EVENT_TIME");
});
test("event sender cannot replace Risk on ACK, fill, cancel, fake reconcile or restart",()=>{
 const s=sent();
 for(const e of [event(2,"ACK"),event(2,"FILL",
  {quantity_units:"20",execution_id:"fill-1"}),event(2,"CANCEL_REQUESTED"),
  event(2,"LOST_ACK"),event(2,"CRASH_RESTART"),event(2,"RECONCILE",
   {receipt:receipt()})])
  deny(advanceSyntheticExecution(s,action(e,{fresh_risk_request:risk()})),
   "UNEXPECTED_RISK_OVERRIDE");
});
test("two-leg mock A partial and B unknown always blocks automatic hedge and cross-account netting",()=>{
 const a=apply(sent(),event(2,"FILL",{quantity_units:"40",execution_id:"fill-1"}));
 let b=created({leg_id:"mock-leg-B",
  risk_request:risk({intent:intent({intent_key:"invented-intent-2"})}),
  ledger_intent:ledgerIntent({intent_key:"invented-intent-2"})});
 b=apply(b,event(1,"MAY_HAVE_SENT",{intent_key:"invented-intent-2"}),{
  fresh_risk_request:risk({intent:intent({intent_key:"invented-intent-2"})})});
 b=apply(b,event(2,"LOST_ACK",{intent_key:"invented-intent-2"}));
 const z=summarizeSyntheticLegs([a,b]);
 assert.equal(z.status,"REQUIRES_RECONCILIATION");noAuthority(z);
 assert.equal(z.legs[0].known_mock_filled_units,"40");
 assert.equal(z.legs[0].possible_unknown_fill_units,"60");
 assert.equal(z.legs[1].possible_unknown_fill_units,"100");
 assert.equal(z.mock_hedge_permitted,false);
 assert.equal(z.cross_account_transfer_inferred,false);
 assert(Object.isFrozen(z.legs));assert(Object.isFrozen(z.legs[0]));
});
test("rejected separately attempted mock Recovery does not clear original fictional exposure",()=>{
 const original=apply(sent(),event(2,"FILL",
  {quantity_units:"40",execution_id:"fill-1"}));
 const fakeRecovery=risk({intent:intent({purpose:"RECOVERY",intent_key:"invented-intent-2"}),
  kill:kill({engaged:true})});
 deny(createSyntheticExecution(input({leg_id:"mock-leg-B",
  risk_request:fakeRecovery,ledger_intent:ledgerIntent({
   intent_key:"invented-intent-2"})})),"MOCK_RISK_KILL_ENGAGED");
 assert.equal(original.ledger.filled_units,"40");
 assert.equal(original.ledger.attempt_id,"mock-attempt-1");
});
test("cross-tenant legs, repeated leg identity and caller data never create an implicit net",()=>{
 const a=created();
 const clone=created();deny(summarizeSyntheticLegs([a,clone]),"INVALID_TWO_LEG_FIXTURE");
 deny(summarizeSyntheticLegs([a,a]),"INVALID_TWO_LEG_FIXTURE");
 deny(summarizeSyntheticLegs([a,{}]),"INVALID_TWO_LEG_FIXTURE");
 deny(summarizeSyntheticLegs([]),"INVALID_TWO_LEG_FIXTURE");
});
test("hostile accessors and throw-proxy deny safely, no side effect or caller exception",()=>{
 const i=input();Object.defineProperty(i,"risk_request",{get(){throw Error("hostile");}});
 deny(createSyntheticExecution(i),"INVALID_CREATION_REQUEST");
 deny(createSyntheticExecution(new Proxy(input(),{get(){throw Error("proxy");}})),
  "INVALID_CREATION_REQUEST");
 const a=action(event(1,"MAY_HAVE_SENT"));
 Object.defineProperty(a,"mock_now_utc",{get(){throw Error("getter");}});
 deny(advanceSyntheticExecution(created(),a),"INVALID_ACTION");
});
test("the implementation cannot perform network/host-clock/persistence or claim durability",()=>{
 const source=fs.readFileSync(new URL("../../src/execution/simulation.mjs",import.meta.url),"utf8");
 for(const forbidden of ["Date.now(", "process.hrtime(", "fetch(", "node:fs",
   "node:http","node:net","child_process","signTransaction","node:crypto",
   "execution_authorized:true","persisted:true","network_performed:true"])
  assert(!source.includes(forbidden),"FORBIDDEN_EXECUTION_OPERATION "+forbidden);
 assert(source.includes("../risk/evaluate.mjs"));
 assert(source.includes("../ledger/simulation.mjs"));
 assert.equal(typeof createSyntheticExecution,"function");
});
