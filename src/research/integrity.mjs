// FV-RESEARCH-001: pure local A/A integrity tests of invented Replay, NOT a financial benchmark.
import {normalizeSyntheticQuote,assessSyntheticQuoteQuality} from "../market-data/quote.mjs";
import {hashSyntheticReplayEvents,runSyntheticReplay} from "../replay/deterministic.mjs";

const REQUEST=["schema_version","source_class","research_version","quality_policy","cases"];
const CASE=["manifest","events"];
const QUALITY=["max_receive_age_ns","max_local_clock_error_ns","min_depth_levels",
 "require_source_event_time"];
const VERSION="fv-research-001-v0";
const NUM=/^(?:0|[1-9][0-9]*)$/;
const HASH=/^[a-f0-9]{64}$/;
const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&
 Object.getPrototypeOf(x)===Object.prototype;
const exact=(x,keys)=>plain(x)&&Object.keys(x).length===keys.length&&
 keys.every(k=>Object.hasOwn(x,k));
const FLAGS=Object.freeze({fixture_only:true,execution_authorized:false,
 network_performed:false,persisted:false,authenticated_provider_evidence:false,
 kill_durable:false,financial_reconciliation_complete:false,
 real_market_performance_established:false,comparative_benchmark_supported:false,
 real_latency_measured:false});
const result=(status,reason_code,extra={})=>Object.freeze({
 schema_version:0,status,reason_code,...extra,...FLAGS
});
const deny=why=>result("DENY",why);
const receipt=(case_index,diagnostic_class,reason_code,event_count=0,quote_count=0,hash=null)=>
 Object.freeze({schema_version:0,case_index,diagnostic_class,reason_code,
 synthetic_event_count:event_count,synthetic_quote_count:quote_count,
 invented_model_diagnostic_sha256:hash,...FLAGS});
// Inspect property DESCRIPTORS and bound structure BEFORE calling any accepted dependency.
// Inspect without invoking accessors or rewriting original frozen mock Risk/kill fields.
function safe(x,depth=0,stack=new Set(),state={nodes:0}){
 if(++state.nodes>24000||depth>30)return false;
 if(x===null||typeof x==="boolean")return true;
 if(typeof x==="string")return x.length<=4096;
 if(typeof x==="number")return Number.isSafeInteger(x);
 if(typeof x!=="object"||stack.has(x))return false;
 if(Array.isArray(x)?x.length>128:!plain(x))return false;
 if(Object.getOwnPropertySymbols(x).length!==0)return false;
 stack.add(x);
 const props=Object.getOwnPropertyDescriptors(x),keys=Object.keys(props);
 if(keys.length>300||Array.isArray(x)&&keys.length!==x.length+1){
  stack.delete(x);return false;
 }
 for(const key of keys){
  const d=props[key];
  if(["__proto__","prototype","constructor"].includes(key)||
   !Object.hasOwn(d,"value")||
   key!=="length"&&(!d.enumerable||!safe(d.value,depth+1,stack,state))){
    stack.delete(x);return false;
  }
 }
 stack.delete(x);return true;
}
function validQuality(q){
 return exact(q,QUALITY)&&typeof q.max_receive_age_ns==="string"&&
  q.max_receive_age_ns.length<=20&&NUM.test(q.max_receive_age_ns)&&
  BigInt(q.max_receive_age_ns)>0n&&
  typeof q.max_local_clock_error_ns==="string"&&
  q.max_local_clock_error_ns.length<=20&&NUM.test(q.max_local_clock_error_ns)&&
  Number.isSafeInteger(q.min_depth_levels)&&q.min_depth_levels>=1&&
  q.min_depth_levels<=12&&typeof q.require_source_event_time==="boolean";
}
function study(input){
 if(!safe(input))return deny("HOSTILE_OR_OVERSIZED_RESEARCH_REQUEST");
 if(!exact(input,REQUEST)||input.schema_version!==0||
  !["SYNTHETIC_FIXTURE","REAL_VENDOR"].includes(input.source_class))
  return deny("INVALID_RESEARCH_REQUEST");
 if(input.source_class!=="SYNTHETIC_FIXTURE")return deny("REAL_DATA_RESEARCH_NOT_IMPLEMENTED");
 if(input.research_version!==VERSION)return deny("UNPINNED_RESEARCH_VERSION");
 if(!validQuality(input.quality_policy))return deny("INVALID_SHARED_QUOTE_QUALITY_POLICY");
 if(!Array.isArray(input.cases)||input.cases.length<1||input.cases.length>4||
  !input.cases.every(c=>exact(c,CASE)||plain(c)))
  return deny("INVALID_RESEARCH_CASES");
 const sum=input.cases.reduce((n,c)=>n+(Array.isArray(c.events)?c.events.length:0),0);
 if(sum>96)return deny("CASE_EVENT_BUDGET_EXCEEDED");
 const receipts=[];let executed=0,quote_total=0,reproducible=0,inconclusive=0;
 for(let i=0;i<input.cases.length;i++){
  const c=input.cases[i];
  const add=(status,why,ec=0,qc=0,hash=null)=>{
   receipts.push(receipt(i,status,why,ec,qc,hash));
   if(status==="REPRODUCIBLE_INVENTED_ONLY")reproducible++;
   else inconclusive++;
  };
  if(!exact(c,CASE)||!Array.isArray(c.events)||c.events.length<1||c.events.length>32){
   add("INCONCLUSIVE","INVALID_CASE_SHAPE");continue;
  }
  const evidence=hashSyntheticReplayEvents(c.events);
  if(evidence.status!=="SYNTHETIC_DATASET_HASH_ONLY"){
   add("INCONCLUSIVE","INVALID_INVENTED_DATASET",c.events.length);continue;
  }
  if(!plain(c.manifest)||typeof c.manifest.dataset_sha256!=="string"||
   !HASH.test(c.manifest.dataset_sha256)||
   c.manifest.dataset_sha256!==evidence.dataset_sha256){
   add("INCONCLUSIVE","UNPINNED_OR_CHANGED_DATASET",c.events.length);continue;
  }
  // ALL quote probes are for ALREADY DELIVERED fake events, with fixed shared policy.
  // Their low-cardinality result never exposes quoted price, IDs, rights or trades.
  let quotes=0,nonactionable=false;
  for(const e of c.events){
   if(e.kind!=="QUOTE")continue;
   quotes++;
   const q=normalizeSyntheticQuote(e.payload);
   const check=q.status==="VALID_SYNTHETIC"?
    assessSyntheticQuoteQuality(e.payload,input.quality_policy,e.clock):null;
   if(q.status!=="VALID_SYNTHETIC"||check?.status!=="SYNTHETIC_CANDIDATE_ONLY")
    nonactionable=true;
  }
  quote_total+=quotes;
  // Actual pinned Replay engine twice on EXACT SAME unchanged input. A/A proves
  // only model reproducibility, NEVER a competitor/strategy or capital outcome.
  const request={schema_version:0,source_class:"SYNTHETIC_FIXTURE",
   manifest:c.manifest,events:c.events};
  const a=runSyntheticReplay(request);
  const b=runSyntheticReplay(request);executed+=2;
  const stable=a.status===b.status&&a.reason_code===b.reason_code&&
   a.dataset_sha256===b.dataset_sha256&&
   a.output_canonical_event_hash===b.output_canonical_event_hash&&
   a.event_count===b.event_count&&
   a.mock_reconciliation_required===b.mock_reconciliation_required&&
   a.execution_authorized===false&&b.execution_authorized===false&&
   a.network_performed===false&&b.network_performed===false&&
   a.persisted===false&&b.persisted===false;
  if(!stable){add("INCONCLUSIVE","A_A_REPLAY_NOT_REPRODUCIBLE",c.events.length,quotes);continue;}
  if(a.status==="DENY"){add("INCONCLUSIVE","ACCEPTED_REPLAY_REJECTED",c.events.length,quotes);continue;}
  if(quotes===0){add("INCONCLUSIVE","NO_SYNTHETIC_QUOTE",c.events.length,quotes);continue;}
  if(nonactionable){add("INCONCLUSIVE","NONACTIONABLE_INVENTED_QUOTE",c.events.length,quotes);continue;}
  if(a.status!=="SYNTHETIC_REPLAY_COMPLETE"||a.mock_reconciliation_required!==false){
   add("INCONCLUSIVE","UNKNOWN_INVENTED_REPLAY_EFFECT",c.events.length,quotes);continue;
  }
  if(typeof a.output_canonical_event_hash!=="string"||
   !HASH.test(a.output_canonical_event_hash)){
   add("INCONCLUSIVE","MISSING_METADATA_PROOF",c.events.length,quotes);continue;
  }
  add("REPRODUCIBLE_INVENTED_ONLY","LOCAL_A_A_MODEL_HASH_ONLY",
   c.events.length,quotes,a.output_canonical_event_hash);
 }
 const all=receipts.length===input.cases.length&&inconclusive===0;
 return result(all?"SYNTHETIC_RESEARCH_REPRODUCIBLE":"SYNTHETIC_RESEARCH_INCONCLUSIVE",
  all?"INVENTED_A_A_DETERMINISM_NOT_FINANCIAL_PERFORMANCE":
   "INCOMPLETE_OR_UNKNOWN_INVENTED_CASES_NO_SELECTION",{
    research_version:VERSION,case_count:receipts.length,
    reproducible_case_count:reproducible,inconclusive_case_count:inconclusive,
    actual_mock_replay_invocations:executed,synthetic_quote_count:quote_total,
    case_receipts:Object.freeze(receipts)
   });
}
/** No financial benchmark, public raw data, actual strategy rankings or external services. */
export function runSyntheticResearch(input){
 try{return study(input);}catch{return deny("INVALID_RESEARCH_INPUT");}
}
