import test from "node:test";
import assert from "node:assert/strict";
import {diagnoseSyntheticForexVenue} from "../../src/forex/diagnostic.mjs";
import {normalizeSyntheticClockSample} from "../../src/clock/time.mjs";
import {normalizeSyntheticQuote,assessSyntheticQuoteQuality} from "../../src/market-data/quote.mjs";
import {evaluateSyntheticRisk} from "../../src/risk/evaluate.mjs";
import {createSyntheticExecution} from "../../src/execution/simulation.mjs";

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
const quality=()=>Object.freeze({max_receive_age_ns:"1000",
 max_local_clock_error_ns:"1000",min_depth_levels:1,require_source_event_time:true});
const now=()=>capture({local_receive_monotonic_ns:"10000000000000101",
 local_receive_wall_utc_ns:"1700000000000000100"});
const portfolio=(p={})=>Object.freeze({schema_version:0,
 source_class:"SYNTHETIC_FIXTURE",scope:Object.freeze({...scope}),
 version:"p-v1",complete:true,unknown_effects:false,known_exposure_units:"100",
 unknown_possible_fill_units:"0",available_quote_minor:"100000",available_base_units:"10000",
 daily_loss_minor:"0",drawdown_minor:"0",recent_order_count:0,seen_intent_keys:Object.freeze([]),...p});
const limits=(p={})=>Object.freeze({schema_version:0,
 source_class:"SYNTHETIC_FIXTURE",scope:Object.freeze({...scope}),version:"l-v1",
 notional_scale:2,max_order_notional_minor:"1000",max_total_exposure_units:"1000",
 max_daily_loss_minor:"1000",max_drawdown_minor:"1000",max_orders_per_window:5,
 worst_case_cost_bps:100,...p});
const kill=(p={})=>Object.freeze({schema_version:0,
 source_class:"SYNTHETIC_FIXTURE",scope:Object.freeze({...scope}),epoch:"k-v1",
 state_known:true,engaged:false,mock_replayed_after_restart:true,...p});
const intent=()=>({schema_version:0,intent_key:"invented-intent-1",
 scope:{...scope},side:"BUY",purpose:"OPEN",quantity_units:"100",
 limit_price:"1.2400",quote_id:"invented-quote-1",portfolio_version:"p-v1",
 limits_version:"l-v1",kill_epoch:"k-v1"});
const risk=(q,qp,n)=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 intent:intent(),policy_request:policy(),quote:q,quality_policy:qp,
 now_capture:n,previous_quote:null,portfolio:portfolio(),limits:limits(),kill:kill()});
const ledgerIntent=(pp)=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 tenant_id:scope.tenant_id,account_id:scope.account_id,venue_id:scope.venue_id,
 instrument_contract_id:scope.instrument_contract_id,intent_key:"invented-intent-1",
 side:"BUY",quantity_units:"100",created_at_utc:"2026-09-15T12:00:00.000Z",
 policy_request:pp});
const fixture=()=>{
 const venue=quote(),qp=quality(),n=now(),rr=risk(venue,qp,n);
 return {schema_version:0,source_class:"SYNTHETIC_FIXTURE",
  mode:"SYNTHETIC_RESEARCH_ONLY",
  reference_quote:quote({quote_id:"invented-reference-1",
   provider_id:"fake-reference-B",feed_id:"fake-reference-stream",
   venue_id:null,quote_kind:"INDICATIVE",
   capture:capture({local_receive_monotonic_ns:"10000000000000000"})}),
  venue_quote:venue,risk_request:rr,ledger_intent:ledgerIntent(rr.policy_request),
  quality_policy:qp,now_capture:n,mock_queue_capacity:2};
};
const noAuthority=x=>{
 assert.equal(x.fixture_only,true);assert.equal(x.execution_authorized,false);
 assert.equal(x.network_performed,false);assert.equal(x.persisted,false);
 assert.equal(x.authenticated_provider_evidence,false);assert.equal(x.kill_durable,false);
 assert.equal(x.financial_reconciliation_complete,false);
 assert.equal(x.real_market_performance_established,false);
 assert.equal(x.session_authenticated,false);assert.equal(x.operator_command_available,false);
 assert(Object.isFrozen(x));return x;
};
const expectNotObservable=(f,reason=null)=>{
 const x=diagnoseSyntheticForexVenue(f);
 assert(["DENY","NON_ACTIONABLE"].includes(x.status),JSON.stringify(x));
 if(reason!==null)assert.equal(x.reason_code,reason,JSON.stringify(x));
 noAuthority(x);assert.equal("diagnostic" in x,false);return x;
};
test("actually invokes all four accepted fictional owners without a real provider",()=>{
 const f=fixture();
 assert.equal(normalizeSyntheticClockSample(f.now_capture).status,"VALID");
 assert.equal(normalizeSyntheticQuote(f.reference_quote).status,"VALID_SYNTHETIC");
 assert.equal(assessSyntheticQuoteQuality(f.venue_quote,f.quality_policy,f.now_capture).status,
  "SYNTHETIC_CANDIDATE_ONLY");
 assert.equal(evaluateSyntheticRisk(f.risk_request).status,"SYNTHETIC_MODEL_PASS");
 assert.equal(createSyntheticExecution({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
  leg_id:"forex-local-diagnostic",risk_request:f.risk_request,
  ledger_intent:f.ledger_intent,mock_queue_capacity:2}).status,"READY_MOCK_ONLY");
 const r=diagnoseSyntheticForexVenue(f);
 assert.equal(r.status,"OBSERVE_ONLY",JSON.stringify(r));noAuthority(r);noAuthority(r.diagnostic);
 assert.equal(r.diagnostic.order,"LOCAL_PREPARED_NOT_SENT");
 assert.equal(r.diagnostic.reference,"INVENTED_INDICATIVE_ONLY");
});
test("deterministic fixed-category output leaks no account, venue, instrument, quote or edge",()=>{
 const a=diagnoseSyntheticForexVenue(fixture()),b=diagnoseSyntheticForexVenue(fixture());
 assert.deepEqual(a,b);const s=JSON.stringify(a);
 for(const leak of [scope.tenant_id,scope.account_id,scope.venue_id,
  scope.instrument_contract_id,"1.2300","1.2400","fictional-grant",
  "quote_id","provider_id","best_price","profit","order_id"])
  assert(!s.includes(leak),"LEAK "+leak);
});
test("input stays unmodified and output nested diagnostic immutable",()=>{
 const f=fixture();const before=structuredClone(f);
 const x=diagnoseSyntheticForexVenue(f);
 assert.equal(x.status,"OBSERVE_ONLY",JSON.stringify(x));
 assert.deepEqual(f,before);noAuthority(x.diagnostic);
 assert.throws(()=>{x.diagnostic.order="SENT";},TypeError);
});
test("real top-level source is categorically denied",()=>{
 const f=fixture();f.source_class="REAL_VENDOR";expectNotObservable(f,"INVALID_FIXTURE_ENVELOPE");
});
test("real source nested reference is denied",()=>{
 const f=fixture();f.reference_quote.source_class="REAL_VENDOR";expectNotObservable(f);
});
test("real source nested venue is denied",()=>{
 const f=fixture();f.venue_quote.source_class="REAL_VENDOR";expectNotObservable(f);
});
test("real source nested risk and ledger denied",()=>{
 const f=fixture();f.risk_request.source_class="REAL_VENDOR";expectNotObservable(f,"REAL_SOURCE_NOT_IMPLEMENTED");
 const g=fixture();g.ledger_intent.source_class="REAL_VENDOR";expectNotObservable(g,"REAL_SOURCE_NOT_IMPLEMENTED");
});
test("fictional reference cannot be relabelled executable or attached to execution venue",()=>{
 const a=fixture();a.reference_quote.quote_kind="EXECUTABLE";
 expectNotObservable(a,"REFERENCE_VENUE_SEPARATION_FAILED");
 const b=fixture();b.reference_quote.venue_id=b.venue_quote.venue_id;
 expectNotObservable(b,"REFERENCE_VENUE_SEPARATION_FAILED");
});
test("same upstream fake provider or same fake stream is not independent",()=>{
 const a=fixture();a.reference_quote.provider_id=a.venue_quote.provider_id;
 expectNotObservable(a,"REFERENCE_VENUE_SEPARATION_FAILED");
 const b=fixture();b.reference_quote.feed_id=b.venue_quote.feed_id;
 expectNotObservable(b,"REFERENCE_VENUE_SEPARATION_FAILED");
});
test("mismatched synthetic instrument or wrong venue context has no observation",()=>{
 const a=fixture();a.reference_quote.instrument_contract_id="DIFFERENT_FICTIONAL_PAIR";
 expectNotObservable(a,"REFERENCE_VENUE_SEPARATION_FAILED");
 const b=fixture();b.risk_request.intent.scope.venue_id="different-fake-venue";
 expectNotObservable(b,"MIXED_MOCK_CONTEXT");
});
test("risk never trusts a swapped quote or foreign quality policy",()=>{
 const a=fixture();a.risk_request.quote=quote();
 expectNotObservable(a,"MIXED_MOCK_CONTEXT");
 const b=fixture();b.risk_request.quality_policy=quality();
 expectNotObservable(b,"MIXED_MOCK_CONTEXT");
});
test("clock same-domain equality, valid fixture and source event semantics are mandatory",()=>{
 const a=fixture();a.reference_quote.capture.clock_domain_id="fake-remote-domain";
 expectNotObservable(a,"FICTIONAL_CLOCK_UNVERIFIED");
 const b=fixture();b.reference_quote.capture.source_timestamp_semantics="UNKNOWN";
 b.reference_quote.capture.source_event_utc_ns=null;
 b.reference_quote.capture.source_event_uncertainty_ns=null;
 expectNotObservable(b,"FICTIONAL_CLOCK_UNVERIFIED");
 const c=fixture();c.reference_quote.capture.sync_state="UNSYNCHRONIZED";
 expectNotObservable(c,"FICTIONAL_CLOCK_UNVERIFIED");
});
test("stale and untrusted venue cannot become a false Forex signal",()=>{
 const a=fixture();a.now_capture.local_receive_monotonic_ns="10000000000010001";
 expectNotObservable(a,"VENUE_FIXTURE_NOT_COMPLETE");
 const b=fixture();b.venue_quote.delivery="THROTTLED";
 expectNotObservable(b,"VENUE_FIXTURE_NOT_COMPLETE");
 const c=fixture();c.venue_quote.synthetic_fee_known=false;
 expectNotObservable(c,"VENUE_FIXTURE_NOT_COMPLETE");
});
test("stale invented reference beyond identical local quality budget is NON_ACTIONABLE",()=>{
 const a=fixture();
 a.reference_quote.capture.local_receive_monotonic_ns="9999999999990000";
 expectNotObservable(a,"REFERENCE_TIME_BUDGET_NOT_MET");
});
test("invented reference receiving after local now is not a reliable research comparison",()=>{
 const a=fixture();
 a.reference_quote.capture.local_receive_monotonic_ns="10000000000000201";
 a.reference_quote.capture.local_receive_wall_utc_ns="1700000000000000200";
 expectNotObservable(a,"REFERENCE_TIME_BUDGET_NOT_MET");
});
test("indicative fake reference exceeding configured clock-error budget cannot be compared",()=>{
 const a=fixture();
 a.reference_quote.capture.estimated_clock_error_ns="1001";
 expectNotObservable(a,"REFERENCE_TIME_BUDGET_NOT_MET");
});
test("reference simulated licensing, completeness and delivery required",()=>{
 const a=fixture();a.reference_quote.data_use_scope="EXTERNAL";
 expectNotObservable(a,"REFERENCE_FIXTURE_NOT_COMPLETE");
 const b=fixture();b.reference_quote.full_snapshot=false;
 expectNotObservable(b,"REFERENCE_FIXTURE_NOT_COMPLETE");
 const c=fixture();c.reference_quote.delivery="SAMPLED";
 expectNotObservable(c,"REFERENCE_FIXTURE_NOT_COMPLETE");
});
test("nonexec venue or unknown fee, depth and size cannot be accepted",()=>{
 const a=fixture();a.venue_quote.quote_kind="INDICATIVE";
 expectNotObservable(a,"REFERENCE_VENUE_SEPARATION_FAILED");
 const b=fixture();b.venue_quote.book_depth_level=null;
 expectNotObservable(b,"VENUE_FIXTURE_NOT_COMPLETE");
 const c=fixture();c.venue_quote.ask_size=null;
 expectNotObservable(c,"VENUE_FIXTURE_NOT_COMPLETE");
});
test("fake independent kill engaged or unknown blocks the local diagnostic",()=>{
 const a=fixture();a.risk_request.kill=kill({engaged:true});
 expectNotObservable(a,"FAKE_RISK_NOT_PASSED");
 const b=fixture();b.risk_request.kill=kill({state_known:false});
 expectNotObservable(b,"FAKE_RISK_NOT_PASSED");
});
test("unknown possible fill and rejected mock Risk do not pass",()=>{
 const a=fixture();a.risk_request.portfolio=portfolio({unknown_effects:true});
 expectNotObservable(a,"FAKE_RISK_NOT_PASSED");
 const b=fixture();b.risk_request.limits=limits({max_order_notional_minor:"1"});
 expectNotObservable(b,"FAKE_RISK_NOT_PASSED");
});
test("duplicate or mismatched ledger intent never creates a preparable route",()=>{
 const a=fixture();a.ledger_intent.quantity_units="101";
 expectNotObservable(a,"FAKE_EXECUTION_NOT_PREPARED");
 const b=fixture();b.ledger_intent.intent_key="foreign-mock-intent";
 expectNotObservable(b,"FAKE_EXECUTION_NOT_PREPARED");
});
test("no queue for even local fake preparation",()=>{
 const f=fixture();f.mock_queue_capacity=0;expectNotObservable(f,"INVALID_MOCK_CONTEXT");
});
test("cross-scope fake ledger and strategy mismatch deny early",()=>{
 const a=fixture();a.ledger_intent.tenant_id="other-invented-tenant";
 expectNotObservable(a,"MIXED_MOCK_CONTEXT");
 const b=fixture();b.risk_request.intent.scope.strategy_family="SIMULATED_TWO_LEG";
 expectNotObservable(b,"MIXED_MOCK_CONTEXT");
});
test("forged user command or fake approved authority not part of exact input DTO",()=>{
 const a=fixture();a.operator_command="SEND_LIVE";
 expectNotObservable(a,"INVALID_FIXTURE_ENVELOPE");
 const b=fixture();b.mode="LIVE";expectNotObservable(b,"INVALID_FIXTURE_ENVELOPE");
});
test("no getter evaluation on hostile nested vendor fields",()=>{
 const f=fixture();let invoked=false;
 Object.defineProperty(f.reference_quote,"provider_id",{get(){invoked=true;throw Error("BAD");}});
 expectNotObservable(f,"UNSAFE_FIXTURE_GRAPH");
 assert.equal(invoked,false);
});
test("nested cycles and extra secret-bearing keys fail before calling mock modules",()=>{
 const a=fixture();a.reference_quote.capture.loop=a.reference_quote;
 expectNotObservable(a,"UNSAFE_FIXTURE_GRAPH");
 const b=fixture();Object.defineProperty(b.reference_quote,"__proto__",
  {value:{token:"fake-secret"},enumerable:true});
 expectNotObservable(b,"UNSAFE_FIXTURE_GRAPH");
});
test("sparse array and exotic fake object fail preflight",()=>{
 const a=fixture();a.risk_request.policy_request.grants=new Array(4);
 expectNotObservable(a,"UNSAFE_FIXTURE_GRAPH");
 const b=fixture();b.reference_quote=Object.assign(Object.create(null),b.reference_quote);
 expectNotObservable(b,"UNSAFE_FIXTURE_GRAPH");
});
test("oversized quote payload or nonfinite fake inputs are denied",()=>{
 const a=fixture();a.reference_quote.feed_id="x".repeat(513);
 expectNotObservable(a,"UNSAFE_FIXTURE_GRAPH");
 const b=fixture();b.mock_queue_capacity=Infinity;
 expectNotObservable(b,"UNSAFE_FIXTURE_GRAPH");
});
test("malformed null, array and wrong schema do not throw or grant",()=>{
 for(const value of [null,[],{},0,"fixture"]){const r=diagnoseSyntheticForexVenue(value);
  assert.equal(r.status,"DENY");noAuthority(r);}
 const f=fixture();f.schema_version=1;expectNotObservable(f,"INVALID_FIXTURE_ENVELOPE");
});
