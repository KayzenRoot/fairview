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
