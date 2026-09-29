// FV-REPLAY-001: bounded, deterministic, fixture-only replay. NO real data, benchmark or order route.
import {createHash} from "node:crypto";
import {normalizeSyntheticClockSample,elapsedWithinSyntheticDomain,compareSyntheticSourceEventOrder}
 from "../clock/time.mjs";
import {normalizeSyntheticQuote,advanceSyntheticSequence}
 from "../market-data/quote.mjs";
import {evaluateSyntheticRisk} from "../risk/evaluate.mjs";
import {createSyntheticLedger} from "../ledger/simulation.mjs";
import {createSyntheticExecution,advanceSyntheticExecution} from "../execution/simulation.mjs";

const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHA=/^[a-f0-9]{64}$/;
const U64=/^(?:0|[1-9][0-9]*)$/;
const MAX_U64=(1n<<64n)-1n;
const EVENTS=["schema_version","source_class","event_id","kind","insertion_index","clock","payload"];
const MANIFEST=["schema_version","source_class","scenario_id","dataset_sha256",
 "engine_version","model_version","seed","sort_policy","data_use_scope"];
const REQUEST=["schema_version","source_class","manifest","events"];
const KINDS=new Set(["QUOTE","EXECUTION_START","EXECUTION_EVENT"]);
const ENGINE="fv-replay-001-v0";
const MODEL="mock-ledger-risk-execution-v0";
const SORT="SAME_CAPTURE_DOMAIN_MONOTONIC_INSERTION_V0";
const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const exact=(x,fields)=>plain(x)&&Object.keys(x).length===fields.length&&fields.every(k=>Object.hasOwn(x,k));
const id=x=>typeof x==="string"&&ID.test(x)&&x!=="ALL"&&x!=="*";
const result=(status,reason_code,extra={})=>Object.freeze({
 schema_version:0,status,reason_code,...extra,fixture_only:true,execution_authorized:false,
 network_performed:false,persisted:false,authenticated_provider_evidence:false,
 kill_durable:false,financial_reconciliation_complete:false,
 real_market_performance_established:false,comparative_benchmark_supported:false
});
const deny=(reason,trace=[])=>result("DENY",reason,{trace:Object.freeze([...trace])});
const digest=s=>createHash("sha256").update(s,"utf8").digest("hex");
// Reject getters/proxies/cycles/special numeric values BEFORE a model sees the fixture.
function canonical(x,depth=0,ctx={nodes:0,seen:new Set()}){
 if(++ctx.nodes>12000||depth>26)throw Error("INVALID_CANONICAL_STRUCTURE");
 if(x===null||typeof x==="string"||typeof x==="boolean")return x;
 if(typeof x==="number"&&Number.isSafeInteger(x))return x;
 if(typeof x!=="object"||ctx.seen.has(x))throw Error("INVALID_CANONICAL_VALUE");
 ctx.seen.add(x);
 let out;
 if(Array.isArray(x)){
  if(x.length>128||Object.keys(x).length!==x.length)throw Error("INVALID_ARRAY");
  out=x.map((_,i)=>{
   const desc=Object.getOwnPropertyDescriptor(x,String(i));
   if(!desc||!Object.hasOwn(desc,"value"))throw Error("INVALID_ARRAY_ACCESSOR");
   return canonical(desc.value,depth+1,ctx);
  });
 }else{
  if(!plain(x)||Object.getOwnPropertySymbols(x).length)throw Error("INVALID_OBJECT");
  const d=Object.getOwnPropertyDescriptors(x),keys=Object.keys(d).sort();
  if(keys.some(k=>["__proto__","prototype","constructor"].includes(k)))throw Error("INVALID_OBJECT_KEY");
  out={};
  for(const k of keys){
   if(!Object.hasOwn(d[k],"value")||!d[k].enumerable)throw Error("INVALID_OBJECT_ACCESSOR");
   out[k]=canonical(d[k].value,depth+1,ctx);
  }
 }
 ctx.seen.delete(x);return out;
}
// Accepted Risk/Ledger require deeply frozen fixture views. Freeze only OUR
// recursively cloned canonical input, never caller-provided objects.
function freezeFixture(x){
 if(x!==null&&typeof x==="object"){
  for(const value of Object.values(x))freezeFixture(value);
  Object.freeze(x);
 }
 return x;
}
function normalizedEvents(raw){
 if(!Array.isArray(raw)||raw.length<1||raw.length>64)return null;
 const clean=canonical(raw);
 if(JSON.stringify(clean).length>131072)return null;
 const ids=new Set(),indices=new Set();
 for(const e of clean){
  if(!exact(e,EVENTS)||e.schema_version!==0||e.source_class!=="SYNTHETIC_FIXTURE"||
   !id(e.event_id)||!KINDS.has(e.kind)||!Number.isInteger(e.insertion_index)||
   e.insertion_index<0||e.insertion_index>=clean.length||
   ids.has(e.event_id)||indices.has(e.insertion_index))return null;
  ids.add(e.event_id);indices.add(e.insertion_index);
 }
 if(indices.size!==clean.length)return null;
 const sorted=clean.sort((a,b)=>a.insertion_index-b.insertion_index);
 const text=JSON.stringify(canonical(sorted));
 return {events:freezeFixture(sorted),dataset_sha256:digest(text)};
}
/** Dataset identity is a synthetic metadata digest, NOT a data licence or validated run. */
export function hashSyntheticReplayEvents(events){
 try{
  const d=normalizedEvents(events);
  return d?result("SYNTHETIC_DATASET_HASH_ONLY","CANONICAL_FIXTURE_IDENTITY_ONLY",
   {dataset_sha256:d.dataset_sha256,event_count:d.events.length}):
   deny("INVALID_SYNTHETIC_DATASET");
 }catch{return deny("INVALID_SYNTHETIC_DATASET");}
}
function validManifest(m){
 return exact(m,MANIFEST)&&m.schema_version===0&&m.source_class==="SYNTHETIC_FIXTURE"&&
  id(m.scenario_id)&&typeof m.dataset_sha256==="string"&&SHA.test(m.dataset_sha256)&&
  m.engine_version===ENGINE&&m.model_version===MODEL&&m.sort_policy===SORT&&
  m.data_use_scope==="SYNTHETIC_INTERNAL"&&typeof m.seed==="string"&&
  m.seed.length<=20&&U64.test(m.seed)&&BigInt(m.seed)<=MAX_U64;
}
function run(input){
 if(!exact(input,REQUEST)||input.schema_version!==0||
  !["SYNTHETIC_FIXTURE","REAL_VENDOR"].includes(input.source_class))
  return deny("INVALID_REPLAY_REQUEST");
 if(input.source_class!=="SYNTHETIC_FIXTURE")return deny("REAL_DATA_REPLAY_NOT_IMPLEMENTED");
 if(!validManifest(input.manifest))return deny("UNPINNED_OR_INVALID_MANIFEST");
 const d=normalizedEvents(input.events);
 if(!d)return deny("INVALID_SYNTHETIC_DATASET");
 if(input.manifest.dataset_sha256!==d.dataset_sha256)return deny("DATASET_HASH_MISMATCH");
 const trace=[],seen=new Set();
 let prevClock=null,domain=null,epoch=null,instrument=null;
 let lastQuote=null,priorQuote=null,execution=null,lastExecutionStatus=null;
 const fail=code=>deny(code,trace);
 for(const e of d.events){
  // This event is delivered before its payload can affect an accepted model decision.
  const c=normalizeSyntheticClockSample(e.clock);
  if(c.status!=="VALID")return fail("CLOCK_"+c.reason_code);
  const clock=c.sample;
  if(BigInt(clock.local_receive_monotonic_ns)<0n)return fail("NEGATIVE_VIRTUAL_TIME");
  if(prevClock!==null){
   const elapsed=elapsedWithinSyntheticDomain(prevClock,clock);
   if(elapsed.status!=="ELAPSED")return fail("CLOCK_"+elapsed.reason_code);
   if(clock.instrument_contract_id!==instrument)return fail("INSTRUMENT_CHANGED");
  }else{
   domain=clock.clock_domain_id;epoch=clock.receive_epoch_id;
   instrument=clock.instrument_contract_id;
  }
  if(clock.clock_domain_id!==domain||clock.receive_epoch_id!==epoch)
   return fail("CROSS_CAPTURE_DOMAIN");
  if(e.kind==="QUOTE"){
   const nq=normalizeSyntheticQuote(e.payload);
   if(nq.status!=="VALID_SYNTHETIC")return fail("QUOTE_"+nq.reason_code);
   const quote=nq.quote;
   if(quote.instrument_contract_id!==instrument||
    JSON.stringify(canonical(e.payload.capture))!==JSON.stringify(canonical(clock)))
    return fail("QUOTE_CAPTURE_OR_INSTRUMENT_MISMATCH");
   const seq=advanceSyntheticSequence(lastQuote,e.payload);
   if(seq.status!=="CURRENT_SYNTHETIC")return fail("QUOTE_SEQUENCE_"+seq.reason_code);
   let source_time="UNKNOWN";
   if(lastQuote!==null){
    const order=compareSyntheticSourceEventOrder(lastQuote.capture,clock);
    if(order.status==="AFTER")return fail("SOURCE_EVENT_TIME_INVERSION");
    if(order.status==="BEFORE"||order.status==="AMBIGUOUS")source_time=order.status;
   }else if(clock.source_event_utc_ns!==null&&clock.source_timestamp_semantics==="EVENT")
    source_time="ONE_SAMPLE_UNCORROBORATED";
   priorQuote=lastQuote;lastQuote=e.payload;
   trace.push(Object.freeze({event_id:e.event_id,kind:e.kind,insertion_index:e.insertion_index,
    virtual_receive_ns:clock.local_receive_monotonic_ns,quote_id:quote.quote_id,
    sequence:seq.sequence,source_time_status:source_time,reason_code:seq.reason_code}));
  }else if(e.kind==="EXECUTION_START"){
   if(execution!==null)return fail("SECOND_MOCK_EXECUTION_FORBIDDEN");
   if(lastQuote===null)return fail("FUTURE_QUOTE_LOOKAHEAD_FORBIDDEN");
   const p=e.payload,rr=p?.risk_request;
   if(!plain(p)||!plain(rr)||JSON.stringify(canonical(rr.quote))!==
    JSON.stringify(canonical(lastQuote))||
    JSON.stringify(canonical(rr.previous_quote))!==JSON.stringify(canonical(priorQuote))||
    JSON.stringify(canonical(rr.now_capture))!==JSON.stringify(canonical(clock)))
    return fail("MODEL_USES_UNDELIVERED_QUOTE_OR_CLOCK");
   const risk=evaluateSyntheticRisk(rr);
   if(risk.status!=="SYNTHETIC_MODEL_PASS"||risk.execution_authorized!==false)
    return fail("MOCK_RISK_"+risk.reason_code);
   const ledger=createSyntheticLedger(p.ledger_intent);
   if(ledger.status!=="CREATED"||ledger.persisted!==false||ledger.execution_authorized!==false)
    return fail("MOCK_LEDGER_"+ledger.reason_code);
   const x=createSyntheticExecution(p);
   if(x.status!=="READY_MOCK_ONLY"||x.execution_authorized!==false||x.persisted!==false||
    x.network_performed!==false)return fail("MOCK_EXECUTION_"+x.reason_code);
   execution=x.state;lastExecutionStatus="PREPARED_MOCK_ONLY";
   trace.push(Object.freeze({event_id:e.event_id,kind:e.kind,insertion_index:e.insertion_index,
    virtual_receive_ns:clock.local_receive_monotonic_ns,leg_id:execution.leg_id,
    reason_code:"FICTIONAL_RISK_LEDGER_PREPARED_NO_ORDER"}));
  }else{
   if(execution===null)return fail("EXECUTION_EVENT_BEFORE_OWNED_PREPARATION");
   const a=e.payload;
   if(!plain(a)||!plain(a.event))return fail("INVALID_EXECUTION_ACTION");
   if(a.event.type==="MAY_HAVE_SENT"){
    const rr=a.fresh_risk_request;
    if(!plain(rr)||lastQuote===null||
     JSON.stringify(canonical(rr.quote))!==JSON.stringify(canonical(lastQuote))||
     JSON.stringify(canonical(rr.previous_quote))!==JSON.stringify(canonical(priorQuote))||
     JSON.stringify(canonical(rr.now_capture))!==JSON.stringify(canonical(clock)))
     return fail("PRESEND_USES_UNDELIVERED_QUOTE_OR_CLOCK");
   }
   const step=advanceSyntheticExecution(execution,a);
   if(!["MOCK_ONLY","REQUIRES_RECONCILIATION","DISCREPANCY_LOCKED"].includes(step.status)||
    step.network_performed!==false||step.persisted!==false||
    step.execution_authorized!==false)return fail("MOCK_EXECUTION_EVENT_"+step.reason_code);
   execution=step.state;lastExecutionStatus=step.status;
   trace.push(Object.freeze({event_id:e.event_id,kind:e.kind,insertion_index:e.insertion_index,
    virtual_receive_ns:clock.local_receive_monotonic_ns,
    ledger_phase:step.leg.ledger_phase,known_mock_filled_units:step.leg.known_mock_filled_units,
    possible_unknown_fill_units:step.leg.possible_unknown_fill_units,
    reason_code:step.reason_code}));
  }
  prevClock=clock;seen.add(e.event_id);
 }
 const uncertain=lastExecutionStatus==="REQUIRES_RECONCILIATION"||
  lastExecutionStatus==="DISCREPANCY_LOCKED";
 const status=lastExecutionStatus==="DISCREPANCY_LOCKED"?"SYNTHETIC_REPLAY_LOCKED":
  uncertain?"SYNTHETIC_REPLAY_UNCERTAIN":"SYNTHETIC_REPLAY_COMPLETE";
 const frozenTrace=Object.freeze([...trace]);
 const modelDiagnostic={scenario_id:input.manifest.scenario_id,seed:input.manifest.seed,
  engine_version:ENGINE,model_version:MODEL,sort_policy:SORT,
  dataset_sha256:d.dataset_sha256,trace:frozenTrace,run_status:status};
 const canonical_output_sha256=digest(JSON.stringify(canonical(modelDiagnostic)));
 return result(status,uncertain?"FICTIONAL_UNKNOWN_NEVER_AUTOMATICALLY_RESOLVED":
  "INVENTED_REPLAY_ONLY_NOT_REAL_PERFORMANCE",{
  scenario_id:input.manifest.scenario_id,dataset_sha256:d.dataset_sha256,
  output_canonical_event_hash:canonical_output_sha256,event_count:frozenTrace.length,
  trace:frozenTrace,mock_reconciliation_required:uncertain,
  mock_execution_phase:execution?.ledger.phase??null});
}
/** No raw data, current feed, external clock, broker fill, server or network is accessed. */
export function runSyntheticReplay(input){
 try{return run(input);}catch{return deny("INVALID_REPLAY_INPUT");}
}
