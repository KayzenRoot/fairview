// FV-WEB-001: bounded LOCAL read model from four ACTUAL accepted FICTIONAL owners.
// NOT a browser app, network endpoint, authenticated BFF, incident pager or trade UI.
import {evaluateSyntheticRisk} from "../risk/evaluate.mjs";
import {deriveSyntheticPortfolio} from "../portfolio/projection.mjs";
import {observeSyntheticScenario} from "../observability/diagnostics.mjs";
import {explainSyntheticEvidence} from "../ai/explanation.mjs";

const VERSION="fv-web-001-local-read-v0";
const TOP=["schema_version","source_class","web_version","mode","requested_scope",
 "mock_now_utc","session","stream","risk_request","portfolio_request",
 "observability_request","advisory_request"];
const SCOPE=["tenant_id","account_id","venue_id","instrument_contract_id","strategy_family"];
const SESSION=["schema_version","source_class","state","role","tenant_id","expires_at_utc"];
const STREAM=["schema_version","source_class","source_epoch","last_seen_epoch",
 "last_seen_sequence","next_sequence","connection_state"];
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const BLOCKED=new Set(["__proto__","prototype","constructor","prompt","prompts",
 "messages","instructions","system","developer","tool","tools","tool_call",
 "tool_calls","model_output","rag_documents","external_evidence",
 "api_key","secret","session_token","authorization","csrf_token",
 "signed_approval","tuning_approved","self_approval","human_approval",
 "tenant_override","wallet","private_key"]);
const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&
 Object.getPrototypeOf(x)===Object.prototype;
const exact=(x,fields)=>plain(x)&&Object.keys(x).length===fields.length&&
 fields.every(k=>Object.hasOwn(x,k));
const id=x=>typeof x==="string"&&ID.test(x)&&x!=="ALL"&&x!=="*";
const validScope=x=>exact(x,SCOPE)&&SCOPE.every(k=>id(x[k]));
const same=(a,b)=>validScope(a)&&validScope(b)&&SCOPE.every(k=>a[k]===b[k]);
const timestamp=x=>typeof x==="string"&&ISO.test(x)&&
 Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x?Date.parse(x):null;
const FLAGS=Object.freeze({fixture_only:true,execution_authorized:false,
 network_performed:false,persisted:false,authenticated_provider_evidence:false,
 real_balance_verified:false,kill_durable:false,
 financial_reconciliation_complete:false,real_market_performance_established:false,
 comparative_benchmark_supported:false,real_latency_measured:false,
 real_alert_delivered:false,mandatory_audit_satisfied:false,
 model_inference_performed:false,human_review_complete:false,
 session_authenticated:false,server_authorization_performed:false,
 live_stream_connected:false,operator_command_available:false});
const outcome=(status,reason_code,data={})=>Object.freeze({
 schema_version:0,status,reason_code,...data,...FLAGS
});
const deny=reason=>outcome("DENY",reason);
// Properties and values inspected without invoking getters, mutation, or network.
// Untrusted role is legal ONLY within a simulated session; nowhere else.
function inspect(x,path=[],stack=new Set(),budget={nodes:0}){
 if(++budget.nodes>24000||path.length>30)return false;
 if(x===null||typeof x==="boolean")return true;
 if(typeof x==="string")return x.length<=4096;
 if(typeof x==="number")return Number.isSafeInteger(x);
 if(typeof x!=="object"||stack.has(x))return false;
 if(Array.isArray(x)?x.length>128:!plain(x))return false;
 if(Object.getOwnPropertySymbols(x).length)return false;
 const d=Object.getOwnPropertyDescriptors(x),keys=Object.keys(d);
 if(keys.length>300||Array.isArray(x)&&keys.length!==x.length+1)return false;
 stack.add(x);
 for(const k of keys){
  const v=d[k];
  if(BLOCKED.has(k)||(k==="role"&&!(path.length===1&&path[0]==="session"))||
   !Object.hasOwn(v,"value")||
   k!=="length"&&(!v.enumerable||!inspect(v.value,[...path,k],stack,budget))){
   stack.delete(x);return false;
  }
 }
 stack.delete(x);return true;
}
function validateSession(s,scope,now){
 if(!exact(s,SESSION)||s.schema_version!==0||
  s.source_class!=="SYNTHETIC_FIXTURE"||
  s.role!=="MOCK_VIEWER"||!id(s.tenant_id)||s.tenant_id!==scope.tenant_id)
  return "INVALID_OR_CROSS_SCOPE_MOCK_SESSION";
 if(s.state!=="ACTIVE_LOCAL_FIXTURE")return "REVOKED_OR_INACTIVE_MOCK_SESSION";
 const expiry=timestamp(s.expires_at_utc);
 if(expiry===null||expiry<=now)return "EXPIRED_MOCK_SESSION";
 return null;
}
function validateStream(s){
 if(!exact(s,STREAM)||s.schema_version!==0||
  s.source_class!=="SYNTHETIC_FIXTURE"||!id(s.source_epoch)||
  s.connection_state!=="CONNECTED_LOCAL_FIXTURE"||
  !Number.isSafeInteger(s.next_sequence)||s.next_sequence<0||
  s.next_sequence>256)
  return "UNAVAILABLE_OR_MALFORMED_LOCAL_STREAM";
 if(s.last_seen_sequence===null&&s.last_seen_epoch===null)
  return s.next_sequence===0?null:"NEW_STREAM_REQUIRES_INITIAL_SNAPSHOT";
 if(!id(s.last_seen_epoch)||s.last_seen_epoch!==s.source_epoch)
  return "STREAM_EPOCH_CHANGED_REQUIRES_NEW_SNAPSHOT";
 if(!Number.isSafeInteger(s.last_seen_sequence)||
  s.last_seen_sequence<0||s.last_seen_sequence>=256||
  s.next_sequence!==s.last_seen_sequence+1)
  return "GAP_DUPLICATE_OR_REPLAYED_LOCAL_STREAM";
 return null;
}
function validBoundary(r,p,o,a){
 return r.fixture_only===true&&r.execution_authorized===false&&
  r.persisted===false&&r.kill_durable===false&&
  p.fixture_only===true&&p.execution_authorized===false&&
  p.persisted===false&&p.authenticated_provider_evidence===false&&
  p.real_balance_verified===false&&p.financial_reconciliation_complete===false&&
  o.fixture_only===true&&o.execution_authorized===false&&
  o.network_performed===false&&o.persisted===false&&
  o.authenticated_provider_evidence===false&&o.kill_durable===false&&
  o.financial_reconciliation_complete===false&&
  a.fixture_only===true&&a.execution_authorized===false&&
  a.network_performed===false&&a.persisted===false&&
  a.model_inference_performed===false&&a.human_review_complete===false&&
  a.financial_reconciliation_complete===false;
}
function compose(input){
 if(!inspect(input))return deny("HOSTILE_OR_OVERSIZED_LOCAL_VIEW_REQUEST");
 if(!exact(input,TOP)||input.schema_version!==0||
  !["SYNTHETIC_FIXTURE","REAL_VENDOR"].includes(input.source_class))
  return deny("INVALID_LOCAL_VIEW_REQUEST");
 if(input.source_class!=="SYNTHETIC_FIXTURE")
  return deny("REAL_BROWSER_DATA_OR_LOGIN_NOT_IMPLEMENTED");
 if(input.web_version!==VERSION)return deny("UNPINNED_LOCAL_VIEW_VERSION");
 if(input.mode!=="READ_ONLY_FIXTURE")return deny("NO_MUTATING_OR_LIVE_WEB_MODES");
 const scope=input.requested_scope,now=timestamp(input.mock_now_utc);
 if(!validScope(scope)||now===null)return deny("INVALID_LOCAL_SCOPE_OR_EXPLICIT_TIME");
 const session=validateSession(input.session,scope,now);
 if(session!==null)return deny(session);
 const stream=validateStream(input.stream);
 if(stream!==null)return deny(stream);
 const risk=input.risk_request,portfolio=input.portfolio_request,
  obs=input.observability_request,advisory=input.advisory_request;
 if(!plain(risk)||!plain(portfolio)||!plain(obs)||!plain(advisory))
  return deny("MISSING_DIRECT_ACCEPTED_MOCK_INPUT");
 if(risk.source_class!=="SYNTHETIC_FIXTURE"||
  portfolio.source_class!=="SYNTHETIC_FIXTURE"||
  obs.source_class!=="SYNTHETIC_FIXTURE"||
  advisory.source_class!=="SYNTHETIC_FIXTURE")
  return deny("MIXED_REAL_OR_UNLICENSED_INPUT");
 const obsRisk=obs.execution_creation?.risk_request;
 if(!same(scope,risk.intent?.scope)||!same(scope,portfolio.scope)||
  !same(scope,obsRisk?.intent?.scope)||!same(scope,advisory.risk_request?.intent?.scope))
  return deny("CROSS_SCOPE_FAKE_READ_DENIED");
 if(portfolio.run_at_utc!==input.mock_now_utc)
  return deny("UNPINNED_MOCK_PORTFOLIO_SNAPSHOT_TIME");
 // All four actual ACCEPTED modules are called. Caller verdicts are NEVER trusted.
 const r=evaluateSyntheticRisk(risk);
 const p=deriveSyntheticPortfolio(portfolio);
 const o=observeSyntheticScenario(obs);
 const a=explainSyntheticEvidence(advisory);
 if(!validBoundary(r,p,o,a))return deny("ACCEPTED_SOURCE_TRUST_BOUNDARY_FAILED");
 const riskSignal=r.status==="SYNTHETIC_MODEL_PASS"?
  "MOCK_RISK_PASS_NOT_AUTHORIZATION":"MOCK_RISK_REFUSAL";
 const portfolioSignal=p.status==="MOCK_CONSISTENT"?
  "FICTIONAL_BALANCE_AND_LEDGER_MATCH":
  p.status==="REQUIRES_RECONCILIATION"||p.status==="DISCREPANCY_LOCKED"?
  "FICTIONAL_BALANCE_UNCERTAIN":"FICTIONAL_BALANCE_REJECTED";
 const obsSignal=o.status==="OBSERVED_MOCK_ONLY"&&
  o.observation?.diagnostic_class==="HEALTHY"?
  "IN_PROCESS_DIAGNOSTIC_ONLY":
  o.status==="OBSERVED_MOCK_UNCERTAIN"?
  "FICTIONAL_UNKNOWN_EVENT":"LOCAL_DIAGNOSTIC_REFUSAL";
 const aiSignal=a.status==="SYNTHETIC_FIXED_EXPLANATION"?
  "FIXED_TEMPLATE_MOCK_ONLY":
  a.status==="SYNTHETIC_EXPLANATION_LIMITED"?
  "FIXED_TEMPLATE_INCOMPLETE":"FIXED_TEMPLATE_REFUSAL";
 const complete=riskSignal==="MOCK_RISK_PASS_NOT_AUTHORIZATION"&&
  portfolioSignal==="FICTIONAL_BALANCE_AND_LEDGER_MATCH"&&
  obsSignal==="IN_PROCESS_DIAGNOSTIC_ONLY"&&
  aiSignal==="FIXED_TEMPLATE_MOCK_ONLY";
 const read_model=Object.freeze({schema_version:0,
  mock_view:"FICTIONAL_OVERVIEW_ONLY",mode_label:"SYNTHETIC_NONAUTHORITATIVE",
  displayed_session_class:"NOT_AUTHENTICATED_LOCAL_FIXTURE",
  stream_class:"BOUNDED_LOCAL_SEQUENCE_ONLY",local_sequence:input.stream.next_sequence,
  risk_class:riskSignal,portfolio_class:portfolioSignal,
  diagnostic_class:obsSignal,advisory_class:aiSignal,
  incident_banner:"NO_REAL_MONITORING_OR_BROKER_STATE",
  hypothetical_pause_hint:!complete,
  redaction_class:"ONLY_BOUNDED_ENUMS_NO_IDENTIFIERS",
  ...FLAGS});
 return outcome(complete?"SYNTHETIC_LOCAL_READ_MODEL":
  "SYNTHETIC_LOCAL_READ_MODEL_DEGRADED",
  complete?"ALL_FOUR_MOCKS_LOCAL_ONLY_NOT_LIVE":
   "ONE_OR_MORE_FICTIONAL_SOURCES_INCOMPLETE",{
   read_model
  });
}
/** Never a real authenticated server, dashboard, operator command or finance approval. */
export function composeSyntheticOperatorReadModel(input){
 try{return compose(input);}catch{return deny("INVALID_LOCAL_VIEW_REQUEST");}
}
