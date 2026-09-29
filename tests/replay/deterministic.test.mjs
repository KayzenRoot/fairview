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
 captured_at_utc:"2026-09-15T12:00:00."+String(n).padStart(3,"0")+"Z",type,attempt_id:"mock-attempt-1",
 quantity_units:null,execution_id:null,receipt:null,...p});
const receipt=(p={})=>({source_class:"SYNTHETIC_FIXTURE",complete:true,
 account_id:scope.account_id,venue_id:scope.venue_id,
 instrument_contract_id:scope.instrument_contract_id,cursor:"fictional-cursor",
 reported_filled_units:"0",order_status:"OPEN",...p});
const action=(e,p={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 event:e,fresh_risk_request:e.type==="MAY_HAVE_SENT"?risk():null,
 mock_now_utc:new Date(Date.parse(e.captured_at_utc)+1).toISOString(),mock_queue_free_slots:1,...p});
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



import {hashSyntheticReplayEvents,runSyntheticReplay} from "../../src/replay/deterministic.mjs";
const envelope=(index,kind,clock,payload,p={})=>({schema_version:0,
 source_class:"SYNTHETIC_FIXTURE",event_id:"replay-event-"+index,kind,
 insertion_index:index,clock,payload,...p});
const tick=(n)=>capture({
 local_receive_monotonic_ns:(10000000000000101n+BigInt(n)*100n).toString(),
 local_receive_wall_utc_ns:(1700000000000000100n+BigInt(n)*100n).toString()
});
const frames=()=>{
 const q=quote(),c=now();
 return [envelope(0,"QUOTE",q.capture,q),
  envelope(1,"EXECUTION_START",c,input({
   risk_request:risk({quote:q,now_capture:c,previous_quote:null})}))];
};
const step=(index,type,framesSoFar,p={})=>{
 const c=tick(index-1),q=framesSoFar.filter(x=>x.kind==="QUOTE").at(-1)?.payload??quote();
 const qs=framesSoFar.filter(x=>x.kind==="QUOTE");
 const previous=qs.length>1?qs.at(-2).payload:null;
 const ev=event(index-1,type,p.event??{});
 return envelope(index,"EXECUTION_EVENT",c,action(ev,{
  fresh_risk_request:type==="MAY_HAVE_SENT"?risk({
   quote:q,now_capture:c,previous_quote:previous}):null,...p.action}));
};
const withPresend=()=>{
 const x=frames();x.push(step(2,"MAY_HAVE_SENT",x));return x;
};
const withPartialUnknown=()=>{
 const x=withPresend();x.push(step(3,"FILL",x,{event:{
  quantity_units:"40",execution_id:"mock-fill-A"}}));
 x.push(step(4,"LOST_ACK",x));return x;
};
const manifest=(xs,p={})=>{
 const h=hashSyntheticReplayEvents(xs);
 assert.equal(h.status,"SYNTHETIC_DATASET_HASH_ONLY",JSON.stringify(h));
 return {schema_version:0,source_class:"SYNTHETIC_FIXTURE",
  scenario_id:"invented-scenario-1",dataset_sha256:h.dataset_sha256,
  engine_version:"fv-replay-001-v0",model_version:"mock-ledger-risk-execution-v0",
  seed:"42",sort_policy:"SAME_CAPTURE_DOMAIN_MONOTONIC_INSERTION_V0",
  data_use_scope:"SYNTHETIC_INTERNAL",...p};
};
const replay=(xs,p={})=>runSyntheticReplay({schema_version:0,
 source_class:"SYNTHETIC_FIXTURE",manifest:manifest(xs,p),events:xs});
const safe=x=>{noAuthority(x);
 assert.equal(x.real_market_performance_established,false);
 assert.equal(x.comparative_benchmark_supported,false);
 return x;};
const rejected=(x,reason)=>{assert.equal(x.status,"DENY",JSON.stringify(x));
 if(reason)assert.equal(x.reason_code,reason,JSON.stringify(x));
 safe(x);assert.equal(x.output_canonical_event_hash,undefined);return x;};

test("one invented quote and owned local mock Risk+Ledger produce a canonical no-order replay",()=>{
 const r=safe(replay(frames()));
 assert.equal(r.status,"SYNTHETIC_REPLAY_COMPLETE");
 assert.equal(r.event_count,2);assert.equal(r.trace[0].kind,"QUOTE");
 assert.equal(r.trace[1].kind,"EXECUTION_START");
 assert.equal(r.trace[1].reason_code,"FICTIONAL_RISK_LEDGER_PREPARED_NO_ORDER");
 assert.equal(r.mock_execution_phase,"INTENT_DURABLE");
 assert.equal(r.mock_reconciliation_required,false);
 assert.match(r.dataset_sha256,/^[0-9a-f]{64}$/);
 assert.match(r.output_canonical_event_hash,/^[0-9a-f]{64}$/);
 assert(Object.isFrozen(r.trace));assert(Object.isFrozen(r.trace[1]));
 assert.equal(r.profit_minor,undefined);
});
test("identical fixture, seed, pinned model and canonical event input reproduce exact hash and output",()=>{
 const xs=withPresend(),a=safe(replay(xs)),b=safe(replay(structuredClone(xs)));
 assert.deepEqual(a,b);assert.equal(a.output_canonical_event_hash,b.output_canonical_event_hash);
 assert.equal(a.trace[2].ledger_phase,"MAY_HAVE_SENT");
 assert.equal(a.mock_reconciliation_required,true);
});
test("reordered object keys and input array permutation preserve persisted insertion-index replay",()=>{
 const xs=withPresend(),permuted=structuredClone(xs).reverse();
 const reversedKeys=permuted.map(x=>Object.fromEntries(Object.entries(x).reverse()));
 const a=safe(replay(xs)),b=safe(replay(reversedKeys));
 assert.equal(manifest(xs).dataset_sha256,manifest(reversedKeys).dataset_sha256);
 assert.equal(a.output_canonical_event_hash,b.output_canonical_event_hash);
 assert.deepEqual(a.trace,b.trace);
});
test("equal-time quote then preparation follows frozen insertion tie and never leaks future",()=>{
 const xs=frames(),first=xs[0];
 xs[1].clock=structuredClone(first.clock);
 xs[1].payload.risk_request.now_capture=structuredClone(first.clock);
 const r=safe(replay(xs));assert.equal(r.status,"SYNTHETIC_REPLAY_COMPLETE");
 const futureFirst=structuredClone(xs);
 futureFirst[0].insertion_index=1;futureFirst[1].insertion_index=0;
 rejected(replay(futureFirst),"FUTURE_QUOTE_LOOKAHEAD_FORBIDDEN");
});
test("poisoning a later quote does not alter earlier emitted mock decisions",()=>{
 const base=frames(),before=safe(replay(base)),plus=structuredClone(base);
 const next=tick(1);
 plus.push(envelope(2,"QUOTE",next,quote({quote_id:"invented-quote-2",
  provider_sequence:"11",full_snapshot:false,capture:next,ask:"99.0000",bid:"98.0000"})));
 const after=safe(replay(plus));
 assert.deepEqual(after.trace.slice(0,2),before.trace);
 assert.notEqual(after.dataset_sha256,before.dataset_sha256);
 assert.notEqual(after.output_canonical_event_hash,before.output_canonical_event_hash);
});
test("the first intentional quote after a later model event cannot be used by an earlier decision",()=>{
 const xs=frames();
 const future=tick(1),q=quote({quote_id:"invented-quote-2",provider_sequence:"11",
  full_snapshot:false,capture:future});
 xs[1].payload.risk_request.quote=q;
 xs[1].payload.risk_request.intent.quote_id=q.quote_id;
 xs.push(envelope(2,"QUOTE",future,q));
 rejected(replay(xs),"MODEL_USES_UNDELIVERED_QUOTE_OR_CLOCK");
});
test("actual imported model records fake presend and preserves hypothetical unknown units",()=>{
 const r=safe(replay(withPresend()));
 assert.equal(r.status,"SYNTHETIC_REPLAY_UNCERTAIN");
 assert.equal(r.event_count,3);
 assert.equal(r.trace[2].possible_unknown_fill_units,"100");
 assert.equal(r.mock_execution_phase,"MAY_HAVE_SENT");
 assert.equal(r.mock_reconciliation_required,true);
});
test("partial fill followed by lost ACK remains explicitly unknown, never zero loss or real broker fill",()=>{
 const r=safe(replay(withPartialUnknown()));
 assert.equal(r.status,"SYNTHETIC_REPLAY_UNCERTAIN");
 assert.equal(r.trace.at(-1).ledger_phase,"UNKNOWN_NEEDS_RECONCILIATION");
 assert.equal(r.trace[3].known_mock_filled_units,"40");
 assert.equal(r.trace[3].possible_unknown_fill_units,"60");
 assert.equal(r.mock_reconciliation_required,true);
});
test("repeating MAY_HAVE_SENT after lost ACK is rejected with no blind duplicate attempt",()=>{
 const xs=withPartialUnknown();
 xs.push(step(5,"MAY_HAVE_SENT",xs,{event:{attempt_id:"different-attempt"},
  action:{fresh_risk_request:risk({now_capture:tick(4)})}}));
 rejected(replay(xs),"MOCK_EXECUTION_EVENT_MOCK_ATTEMPT_ALREADY_RECORDED");
});
test("ACK and cancel request are not broker cancel confirmation; late fill remains exposed",()=>{
 const xs=withPresend();
 xs.push(step(3,"ACK",xs));xs.push(step(4,"CANCEL_REQUESTED",xs));
 xs.push(step(5,"FILL",xs,{event:{quantity_units:"40",execution_id:"mock-fill-A"}}));
 xs.push(step(6,"CANCEL_CONFIRMED",xs));
 const r=safe(replay(xs));
 assert.equal(r.status,"SYNTHETIC_REPLAY_UNCERTAIN");
 assert.equal(r.trace[5].known_mock_filled_units,"40");
 assert.equal(r.trace[5].possible_unknown_fill_units,"60");
 assert.equal(r.mock_execution_phase,"CANCELED_CONFIRMED");
});
test("an invented complete terminal cancel receipt may bound only FICTIONAL remaining units",()=>{
 const xs=withPresend();xs.push(step(3,"ACK",xs));
 xs.push(step(4,"CANCEL_REQUESTED",xs));
 xs.push(step(5,"FILL",xs,{event:{quantity_units:"40",execution_id:"mock-fill-A"}}));
 xs.push(step(6,"CANCEL_CONFIRMED",xs));
 xs.push(step(7,"RECONCILE",xs,{event:{receipt:receipt({
  reported_filled_units:"40",order_status:"CANCELED"})}}));
 const r=safe(replay(xs));assert.equal(r.status,"SYNTHETIC_REPLAY_COMPLETE");
 assert.equal(r.trace.at(-1).possible_unknown_fill_units,"0");
 assert.equal(r.authenticated_provider_evidence,false);
});
test("fake incomplete order history locks discrepancy and preserves no financial authorization",()=>{
 const xs=withPartialUnknown();
 xs.push(step(5,"RECONCILE",xs,{event:{receipt:receipt({
  complete:false,reported_filled_units:"40"})}}));
 const r=safe(replay(xs));assert.equal(r.status,"SYNTHETIC_REPLAY_LOCKED");
 assert.equal(r.trace.at(-1).ledger_phase,"DISCREPANCY_LOCKED");
 assert.equal(r.mock_reconciliation_required,true);
});
test("duplicate invented execution ID or quantity overfill locks, not synthetic success",()=>{
 const xs=withPresend();
 xs.push(step(3,"FILL",xs,{event:{quantity_units:"40",execution_id:"fill-1"}}));
 xs.push(step(4,"FILL",xs,{event:{quantity_units:"10",execution_id:"fill-1"}}));
 const a=safe(replay(xs));assert.equal(a.status,"SYNTHETIC_REPLAY_LOCKED");
 const over=structuredClone(xs);over[4].payload.event.execution_id="fill-2";
 over[4].payload.event.quantity_units="80";
 const b=safe(replay(over));assert.equal(b.status,"SYNTHETIC_REPLAY_LOCKED");
});
test("quotes-only replay with explicit unknown source event time never fabricates an event timestamp",()=>{
 const c=capture({source_event_utc_ns:null,source_event_uncertainty_ns:null,
  source_timestamp_semantics:"UNKNOWN"});
 const xs=[envelope(0,"QUOTE",c,quote({capture:c}))];
 const r=safe(replay(xs));assert.equal(r.status,"SYNTHETIC_REPLAY_COMPLETE");
 assert.equal(r.trace[0].source_time_status,"UNKNOWN");
 assert.equal(r.mock_execution_phase,null);
});
test("cannot use unknown source-event time to pass fresh mock Risk when required",()=>{
 const xs=frames(),c=capture({source_event_utc_ns:null,source_event_uncertainty_ns:null,
  source_timestamp_semantics:"UNKNOWN"}),q=quote({capture:c});
 xs[0].clock=c;xs[0].payload=q;
 xs[1].payload.risk_request.quote=q;
 rejected(replay(xs),"MOCK_RISK_QUOTE_QUALITY_SOURCE_TIME_UNVERIFIED");
});
test("unknown or inconsistent capture domains and receiver epoch NEVER share monotonic clock",()=>{
 const xs=frames();
 xs[1].clock=now({clock_domain_id:"another-domain"});
 xs[1].payload.risk_request.now_capture=xs[1].clock;
 rejected(replay(xs),"CLOCK_CROSS_DOMAIN");
 const restart=frames();restart[1].clock=now({receive_epoch_id:"new-boot"});
 restart[1].payload.risk_request.now_capture=restart[1].clock;
 rejected(replay(restart),"CLOCK_CROSS_DOMAIN");
});
test("backwards monotonic and backwards wall receipt intervals reject before any mock decision",()=>{
 const xs=frames();xs[1].clock=now({local_receive_monotonic_ns:"10000000000000000"});
 xs[1].payload.risk_request.now_capture=xs[1].clock;
 rejected(replay(xs),"CLOCK_BACKWARD_MONOTONIC");
 const wall=frames();wall[1].clock=now({local_receive_wall_utc_ns:"1699999999999999999"});
 wall[1].payload.risk_request.now_capture=wall[1].clock;
 rejected(replay(wall),"CLOCK_BACKWARD_WALL");
});
test("known disjoint backward source event chronology is rejected, without comparing cross-host monotonic",()=>{
 const xs=[frames()[0]],c=tick(1);
 c.source_event_utc_ns="1699999999999000000";
 xs.push(envelope(1,"QUOTE",c,quote({quote_id:"invented-quote-2",
  provider_sequence:"11",full_snapshot:false,capture:c})));
 rejected(replay(xs),"SOURCE_EVENT_TIME_INVERSION");
});
test("actual market sequence requires real initial invented full snapshot and exact increments",()=>{
 const xs=[frames()[0]];
 xs[0].payload.full_snapshot=false;
 rejected(replay(xs),"QUOTE_SEQUENCE_INITIAL_SNAPSHOT_REQUIRED");
 for(const seq of ["10","9","12"]){
  const d=frames(),c=tick(1);
  d.push(envelope(2,"QUOTE",c,quote({quote_id:"invented-quote-2",
   provider_sequence:seq,full_snapshot:false,capture:c})));
  const why=seq==="10"?"OUT_OF_ORDER_DUPLICATE":seq==="9"?"OUT_OF_ORDER_DUPLICATE":"SEQUENCE_GAP";
  rejected(replay(d),"QUOTE_SEQUENCE_"+why);
 }
});
test("indicative, throttled and missing invented depth or fee cannot manufacture an executable Risk pass",()=>{
 for(const change of [{quote_kind:"INDICATIVE"},{delivery:"THROTTLED"},
  {bid_size:null},{book_depth_level:null},{synthetic_fee_known:false}]){
  const xs=frames(),q=quote(change);xs[0].payload=q;
  xs[1].payload.risk_request.quote=q;
  rejected(replay(xs),"MOCK_RISK_QUOTE_QUALITY_"+({
   INDICATIVE:"VENUE_QUOTE_NOT_EXECUTABLE",THROTTLED:"SAMPLED_THROTTLED_OR_UNKNOWN"
  }[change.quote_kind??change.delivery]??(
   change.bid_size===null?"EXECUTABLE_SIZE_UNKNOWN":
   change.book_depth_level===null?"BOOK_DEPTH_INSUFFICIENT":
   "FEE_MODEL_UNKNOWN")));
 }
});
test("real vendor quote or missing synthetic data rights cannot enter Replay",()=>{
 for(const change of [{source_class:"REAL_VENDOR"},{data_use_scope:"OTHER"}]){
  const xs=[frames()[0]];xs[0].payload=quote(change);
  rejected(replay(xs),change.source_class?"QUOTE_TRUSTED_PROVIDER_NOT_IMPLEMENTED":"QUOTE_RIGHTS_UNVERIFIED");
 }
});
test("missing synthetic kill, unknown mock balance or engaged kill rejects at accepted Risk",()=>{
 for(const [bad,why] of [[{kill:null},"UNKNOWN_KILL_STATE"],
  [{kill:kill({engaged:true})},"KILL_ENGAGED"],
  [{portfolio:null},"MISSING_PORTFOLIO"]]){
  const xs=frames();xs[1].payload.risk_request=risk({...bad});
  rejected(replay(xs),"MOCK_RISK_"+why);
 }
});
test("stale invented quote cannot be replayed as fresh execution opportunity",()=>{
 const xs=frames();xs[1].clock=tick(100);
 xs[1].payload.risk_request.now_capture=xs[1].clock;
 rejected(replay(xs),"MOCK_RISK_QUOTE_QUALITY_STALE_FEED");
});
test("fake presend must recheck fresh current quote and reject stale/engaged kill and queue saturation",()=>{
 const xs=withPresend();
 xs[2].payload.fresh_risk_request=risk({
  quote:xs[0].payload,now_capture:xs[2].clock,kill:kill({engaged:true})});
 rejected(replay(xs),"MOCK_EXECUTION_EVENT_FRESH_MOCK_RISK_KILL_ENGAGED");
 const full=withPresend();full[2].payload.mock_queue_free_slots=0;
 rejected(replay(full),"MOCK_EXECUTION_EVENT_MOCK_QUEUE_BACKPRESSURE");
 const stale=withPresend();stale[2].clock=tick(100);
 stale[2].payload.fresh_risk_request=risk({now_capture:stale[2].clock});
 rejected(replay(stale),"MOCK_EXECUTION_EVENT_FRESH_MOCK_RISK_QUOTE_QUALITY_STALE_FEED");
});
test("cannot inject any caller-owned state or extra risk verdict through replay event contract",()=>{
 const xs=withPresend();
 xs[2].payload.state={execution_authorized:true};
 rejected(replay(xs),"MOCK_EXECUTION_EVENT_INVALID_ACTION");
 const forged=frames();forged[1].payload.risk_verdict={status:"ADMIT"};
 rejected(replay(forged),"MOCK_EXECUTION_INVALID_CREATION_REQUEST");
});
test("untrusted or future mock lifecycle before actual accepted creation always fails closed",()=>{
 const xs=[frames()[0]];
 xs.push(envelope(1,"EXECUTION_EVENT",now(),action(event(1,"ACK"))));
 rejected(replay(xs),"EXECUTION_EVENT_BEFORE_OWNED_PREPARATION");
 const future=frames();const tmp=future[0].insertion_index;
 future[0].insertion_index=future[1].insertion_index;future[1].insertion_index=tmp;
 rejected(replay(future),"FUTURE_QUOTE_LOOKAHEAD_FORBIDDEN");
});
test("manifest requires pinned exact dataset hash, model, sort, seed and fictional rights",()=>{
 const xs=frames(),m=manifest(xs);
 for(const patch of [{dataset_sha256:""},{engine_version:"unversioned"},
  {model_version:"future"},{sort_policy:"arrival-random"},{seed:"-1"},
  {data_use_scope:"LIVE"},{scenario_id:"*"}]){
  const r=runSyntheticReplay({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
   manifest:{...m,...patch},events:xs});
  rejected(r,"UNPINNED_OR_INVALID_MANIFEST");
 }
 const changed=structuredClone(xs);changed[0].payload.ask="9.9900";
 rejected(runSyntheticReplay({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
  manifest:m,events:changed}),"DATASET_HASH_MISMATCH");
});
test("duplicate event ids, missing indices, unknown kinds and oversized fixture reject hash and run",()=>{
 const xs=frames();
 for(const mutate of [
  x=>{x[1].event_id=x[0].event_id;},
  x=>{x[1].insertion_index=0;},
  x=>{x[1].kind="REAL_TRADE";},
  x=>{x[1].source_class="REAL_VENDOR";},
  x=>{x[1].unrecognized=true;}
 ]){
  const copy=structuredClone(xs);mutate(copy);
  rejected(hashSyntheticReplayEvents(copy),"INVALID_SYNTHETIC_DATASET");
  rejected(runSyntheticReplay({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
   manifest:manifest(xs),events:copy}),"INVALID_SYNTHETIC_DATASET");
 }
 const many=Array.from({length:65},(_,i)=>envelope(i,"QUOTE",capture(),quote()));
 rejected(hashSyntheticReplayEvents(many),"INVALID_SYNTHETIC_DATASET");
});
test("hostile getter, cycle, undefined, NaN and prototype pollution are never hashed or replayed",()=>{
 const xs=frames(),g=structuredClone(xs);
 Object.defineProperty(g[0],"payload",{get(){throw Error("hostile");},enumerable:true});
 rejected(hashSyntheticReplayEvents(g),"INVALID_SYNTHETIC_DATASET");
 const cyclic=frames();cyclic[0].payload.self=cyclic[0].payload;
 rejected(hashSyntheticReplayEvents(cyclic),"INVALID_SYNTHETIC_DATASET");
 const undef=frames();undef[0].payload.ask=undefined;
 rejected(hashSyntheticReplayEvents(undef),"INVALID_SYNTHETIC_DATASET");
 const nan=frames();nan[0].payload.price_scale=NaN;
 rejected(hashSyntheticReplayEvents(nan),"INVALID_SYNTHETIC_DATASET");
 const proto=frames();Object.defineProperty(proto[0].payload,"__proto__",{
  value:{execution_authorized:true},enumerable:true});
 rejected(hashSyntheticReplayEvents(proto),"INVALID_SYNTHETIC_DATASET");
});
test("full synthetic input never becomes a broker order or permits p99, backtest ROI or competitor score",()=>{
 const r=safe(replay(withPartialUnknown()));
 for(const name of ["profit_minor","pnl_minor","p99_latency_ns",
  "real_broker_ack","authenticated_order_id","competitor_winner","risk_admission_id"])
  assert.equal(r[name],undefined);
 const source=fs.readFileSync(new URL("../../src/replay/deterministic.mjs",import.meta.url),"utf8");
 for(const s of ["Date.now(", "fetch(", "node:http","node:net","node:fs",
  "child_process", "execution_authorized:true", "network_performed:true",
  "persisted:true", "authenticated_provider_evidence:true", "real_market_performance_established:true"])
  assert(!source.includes(s),"NO_EXTERNAL_OPERATION_OR_FINANCIAL_CLAIM "+s);
 for(const module of ["../clock/time.mjs","../market-data/quote.mjs","../risk/evaluate.mjs",
  "../ledger/simulation.mjs","../execution/simulation.mjs"])
  assert(source.includes(module),"REPLAY_DIRECT_DEPENDENCY_NOT_REUSED "+module);
});
