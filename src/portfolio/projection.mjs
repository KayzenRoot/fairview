// FV-PORTFOLIO-001: ONLY fictional, pure, in-process portfolio projections.
// A simulated Ledger state, invented balance and mock Risk pass are NEVER financial truth.
import {createSyntheticLedger,appendSyntheticLedgerEvent} from "../ledger/simulation.mjs";
import {evaluateSyntheticRisk} from "../risk/evaluate.mjs";

const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const U=/^(?:0|[1-9][0-9]*)$/;
const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MAX=(1n<<64n)-1n;
const TOP=["schema_version","source_class","scope","balance","ledger_intent","ledger_events","run_at_utc"];
const SCOPE=["tenant_id","account_id","venue_id","instrument_contract_id","strategy_family"];
const BALANCE=["schema_version","source_class","scope","version","observed_at_utc","valid_until_utc",
 "complete","transfer_state","available_quote_minor","available_base_units","known_exposure_units",
 "daily_loss_minor","drawdown_minor","recent_order_count","seen_intent_keys","expected_filled_units"];
const owned=new WeakSet();
const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const exact=(x,fields)=>plain(x)&&Object.keys(x).length===fields.length&&fields.every(k=>Object.hasOwn(x,k));
const id=x=>typeof x==="string"&&ID.test(x)&&x!=="*"&&x!=="ALL";
const scope=x=>exact(x,SCOPE)&&SCOPE.every(k=>id(x[k]));
const same=(a,b)=>SCOPE.every(k=>a[k]===b[k]);
const uint=x=>{
 if(typeof x!=="string"||x.length>20||!U.test(x))return null;
 const n=BigInt(x);return n<=MAX?n:null;
};
const utc=x=>typeof x==="string"&&ISO.test(x)&&Number.isFinite(Date.parse(x))&&
 new Date(x).toISOString()===x?Date.parse(x):null;
const outcome=(status,reason_code,extra={})=>Object.freeze({schema_version:0,status,reason_code,
 ...extra,fixture_only:true,execution_authorized:false,persisted:false,
 authenticated_provider_evidence:false,real_balance_verified:false,
 financial_reconciliation_complete:false});
const deny=reason=>outcome("DENY",reason);
function validBalance(b){
 return exact(b,BALANCE)&&b.schema_version===0&&b.source_class==="SYNTHETIC_FIXTURE"&&
 Object.isFrozen(b)&&scope(b.scope)&&Object.isFrozen(b.scope)&&id(b.version)&&
 utc(b.observed_at_utc)!==null&&utc(b.valid_until_utc)!==null&&
 utc(b.observed_at_utc)<utc(b.valid_until_utc)&&typeof b.complete==="boolean"&&
 ["NONE","PENDING","UNKNOWN"].includes(b.transfer_state)&&
 ["available_quote_minor","available_base_units","known_exposure_units",
  "daily_loss_minor","drawdown_minor","expected_filled_units"].every(k=>uint(b[k])!==null)&&
 Number.isInteger(b.recent_order_count)&&b.recent_order_count>=0&&b.recent_order_count<=10000&&
 Array.isArray(b.seen_intent_keys)&&Object.isFrozen(b.seen_intent_keys)&&
 b.seen_intent_keys.length<=1023&&b.seen_intent_keys.every(id)&&
 b.seen_intent_keys.length===new Set(b.seen_intent_keys).size;
}
function projection(input){
 if(!exact(input,TOP)||input.schema_version!==0||
  !["SYNTHETIC_FIXTURE","REAL_VENDOR"].includes(input.source_class)||!scope(input.scope))
  return deny("INVALID_PROJECTION_REQUEST");
 if(input.source_class!=="SYNTHETIC_FIXTURE")return deny("REAL_PROVIDER_NOT_IMPLEMENTED");
 if(!validBalance(input.balance))return deny("INVALID_FROZEN_MOCK_BALANCE");
 const b=input.balance,s=input.scope,run=utc(input.run_at_utc);
 if(run===null)return deny("INVALID_RUN_TIME");
 if(!same(s,b.scope))return deny("BALANCE_SCOPE_MISMATCH");
 if(utc(b.observed_at_utc)>run||run>=utc(b.valid_until_utc))
  return deny("STALE_OR_FUTURE_MOCK_BALANCE");
 const intent=input.ledger_intent;
 if(!plain(intent)||!plain(intent.policy_request)||!plain(intent.policy_request.scope)||
  intent.tenant_id!==s.tenant_id||intent.account_id!==s.account_id||
  intent.venue_id!==s.venue_id||intent.instrument_contract_id!==s.instrument_contract_id||
  intent.policy_request.scope.strategy_family!==s.strategy_family)
  return deny("LEDGER_SCOPE_MISMATCH");
 if(!Array.isArray(input.ledger_events)||input.ledger_events.length>128)
  return deny("INVALID_EVENT_STREAM");
 const initial=createSyntheticLedger(intent);
 if(initial.status!=="CREATED"||initial.fixture_only!==true||initial.persisted!==false||
  initial.execution_authorized!==false)return deny("INVALID_SYNTHETIC_LEDGER_"+initial.reason_code);
 if(utc(initial.ledger.intent.created_at_utc)>run)return deny("FUTURE_LEDGER_INTENT");
 if(b.seen_intent_keys.includes(initial.ledger.intent.intent_key))return deny("DUPLICATE_SCOPED_INTENT");
 let state=initial.ledger;
 for(const e of input.ledger_events){
  const next=appendSyntheticLedgerEvent(state,e);
  if(next.status==="LOCKED")
   return outcome("DISCREPANCY_LOCKED","MOCK_LEDGER_"+next.reason_code);
  if(next.status!=="APPLIED"||next.fixture_only!==true||next.persisted!==false||
   next.execution_authorized!==false)return deny("INVALID_MOCK_EVENT_"+next.reason_code);
  if(utc(e.captured_at_utc)>run)return deny("FUTURE_LEDGER_EVENT");
  state=next.ledger;
 }
 if(state.fixture_only!==true||state.persisted!==false||state.execution_authorized!==false||
  state.blocked_new_exposure!==true)return deny("UNTRUSTED_LEDGER_BOUNDARY");
 const qty=uint(state.intent.quantity_units),filled=uint(state.filled_units);
 if(qty===null||filled===null||filled>qty)return deny("INVALID_LEDGER_QUANTITY");
 if(filled!==uint(b.expected_filled_units))
  return outcome("DISCREPANCY_LOCKED","MOCK_BALANCE_LEDGER_FILL_MISMATCH");
 // A synthetic ACK or cancel claim is NEVER proof that a possible external order cannot fill.
 // Only a locally complete fictional reconciliation terminal, no-send, or full mock fill
 // can clear remaining invented possible-fill units. None proves actual remote truth.
 const terminalReceipt=state.events.some(e=>e.type==="RECONCILE"&&e.receipt?.complete===true)&&
  ["CANCELED_CONFIRMED","REJECTED","FILLED"].includes(state.phase);
 const noSend=state.attempt_id===null&&state.phase==="INTENT_DURABLE";
 const possible=noSend||terminalReceipt||filled===qty?0n:qty-filled;
 const locked=state.unknown_external_effect||state.phase==="DISCREPANCY_LOCKED"||
  !b.complete||b.transfer_state!=="NONE"||possible>0n;
 const exp=uint(b.known_exposure_units)+filled+possible;
 if(exp>MAX)return deny("MOCK_EXPOSURE_OVERFLOW");
 const frozenScope=Object.freeze(Object.fromEntries(SCOPE.map(k=>[k,s[k]])));
 const versionedSeen=Object.freeze([...b.seen_intent_keys,state.intent.intent_key]);
 const summary=Object.freeze({
  schema_version:0,scope:frozenScope,balance_version:b.version,
  ledger_intent_key:state.intent.intent_key,ledger_phase:state.phase,
  ledger_event_count:state.events.length,ledger_filled_units:filled.toString(),
  possible_unknown_fill_units:possible.toString(),worst_case_exposure_units:exp.toString(),
  mock_complete:b.complete,transfer_state:b.transfer_state,
  balance_observed_at_utc:b.observed_at_utc,balance_valid_until_utc:b.valid_until_utc,
  run_at_utc:input.run_at_utc,fixture_only:true,execution_authorized:false,
  persisted:false,authenticated_provider_evidence:false,
  real_balance_verified:false,financial_reconciliation_complete:false
 });
 if(locked)return outcome("REQUIRES_RECONCILIATION","INVENTED_STATE_UNCERTAIN",{snapshot:summary,mock_risk_view:null});
 const riskView=Object.freeze({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
  scope:frozenScope,version:b.version,complete:true,unknown_effects:false,
  known_exposure_units:(uint(b.known_exposure_units)+filled).toString(),
  unknown_possible_fill_units:"0",available_quote_minor:b.available_quote_minor,
  available_base_units:b.available_base_units,daily_loss_minor:b.daily_loss_minor,
  drawdown_minor:b.drawdown_minor,recent_order_count:b.recent_order_count,
  seen_intent_keys:versionedSeen});
 const result=outcome("MOCK_CONSISTENT","INVENTED_LEDGER_AND_BALANCE_MATCH_ONLY",
  {snapshot:summary,mock_risk_view:riskView});
 owned.add(result);return result;
}
/** Complete local-only fictional projection, not actual Portfolio or provider reconciliation. */
export function deriveSyntheticPortfolio(input){
 try{return projection(input);}catch{return deny("INVALID_PROJECTION_REQUEST");}
}
/** Private-process provenance guard: caller cannot forge/clone a Portfolio-produced mock view. */
export function probeSyntheticPortfolioRisk(projected,riskInput){
 try{
  if(!plain(projected)||!owned.has(projected)||projected.status!=="MOCK_CONSISTENT"||
   !plain(riskInput))return deny("UNTRUSTED_MOCK_PROJECTION");
  // Never trust a caller-supplied riskInput.portfolio; use only this module's
  // own fictionally derived exact RiskPortfolioViewV0-shape.
  const decision=evaluateSyntheticRisk({...riskInput,portfolio:projected.mock_risk_view});
  return outcome(decision.status==="SYNTHETIC_MODEL_PASS"?"MOCK_RISK_MODEL_PASS":"DENY",
   decision.reason_code,{risk_result:decision});
 }catch{return deny("UNTRUSTED_MOCK_PROJECTION");}
}
