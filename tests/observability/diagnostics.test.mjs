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



import {observeSyntheticScenario,createSyntheticTelemetryBuffer,appendSyntheticTelemetry,
 summarizeSyntheticTelemetry} from "../../src/observability/diagnostics.mjs";

const scenario=(p={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 execution_creation:input(),actions:[],...p});
const observed=(s=scenario())=>observeSyntheticScenario(s);
const assertSafe=x=>{
 assert.equal(x.fixture_only,true);assert.equal(x.execution_authorized,false);
 assert.equal(x.network_performed,false);assert.equal(x.persisted,false);
 assert.equal(x.authenticated_provider_evidence,false);assert.equal(x.kill_durable,false);
 assert.equal(x.financial_reconciliation_complete,false);
 assert.equal(x.real_latency_measured,false);assert.equal(x.alert_delivered,false);
 assert.equal(x.mandatory_audit_satisfied,false);
 assert(Object.isFrozen(x));return x;
};
const refused=(x,code)=>{assert.equal(x.status,"DENY",JSON.stringify(x));
 if(code)assert.equal(x.reason_code,code,JSON.stringify(x));assertSafe(x);};
const classified=(x,code,kind)=>{assert.equal(x.status,"OBSERVED_MOCK_DENIAL",JSON.stringify(x));
 assert.equal(x.reason_code,code);assert.equal(x.observation.diagnostic_class,kind);
 assertSafe(x);assertSafe(x.observation);};
const eventInput=(type,n,p={})=>action(event(n,type,p));

test("owned actual Risk, Clock, Market Data, Ledger and Execution produce a redacted mock diagnostic",()=>{
 const r=assertSafe(observed());
 assert.equal(r.status,"OBSERVED_MOCK_ONLY");
 assert.equal(r.reason_code,"REDACTED_FIXTURE_DIAGNOSTIC_ONLY");
 const o=assertSafe(r.observation);
 assert.equal(o.diagnostic_class,"HEALTHY");
 assert.equal(o.mode,"SYNTHETIC");
 assert.equal(o.stage,"IN_PROCESS_SYNTHETIC_DIAGNOSTIC_ONLY");
 assert.equal(o.synthetic_timing_scope,"SYNTHETIC");
 assert.equal(o.synthetic_elapsed_ns,"100");
 assert.equal(o.mock_event_count,0);
 assert.equal(o.mock_phase_family,"PREPARED_MOCK");
 assert.equal(o.mock_possible_unknown_effect,false);
 assert.equal(o.operational_pause_recommended,false);
 assert.equal(o.trace_id,undefined);assert.equal(o.account_id,undefined);
 assert.equal(o.p99_latency_ns,undefined);assert.equal(o.broker_venue_ack,undefined);
});
test("same exact invented scenario produces equivalent fixed low-cardinality diagnostics without host time",()=>{
 const a=observed(),b=observed();
 assert.deepEqual(a.observation,b.observation);
 assert.equal(a.observation.synthetic_elapsed_ns,b.observation.synthetic_elapsed_ns);
});
test("actual mock Execution presend marks hypothetical remaining units as uncertain, never a broker operation",()=>{
 const r=assertSafe(observed(scenario({actions:[eventInput("MAY_HAVE_SENT",1)]})));
 assert.equal(r.status,"OBSERVED_MOCK_UNCERTAIN");
 assert.equal(r.observation.diagnostic_class,"MOCK_UNCERTAIN");
 assert.equal(r.observation.mock_possible_unknown_effect,true);
 assert.equal(r.observation.mock_event_count,1);
 assert.equal(r.observation.operational_pause_recommended,true);
 assert.equal(r.observation.mock_phase_family,"IN_MEMORY_MOCK_EVENT");
 assertSafe(r.observation);
});
test("partial fake fill followed by lost ACK retains uncertainty and cannot become external evidence",()=>{
 const r=observed(scenario({actions:[
  eventInput("MAY_HAVE_SENT",1),
  eventInput("FILL",2,{quantity_units:"40",execution_id:"fill-only-mock"}),
  eventInput("LOST_ACK",3)]}));
 assertSafe(r);
 assert.equal(r.status,"OBSERVED_MOCK_UNCERTAIN");
 assert.equal(r.observation.diagnostic_class,"MOCK_UNCERTAIN");
 assert.equal(r.observation.mock_event_count,3);
 assert.equal(r.observation.mock_possible_unknown_effect,true);
 assert.equal(r.observation.account_id,undefined);
});
test("invented incomplete reconciliation is locked rather than silently reporting an actual fill",()=>{
 const r=observed(scenario({actions:[
  eventInput("MAY_HAVE_SENT",1),
  eventInput("LOST_ACK",2),
  eventInput("RECONCILE",3,{receipt:receipt({complete:false,order_status:"OPEN"})})]}));
 assert.equal(r.status,"OBSERVED_MOCK_UNCERTAIN");
 assert.equal(r.observation.diagnostic_class,"MOCK_DISCREPANCY_LOCKED");
 assert.equal(r.observation.operational_pause_recommended,true);
 assertSafe(r);
});
test("invented complete cancel receipt only removes MOCK uncertainty, never authenticates a broker",()=>{
 const r=observed(scenario({actions:[
  eventInput("MAY_HAVE_SENT",1),
  eventInput("CANCEL_REQUESTED",2),
  eventInput("CANCEL_CONFIRMED",3),
  eventInput("RECONCILE",4,{receipt:receipt({order_status:"CANCELED",reported_filled_units:"0"})})]}));
 assert.equal(r.status,"OBSERVED_MOCK_ONLY");
 assert.equal(r.observation.diagnostic_class,"HEALTHY");
 assertSafe(r);assertSafe(r.observation);
 assert.equal(r.observation.financial_reconciliation_complete,false);
});
test("attempting a second mock presend after unknown effect yields safe model-denied diagnostic",()=>{
 const s=scenario({actions:[eventInput("MAY_HAVE_SENT",1),
  eventInput("LOST_ACK",2),
  eventInput("MAY_HAVE_SENT",3,{attempt_id:"different-attempt"})]});
 const r=observed(s);classified(r,"MOCK_ACTION_REJECTED","MOCK_ACTION_DENIED");
 assert.equal(r.observation.mock_possible_unknown_effect,true);
 assert.equal(r.observation.operational_pause_recommended,true);
});
test("clock domain or receive epoch mismatch and backwards local times never report measurements",()=>{
 for(const change of [{clock_domain_id:"other-clock"},{receive_epoch_id:"new-boot"},
  {local_receive_monotonic_ns:"10000000000000000"},
  {local_receive_wall_utc_ns:"1699999999999999999"}]){
  const s=scenario();s.execution_creation.risk_request.now_capture=now(change);
  const r=observed(s);classified(r,"CLOCK_REJECTED","MOCK_CLOCK_DENIED");
  assert.equal(r.observation.synthetic_elapsed_ns,null);
  assert.equal(r.observation.real_latency_measured,false);
 }
});
test("unknown source time cannot masquerade as qualified mock quote",()=>{
 const s=scenario();
 const c=capture({source_event_utc_ns:null,source_event_uncertainty_ns:null,
  source_timestamp_semantics:"UNKNOWN"});
 s.execution_creation.risk_request.quote=quote({capture:c});
 classified(observed(s),"QUOTE_QUALITY_REJECTED","MOCK_QUALITY_DENIED");
});
test("unknown quote sequence, missing initial snapshot and out-of-order observations fail closed",()=>{
 for(const patch of [{provider_sequence:null},{full_snapshot:false}]){
  const s=scenario();s.execution_creation.risk_request.quote=quote(patch);
  classified(observed(s),"QUOTE_SEQUENCE_REJECTED","MOCK_QUOTE_DENIED");
 }
 const s=scenario();
 s.execution_creation.risk_request.previous_quote=quote({provider_sequence:"11"});
 classified(observed(s),"QUOTE_SEQUENCE_REJECTED","MOCK_QUOTE_DENIED");
});
test("forged real provider, unmatched clock instrument and crossed fake quote do not become telemetry authority",()=>{
 const a=scenario({source_class:"REAL_VENDOR"});refused(observed(a),"REAL_OBSERVABILITY_NOT_IMPLEMENTED");
 const b=scenario();b.execution_creation.risk_request.quote=quote({source_class:"REAL_VENDOR"});
 classified(observed(b),"QUOTE_REJECTED","MOCK_QUOTE_DENIED");
 const c=scenario();c.execution_creation.risk_request.quote=quote({bid:"2.0000",ask:"1.0000"});
 classified(observed(c),"QUOTE_REJECTED","MOCK_QUOTE_DENIED");
 const d=scenario();d.execution_creation.risk_request.now_capture=now({instrument_contract_id:"other-instrument"});
 classified(observed(d),"CLOCK_REJECTED","MOCK_CLOCK_DENIED");
});
test("indicative quote, throttling, missing depth and unknown fake fee reject mock quality",()=>{
 for(const patch of [{quote_kind:"INDICATIVE"},{delivery:"THROTTLED"},
  {bid_size:null},{book_depth_level:null},{synthetic_fee_known:false}]){
  const s=scenario();s.execution_creation.risk_request.quote=quote(patch);
  classified(observed(s),"QUOTE_QUALITY_REJECTED","MOCK_QUALITY_DENIED");
 }
});
test("actual Risk denies engaged kill, untrusted portfolio and insufficient invented depth",()=>{
 for(const patch of [{kill:kill({engaged:true})},{portfolio:null}]){
  const s=scenario();Object.assign(s.execution_creation.risk_request,patch);
  classified(observed(s),"MOCK_RISK_REJECTED","MOCK_RISK_DENIED");
 }
 const s=scenario();s.execution_creation.risk_request.intent=intent({quantity_units:"100000"});
 classified(observed(s),"MOCK_RISK_REJECTED","MOCK_RISK_DENIED");
});
test("actual Ledger denial is diagnostic only and no in-memory financial facts are exposed",()=>{
 const s=scenario();s.execution_creation.ledger_intent=ledgerIntent({created_at_utc:"NOT_A_DATE"});
 const r=observed(s);classified(r,"MOCK_LEDGER_REJECTED","MOCK_LEDGER_DENIED");
 assert(!JSON.stringify(r).includes(scope.account_id));
});
test("actual Execution invalid leg/queue and mismatched policy/quantity refuse to invent admission",()=>{
 const a=scenario();a.execution_creation.leg_id="*";
 classified(observed(a),"MOCK_EXECUTION_REJECTED","MOCK_EXECUTION_DENIED");
 const b=scenario();b.execution_creation.mock_queue_capacity=0;
 classified(observed(b),"MOCK_EXECUTION_REJECTED","MOCK_EXECUTION_DENIED");
 const c=scenario();c.execution_creation.ledger_intent=ledgerIntent({quantity_units:"99"});
 classified(observed(c),"MOCK_EXECUTION_REJECTED","MOCK_EXECUTION_DENIED");
});
test("bad event ordering, forged external receipt or illegal unknown event cannot mutate real mock state",()=>{
 const a=scenario({actions:[eventInput("ACK",1)]});
 classified(observed(a),"MOCK_ACTION_REJECTED","MOCK_ACTION_DENIED");
 const b=scenario({actions:[eventInput("MAY_HAVE_SENT",1),
  eventInput("FILL",3,{quantity_units:"1",execution_id:"fake-fill"})]});
 classified(observed(b),"MOCK_ACTION_REJECTED","MOCK_ACTION_DENIED");
 const c=scenario({actions:[eventInput("MAY_HAVE_SENT",1),
  eventInput("ACK",2,{source_class:"REAL_VENDOR"})]});
 classified(observed(c),"MOCK_ACTION_REJECTED","MOCK_ACTION_DENIED");
});
test("simulation is bounded to at most 16 future local steps, never infinite collector work",()=>{
 refused(observed(scenario({actions:Array.from({length:17},()=>eventInput("ACK",1))})),
  "INVALID_SYNTHETIC_SCENARIO");
});
test("public observation deliberately redacts every caller scope, price, grant and event identifier",()=>{
 const s=scenario({actions:[eventInput("MAY_HAVE_SENT",1),
  eventInput("LOST_ACK",2)]});
 const r=observed(s),text=JSON.stringify(r);
 for(const secret of [scope.account_id,scope.tenant_id,scope.venue_id,
  scope.instrument_contract_id,"invented-quote-1","invented-intent-1",
  "fictional-grant","mock-attempt-1","1.2300","1.2400"])
  assert(!text.includes(secret),"TELEMETRY_INFORMATION_LEAK "+secret);
 for(const forbidden of ["p50","p95","p99","roi","real_order","latency_ms"])
  assert(!Object.hasOwn(r.observation,forbidden));
});
test("strict schema, getters/cycles and attempts to alter readonly observation are denied",()=>{
 refused(observed({...scenario(),unbounded_label:scope.account_id}),"INVALID_DIAGNOSTIC_REQUEST");
 const hostile=scenario();Object.defineProperty(hostile,"execution_creation",{
  get(){throw Error("SENSITIVE_GETTER");},enumerable:true});
 refused(observed(hostile),"INVALID_DIAGNOSTIC_REQUEST");
 const cyclic=scenario();cyclic.execution_creation.risk_request.quote=cyclic;
 refused(observed(cyclic),"INVALID_DIAGNOSTIC_REQUEST");
 const obs=observed().observation;
 assert(Object.isFrozen(obs));
 assert.equal(obs.execution_authorized,false);
});
test("bounded collector stores only own redacted model outcomes, not caller-supplied records",()=>{
 const made=assertSafe(createSyntheticTelemetryBuffer({schema_version:0,
  source_class:"SYNTHETIC_FIXTURE",capacity:2}));
 assert.equal(made.status,"CREATED");assertSafe(made.state);
 const a=observed().observation;
 const injected=appendSyntheticTelemetry(made.state,{...a},{
  schema_version:0,source_class:"SYNTHETIC_FIXTURE",collector_state:"UP"});
 refused(injected,"UNTRUSTED_OBSERVATION");
 const accepted=appendSyntheticTelemetry(made.state,a,{
  schema_version:0,source_class:"SYNTHETIC_FIXTURE",collector_state:"UP"});
 assert.equal(accepted.status,"RECORDED_LOCAL_FIXTURE");
 const sum=assertSafe(summarizeSyntheticTelemetry(accepted.state));
 assert.equal(sum.observed_total,1);
 assert.equal(sum.retained_total,1);
 assert.equal(sum.dropped_total,0);
 assert.equal(sum.retained_class_counts.HEALTHY,1);
 assert(!JSON.stringify(sum).includes(scope.account_id));
});
test("clone of in-memory buffer or mutation of metric counts cannot claim authenticity",()=>{
 const x=createSyntheticTelemetryBuffer({schema_version:0,
  source_class:"SYNTHETIC_FIXTURE",capacity:1}).state;
 refused(summarizeSyntheticTelemetry({...x}),"UNTRUSTED_BUFFER");
 refused(summarizeSyntheticTelemetry({...x,observed_total:-1}),"UNTRUSTED_BUFFER");
 assert(Object.isFrozen(x)&&Object.isFrozen(x.records));
});
test("simulated exporter DOWN drops only optional diagnostic and records monitoring unavailability",()=>{
 const start=createSyntheticTelemetryBuffer({schema_version:0,
  source_class:"SYNTHETIC_FIXTURE",capacity:2}).state;
 const obs=observed().observation;
 const down=assertSafe(appendSyntheticTelemetry(start,obs,{
  schema_version:0,source_class:"SYNTHETIC_FIXTURE",collector_state:"DOWN"}));
 assert.equal(down.status,"SIMULATED_COLLECTOR_UNAVAILABLE");
 const s=assertSafe(summarizeSyntheticTelemetry(down.state));
 assert.equal(s.quality,"UNAVAILABLE");assert.equal(s.dropped_total,1);
 assert.equal(s.retained_total,0);assert.equal(s.operational_pause_recommended,true);
 assert.equal(s.mandatory_audit_satisfied,false);
 const up=appendSyntheticTelemetry(down.state,obs,{
  schema_version:0,source_class:"SYNTHETIC_FIXTURE",collector_state:"UP"});
 assert.equal(summarizeSyntheticTelemetry(up.state).quality,"DEGRADED");
});
test("simulated queue saturation never blocks or alters fake Risk, Ledger, broker state or old records",()=>{
 const made=createSyntheticTelemetryBuffer({schema_version:0,
  source_class:"SYNTHETIC_FIXTURE",capacity:1}).state;
 const a=observed().observation;
 const unknown=observed(scenario({actions:[eventInput("MAY_HAVE_SENT",1)]})).observation;
 const opts={schema_version:0,source_class:"SYNTHETIC_FIXTURE",collector_state:"UP"};
 const one=appendSyntheticTelemetry(made,a,opts);
 const two=appendSyntheticTelemetry(one.state,unknown,opts);
 assert.equal(two.status,"SIMULATED_BACKPRESSURE");
 const sum=summarizeSyntheticTelemetry(two.state);
 assertSafe(sum);
 assert.equal(sum.retained_total,1);
 assert.equal(sum.dropped_total,1);
 assert.equal(sum.retained_class_counts.HEALTHY,1);
 assert.equal(sum.retained_class_counts.MOCK_UNCERTAIN,0);
 assert.equal(sum.operational_pause_recommended,true);
 assert.equal(two.state.records[0],a);
});
test("foreign collector, malformed append and fake alert ACK cannot prove financial reconciliation",()=>{
 const made=createSyntheticTelemetryBuffer({schema_version:0,
  source_class:"SYNTHETIC_FIXTURE",capacity:1}).state;
 const obs=observed().observation;
 refused(appendSyntheticTelemetry(made,obs,{schema_version:0,
  source_class:"REAL_VENDOR",collector_state:"UP"}),"INVALID_COLLECTOR_FIXTURE");
 refused(appendSyntheticTelemetry(made,obs,{schema_version:0,
  source_class:"SYNTHETIC_FIXTURE",collector_state:"ACK"}),"INVALID_COLLECTOR_FIXTURE");
 refused(appendSyntheticTelemetry(made,obs,{schema_version:0,
  source_class:"SYNTHETIC_FIXTURE",collector_state:"UP",alert_acknowledged:true}),
  "INVALID_COLLECTOR_FIXTURE");
 refused(createSyntheticTelemetryBuffer({schema_version:0,
  source_class:"SYNTHETIC_FIXTURE",capacity:100}),"INVALID_BUFFER_REQUEST");
 refused(createSyntheticTelemetryBuffer({schema_version:0,
  source_class:"REAL_VENDOR",capacity:1}),"INVALID_BUFFER_REQUEST");
 assert.equal(made.financial_reconciliation_complete,false);
});
test("hard cap of 256 in-process records is finite and fail-closed without any network calls",()=>{
 let b=createSyntheticTelemetryBuffer({schema_version:0,
  source_class:"SYNTHETIC_FIXTURE",capacity:1}).state;
 const o=observed().observation,opts={schema_version:0,
  source_class:"SYNTHETIC_FIXTURE",collector_state:"UP"};
 for(let i=0;i<256;i++){
  const next=appendSyntheticTelemetry(b,o,opts);
  assert.notEqual(next.status,"DENY",JSON.stringify(next));
  b=next.state;
 }
 assert.equal(summarizeSyntheticTelemetry(b).observed_total,256);
 refused(appendSyntheticTelemetry(b,o,opts),"SIMULATED_SAMPLE_LIMIT");
});
test("no remote network, host-clock, transport or broad production claims exist in direct local diagnostic source",()=>{
 const src=fs.readFileSync(new URL("../../src/observability/diagnostics.mjs",import.meta.url),"utf8");
 for(const forbidden of ["fetch(","Date.now(","node:fs","node:net","node:http",
  "child_process", "execution_authorized:true","persisted:true","alert_delivered:true",
  "real_latency_measured:true","mandatory_audit_satisfied:true"])
  assert(!src.includes(forbidden),"NO_FORBIDDEN_DIAGNOSTIC_DEPENDENCY "+forbidden);
 for(const module of ["../clock/time.mjs","../market-data/quote.mjs",
  "../risk/evaluate.mjs","../ledger/simulation.mjs","../execution/simulation.mjs"])
  assert(src.includes(module),"OBSERVABILITY_GRAPH_DEPENDENCY_NOT_USED "+module);
});
