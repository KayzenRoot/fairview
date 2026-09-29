// FV-FOREX-001: PURE invented reference-versus-venue DIAGNOSTIC ONLY.
// No provider connection, market edge calculation, trading signal or order authority.
import {normalizeSyntheticClockSample} from "../clock/time.mjs";
import {normalizeSyntheticQuote,assessSyntheticQuoteQuality} from "../market-data/quote.mjs";
import {evaluateSyntheticRisk} from "../risk/evaluate.mjs";
import {createSyntheticExecution} from "../execution/simulation.mjs";

const TOP=Object.freeze(["schema_version","source_class","mode","reference_quote",
 "venue_quote","risk_request","ledger_intent","quality_policy","now_capture","mock_queue_capacity"]);
const SCOPE=Object.freeze(["tenant_id","account_id","venue_id","instrument_contract_id","strategy_family"]);
const FLAGS=Object.freeze({
 fixture_only:true,execution_authorized:false,network_performed:false,persisted:false,
 authenticated_provider_evidence:false,real_balance_verified:false,kill_durable:false,
 financial_reconciliation_complete:false,real_market_performance_established:false,
 comparative_benchmark_supported:false,real_latency_measured:false,
 real_alert_delivered:false,mandatory_audit_satisfied:false,
 model_inference_performed:false,human_review_complete:false,
 session_authenticated:false,server_authorization_performed:false,
 operator_command_available:false,real_venue_proven:false,
 data_export_authorized:false
});
const fail=(status,reason_code)=>Object.freeze({schema_version:0,status,reason_code,...FLAGS});
const deny=code=>fail("DENY",code);
const nonaction=code=>fail("NON_ACTIONABLE",code);
const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const exact=(x,keys)=>plain(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const sameScope=(a,b)=>plain(a)&&plain(b)&&SCOPE.every(k=>typeof a[k]==="string"&&a[k]===b[k]);
const sameClock=(a,b)=>a.clock_domain_id===b.clock_domain_id&&
 a.receive_epoch_id===b.receive_epoch_id&&a.instrument_contract_id===b.instrument_contract_id;

/** Reject unsafe graph shapes BEFORE invoking any accepted mock function.
 * Shared references are allowed (the mock Risk request intentionally shares a quote);
 * a recursive active ancestor is a cycle. No getters, symbols or exotic prototypes.
 */
function safeGraph(root){
 const seen=new WeakSet(),active=new WeakSet();let count=0;
 function visit(value,depth){
  if(value===null||typeof value==="boolean")return true;
  if(typeof value==="string")return value.length<=512;
  if(typeof value==="number")return Number.isFinite(value);
  if(typeof value!=="object"||depth>16||++count>512)return false;
  if(active.has(value))return false;
  if(seen.has(value))return true;
  const arr=Array.isArray(value);
  if(arr){if(Object.getPrototypeOf(value)!==Array.prototype||value.length>128)return false;
   for(let j=0;j<value.length;j++)if(!Object.hasOwn(value,j))return false;
  }else if(Object.getPrototypeOf(value)!==Object.prototype)return false;
  const keys=Reflect.ownKeys(value);
  if(keys.length>64)return false;
  active.add(value);
  for(const key of keys){
   if(typeof key!=="string"||key==="__proto__"||key==="constructor"||key==="prototype")return false;
   const d=Object.getOwnPropertyDescriptor(value,key);
   if(!d||!Object.hasOwn(d,"value")||(key!=="length"&&!d.enumerable))return false;
   if(arr&&key==="length")continue;
   if(!visit(d.value,depth+1))return false;
  }
  active.delete(value);seen.add(value);return true;
 }
 try{return visit(root,0);}catch{return false;}
}

/** Only bounded invented-source completeness: NEVER a Forex strategy signal. */
export function diagnoseSyntheticForexVenue(input){
 try{
  if(!safeGraph(input))return deny("UNSAFE_FIXTURE_GRAPH");
  if(!exact(input,TOP)||input.schema_version!==0||
   input.source_class!=="SYNTHETIC_FIXTURE"||input.mode!=="SYNTHETIC_RESEARCH_ONLY")
   return deny("INVALID_FIXTURE_ENVELOPE");
  const {reference_quote:ref,venue_quote:venue,risk_request:r,ledger_intent:l,
   quality_policy:quality,now_capture:now,mock_queue_capacity:capacity}=input;
  if(!plain(ref)||!plain(venue)||!plain(r)||!plain(r.intent)||!plain(l)||
   !plain(r.intent.scope)||!plain(r.quote)||!plain(r.quality_policy)||!plain(r.now_capture)||
   !Number.isInteger(capacity)||capacity<1||capacity>32)return deny("INVALID_MOCK_CONTEXT");
  if(ref.source_class!=="SYNTHETIC_FIXTURE"||venue.source_class!=="SYNTHETIC_FIXTURE"||
   r.source_class!=="SYNTHETIC_FIXTURE"||l.source_class!=="SYNTHETIC_FIXTURE")
   return deny("REAL_SOURCE_NOT_IMPLEMENTED");
  // Strict in-process aliasing prevents cross-quote/cross-snapshot authority laundering.
  if(r.quote!==venue||r.quality_policy!==quality||r.now_capture!==now||
   r.intent.quote_id!==venue.quote_id||
   !sameScope(r.intent.scope,{tenant_id:l.tenant_id,account_id:l.account_id,
    venue_id:l.venue_id,instrument_contract_id:l.instrument_contract_id,
    strategy_family:l.policy_request?.scope?.strategy_family})||
   r.intent.scope.strategy_family!=="SIMULATED_ONE_LEG"||
   r.intent.scope.venue_id!==venue.venue_id||
   r.intent.scope.instrument_contract_id!==venue.instrument_contract_id)
   return deny("MIXED_MOCK_CONTEXT");
  if(ref.quote_kind!=="INDICATIVE"||ref.venue_id!==null||
   venue.quote_kind!=="EXECUTABLE"||
   ref.instrument_contract_id!==venue.instrument_contract_id||
   ref.provider_id===venue.provider_id||ref.feed_id===venue.feed_id)
   return nonaction("REFERENCE_VENUE_SEPARATION_FAILED");
  // All four actual frozen upstream mock families are directly exercised below.
  const nowClock=normalizeSyntheticClockSample(now);
  const refClock=normalizeSyntheticClockSample(ref.capture);
  const venueClock=normalizeSyntheticClockSample(venue.capture);
  if(nowClock.status!=="VALID"||refClock.status!=="VALID"||venueClock.status!=="VALID"||
   !sameClock(nowClock.sample,refClock.sample)||!sameClock(nowClock.sample,venueClock.sample)||
   refClock.sample.sync_state!=="HEALTHY"||venueClock.sample.sync_state!=="HEALTHY"||
   refClock.sample.source_timestamp_semantics!=="EVENT"||
   refClock.sample.source_event_utc_ns===null||refClock.sample.source_event_uncertainty_ns===null)
   return nonaction("FICTIONAL_CLOCK_UNVERIFIED");
  const reference=normalizeSyntheticQuote(ref);
  if(reference.status!=="VALID_SYNTHETIC"||ref.delivery!=="NORMAL"||
   ref.provider_sequence===null||ref.full_snapshot!==true)
   return nonaction("REFERENCE_FIXTURE_NOT_COMPLETE");
  const qualityResult=assessSyntheticQuoteQuality(venue,quality,now);
  if(qualityResult.status!=="SYNTHETIC_CANDIDATE_ONLY"||
   venue.provider_sequence===null||venue.full_snapshot!==true)
   return nonaction("VENUE_FIXTURE_NOT_COMPLETE");
  const risk=evaluateSyntheticRisk(r);
  if(risk.status!=="SYNTHETIC_MODEL_PASS"||risk.execution_authorized!==false||
   risk.fixture_only!==true||risk.persisted!==false||risk.kill_durable!==false)
   return nonaction("FAKE_RISK_NOT_PASSED");
  const exec=createSyntheticExecution({
   schema_version:0,source_class:"SYNTHETIC_FIXTURE",leg_id:"forex-local-diagnostic",
   risk_request:r,ledger_intent:l,mock_queue_capacity:capacity
  });
  if(exec.status!=="READY_MOCK_ONLY"||exec.fixture_only!==true||
   exec.execution_authorized!==false||exec.network_performed!==false||
   exec.persisted!==false||exec.state?.phase!=="PREPARED_MOCK_ONLY")
   return nonaction("FAKE_EXECUTION_NOT_PREPARED");
  const summary=Object.freeze({schema_version:0,
   reference:"INVENTED_INDICATIVE_ONLY",venue:"INVENTED_VENUE_MODEL_ONLY",
   time:"ONE_LOCAL_FIXTURE_DOMAIN",risk:"SIMULATED_MODEL_PASS_NOT_ADMISSION",
   order:"LOCAL_PREPARED_NOT_SENT",...FLAGS});
  return Object.freeze({schema_version:0,status:"OBSERVE_ONLY",
   reason_code:"NO_SIGNAL_NO_BROKER_NO_PRICE_COMPARISON",diagnostic:summary,...FLAGS});
 }catch{return deny("INVALID_FIXTURE_REQUEST");}
}
