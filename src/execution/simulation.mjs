// FV-EXECUTION-001: pure in-process FICTIONAL order lifecycle. NEVER transmits an order.
// This module neither persists a presend marker nor authenticates a broker receipt.
import {evaluateSyntheticRisk} from "../risk/evaluate.mjs";
import {createSyntheticLedger,appendSyntheticLedgerEvent} from "../ledger/simulation.mjs";

const own=new WeakSet();
const KEYS=["schema_version","source_class","leg_id","risk_request","ledger_intent","mock_queue_capacity"];
const ACTION=["schema_version","source_class","event","fresh_risk_request","mock_now_utc","mock_queue_free_slots"];
const SCOPE=["tenant_id","account_id","venue_id","instrument_contract_id","strategy_family"];
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const TIME=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const U=/^(?:0|[1-9][0-9]*)$/;
const U64=(1n<<64n)-1n;
const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const exact=(x,fields)=>plain(x)&&Object.keys(x).length===fields.length&&fields.every(k=>Object.hasOwn(x,k));
const id=x=>typeof x==="string"&&ID.test(x)&&x!=="*"&&x!=="ALL";
const utc=x=>typeof x==="string"&&TIME.test(x)&&Number.isFinite(Date.parse(x))&&
 new Date(x).toISOString()===x?Date.parse(x):null;
const uint=x=>{if(typeof x!=="string"||x.length>20||!U.test(x))return null;
 const v=BigInt(x);return v<=U64?v:null;};
const scope=x=>plain(x)&&Object.keys(x).length===SCOPE.length&&SCOPE.every(k=>id(x[k]));
const same=(a,b)=>SCOPE.every(k=>a[k]===b[k]);
const copyScope=x=>Object.freeze(Object.fromEntries(SCOPE.map(k=>[k,x[k]])));
const json=x=>JSON.stringify(x);
function policyFacts(p){
 if(!plain(p)||!plain(p.scope))return null;
 const c=structuredClone(p);delete c.now_utc;
 return json(c);
}
const result=(status,reason_code,extra={})=>Object.freeze({
 schema_version:0,status,reason_code,...extra,fixture_only:true,execution_authorized:false,
 network_performed:false,persisted:false,authenticated_provider_evidence:false,
 kill_durable:false,financial_reconciliation_complete:false
});
const deny=(reason)=>result("DENY",reason);
const minted=s=>{const x=Object.freeze(s);own.add(x);return x;};
const validState=s=>plain(s)&&own.has(s)&&Object.isFrozen(s)&&
 s.fixture_only===true&&s.execution_authorized===false&&s.network_performed===false&&
 s.persisted===false&&s.kill_durable===false&&
 plain(s.ledger)&&Object.isFrozen(s.ledger)&&s.ledger.fixture_only===true&&
 s.ledger.persisted===false&&s.ledger.execution_authorized===false&&
 s.ledger.blocked_new_exposure===true&&Object.isFrozen(s.scope)&&
 Object.isFrozen(s.ledger.events)&&Object.isFrozen(s.ledger.intent)&&
 typeof s.intent_signature==="string"&&typeof s.policy_signature==="string";
function create(i){
 if(!exact(i,KEYS)||i.schema_version!==0||
  !["SYNTHETIC_FIXTURE","REAL_VENDOR"].includes(i.source_class))
  return deny("INVALID_CREATION_REQUEST");
 if(i.source_class!=="SYNTHETIC_FIXTURE")return deny("REAL_VENUE_NOT_IMPLEMENTED");
 if(!id(i.leg_id)||!Number.isInteger(i.mock_queue_capacity)||
  i.mock_queue_capacity<1||i.mock_queue_capacity>32)return deny("INVALID_MOCK_QUEUE");
 const rr=i.risk_request,li=i.ledger_intent;
 if(!plain(rr)||!plain(rr.intent)||!scope(rr.intent.scope)||!plain(li)||
  !plain(li.policy_request)||!plain(li.policy_request.scope))
  return deny("INVALID_SUBJECT");
 const ri=rr.intent,rs=ri.scope;
 if(li.source_class!=="SYNTHETIC_FIXTURE"||
  li.tenant_id!==rs.tenant_id||li.account_id!==rs.account_id||
  li.venue_id!==rs.venue_id||li.instrument_contract_id!==rs.instrument_contract_id||
  li.policy_request.scope.strategy_family!==rs.strategy_family||
  li.intent_key!==ri.intent_key||li.side!==ri.side||
  li.quantity_units!==ri.quantity_units)return deny("INTENT_SCOPE_OR_QUANTITY_MISMATCH");
 const ps=policyFacts(rr.policy_request);
 if(ps===null||ps!==policyFacts(li.policy_request)||rr.policy_request.now_utc!==li.policy_request.now_utc)
  return deny("POLICY_FACTS_MISMATCH");
 const risk=evaluateSyntheticRisk(rr);
 if(risk.status!=="SYNTHETIC_MODEL_PASS"||risk.fixture_only!==true||
  risk.execution_authorized!==false||risk.persisted!==false||risk.kill_durable!==false)
  return deny("MOCK_RISK_"+risk.reason_code);
 const l=createSyntheticLedger(li);
 if(l.status!=="CREATED"||l.fixture_only!==true||l.persisted!==false||
  l.execution_authorized!==false)return deny("MOCK_LEDGER_"+l.reason_code);
 if(utc(l.ledger.intent.created_at_utc)===null)return deny("INVALID_MOCK_CREATION_TIME");
 const s=minted({schema_version:0,source_class:"SYNTHETIC_FIXTURE",leg_id:i.leg_id,
  scope:copyScope(rs),ledger:l.ledger,initial_mock_risk:risk,
  intent_signature:json(ri),policy_signature:ps,mock_queue_capacity:i.mock_queue_capacity,
  last_mock_at_utc:l.ledger.intent.created_at_utc,phase:"PREPARED_MOCK_ONLY",
  fixture_only:true,execution_authorized:false,network_performed:false,persisted:false,
  authenticated_provider_evidence:false,kill_durable:false,financial_reconciliation_complete:false});
 return result("READY_MOCK_ONLY","IN_MEMORY_RISK_LEDGER_DIAGNOSTIC_ONLY",{state:s});
}
/** Create a simulation, never a network request, durable intent or real risk admission. */
export function createSyntheticExecution(i){try{return create(i);}catch{return deny("INVALID_CREATION_REQUEST");}}
function remaining(s){
 const q=uint(s.ledger.intent.quantity_units),f=uint(s.ledger.filled_units);
 if(q===null||f===null||f>q)return null;
 if(s.ledger.attempt_id===null)return 0n;
 if(f===q)return 0n;
 const mockCompleteTerminal=s.ledger.events.some(e=>e.type==="RECONCILE"&&
  e.receipt?.source_class==="SYNTHETIC_FIXTURE"&&e.receipt.complete===true)&&
  ["FILLED","CANCELED_CONFIRMED","REJECTED"].includes(s.ledger.phase);
 return mockCompleteTerminal?0n:q-f;
}
const status=s=>s.ledger.phase==="DISCREPANCY_LOCKED"?"DISCREPANCY_LOCKED":
 s.ledger.unknown_external_effect||remaining(s)>0n?"REQUIRES_RECONCILIATION":"MOCK_ONLY";
function summary(s){
 const possible=remaining(s);
 return Object.freeze({
  leg_id:s.leg_id,scope:s.scope,intent_key:s.ledger.intent.intent_key,
  ledger_phase:s.ledger.phase,ledger_event_count:s.ledger.events.length,
  known_mock_filled_units:s.ledger.filled_units,
  possible_unknown_fill_units:possible===null?null:possible.toString(),
  unknown_effect:s.ledger.unknown_external_effect,attempt_id:s.ledger.attempt_id,
  fixture_only:true,execution_authorized:false,network_performed:false,persisted:false,
  authenticated_provider_evidence:false,kill_durable:false,financial_reconciliation_complete:false
 });
}
function advance(s,a){
 if(!validState(s))return deny("UNTRUSTED_EXECUTION_STATE");
 if(!exact(a,ACTION)||a.schema_version!==0||
  !["SYNTHETIC_FIXTURE","REAL_VENDOR"].includes(a.source_class))
  return deny("INVALID_ACTION");
 if(a.source_class!=="SYNTHETIC_FIXTURE")return deny("REAL_VENUE_NOT_IMPLEMENTED");
 if(!Number.isInteger(a.mock_queue_free_slots)||a.mock_queue_free_slots<0||
  a.mock_queue_free_slots>s.mock_queue_capacity)return deny("INVALID_MOCK_QUEUE");
 const e=a.event,when=utc(a.mock_now_utc),ev=plain(e)?utc(e.captured_at_utc):null;
 if(ev===null||when===null)return deny("INVALID_MOCK_EVENT_TIME");
 if(ev>when||ev<utc(s.last_mock_at_utc)||when<utc(s.last_mock_at_utc))
  return deny("STALE_OR_FUTURE_MOCK_EVENT_TIME");
 if(s.ledger.events.length>=128)return deny("SIMULATED_EVENT_LIMIT");
 if(e.type==="MAY_HAVE_SENT"){
  if(s.ledger.attempt_id!==null)return deny("MOCK_ATTEMPT_ALREADY_RECORDED");
  if(a.mock_queue_free_slots===0)return deny("MOCK_QUEUE_BACKPRESSURE");
  const r=a.fresh_risk_request;
  if(!plain(r)||!plain(r.intent)||json(r.intent)!==s.intent_signature||
   policyFacts(r.policy_request)!==s.policy_signature)
   return deny("MOCK_RISK_SUBJECT_OR_POLICY_CHANGED");
  const verified=evaluateSyntheticRisk(r);
  if(verified.status!=="SYNTHETIC_MODEL_PASS"||verified.fixture_only!==true||
   verified.execution_authorized!==false||verified.persisted!==false||
   verified.kill_durable!==false)return deny("FRESH_MOCK_RISK_"+verified.reason_code);
  for(const k of ["intent_key","quote_id","portfolio_version","limits_version","kill_epoch"])
   if(verified[k]!==s.initial_mock_risk[k])
    return deny("MOCK_VERSION_OR_QUOTE_CHANGED");
  if(!same(verified.scope,s.scope))return deny("MOCK_SCOPE_CHANGED");
 }else if(a.fresh_risk_request!==null)return deny("UNEXPECTED_RISK_OVERRIDE");
 const step=appendSyntheticLedgerEvent(s.ledger,e);
 if(step.status!=="APPLIED"&&step.status!=="LOCKED")
  return deny("MOCK_LEDGER_"+step.reason_code);
 const next=minted({...s,ledger:step.ledger,last_mock_at_utc:a.mock_now_utc,
  phase:step.ledger.phase});
 const out=summary(next);
 return result(step.status==="LOCKED"?"DISCREPANCY_LOCKED":status(next),
  "INVENTED_EVENT_"+step.reason_code,{state:next,leg:out,mock_hedge_permitted:false});
}
/** Applies one accepted fictional Ledger event; no send, resend or hedge is possible. */
export function advanceSyntheticExecution(s,a){try{return advance(s,a);}catch{return deny("INVALID_ACTION");}}
/** Read-only, non-netted two-leg diagnostics; never hedge or transfer across accounts. */
export function summarizeSyntheticLegs(legs){
 try{
  if(!Array.isArray(legs)||legs.length!==2||!legs.every(validState)||
   legs[0]===legs[1]||legs[0].leg_id===legs[1].leg_id||
   legs[0].scope.tenant_id!==legs[1].scope.tenant_id||
   legs[0].scope.strategy_family!==legs[1].scope.strategy_family)
   return deny("INVALID_TWO_LEG_FIXTURE");
  const per=Object.freeze(legs.map(summary));
  if(per.some(x=>x.possible_unknown_fill_units===null))return deny("INVALID_TWO_LEG_UNITS");
  const uncertain=legs.some(x=>x.ledger.unknown_external_effect||remaining(x)>0n||
   x.ledger.phase==="DISCREPANCY_LOCKED");
  return result(uncertain?"REQUIRES_RECONCILIATION":"MOCK_ONLY",
   "NO_CROSS_VENUE_NETTING_OR_AUTOMATIC_HEDGE",
   {legs:per,mock_hedge_permitted:false,cross_account_transfer_inferred:false});
 }catch{return deny("INVALID_TWO_LEG_FIXTURE");}
}
