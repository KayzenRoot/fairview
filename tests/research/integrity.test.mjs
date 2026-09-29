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



import {runSyntheticResearch} from "../../src/research/integrity.mjs";
const quoteOnly=(p={})=>{
 const c=capture(),q=quote({capture:c,...p});
 return [envelope(0,"QUOTE",c,q)];
};
const caseOf=(xs=quoteOnly(),p={})=>({manifest:manifest(xs),events:xs,...p});
const request=(cases=[caseOf()],p={})=>({schema_version:0,
 source_class:"SYNTHETIC_FIXTURE",research_version:"fv-research-001-v0",
 quality_policy:quality,cases,...p});
const study=(cases=[caseOf()],p={})=>runSyntheticResearch(request(cases,p));
const authority=x=>{
 assert.equal(x.fixture_only,true);assert.equal(x.execution_authorized,false);
 assert.equal(x.network_performed,false);assert.equal(x.persisted,false);
 assert.equal(x.authenticated_provider_evidence,false);
 assert.equal(x.kill_durable,false);
 assert.equal(x.financial_reconciliation_complete,false);
 assert.equal(x.real_market_performance_established,false);
 assert.equal(x.comparative_benchmark_supported,false);
 assert.equal(x.real_latency_measured,false);
 assert(Object.isFrozen(x));return x;
};
const inconclusive=(r,why)=>{
 authority(r);
 assert.equal(r.status,"SYNTHETIC_RESEARCH_INCONCLUSIVE",JSON.stringify(r));
 assert.equal(r.inconclusive_case_count,1);
 assert.equal(r.case_receipts[0].diagnostic_class,"INCONCLUSIVE");
 if(why)assert.equal(r.case_receipts[0].reason_code,why,JSON.stringify(r));
 authority(r.case_receipts[0]);return r;
};
const denied=(r,why)=>{authority(r);assert.equal(r.status,"DENY",JSON.stringify(r));
 if(why)assert.equal(r.reason_code,why,JSON.stringify(r));
 assert.equal(r.case_receipts,undefined);return r;};

test("real accepted synthetic Market Data plus two actual pinned Replay runs yield only A/A integrity",()=>{
 const a=authority(study());
 assert.equal(a.status,"SYNTHETIC_RESEARCH_REPRODUCIBLE");
 assert.equal(a.case_count,1);assert.equal(a.actual_mock_replay_invocations,2);
 assert.equal(a.reproducible_case_count,1);assert.equal(a.inconclusive_case_count,0);
 assert.equal(a.synthetic_quote_count,1);
 assert.equal(a.case_receipts[0].diagnostic_class,"REPRODUCIBLE_INVENTED_ONLY");
 assert.equal(a.case_receipts[0].reason_code,"LOCAL_A_A_MODEL_HASH_ONLY");
 assert.equal(a.case_receipts[0].synthetic_quote_count,1);
 assert.match(a.case_receipts[0].invented_model_diagnostic_sha256,/^[a-f0-9]{64}$/);
 authority(a.case_receipts[0]);assert(Object.isFrozen(a.case_receipts));
 assert.equal(a.real_latency_measured,false);
});
test("same matching replay case reused produces identical model metadata hashes without hidden clock or random input",()=>{
 const first=study(),second=study();
 assert.deepEqual(first.case_receipts,second.case_receipts);
 assert.equal(first.research_version,"fv-research-001-v0");
 assert.equal(first.comparative_benchmark_supported,false);
});
test("canonical key insertion and case event input permutations preserving frozen index do not change case receipt",()=>{
 const c=caseOf(frames());
 const flipped=structuredClone(c),reverse=flipped.events.reverse();
 flipped.events=reverse.map(x=>Object.fromEntries(Object.entries(x).reverse()));
 const x=study([c]),y=study([flipped]);
 assert.equal(x.status,"SYNTHETIC_RESEARCH_REPRODUCIBLE");
 assert.equal(y.status,"SYNTHETIC_RESEARCH_REPRODUCIBLE");
 assert.deepEqual(x.case_receipts,y.case_receipts);
});
test("four identical invented A/A trial inputs are ALL counted with no selection of favorable trial",()=>{
 const c=caseOf();
 const r=study([c,structuredClone(c),structuredClone(c),structuredClone(c)]);
 assert.equal(r.case_count,4);assert.equal(r.reproducible_case_count,4);
 assert.equal(r.inconclusive_case_count,0);assert.equal(r.actual_mock_replay_invocations,8);
 assert.deepEqual(r.case_receipts.map(x=>x.case_index),[0,1,2,3]);
 assert.equal(r.champion,undefined);assert.equal(r.strategy_rank,undefined);
});
test("mixed valid and invalid fixture cases remain visibly counted in input order, never silently dropped",()=>{
 const c=caseOf(),bad=caseOf();bad.manifest.dataset_sha256="a".repeat(64);
 const r=study([c,bad,c]);
 authority(r);assert.equal(r.status,"SYNTHETIC_RESEARCH_INCONCLUSIVE");
 assert.equal(r.case_count,3);assert.equal(r.reproducible_case_count,2);
 assert.equal(r.inconclusive_case_count,1);
 assert.deepEqual(r.case_receipts.map(x=>x.diagnostic_class),
  ["REPRODUCIBLE_INVENTED_ONLY","INCONCLUSIVE","REPRODUCIBLE_INVENTED_ONLY"]);
 assert.equal(r.case_receipts[1].reason_code,"UNPINNED_OR_CHANGED_DATASET");
 assert.equal(r.actual_mock_replay_invocations,4);
});
test("manifest SHA mismatch is inconclusive and never gets a model receipt",()=>{
 const c=caseOf();c.manifest.dataset_sha256="f".repeat(64);
 const r=inconclusive(study([c]),"UNPINNED_OR_CHANGED_DATASET");
 assert.equal(r.actual_mock_replay_invocations,0);
 assert.equal(r.case_receipts[0].invented_model_diagnostic_sha256,null);
});
test("replay seed, model, engine, sort and rights drift all fail accepted replay without research auto-repair",()=>{
 for(const patch of [{seed:"-3"},{model_version:"not-the-accepted-model"},
  {engine_version:"unversioned"},{sort_policy:"unversioned"},
  {data_use_scope:"REAL_PROVIDER"}]){
  const c=caseOf();Object.assign(c.manifest,patch);
  const r=inconclusive(study([c]),"ACCEPTED_REPLAY_REJECTED");
  assert.equal(r.actual_mock_replay_invocations,2);
 }
});
test("real research mode and unknown versions are denied before evaluating any fixture",()=>{
 denied(study([caseOf()],{source_class:"REAL_VENDOR"}),"REAL_DATA_RESEARCH_NOT_IMPLEMENTED");
 denied(study([caseOf()],{research_version:"fv-research-experimental"}),"UNPINNED_RESEARCH_VERSION");
 denied(study([caseOf()],{unexpected_output_permission:true}),"INVALID_RESEARCH_REQUEST");
});
test("indicative, throttled and insufficient shared fake depth keep all cases inconclusive, not best-trial winners",()=>{
 for(const patch of [{quote_kind:"INDICATIVE"},{delivery:"THROTTLED"}]){
  const c=caseOf(quoteOnly(patch));
  const r=inconclusive(study([c]),"NONACTIONABLE_INVENTED_QUOTE");
  assert.equal(r.reproducible_case_count,0);assert.equal(r.inconclusive_case_count,1);
 }
 const c=caseOf();const strictDepth=inconclusive(study([c],{
  quality_policy:{...quality,min_depth_levels:3}}),"NONACTIONABLE_INVENTED_QUOTE");
 assert.equal(strictDepth.case_count,1);
});
test("unknown fake source-event timestamp never qualifies an observed executable market quote",()=>{
 const c=capture({source_event_utc_ns:null,source_event_uncertainty_ns:null,
  source_timestamp_semantics:"UNKNOWN"}),q=quote({capture:c});
 const r=inconclusive(study([caseOf([envelope(0,"QUOTE",c,q)])]),
  "NONACTIONABLE_INVENTED_QUOTE");
 assert.equal(r.actual_mock_replay_invocations,2);
});
test("missing depth, executable size or synthetic known fee prevents any performance inference",()=>{
 for(const patch of [{book_depth_level:null},{bid_size:null},
  {synthetic_fee_known:false}]){
  const c=caseOf(quoteOnly(patch));
  const r=inconclusive(study([c]),"NONACTIONABLE_INVENTED_QUOTE");
  assert.equal(r.case_receipts[0].invented_model_diagnostic_sha256,null);
 }
});
test("fake provider rights or real quoted source do not become licensed historical evidence",()=>{
 const c=caseOf(quoteOnly({source_class:"REAL_VENDOR"}));
 inconclusive(study([c]),"ACCEPTED_REPLAY_REJECTED");
 const illegal=caseOf();illegal.events[0].payload.data_use_scope="LICENSED_HISTORICAL_REPLAY";
 inconclusive(study([illegal]),"UNPINNED_OR_CHANGED_DATASET");
});
test("quote seq gap, duplicate ID and missing initial snapshot are never repaired by Research",()=>{
 for(const change of [
  x=>{x[0].payload.full_snapshot=false;},
  x=>{x[0].payload.provider_sequence=null;},
  x=>{x[0].payload.quote_id="*";}
 ]){
  const xs=quoteOnly();change(xs);
  const r=study([{manifest:manifest(quoteOnly()),events:xs}]);
  assert.equal(r.status,"SYNTHETIC_RESEARCH_INCONCLUSIVE");
 }
 const xs=frames(),c=tick(1);
 xs.push(envelope(2,"QUOTE",c,quote({capture:c,full_snapshot:false,
  quote_id:"new-quote-2",provider_sequence:"12"})));
 inconclusive(study([caseOf(xs)]),"ACCEPTED_REPLAY_REJECTED");
});
test("cross-domain fake clocks and known backward source-event inversion reject replay comparison",()=>{
 const c=caseOf(frames());
 c.events[1].clock.clock_domain_id="other-domain";
 c.events[1].payload.risk_request.now_capture.clock_domain_id="other-domain";
 // Dataset identity is computed on the intentionally bad captured events.
 c.manifest=manifest(c.events);
 inconclusive(study([c]),"ACCEPTED_REPLAY_REJECTED");
 const xs=[quoteOnly()[0]],later=tick(1);
 later.source_event_utc_ns="1699999999999000000";
 xs.push(envelope(1,"QUOTE",later,quote({capture:later,full_snapshot:false,
  quote_id:"new-quote-2",provider_sequence:"11"})));
 inconclusive(study([caseOf(xs)]),"ACCEPTED_REPLAY_REJECTED");
});
test("a strategy cannot access a quote delivered after its imaginary decision",()=>{
 const xs=frames(),future=tick(1),q=quote({capture:future,
  full_snapshot:false,quote_id:"new-quote-2",provider_sequence:"11"});
 xs[1].payload.risk_request.quote=q;
 xs[1].payload.risk_request.intent.quote_id=q.quote_id;
 xs.push(envelope(2,"QUOTE",future,q));
 inconclusive(study([caseOf(xs)]),"ACCEPTED_REPLAY_REJECTED");
});
test("a fabricated MAY_HAVE_SENT always stays inconclusive, never profitable or externally reconciled",()=>{
 const r=inconclusive(study([caseOf(withPresend())]),"UNKNOWN_INVENTED_REPLAY_EFFECT");
 assert.equal(r.case_receipts[0].invented_model_diagnostic_sha256,null);
});
test("fake partial FILL and LOST_ACK remain unknown even if earlier fixture seemed positive",()=>{
 const a=caseOf(),b=caseOf(withPartialUnknown()),r=study([a,b]);
 assert.equal(r.case_count,2);
 assert.equal(r.reproducible_case_count,1);
 assert.equal(r.inconclusive_case_count,1);
 assert.equal(r.case_receipts[1].reason_code,"UNKNOWN_INVENTED_REPLAY_EFFECT");
 assert.equal(r.case_receipts[1].invented_model_diagnostic_sha256,null);
 assert.equal(r.financial_reconciliation_complete,false);
});
test("fake cancel request and false alert cannot declare broker cancel or financial audit",()=>{
 const xs=withPresend();
 xs.push(step(3,"ACK",xs));xs.push(step(4,"CANCEL_REQUESTED",xs));
 const r=inconclusive(study([caseOf(xs)]),"UNKNOWN_INVENTED_REPLAY_EFFECT");
 assert.equal(r.case_receipts[0].invented_model_diagnostic_sha256,null);
 assert.equal(r.authenticated_provider_evidence,false);
});
test("malformed event kind, duplicate insertion index or no quote remains inconclusive",()=>{
 const x=quoteOnly();x[0].kind="REAL_TRADE";
 inconclusive(study([{manifest:manifest(quoteOnly()),events:x}]),"INVALID_INVENTED_DATASET");
 const y=frames();y[1].insertion_index=0;
 inconclusive(study([{manifest:manifest(quoteOnly()),events:y}]),"INVALID_INVENTED_DATASET");
 const z=[envelope(0,"EXECUTION_EVENT",capture(),action(event(1,"ACK")))];
 inconclusive(study([caseOf(z)]),"ACCEPTED_REPLAY_REJECTED");
});
test("one per-study quality policy prevents selectively relaxing limits in losing trials",()=>{
 const c=caseOf();
 denied(study([c],{quality_policy:{...quality,extra_privileged:true}}),
  "INVALID_SHARED_QUOTE_QUALITY_POLICY");
 denied(study([c],{quality_policy:{...quality,min_depth_levels:0}}),
  "INVALID_SHARED_QUOTE_QUALITY_POLICY");
 denied(study([c],{quality_policy:{...quality,max_receive_age_ns:"-1"}}),
  "INVALID_SHARED_QUOTE_QUALITY_POLICY");
});
test("no sample, five cases, 33 events in a case or total event budget >96 can enter the study",()=>{
 denied(study([]),"INVALID_RESEARCH_CASES");
 const base=caseOf();
 denied(study([base,base,base,base,base]),"INVALID_RESEARCH_CASES");
 const events=Array.from({length:33},(_,i)=>envelope(i,"QUOTE",capture(),quote()));
 inconclusive(study([{manifest:{},events}]),"INVALID_CASE_SHAPE");
 const bigger=Array.from({length:32},(_,i)=>envelope(i,"QUOTE",capture(),quote()));
 denied(study([caseOf(bigger),caseOf(bigger),caseOf(bigger),caseOf(bigger)]),
  "CASE_EVENT_BUDGET_EXCEEDED");
});
test("adversarial getter, cyclic payload, exotic prototype, NaN and forbidden proto key are DENY before mock engines",()=>{
 const x=request();Object.defineProperty(x,"cases",{enumerable:true,
  get(){throw Error("HOSTILE_GETTER_MUST_NEVER_RUN");}});
 denied(runSyntheticResearch(x),"HOSTILE_OR_OVERSIZED_RESEARCH_REQUEST");
 const cyclic=request();cyclic.cases[0].events[0].payload.cycle=cyclic;
 denied(runSyntheticResearch(cyclic),"HOSTILE_OR_OVERSIZED_RESEARCH_REQUEST");
 const exotic=request();exotic.cases[0].events[0].payload=Object.create({unsafe:true});
 denied(runSyntheticResearch(exotic),"HOSTILE_OR_OVERSIZED_RESEARCH_REQUEST");
 const bad=request();bad.cases[0].events[0].payload.price_scale=NaN;
 denied(runSyntheticResearch(bad),"HOSTILE_OR_OVERSIZED_RESEARCH_REQUEST");
 const proto=request();Object.defineProperty(proto.cases[0].events[0].payload,
  "__proto__",{value:{execution_authorized:true},enumerable:true});
 denied(runSyntheticResearch(proto),"HOSTILE_OR_OVERSIZED_RESEARCH_REQUEST");
});
test("public output cannot leak any invented price, account, instrument, order, legal grant or provider identifier",()=>{
 const r=authority(study([caseOf(withPresend())]));
 const s=JSON.stringify(r);
 for(const token of [scope.account_id,scope.tenant_id,scope.venue_id,
  scope.instrument_contract_id,"invented-quote-1","invented-intent-1",
  "fictional-grant-1","fake-provider-A","1.2300","1.2400","mock-attempt-1"]){
  assert(!s.includes(token),"RESEARCH_REDACTION_VIOLATION "+token);
 }
 for(const field of ["roi","profit_minor","pnl_minor","strategy_winner",
  "p50_latency_ns","p95_latency_ns","p99_latency_ns","broker_evidence",
  "historical_provider_verified","live_competitor_score"])
  assert.equal(r[field],undefined);
});
test("own source directly uses actual accepted Replay twice and Market Data, never installed trading/benchmark externals",()=>{
 const s=fs.readFileSync(new URL("../../src/research/integrity.mjs",import.meta.url),"utf8");
 for(const ref of ["../market-data/quote.mjs","../replay/deterministic.mjs",
  "hashSyntheticReplayEvents","runSyntheticReplay","normalizeSyntheticQuote",
  "assessSyntheticQuoteQuality"])assert(s.includes(ref),"ACTUAL_ACCEPTED_SOURCE_NOT_IMPORTED "+ref);
 for(const forbidden of ["Date.now(","fetch(","node:fs","node:net","node:http",
  "child_process","execution_authorized:true","persisted:true",
  "real_market_performance_established:true","comparative_benchmark_supported:true"])
  assert(!s.includes(forbidden),"UNAUTHORIZED_EXTERNAL_OR_FINANCIAL_CLAIM "+forbidden);
 const r=study();
 assert.equal(r.actual_mock_replay_invocations,2);
});
