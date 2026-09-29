// FV-CLOCK-001: PURE, SYNTHETIC time-integrity accounting, not actual clock capture.
// Every result is non-authoritative: no provider clock calibration or trading permission.
const MIN_I64=-(1n<<63n), MAX_I64=(1n<<63n)-1n;
const DECIMAL=/^(?:0|-?[1-9][0-9]*)$/;
const POSITIVE=/^(?:0|[1-9][0-9]*)$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SYNC=new Set(["HEALTHY","DEGRADED","UNSYNCHRONIZED","UNKNOWN"]);
const SEMANTICS=new Set(["EVENT","BATCH","SEND","UNKNOWN"]);
const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const id=x=>typeof x==="string"&&ID.test(x)&&x!=="*"&&x!=="ALL";
function parseNs(v,{unsigned=false,nullable=false}={}){
 if(v===null&&nullable)return null;
 if(typeof v!=="string"||!(unsigned?POSITIVE:DECIMAL).test(v))return undefined;
 try{const n=BigInt(v);return n>= (unsigned?0n:MIN_I64)&&n<=MAX_I64?n:undefined;}catch{return undefined;}
}
function outcome(state,reason_codes,extra={}){
 return Object.freeze({schema_version:0,state,reason_codes:Object.freeze([...reason_codes]),
  fixture_only:true,execution_authorized:false,remote_one_way_latency_proven:false,...extra});
}
const denied=reason=>outcome("DENY",[reason],{utc_order_eligible:false});
function parseCapture(c){
 if(!plain(c)||c.schema_version!==0||!["SYNTHETIC_FIXTURE","REAL_VENDOR"].includes(c.source_class)||
    !id(c.clock_domain_id)||!id(c.receive_epoch_id)||!SYNC.has(c.sync_state))return null;
 const mono=parseNs(c.local_receive_monotonic_ns,{unsigned:true});
 const wall=parseNs(c.local_receive_wall_utc_ns);
 const err=parseNs(c.estimated_clock_error_ns,{unsigned:true,nullable:true});
 if(mono===undefined||wall===undefined||err===undefined||!Object.hasOwn(c,"estimated_clock_error_ns"))return null;
 return {mono,wall,err,sync:c.sync_state,domain:c.clock_domain_id,
  epoch:c.receive_epoch_id,source:c.source_class};
}
function budget(p,name){return plain(p)?parseNs(p[name],{unsigned:true}):undefined;}
function captureHealth(c,maxError){
 if(c.sync==="UNKNOWN")return outcome("UNKNOWN",["UNKNOWN_CLOCK"],{utc_order_eligible:false});
 if(c.sync==="DEGRADED")return outcome("DEGRADED",["DEGRADED_CLOCK"],{utc_order_eligible:false});
 if(c.sync==="UNSYNCHRONIZED")return outcome("UNSYNCHRONIZED",["UNSYNCHRONIZED_CLOCK"],{utc_order_eligible:false});
 if(c.err===null)return outcome("UNKNOWN",["UNKNOWN_CLOCK_ERROR"],{utc_order_eligible:false});
 if(c.err>maxError)return outcome("DEGRADED",["CLOCK_ERROR_BUDGET_EXCEEDED"],{utc_order_eligible:false});
 return outcome("HEALTHY",["SYNTHETIC_LOCAL_BOUND_ONLY"],{utc_order_eligible:true});
}
/** Synthetic local receive pairing only. No host clock or OS synchronization call. */
export function assessSyntheticCapture(input,policy){
 const max=budget(policy,"max_clock_error_ns");
 if(max===undefined)return denied("INVALID_CLOCK_POLICY");
 const c=parseCapture(input);
 if(!c)return denied("INVALID_CAPTURE");
 if(c.source!=="SYNTHETIC_FIXTURE")return denied("REAL_PROVIDER_NOT_IMPLEMENTED");
 return captureHealth(c,max);
}
/** Elapsed is meaningful only inside identical synthetic monotonic domain AND boot epoch. */
export function elapsedSyntheticInDomain(first,last,policy){
 const max=budget(policy,"max_clock_error_ns");
 const step=budget(policy,"max_wall_delta_disagreement_ns");
 if(max===undefined||step===undefined)return denied("INVALID_CLOCK_POLICY");
 const a=parseCapture(first),b=parseCapture(last);
 if(!a||!b)return denied("INVALID_CAPTURE");
 if(a.source!=="SYNTHETIC_FIXTURE"||b.source!=="SYNTHETIC_FIXTURE")return denied("REAL_PROVIDER_NOT_IMPLEMENTED");
 if(a.domain!==b.domain||a.epoch!==b.epoch)return denied("CROSS_DOMAIN");
 if(b.mono<a.mono)return denied("BACKWARD_MONOTONIC");
 if(b.wall<a.wall)return denied("BACKWARD_WALL");
 const md=b.mono-a.mono,wd=b.wall-a.wall;
 const difference=md>wd?md-wd:wd-md;
 if(difference>step)return denied("WALL_STEP_OR_CLOCK_DRIFT");
 for(const capture of [a,b]){
  const q=captureHealth(capture,max);
  if(q.state!=="HEALTHY")return outcome(q.state,q.reason_codes,{utc_order_eligible:false});
 }
 return outcome("HEALTHY",["SYNTHETIC_SAME_DOMAIN_ELAPSED_ONLY"],
  {elapsed_ns:md.toString(),clock_domain_id:a.domain,receive_epoch_id:a.epoch,
   utc_order_eligible:true,duration_context:"LOCAL_SYNTHETIC_SAME_DOMAIN_ONLY"});
}
function parseEvent(e){
 if(!plain(e)||e.schema_version!==0||!["SYNTHETIC_FIXTURE","REAL_VENDOR"].includes(e.source_class)||
    !id(e.instrument_contract_id)||!id(e.provider_time_evidence_ref)||!SEMANTICS.has(e.source_timestamp_semantics))return null;
 const event=parseNs(e.source_event_utc_ns);
 const uncertainty=parseNs(e.source_event_uncertainty_ns,{unsigned:true,nullable:true});
 const providerError=parseNs(e.provider_clock_error_ns,{unsigned:true,nullable:true});
 if(event===undefined||uncertainty===undefined||providerError===undefined||
    !Object.hasOwn(e,"source_event_uncertainty_ns")||!Object.hasOwn(e,"provider_clock_error_ns"))return null;
 return {event,uncertainty,providerError,semantics:e.source_timestamp_semantics,
  contract:e.instrument_contract_id,source:e.source_class};
}
/** Conditional synthetic event-interval ordering, NEVER evidence of real cross-host latency. */
export function compareSyntheticSourceEvents(left,right,policy){
 const max=budget(policy,"max_provider_error_ns");
 if(max===undefined)return denied("INVALID_CLOCK_POLICY");
 const a=parseEvent(left),b=parseEvent(right);
 if(!a||!b)return denied("INVALID_SOURCE_EVENT");
 if(a.source!=="SYNTHETIC_FIXTURE"||b.source!=="SYNTHETIC_FIXTURE")return denied("REAL_PROVIDER_NOT_IMPLEMENTED");
 if(a.contract!==b.contract)return denied("INSTRUMENT_MISMATCH");
 if(a.semantics!=="EVENT"||b.semantics!=="EVENT")return denied("UNSUPPORTED_TIMESTAMP_SEMANTICS");
 if(a.uncertainty===null||b.uncertainty===null||a.providerError===null||b.providerError===null)
  return outcome("UNKNOWN",["UNKNOWN_PROVIDER_CLOCK"],{utc_order_eligible:false});
 if(a.providerError>max||b.providerError>max)
  return outcome("DEGRADED",["PROVIDER_ERROR_BUDGET_EXCEEDED"],{utc_order_eligible:false});
 const ae=a.uncertainty+a.providerError,be=b.uncertainty+b.providerError;
 if(ae>MAX_I64||be>MAX_I64)return denied("UNCERTAINTY_INTERVAL_UNBOUNDED");
 if(a.event+ae<b.event-be)
  return outcome("ORDERED",["SYNTHETIC_INTERVALS_NONOVERLAPPING"],
   {order:"LEFT_BEFORE_RIGHT",utc_order_eligible:true});
 if(b.event+be<a.event-ae)
  return outcome("ORDERED",["SYNTHETIC_INTERVALS_NONOVERLAPPING"],
   {order:"RIGHT_BEFORE_LEFT",utc_order_eligible:true});
 return outcome("UNKNOWN",["AMBIGUOUS_INTERVAL"],{utc_order_eligible:false});
}
