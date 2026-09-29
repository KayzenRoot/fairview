// FV-LEDGER-001: pure immutable, in-memory fictional event reducer.
// No storage transaction, external order, venue auth or exactly-once promise.
import {evaluateSyntheticEligibility} from "../policy/eligibility.mjs";
const ID=/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const U=/^(0|[1-9][0-9]*)$/;
const MAX=(1n<<64n)-1n;
const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const id=x=>typeof x==="string"&&ID.test(x)&&x!=="ALL"&&x!=="*";
const units=x=>typeof x==="string"&&x.length<=20&&U.test(x)&&BigInt(x)<=MAX?BigInt(x):null;
const TIME=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const utc=x=>typeof x==="string"&&TIME.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
const frozen=x=>Object.freeze(x);
const outcome=(status,reason_code,ledger=null)=>frozen({schema_version:0,status,reason_code,ledger,fixture_only:true,persisted:false,execution_authorized:false});
const deny=(code,state=null)=>outcome("DENY",code,state);
const REQUEST=["schema_version","source_class","tenant_id","account_id","venue_id","instrument_contract_id","intent_key","side","quantity_units","created_at_utc","policy_request"];
export function createSyntheticLedger(raw){
 try {
  if(!plain(raw)||Object.keys(raw).length!==REQUEST.length||!REQUEST.every(k=>Object.hasOwn(raw,k))||
     raw.schema_version!==0||!["SYNTHETIC_FIXTURE","REAL_VENDOR"].includes(raw.source_class))return deny("INVALID_INTENT");
  if(raw.source_class!=="SYNTHETIC_FIXTURE")return deny("REAL_VENUE_NOT_SUPPORTED");
  if(![raw.tenant_id,raw.account_id,raw.venue_id,raw.instrument_contract_id,raw.intent_key].every(id)||
     !["BUY","SELL"].includes(raw.side)||units(raw.quantity_units)===null||
     units(raw.quantity_units)===0n||!utc(raw.created_at_utc))return deny("INVALID_INTENT");
  const req=raw.policy_request;
  if(!plain(req)||!plain(req.scope)||req.source_class!=="SYNTHETIC_FIXTURE"||
     !["DEMO","PAPER"].includes(req.mode)||req.scope.account_ref!==raw.account_id||
     req.scope.venue_id!==raw.venue_id||req.scope.instrument_contract_id!==raw.instrument_contract_id)
    return deny("POLICY_SCOPE_MISMATCH");
  const policy=evaluateSyntheticEligibility(req);
  if(policy.decision!==(req.mode==="DEMO"?"DEMO_ELIGIBLE":"PAPER_ELIGIBLE")||
     !policy.fixture_only||policy.execution_authorized!==false)return deny("POLICY_FIXTURE_NOT_ELIGIBLE");
  const intent=frozen(Object.fromEntries(REQUEST.filter(k=>k!=="policy_request").map(k=>[k,raw[k]])));
  const state=frozen({schema_version:0,intent,policy_evidence_refs:frozen([...policy.authorization_evidence_refs]),
   phase:"INTENT_DURABLE",attempt_id:null,filled_units:"0",unknown_external_effect:false,
   blocked_new_exposure:true,events:frozen([]),fixture_only:true,persisted:false,execution_authorized:false});
  return outcome("CREATED","IN_MEMORY_INTENT_ONLY",state);
 }catch{return deny("INVALID_INTENT");}
}
const TYPES=new Set(["MAY_HAVE_SENT","ACK","FILL","CANCEL_REQUESTED","CANCEL_CONFIRMED","LOST_ACK","CRASH_RESTART","RECONCILE"]);
const EVENT=["schema_version","source_class","intent_key","event_id","sequence","captured_at_utc","type","attempt_id","quantity_units","execution_id","receipt"];
const RECEIPT=["source_class","complete","account_id","venue_id","instrument_contract_id","cursor","reported_filled_units","order_status"];
const terminal=new Set(["FILLED","CANCELED_CONFIRMED"]);

const next=(s,e,patch)=>frozen({...s,...patch,events:frozen([...s.events,frozen({...e,receipt:e.receipt===null?null:frozen({...e.receipt})})])});
const lock=(s,code,e)=>outcome("LOCKED",code,next(s,e,{phase:"DISCREPANCY_LOCKED",unknown_external_effect:true}));
function receiptValid(rec,s){
 return plain(rec)&&Object.keys(rec).length===RECEIPT.length&&RECEIPT.every(k=>Object.hasOwn(rec,k))&&
 rec.source_class==="SYNTHETIC_FIXTURE"&&typeof rec.complete==="boolean"&&
 [rec.account_id,rec.venue_id,rec.instrument_contract_id].every(id)&&id(rec.cursor)&&
 ["OPEN","FILLED","CANCELED","REJECTED"].includes(rec.order_status)&&
 units(rec.reported_filled_units)!==null&&
 rec.account_id===s.intent.account_id&&rec.venue_id===s.intent.venue_id&&
 rec.instrument_contract_id===s.intent.instrument_contract_id;
}
export function appendSyntheticLedgerEvent(state,event){
 try{
  if(!plain(state)||!state.fixture_only||state.persisted!==false||state.execution_authorized!==false||
     !plain(state.intent)||!Array.isArray(state.events)||!Array.isArray(state.policy_evidence_refs))
    return deny("INVALID_LEDGER_STATE");
  if(!plain(event)||Object.keys(event).length!==EVENT.length||!EVENT.every(k=>Object.hasOwn(event,k))||
     event.schema_version!==0||!["SYNTHETIC_FIXTURE","REAL_VENDOR"].includes(event.source_class))
    return deny("INVALID_EVENT",state);
  if(event.source_class!=="SYNTHETIC_FIXTURE")return deny("REAL_VENUE_NOT_SUPPORTED",state);
  if(!id(event.event_id)||event.intent_key!==state.intent.intent_key||!utc(event.captured_at_utc)||
     !TYPES.has(event.type)||units(event.sequence)===null||units(event.sequence)===0n||
     !(event.attempt_id===null||id(event.attempt_id))||
     !(event.execution_id===null||id(event.execution_id))||
     !(event.quantity_units===null||units(event.quantity_units)!==null&&units(event.quantity_units)>0n))
    return deny("INVALID_EVENT",state);
  const duplicate=state.events.find(x=>x.event_id===event.event_id);
  if(duplicate){
   if(JSON.stringify(duplicate)===JSON.stringify(event))return outcome("IGNORED_DUPLICATE","SAME_EVENT_ID_SAME_FACTS",state);
   return outcome("LOCKED","CONFLICTING_DUPLICATE_EVENT_ID",frozen({...state,phase:"DISCREPANCY_LOCKED",unknown_external_effect:true}));
  }
  if(state.events.length>=128)return deny("EVENT_LIMIT",state);
  const last=state.events.at(-1);
  if(units(event.sequence)!==(last?units(last.sequence)+1n:1n))return deny("EVENT_SEQUENCE_GAP",state);
  if(event.type==="RECONCILE"){
   if(state.attempt_id===null)return deny("PRE_SEND_MARKER_REQUIRED",state);
   if(event.quantity_units!==null||event.execution_id!==null||event.attempt_id!==state.attempt_id||
      !receiptValid(event.receipt,state))return deny("INVALID_RECONCILIATION_RECEIPT",state);
   const rec=event.receipt,known=units(state.filled_units),reported=units(rec.reported_filled_units);
   if(!rec.complete)return lock(state,"INCOMPLETE_SYNTHETIC_HISTORY",event);
   if(reported<known||reported>units(state.intent.quantity_units)||
      rec.order_status==="FILLED"&&reported!==units(state.intent.quantity_units)||
      rec.order_status==="REJECTED"&&reported!==0n)
    return lock(state,"CONFLICTING_SYNTHETIC_RECONCILIATION",event);
   const phase={OPEN:reported>0n?"PARTIALLY_FILLED":"ACKNOWLEDGED",FILLED:"FILLED",CANCELED:"CANCELED_CONFIRMED",REJECTED:"REJECTED"}[rec.order_status];
   return outcome("APPLIED","SYNTHETIC_RECONCILED_NOT_VENUE_PROOF",
    next(state,event,{phase,filled_units:rec.reported_filled_units,unknown_external_effect:false}));
  }
  if(event.receipt!==null)return deny("UNEXPECTED_RECEIPT",state);
  if(terminal.has(state.phase)||state.phase==="REJECTED"||state.phase==="DISCREPANCY_LOCKED")
   return deny("TERMINAL_OR_LOCKED",state);
  if(event.type==="MAY_HAVE_SENT"){
   if(state.phase!=="INTENT_DURABLE"||event.attempt_id===null||event.quantity_units!==null||event.execution_id!==null)
    return deny("UNAUTHORIZED_ATTEMPT_REUSE",state);
   return outcome("APPLIED","SYNTHETIC_PRESEND_MARKER_ONLY",
    next(state,event,{phase:"MAY_HAVE_SENT",attempt_id:event.attempt_id}));
  }
  if(state.attempt_id===null||event.attempt_id!==state.attempt_id)
   return deny("MISSING_OR_MISMATCHED_ATTEMPT",state);
  if(event.type==="FILL"){
   if(event.execution_id===null||event.quantity_units===null)return deny("INVALID_FILL",state);
   if(state.events.some(x=>x.type==="FILL"&&x.execution_id===event.execution_id))
    return lock(state,"CONFLICTING_EXECUTION_ID",event);
   const filled=units(state.filled_units)+units(event.quantity_units);
   if(filled>units(state.intent.quantity_units))return lock(state,"OVERFILL_DISCREPANCY",event);
   const phase=state.unknown_external_effect?"UNKNOWN_NEEDS_RECONCILIATION":
     filled===units(state.intent.quantity_units)?"FILLED":state.phase==="CANCEL_REQUESTED"?"CANCEL_REQUESTED":"PARTIALLY_FILLED";
   return outcome("APPLIED","SYNTHETIC_FILL_NOT_EXTERNAL_PROOF",
    next(state,event,{filled_units:filled.toString(),phase}));
  }
  if(event.quantity_units!==null||event.execution_id!==null)return deny("UNEXPECTED_EVENT_QUANTITY",state);
  if(event.type==="LOST_ACK"||event.type==="CRASH_RESTART")
   return outcome("APPLIED","SIMULATED_UNKNOWN_MUST_RECONCILE",
    next(state,event,{phase:"UNKNOWN_NEEDS_RECONCILIATION",unknown_external_effect:true}));
  if(event.type==="ACK"){
   const phase=state.unknown_external_effect?"UNKNOWN_NEEDS_RECONCILIATION":
    state.phase==="CANCEL_REQUESTED"?"CANCEL_REQUESTED":
    units(state.filled_units)>0n?"PARTIALLY_FILLED":"ACKNOWLEDGED";
   return outcome("APPLIED","SYNTHETIC_ACK_ONLY",next(state,event,{phase}));
  }
  if(event.type==="CANCEL_REQUESTED")
   return outcome("APPLIED","CANCEL_NOT_CONFIRMED",next(state,event,{
    phase:state.unknown_external_effect?"UNKNOWN_NEEDS_RECONCILIATION":"CANCEL_REQUESTED"}));
  if(event.type==="CANCEL_CONFIRMED"){
   if(state.unknown_external_effect)return outcome("APPLIED","UNKNOWN_NOT_CLEARED_BY_CANCEL",
    next(state,event,{phase:"UNKNOWN_NEEDS_RECONCILIATION"}));
   if(state.phase!=="CANCEL_REQUESTED")return deny("CANCEL_NOT_REQUESTED",state);
   return outcome("APPLIED","SYNTHETIC_CANCEL_ONLY",next(state,event,{phase:"CANCELED_CONFIRMED"}));
  }
  return deny("UNHANDLED_EVENT",state);
 }catch{return deny("INVALID_EVENT_OR_STATE",state);}
}
