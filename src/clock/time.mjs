// FV-CLOCK-001: pure fictional timestamp contracts. No OS time, vendor clock or trading authority.
export const CLOCK_SYNC_STATES=Object.freeze(["HEALTHY","DEGRADED","UNSYNCHRONIZED","UNKNOWN"]);
export const SOURCE_TIME_SEMANTICS=Object.freeze(["EVENT","BATCH","SEND","UNKNOWN"]);
const SAMPLE_FIELDS=Object.freeze([
 "schema_version","source_class","clock_domain_id","receive_epoch_id","instrument_contract_id",
 "local_receive_monotonic_ns","local_receive_wall_utc_ns","estimated_clock_error_ns","sync_state",
 "source_event_utc_ns","source_event_uncertainty_ns","source_timestamp_semantics"
]);
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SIGNED=/^(0|-?[1-9][0-9]*)$/;
const UNSIGNED=/^(0|[1-9][0-9]*)$/;
const I64_MIN=-(1n<<63n),I64_MAX=(1n<<63n)-1n,U64_MAX=(1n<<64n)-1n;
const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const validId=x=>typeof x==="string"&&ID.test(x)&&x!=="ALL"&&x!=="*";
function decimal(value,kind){
 if(typeof value!=="string")return null;
 if(value.length>20||!(kind==="i64"?SIGNED:UNSIGNED).test(value))return null;
 const n=BigInt(value);
 if(kind==="i64"&&(n<I64_MIN||n>I64_MAX))return null;
 if(kind==="u64"&&(n<0n||n>U64_MAX))return null;
 return n;
}
function outcome(status,reason_code,sample=null){
 return Object.freeze({schema_version:0,status,reason_code,sample,
  fixture_only:true,remote_latency_claim_allowed:false,trading_authorized:false});
}
const deny=reason=>outcome("DENY",reason);
function validate(raw){
 if(!plain(raw)||raw.schema_version!==0||!["SYNTHETIC_FIXTURE","REAL_VENDOR"].includes(raw.source_class))return deny("INVALID_SAMPLE");
 if(raw.source_class!=="SYNTHETIC_FIXTURE")return deny("TRUSTED_CLOCK_NOT_IMPLEMENTED");
 if(Object.keys(raw).length!==SAMPLE_FIELDS.length||!SAMPLE_FIELDS.every(k=>Object.hasOwn(raw,k)))return deny("INVALID_SAMPLE");
 if(!validId(raw.clock_domain_id)||!validId(raw.receive_epoch_id)||!validId(raw.instrument_contract_id)||
    !CLOCK_SYNC_STATES.includes(raw.sync_state)||!SOURCE_TIME_SEMANTICS.includes(raw.source_timestamp_semantics))return deny("INVALID_SAMPLE");
 const mono=decimal(raw.local_receive_monotonic_ns,"i64");
 const wall=decimal(raw.local_receive_wall_utc_ns,"i64");
 if(mono===null||mono<0n||wall===null)return deny("INVALID_SAMPLE");
 const err=raw.estimated_clock_error_ns===null?null:decimal(raw.estimated_clock_error_ns,"u64");
 const source=raw.source_event_utc_ns===null?null:decimal(raw.source_event_utc_ns,"i64");
 const sourceErr=raw.source_event_uncertainty_ns===null?null:decimal(raw.source_event_uncertainty_ns,"u64");
 if(raw.estimated_clock_error_ns!==null&&err===null)return deny("INVALID_SAMPLE");
 if(raw.source_event_utc_ns!==null&&source===null)return deny("INVALID_SAMPLE");
 if(raw.source_event_uncertainty_ns!==null&&sourceErr===null)return deny("INVALID_SAMPLE");
 if(source===null&&(raw.source_timestamp_semantics!=="UNKNOWN"||sourceErr!==null))return deny("INCONSISTENT_SOURCE_TIMESTAMP");
 const sample=Object.freeze(Object.fromEntries(SAMPLE_FIELDS.map(k=>[k,raw[k]])));
 return outcome("VALID","SYNTHETIC_SAMPLE_ONLY",sample);
}
export function normalizeSyntheticClockSample(raw){
 try{return validate(raw);}catch{return deny("INVALID_SAMPLE");}
}
function getPair(start,end){
 const a=normalizeSyntheticClockSample(start),b=normalizeSyntheticClockSample(end);
 if(a.status!=="VALID")return {error:a.reason_code};
 if(b.status!=="VALID")return {error:b.reason_code};
 return {a:a.sample,b:b.sample};
}
export function elapsedWithinSyntheticDomain(start,end){
 const p=getPair(start,end);
 if(p.error)return deny(p.error);
 const {a,b}=p;
 if(a.clock_domain_id!==b.clock_domain_id||a.receive_epoch_id!==b.receive_epoch_id)return deny("CROSS_DOMAIN");
 const elapsed=BigInt(b.local_receive_monotonic_ns)-BigInt(a.local_receive_monotonic_ns);
 if(elapsed<0n)return deny("BACKWARD_MONOTONIC");
 if(BigInt(b.local_receive_wall_utc_ns)<BigInt(a.local_receive_wall_utc_ns))return deny("BACKWARD_WALL");
 return Object.freeze({schema_version:0,status:"ELAPSED",reason_code:"SYNTHETIC_SAME_DOMAIN_ONLY",
  elapsed_ns:elapsed.toString(),fixture_only:true,remote_latency_claim_allowed:false,trading_authorized:false});
}
export function compareSyntheticSourceEventOrder(first,second){
 const p=getPair(first,second);
 if(p.error)return deny(p.error);
 const {a,b}=p;
 if(a.instrument_contract_id!==b.instrument_contract_id)return deny("INSTRUMENT_MISMATCH");
 if(a.source_event_utc_ns===null||b.source_event_utc_ns===null)return deny("UNKNOWN_SOURCE_TIME");
 if(a.source_timestamp_semantics!=="EVENT"||b.source_timestamp_semantics!=="EVENT")return deny("NON_EVENT_TIMESTAMP_SEMANTICS");
 if(a.sync_state!=="HEALTHY"||b.sync_state!=="HEALTHY")return deny("CLOCK_UNSYNCHRONIZED");
 if(a.estimated_clock_error_ns===null||b.estimated_clock_error_ns===null||
    a.source_event_uncertainty_ns===null||b.source_event_uncertainty_ns===null)return deny("UNKNOWN_CLOCK");
 const aBound=BigInt(a.estimated_clock_error_ns)+BigInt(a.source_event_uncertainty_ns);
 const bBound=BigInt(b.estimated_clock_error_ns)+BigInt(b.source_event_uncertainty_ns);
 const aEvent=BigInt(a.source_event_utc_ns),bEvent=BigInt(b.source_event_utc_ns);
 let status="AMBIGUOUS",reason_code="OVERLAPPING_UNCERTAINTY";
 if(aEvent+aBound<bEvent-bBound){status="BEFORE";reason_code="SYNTHETIC_DISJOINT_EVENT_INTERVALS";}
 else if(bEvent+bBound<aEvent-aBound){status="AFTER";reason_code="SYNTHETIC_DISJOINT_EVENT_INTERVALS";}
 return Object.freeze({schema_version:0,status,reason_code,fixture_only:true,
  remote_latency_claim_allowed:false,trading_authorized:false});
}
