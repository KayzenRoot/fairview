// FV-RISK-001: fictional risk-model exercises only; NEVER an executable risk permit.
// Actual broker balances, durable kill, provider rights and funded orders are absent.
import {evaluateSyntheticEligibility} from "../policy/eligibility.mjs";
import {normalizeSyntheticQuote,assessSyntheticQuoteQuality,advanceSyntheticSequence} from "../market-data/quote.mjs";

const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const UINT=/^(?:0|[1-9][0-9]*)$/;
const FIXED=/^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/;
const U128=(1n<<128n)-1n;
const SCOPE=["tenant_id","account_id","venue_id","instrument_contract_id","strategy_family"];
const TOP=["schema_version","source_class","intent","policy_request","quote","quality_policy",
 "now_capture","previous_quote","portfolio","limits","kill"];
const INTENT=["schema_version","intent_key","scope","side","purpose","quantity_units","limit_price",
 "quote_id","portfolio_version","limits_version","kill_epoch"];
const PORTFOLIO=["schema_version","source_class","scope","version","complete","unknown_effects",
 "known_exposure_units","unknown_possible_fill_units","available_quote_minor","available_base_units",
 "daily_loss_minor","drawdown_minor","recent_order_count","seen_intent_keys"];
const LIMITS=["schema_version","source_class","scope","version","notional_scale",
 "max_order_notional_minor","max_total_exposure_units","max_daily_loss_minor",
 "max_drawdown_minor","max_orders_per_window","worst_case_cost_bps"];
const KILL=["schema_version","source_class","scope","epoch","state_known","engaged","mock_replayed_after_restart"];
const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const keys=(x,expected)=>plain(x)&&Object.keys(x).length===expected.length&&expected.every(k=>Object.hasOwn(x,k));
const id=x=>typeof x==="string"&&ID.test(x)&&x!=="ALL"&&x!=="*";
const scope=x=>keys(x,SCOPE)&&SCOPE.every(k=>id(x[k]));
const same=(a,b)=>SCOPE.every(k=>a[k]===b[k]);
const uint=x=>{
 if(typeof x!=="string"||x.length>39||!UINT.test(x))return null;
 const n=BigInt(x);return n<=U128?n:null;
};
const fixed=(v,d)=>{
 if(typeof v!=="string"||v.length>48||!FIXED.test(v)||!Number.isInteger(d)||d<0||d>18)return null;
 const parts=v.split(".");
 return (parts[1]?.length??0)===d?BigInt(parts[0]+(parts[1]??"")):null;
};
const positive=x=>{const n=uint(x);return n===null||n===0n?null:n;};
const ceil=(n,d)=>(n+d-1n)/d;
const result=(status,reason_code,extra={})=>Object.freeze({
 schema_version:0,status,reason_code,fixture_only:true,execution_authorized:false,
 persisted:false,real_account_verified:false,kill_durable:false,...extra
});
const deny=reason=>result("DENY",reason);
function validPortfolio(p){
 return keys(p,PORTFOLIO)&&p.schema_version===0&&p.source_class==="SYNTHETIC_FIXTURE"&&
  Object.isFrozen(p)&&scope(p.scope)&&Object.isFrozen(p.scope)&&id(p.version)&&
  p.complete===true&&typeof p.unknown_effects==="boolean"&&
  ["known_exposure_units","unknown_possible_fill_units","available_quote_minor","available_base_units",
   "daily_loss_minor","drawdown_minor"].every(k=>uint(p[k])!==null)&&
  Number.isInteger(p.recent_order_count)&&p.recent_order_count>=0&&p.recent_order_count<=10000&&
  Array.isArray(p.seen_intent_keys)&&Object.isFrozen(p.seen_intent_keys)&&
  p.seen_intent_keys.length<=1024&&p.seen_intent_keys.every(id)&&
  new Set(p.seen_intent_keys).size===p.seen_intent_keys.length;
}
function validLimits(l){
 return keys(l,LIMITS)&&l.schema_version===0&&l.source_class==="SYNTHETIC_FIXTURE"&&
  Object.isFrozen(l)&&scope(l.scope)&&Object.isFrozen(l.scope)&&id(l.version)&&
  Number.isInteger(l.notional_scale)&&l.notional_scale>=0&&l.notional_scale<=18&&
  ["max_order_notional_minor","max_total_exposure_units","max_daily_loss_minor","max_drawdown_minor"]
   .every(k=>positive(l[k])!==null)&&
  Number.isInteger(l.max_orders_per_window)&&l.max_orders_per_window>=1&&l.max_orders_per_window<=10000&&
  Number.isInteger(l.worst_case_cost_bps)&&l.worst_case_cost_bps>=1&&l.worst_case_cost_bps<=10000;
}
function validKill(k){
 return keys(k,KILL)&&k.schema_version===0&&k.source_class==="SYNTHETIC_FIXTURE"&&
  Object.isFrozen(k)&&scope(k.scope)&&Object.isFrozen(k.scope)&&id(k.epoch)&&
  typeof k.state_known==="boolean"&&typeof k.engaged==="boolean"&&
  typeof k.mock_replayed_after_restart==="boolean";
}
function evaluate(input){
 if(!keys(input,TOP)||input.schema_version!==0||!["SYNTHETIC_FIXTURE","REAL_VENDOR"].includes(input.source_class))
  return deny("INVALID_REQUEST");
 if(input.source_class!=="SYNTHETIC_FIXTURE")return deny("TRUSTED_RISK_NOT_IMPLEMENTED");
 const i=input.intent;
 if(!keys(i,INTENT)||i.schema_version!==0||!id(i.intent_key)||!scope(i.scope)||
    !["BUY","SELL"].includes(i.side)||!["OPEN","RECOVERY"].includes(i.purpose)||
    !id(i.quote_id)||!id(i.portfolio_version)||!id(i.limits_version)||!id(i.kill_epoch))
  return deny("INVALID_INTENT");
 const qty=positive(i.quantity_units);
 if(qty===null)return deny("INVALID_QUANTITY");
 if(input.portfolio===null||input.portfolio===undefined)return deny("MISSING_PORTFOLIO");
 const p=input.portfolio,l=input.limits,k=input.kill;
 if(!validPortfolio(p))return deny("INVALID_PORTFOLIO");
 if(!validLimits(l))return deny("INVALID_LIMITS");
 if(k===null||k===undefined||!validKill(k)||!k.state_known||!k.mock_replayed_after_restart)
  return deny("UNKNOWN_KILL_STATE");
 if(!same(i.scope,p.scope)||!same(i.scope,l.scope)||!same(i.scope,k.scope))
  return deny("SCOPE_MISMATCH");
 if(i.portfolio_version!==p.version)return deny("STALE_PORTFOLIO_VERSION");
 if(i.limits_version!==l.version)return deny("STALE_LIMITS_VERSION");
 if(i.kill_epoch!==k.epoch)return deny("KILL_EPOCH_MISMATCH");
 if(k.engaged)return deny("KILL_ENGAGED");
 if(p.unknown_effects||uint(p.unknown_possible_fill_units)>0n)return deny("UNRESOLVED_POSSIBLE_FILL");
 if(p.seen_intent_keys.includes(i.intent_key))return deny("DUPLICATE_INTENT");
 if(p.recent_order_count>=l.max_orders_per_window)return deny("ORDER_RATE_LIMIT");
 if(uint(p.daily_loss_minor)>=uint(l.max_daily_loss_minor))return deny("DAILY_LOSS_LIMIT");
 if(uint(p.drawdown_minor)>=uint(l.max_drawdown_minor))return deny("DRAWDOWN_LIMIT");
 const req=input.policy_request;
 if(!plain(req)||!["DEMO","PAPER"].includes(req.mode)||!plain(req.scope)||
    req.scope.venue_id!==i.scope.venue_id||
    req.scope.account_ref!==i.scope.account_id||
    req.scope.instrument_contract_id!==i.scope.instrument_contract_id||
    req.scope.strategy_family!==i.scope.strategy_family)
  return deny("POLICY_SCOPE_OR_MODE");
 const policy=evaluateSyntheticEligibility(req);
 if(!["DEMO_ELIGIBLE","PAPER_ELIGIBLE"].includes(policy.decision)||!policy.fixture_only||
    policy.execution_authorized!==false)return deny("POLICY_DENY");
 const n=normalizeSyntheticQuote(input.quote);
 if(n.status!=="VALID_SYNTHETIC")return deny("INVALID_QUOTE_"+n.reason_code);
 const q=n.quote;
 if(q.quote_id!==i.quote_id||q.venue_id!==i.scope.venue_id||
    q.instrument_contract_id!==i.scope.instrument_contract_id)
  return deny("QUOTE_SCOPE_MISMATCH");
 const quality=assessSyntheticQuoteQuality(input.quote,input.quality_policy,input.now_capture);
 if(quality.status!=="SYNTHETIC_CANDIDATE_ONLY"||quality.execution_authorized!==false)
  return deny("QUOTE_QUALITY_"+quality.reason_code);
 const seq=advanceSyntheticSequence(input.previous_quote,input.quote);
 if(seq.status!=="CURRENT_SYNTHETIC")return deny("QUOTE_SEQUENCE_"+seq.reason_code);
 const limitPrice=fixed(i.limit_price,q.price_scale);
 const bid=fixed(q.bid,q.price_scale),ask=fixed(q.ask,q.price_scale);
 if(limitPrice===null||limitPrice===0n)return deny("INVALID_LIMIT_PRICE");
 if(i.side==="BUY"&&limitPrice<ask||i.side==="SELL"&&limitPrice>bid)
  return deny("LIMIT_PRICE_OUTSIDE_QUOTE");
 const availableSide=fixed(i.side==="BUY"?q.ask_size:q.bid_size,q.quantity_scale);
 if(availableSide===null||qty>availableSide)return deny("INSUFFICIENT_SYNTHETIC_DEPTH");
 const worstPrice=i.side==="BUY"?limitPrice:bid;
 const raw=worstPrice*qty*(10n**BigInt(l.notional_scale));
 const den=10n**BigInt(q.price_scale+q.quantity_scale);
 const notional=ceil(raw,den);
 const cost=ceil(notional*BigInt(l.worst_case_cost_bps),10000n);
 if(notional===0n||notional+cost>uint(l.max_order_notional_minor))
  return deny("ORDER_NOTIONAL_OR_COST_LIMIT");
 const exposure=uint(p.known_exposure_units)+uint(p.unknown_possible_fill_units)+qty;
 if(exposure>uint(l.max_total_exposure_units))return deny("TOTAL_EXPOSURE_LIMIT");
 if(i.side==="BUY"&&notional+cost>uint(p.available_quote_minor))
  return deny("INSUFFICIENT_SYNTHETIC_BALANCE");
 if(i.side==="SELL"&&qty>uint(p.available_base_units))
  return deny("INSUFFICIENT_SYNTHETIC_BALANCE");
 return result("SYNTHETIC_MODEL_PASS","INVENTED_BOUND_CHECKS_ONLY",{
  intent_key:i.intent_key,scope:Object.freeze(Object.fromEntries(SCOPE.map(x=>[x,i.scope[x]]))),
  quote_id:q.quote_id,portfolio_version:p.version,limits_version:l.version,kill_epoch:k.epoch,
  worst_case_notional_minor:notional.toString(),worst_case_cost_minor:cost.toString(),
  worst_case_exposure_units:exposure.toString(),observed_elapsed_ns:quality.observed_elapsed_ns,
  policy_classification:policy.decision
 });
}
/** No caller field can elevate this model result into an actual, durable or signed trading permit. */
export function evaluateSyntheticRisk(input){
 try{return evaluate(input);}catch{return deny("INVALID_REQUEST");}
}
