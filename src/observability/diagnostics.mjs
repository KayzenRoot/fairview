// FV-OBSERVABILITY-001: pure, bounded, REDACTED diagnostics on INVENTED fixtures ONLY.
// Never a synchronous exporter, audit source, broker receipt, kill or trading control.
import {normalizeSyntheticClockSample,elapsedWithinSyntheticDomain} from "../clock/time.mjs";
import {normalizeSyntheticQuote,assessSyntheticQuoteQuality,advanceSyntheticSequence}
 from "../market-data/quote.mjs";
import {evaluateSyntheticRisk} from "../risk/evaluate.mjs";
import {createSyntheticLedger} from "../ledger/simulation.mjs";
import {createSyntheticExecution,advanceSyntheticExecution} from "../execution/simulation.mjs";

const ownObservations=new WeakSet(),ownBuffers=new WeakSet();
const OBS_INPUT=["schema_version","source_class","execution_creation","actions"];
const BUFFER_INPUT=["schema_version","source_class","capacity"];
const APPEND_INPUT=["schema_version","source_class","collector_state"];
const CLASS=["HEALTHY","MOCK_RISK_DENIED","MOCK_LEDGER_DENIED","MOCK_EXECUTION_DENIED",
 "MOCK_CLOCK_DENIED","MOCK_QUOTE_DENIED","MOCK_QUALITY_DENIED","MOCK_ACTION_DENIED",
 "MOCK_UNCERTAIN","MOCK_DISCREPANCY_LOCKED"];
const PLAIN=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const exact=(x,fields)=>PLAIN(x)&&Object.keys(x).length===fields.length&&fields.every(k=>Object.hasOwn(x,k));
const isFixture=x=>PLAIN(x)&&x.schema_version===0&&x.source_class==="SYNTHETIC_FIXTURE";
const bounded=x=>Number.isSafeInteger(x)&&x>=1&&x<=32;
const flags=Object.freeze({fixture_only:true,execution_authorized:false,
 network_performed:false,persisted:false,authenticated_provider_evidence:false,
 kill_durable:false,financial_reconciliation_complete:false,
 real_latency_measured:false,alert_delivered:false,mandatory_audit_satisfied:false});
const outcome=(status,reason_code,data={})=>Object.freeze({schema_version:0,status,reason_code,
 ...data,...flags});
const deny=code=>outcome("DENY",code);
const mintedObservation=x=>{const v=Object.freeze({...x,...flags});
 ownObservations.add(v);return v;};
const mintedBuffer=x=>{const v=Object.freeze({...x,...flags});ownBuffers.add(v);return v;};
const validObservation=x=>PLAIN(x)&&ownObservations.has(x)&&Object.isFrozen(x)&&
 x.fixture_only===true&&x.execution_authorized===false&&x.persisted===false&&
 CLASS.includes(x.diagnostic_class)&&["SYNTHETIC","NONE"].includes(x.synthetic_timing_scope);
const validBuffer=x=>PLAIN(x)&&ownBuffers.has(x)&&Object.isFrozen(x)&&
 x.fixture_only===true&&x.network_performed===false&&x.persisted===false&&
 bounded(x.capacity)&&Number.isSafeInteger(x.observed_total)&&x.observed_total>=0&&
 Number.isSafeInteger(x.dropped_total)&&x.dropped_total>=0&&
 Array.isArray(x.records)&&Object.isFrozen(x.records)&&x.records.length<=x.capacity&&
 x.records.every(validObservation);
const diag=(kind,elapsed_ns=null,events=0,phase="NONE",unknown=false)=>mintedObservation({
 diagnostic_class:kind,stage:"IN_PROCESS_SYNTHETIC_DIAGNOSTIC_ONLY",
 mode:"SYNTHETIC",redaction_status:"FULLY_REDACTED",synthetic_timing_scope:
 elapsed_ns===null?"NONE":"SYNTHETIC",synthetic_elapsed_ns:elapsed_ns,
 mock_event_count:events,mock_phase_family:phase,mock_possible_unknown_effect:unknown,
 operational_pause_recommended:unknown||kind==="MOCK_CLOCK_DENIED"||
 kind==="MOCK_DISCREPANCY_LOCKED"
});
function observe(input){
 if(!exact(input,OBS_INPUT)||input.schema_version!==0||
  !["SYNTHETIC_FIXTURE","REAL_VENDOR"].includes(input.source_class))
  return deny("INVALID_DIAGNOSTIC_REQUEST");
 if(input.source_class!=="SYNTHETIC_FIXTURE")return deny("REAL_OBSERVABILITY_NOT_IMPLEMENTED");
 const create=input.execution_creation;
 if(!PLAIN(create)||!PLAIN(create.risk_request)||
  !Array.isArray(input.actions)||input.actions.length>16)
  return deny("INVALID_SYNTHETIC_SCENARIO");
 const rr=create.risk_request;
 if(!PLAIN(rr.quote))return deny("INVALID_SYNTHETIC_SCENARIO");
 const first=normalizeSyntheticClockSample(rr.quote.capture);
 const last=normalizeSyntheticClockSample(rr.now_capture);
 if(first.status!=="VALID"||last.status!=="VALID")
  return outcome("OBSERVED_MOCK_DENIAL","CLOCK_REJECTED",{
   observation:diag("MOCK_CLOCK_DENIED")});
 const elapsed=elapsedWithinSyntheticDomain(first.sample,last.sample);
 if(elapsed.status!=="ELAPSED"||
  first.sample.instrument_contract_id!==last.sample.instrument_contract_id)
  return outcome("OBSERVED_MOCK_DENIAL","CLOCK_REJECTED",{
   observation:diag("MOCK_CLOCK_DENIED")});
 const quote=normalizeSyntheticQuote(rr.quote);
 if(quote.status!=="VALID_SYNTHETIC"||
  quote.quote.instrument_contract_id!==first.sample.instrument_contract_id)
  return outcome("OBSERVED_MOCK_DENIAL","QUOTE_REJECTED",{
   observation:diag("MOCK_QUOTE_DENIED",elapsed.elapsed_ns)});
 const seq=advanceSyntheticSequence(rr.previous_quote,rr.quote);
 if(seq.status!=="CURRENT_SYNTHETIC")
  return outcome("OBSERVED_MOCK_DENIAL","QUOTE_SEQUENCE_REJECTED",{
   observation:diag("MOCK_QUOTE_DENIED",elapsed.elapsed_ns)});
 const quality=assessSyntheticQuoteQuality(rr.quote,rr.quality_policy,rr.now_capture);
 if(quality.status!=="SYNTHETIC_CANDIDATE_ONLY")
  return outcome("OBSERVED_MOCK_DENIAL","QUOTE_QUALITY_REJECTED",{
   observation:diag("MOCK_QUALITY_DENIED",elapsed.elapsed_ns)});
 const risk=evaluateSyntheticRisk(rr);
 if(risk.status!=="SYNTHETIC_MODEL_PASS"||risk.execution_authorized!==false||
  risk.persisted!==false||risk.kill_durable!==false)
  return outcome("OBSERVED_MOCK_DENIAL","MOCK_RISK_REJECTED",{
   observation:diag("MOCK_RISK_DENIED",elapsed.elapsed_ns)});
 const ledger=createSyntheticLedger(create.ledger_intent);
 if(ledger.status!=="CREATED"||ledger.persisted!==false||
  ledger.execution_authorized!==false)
  return outcome("OBSERVED_MOCK_DENIAL","MOCK_LEDGER_REJECTED",{
   observation:diag("MOCK_LEDGER_DENIED",elapsed.elapsed_ns)});
 const execution=createSyntheticExecution(create);
 if(execution.status!=="READY_MOCK_ONLY"||
  execution.network_performed!==false||execution.persisted!==false||
  execution.execution_authorized!==false)
  return outcome("OBSERVED_MOCK_DENIAL","MOCK_EXECUTION_REJECTED",{
   observation:diag("MOCK_EXECUTION_DENIED",elapsed.elapsed_ns)});
 let state=execution.state,step=null;
 for(const a of input.actions){
  step=advanceSyntheticExecution(state,a);
  if(!["MOCK_ONLY","REQUIRES_RECONCILIATION","DISCREPANCY_LOCKED"].includes(step.status)||
   step.execution_authorized!==false||step.persisted!==false||
   step.network_performed!==false)
    return outcome("OBSERVED_MOCK_DENIAL","MOCK_ACTION_REJECTED",{
     observation:diag("MOCK_ACTION_DENIED",elapsed.elapsed_ns,state.ledger.events.length,
      state.ledger.phase,Boolean(state.ledger.unknown_external_effect)||
       (state.ledger.attempt_id!==null&&!["FILLED","CANCELED_CONFIRMED","REJECTED"].includes(state.ledger.phase)))});
  state=step.state;
 }
 const unknown=step===null?false:
  step.status==="REQUIRES_RECONCILIATION"||step.status==="DISCREPANCY_LOCKED";
 const discrepancy=step?.status==="DISCREPANCY_LOCKED";
 return outcome(unknown?"OBSERVED_MOCK_UNCERTAIN":"OBSERVED_MOCK_ONLY",
  discrepancy?"MOCK_DISCREPANCY_NOT_REAL_BROKER_PROOF":
   unknown?"POSSIBLE_FICTIONAL_EFFECT_NEEDS_RECONCILIATION":
    "REDACTED_FIXTURE_DIAGNOSTIC_ONLY",{
    observation:diag(discrepancy?"MOCK_DISCREPANCY_LOCKED":
      unknown?"MOCK_UNCERTAIN":"HEALTHY",elapsed.elapsed_ns,
      state.ledger.events.length,
      state.ledger.attempt_id===null?"PREPARED_MOCK":"IN_MEMORY_MOCK_EVENT",
      unknown)
   });
}
/** Computes ONLY local synthetic, redacted model diagnostics using real accepted mock sources. */
export function observeSyntheticScenario(input){
 try{return observe(input);}catch{return deny("INVALID_DIAGNOSTIC_REQUEST");}
}
/** Optional tiny simulated collector: never called inside actual Risk/Ledger and never exports. */
export function createSyntheticTelemetryBuffer(input){
 try{
  if(!exact(input,BUFFER_INPUT)||!isFixture(input)||!bounded(input.capacity))
   return deny("INVALID_BUFFER_REQUEST");
  const state=mintedBuffer({capacity:input.capacity,records:Object.freeze([]),
   observed_total:0,dropped_total:0,quality:"HEALTHY",
   operational_pause_recommended:false});
  return outcome("CREATED","BOUNDED_IN_PROCESS_FIXTURE_ONLY",{state});
 }catch{return deny("INVALID_BUFFER_REQUEST");}
}
export function appendSyntheticTelemetry(state,observation,options){
 try{
  if(!validBuffer(state))return deny("UNTRUSTED_BUFFER");
  if(!validObservation(observation))return deny("UNTRUSTED_OBSERVATION");
  if(!exact(options,APPEND_INPUT)||!isFixture(options)||
   !["UP","DOWN"].includes(options.collector_state))return deny("INVALID_COLLECTOR_FIXTURE");
  if(state.observed_total>=256)return deny("SIMULATED_SAMPLE_LIMIT");
  const down=options.collector_state==="DOWN",full=state.records.length>=state.capacity;
  const dropped=down||full;
  const next=mintedBuffer({...state,
   observed_total:state.observed_total+1,
   dropped_total:state.dropped_total+(dropped?1:0),
   records:dropped?state.records:Object.freeze([...state.records,observation]),
   quality:down?"UNAVAILABLE":full||state.dropped_total>0?"DEGRADED":"HEALTHY",
   operational_pause_recommended:state.operational_pause_recommended||
    observation.operational_pause_recommended||down});
  return outcome(down?"SIMULATED_COLLECTOR_UNAVAILABLE":
   full?"SIMULATED_BACKPRESSURE":"RECORDED_LOCAL_FIXTURE",
   dropped?"DIAGNOSTIC_DROPPED_NO_FINANCIAL_STATE_CHANGED":
    "LOCAL_REDACTED_FIXTURE_ONLY",{state:next});
 }catch{return deny("INVALID_TELEMETRY_APPEND");}
}
/** Read-only low-cardinality summary. An alert ACK is never a financial evidence receipt. */
export function summarizeSyntheticTelemetry(state){
 try{
  if(!validBuffer(state))return deny("UNTRUSTED_BUFFER");
  const counts=Object.freeze(Object.fromEntries(CLASS.map(k=>[k,
   state.records.filter(x=>x.diagnostic_class===k).length])));
  return outcome("SYNTHETIC_TELEMETRY_SUMMARY","NO_REMOTE_OR_FINANCIAL_AUTHORITY",{
   observed_total:state.observed_total,retained_total:state.records.length,
   dropped_total:state.dropped_total,quality:state.quality,
   retained_class_counts:counts,
   operational_pause_recommended:state.operational_pause_recommended});
 }catch{return deny("INVALID_SUMMARY");}
}
