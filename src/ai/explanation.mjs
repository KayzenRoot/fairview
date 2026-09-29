// FV-AI-001: fixed-template explanations of SELF-GENERATED fixtures ONLY.
// NO LLM, prompt parser, model inference, external knowledge, tool or order route.
import {evaluateSyntheticRisk} from "../risk/evaluate.mjs";
import {runSyntheticResearch} from "../research/integrity.mjs";

const TOP=["schema_version","source_class","advisory_version","mode",
 "risk_request","research_request"];
const VERSION="fv-ai-001-fixed-template-v0";
const BLOCKED_FIELDS=new Set(["__proto__","constructor","prototype","role",
 "system","developer","prompt","prompts","messages","instructions","tools",
 "tool_call","tool_calls","model_output","rag_documents","external_evidence",
 "approval","self_approval","human_approval","api_key","secret","tenant_override"]);
const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&
 Object.getPrototypeOf(x)===Object.prototype;
const exact=(x,keys)=>plain(x)&&Object.keys(x).length===keys.length&&
 keys.every(k=>Object.hasOwn(x,k));
const FLAGS=Object.freeze({fixture_only:true,execution_authorized:false,
 network_performed:false,persisted:false,authenticated_provider_evidence:false,
 kill_durable:false,financial_reconciliation_complete:false,
 real_market_performance_established:false,comparative_benchmark_supported:false,
 real_latency_measured:false,model_inference_performed:false,
 model_service_connected:false,human_review_complete:false,tuning_approved:false});
const result=(status,reason_code,extra={})=>Object.freeze({
 schema_version:0,status,reason_code,...extra,...FLAGS
});
const deny=code=>result("DENY",code);
// Preflight before ACTUAL accepted mock models. Never read an accessor.
function inspect(x,depth=0,stack=new Set(),budget={nodes:0}){
 if(++budget.nodes>24000||depth>30)return false;
 if(x===null||typeof x==="boolean")return true;
 if(typeof x==="string")return x.length<=4096;
 if(typeof x==="number")return Number.isSafeInteger(x);
 if(typeof x!=="object"||stack.has(x))return false;
 if(Array.isArray(x)?x.length>128:!plain(x))return false;
 if(Object.getOwnPropertySymbols(x).length!==0)return false;
 const desc=Object.getOwnPropertyDescriptors(x),ks=Object.keys(desc);
 if(ks.length>300||Array.isArray(x)&&ks.length!==x.length+1)return false;
 stack.add(x);
 for(const k of ks){
  const d=desc[k];
  if(BLOCKED_FIELDS.has(k)||!Object.hasOwn(d,"value")||
   k!=="length"&&(!d.enumerable||!inspect(d.value,depth+1,stack,budget))){
   stack.delete(x);return false;
  }
 }
 stack.delete(x);return true;
}
const riskLabel=r=>r.status==="SYNTHETIC_MODEL_PASS"&&
 r.fixture_only===true&&r.execution_authorized===false&&
 r.persisted===false&&r.kill_durable===false?
 "MOCK_RISK_MODEL_PASS_NONAUTHORIZING":"MOCK_RISK_REFUSAL";
const researchLabel=r=>r.status==="SYNTHETIC_RESEARCH_REPRODUCIBLE"&&
 r.fixture_only===true&&r.execution_authorized===false&&
 r.network_performed===false&&r.persisted===false&&
 r.comparative_benchmark_supported===false?
 "MOCK_A_A_REPEATABILITY_ONLY":
 r.status==="SYNTHETIC_RESEARCH_INCONCLUSIVE"?
 "MOCK_INCOMPLETE_EVIDENCE":"MOCK_RESEARCH_REJECTED";
function explain(input){
 if(!inspect(input))return deny("HOSTILE_OR_UNTRUSTED_ADVISORY_REQUEST");
 if(!exact(input,TOP)||input.schema_version!==0||
  !["SYNTHETIC_FIXTURE","REAL_VENDOR"].includes(input.source_class))
  return deny("INVALID_ADVISORY_REQUEST");
 if(input.source_class!=="SYNTHETIC_FIXTURE")
  return deny("REAL_DATA_OR_EXTERNAL_MODEL_NOT_IMPLEMENTED");
 if(input.advisory_version!==VERSION)return deny("UNPINNED_ADVISORY_VERSION");
 if(input.mode!=="EXPLAIN_ONLY")return deny("NO_MODEL_OR_MUTATING_ADVISORY_MODES");
 if(!plain(input.risk_request)||!plain(input.research_request))
  return deny("MISSING_ACTUAL_MOCK_EVIDENCE");
 if(input.risk_request.source_class!=="SYNTHETIC_FIXTURE"||
  input.research_request.source_class!=="SYNTHETIC_FIXTURE")
  return deny("CROSS_BOUNDARY_OR_EXTERNAL_EVIDENCE");
 // These are real accepted SOURCE functions, but both are strictly mocked.
 // Never accept caller-supplied verdicts or text as authority.
 const risk=evaluateSyntheticRisk(input.risk_request);
 const research=runSyntheticResearch(input.research_request);
 if(risk.fixture_only!==true||risk.execution_authorized!==false||
  risk.persisted!==false||risk.kill_durable!==false||
  research.fixture_only!==true||research.execution_authorized!==false||
  research.network_performed!==false||research.persisted!==false||
  research.real_market_performance_established!==false||
  research.comparative_benchmark_supported!==false)
  return deny("ACCEPTED_MOCK_AUTHORITY_MISMATCH");
 const r=riskLabel(risk),s=researchLabel(research);
 const complete=r==="MOCK_RISK_MODEL_PASS_NONAUTHORIZING"&&
  s==="MOCK_A_A_REPEATABILITY_ONLY";
 const finding=Object.freeze({schema_version:0,
  finding_class:complete?"FICTIONAL_MODEL_ONLY_EXPLANATION":
   r!=="MOCK_RISK_MODEL_PASS_NONAUTHORIZING"?"FICTIONAL_RISK_REFUSAL":
   "FICTIONAL_INCOMPLETE_RESEARCH",
  evidence_scope:"SELF_GENERATED_FIXTURE_ONLY",risk_class:r,research_class:s,
  mock_research_case_count:Number.isSafeInteger(research.case_count)&&
   research.case_count>=1&&research.case_count<=4?research.case_count:0,
  mock_inconclusive_case_count:Number.isSafeInteger(research.inconclusive_case_count)&&
   research.inconclusive_case_count>=0&&research.inconclusive_case_count<=4?
   research.inconclusive_case_count:0,
  hypothetical_operator_pause_hint:!complete,
  ...FLAGS});
 return result(complete?"SYNTHETIC_FIXED_EXPLANATION":"SYNTHETIC_EXPLANATION_LIMITED",
  complete?"NO_REAL_MODEL_OR_FINANCIAL_PROOF":"NOT_ACTIONABLE_INCOMPLETE_MOCK_EVIDENCE",{
   template_version:VERSION,finding
  });
}
/** Deterministic data-class explanation, never generative model output or an order permit. */
export function explainSyntheticEvidence(input){
 try{return explain(input);}catch{return deny("INVALID_ADVISORY_INPUT");}
}
