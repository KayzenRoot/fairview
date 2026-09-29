import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {assessSyntheticCapture,elapsedSyntheticInDomain,compareSyntheticSourceEvents}
 from "../../src/clock/integrity.mjs";

const cp=Object.freeze({max_clock_error_ns:"1000000",max_wall_delta_disagreement_ns:"3000000"});
const ep=Object.freeze({max_provider_error_ns:"1000000"});
const base=Object.freeze({schema_version:0,source_class:"SYNTHETIC_FIXTURE",clock_domain_id:"mock-host-1",
 receive_epoch_id:"mock-boot-1",local_receive_monotonic_ns:"1000000000000000000",
 local_receive_wall_utc_ns:"1710000000000000000",estimated_clock_error_ns:"500000",sync_state:"HEALTHY"});
const later=Object.freeze({...base,local_receive_monotonic_ns:"1000000000500000000",
 local_receive_wall_utc_ns:"1710000000500000000"});
const ev=Object.freeze({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 instrument_contract_id:"EURUSD_SPOT_FIXTURE",provider_time_evidence_ref:"invented-proof-1",
 source_timestamp_semantics:"EVENT",source_event_utc_ns:"1710000000000000000",
 source_event_uncertainty_ns:"100000",provider_clock_error_ns:"100000"});
const next=Object.freeze({...ev,provider_time_evidence_ref:"invented-proof-2",
 source_event_utc_ns:"1710000000001000000"});
const checked=r=>{assert.equal(r.fixture_only,true);assert.equal(r.execution_authorized,false);
 assert.equal(r.remote_one_way_latency_proven,false);assert(Object.isFrozen(r));assert(Object.isFrozen(r.reason_codes));return r};
const reason=(r,code)=>{checked(r);assert(r.reason_codes.includes(code),JSON.stringify(r));assert.equal(r.utc_order_eligible,false)};

test("single invented capture is healthy only inside configured local error budget",()=>{
 const r=checked(assessSyntheticCapture(base,cp));
 assert.equal(r.state,"HEALTHY");assert.equal(r.utc_order_eligible,true);
});
test("invented same-domain 500ms duration uses exact nanosecond strings",()=>{
 const r=checked(elapsedSyntheticInDomain(base,later,cp));
 assert.equal(r.state,"HEALTHY");assert.equal(r.elapsed_ns,"500000000");
 assert.equal(r.duration_context,"LOCAL_SYNTHETIC_SAME_DOMAIN_ONLY");
});
test("invented identical monotonic and wall samples admit zero local elapsed",()=>{
 const r=checked(elapsedSyntheticInDomain(base,base,cp));
 assert.equal(r.elapsed_ns,"0");
});
test("max signed 64-bit capture retains nanosecond precision above JS safe integers",()=>{
 const a={...base,local_receive_monotonic_ns:"9223372036854775700",
 local_receive_wall_utc_ns:"9223372036854775700"};
 const b={...a,local_receive_monotonic_ns:"9223372036854775807",local_receive_wall_utc_ns:"9223372036854775807"};
 assert.equal(checked(elapsedSyntheticInDomain(a,b,cp)).elapsed_ns,"107");
});
const invalidCaptures=[
 ["null",null],["array",[]],["empty",{}],["untrusted prototype",Object.create(null)],
 ["unknown schema",{...base,schema_version:1}],
 ["number mono",{...base,local_receive_monotonic_ns:1000}],
 ["float mono",{...base,local_receive_monotonic_ns:"1.5"}],
 ["exponent mono",{...base,local_receive_monotonic_ns:"1e9"}],
 ["leading-zero mono",{...base,local_receive_monotonic_ns:"001"}],
 ["negative mono",{...base,local_receive_monotonic_ns:"-1"}],
 ["overflow mono",{...base,local_receive_monotonic_ns:"9223372036854775808"}],
 ["overflow wall",{...base,local_receive_wall_utc_ns:"9223372036854775808"}],
 ["negative zero wall",{...base,local_receive_wall_utc_ns:"-0"}],
 ["missing clock domain",{...base,clock_domain_id:undefined}],
 ["wildcard epoch",{...base,receive_epoch_id:"*"}],
 ["missing error",{...base,estimated_clock_error_ns:undefined}],
 ["negative error",{...base,estimated_clock_error_ns:"-1"}],
 ["invalid health",{...base,sync_state:"GREEN"}],
 ["missing source class",{...base,source_class:undefined}]
];
for(const [name,x] of invalidCaptures){
 test("malformed local capture DENY: "+name,()=>reason(assessSyntheticCapture(x,cp),"INVALID_CAPTURE"));
}
const invalidPolicies=[null,{}, {max_clock_error_ns:-2}, {max_clock_error_ns:1.25},
 {max_clock_error_ns:"-2"},{max_clock_error_ns:"01"},{max_clock_error_ns:"1e6"},
 {max_clock_error_ns:"9223372036854775808"}];
for(const [index,p] of invalidPolicies.entries()){
 test("malformed local clock policy DENY #"+index,()=>reason(assessSyntheticCapture(base,p),"INVALID_CLOCK_POLICY"));
}
test("real provider-looking capture never becomes verified by caller",()=>reason(assessSyntheticCapture({...base,source_class:"REAL_VENDOR"},cp),"REAL_PROVIDER_NOT_IMPLEMENTED"));
for(const [name,input,code,state] of [
 ["sync unknown",{sync_state:"UNKNOWN"},"UNKNOWN_CLOCK","UNKNOWN"],
 ["sync degraded",{sync_state:"DEGRADED"},"DEGRADED_CLOCK","DEGRADED"],
 ["unsynchronized",{sync_state:"UNSYNCHRONIZED"},"UNSYNCHRONIZED_CLOCK","UNSYNCHRONIZED"],
 ["missing bound",{estimated_clock_error_ns:null},"UNKNOWN_CLOCK_ERROR","UNKNOWN"],
 ["error above bound",{estimated_clock_error_ns:"1000001"},"CLOCK_ERROR_BUDGET_EXCEEDED","DEGRADED"]
]){
 test("capture quality FAIL-CLOSED: "+name,()=>{
  const r=assessSyntheticCapture({...base,...input},cp);reason(r,code);assert.equal(r.state,state);
 });
}
for(const [name,second,code] of [
 ["different domain",{clock_domain_id:"mock-host-2"},"CROSS_DOMAIN"],
 ["same domain different process epoch",{receive_epoch_id:"mock-boot-2"},"CROSS_DOMAIN"],
 ["monotonic rollback",{local_receive_monotonic_ns:"999999999999999999"},"BACKWARD_MONOTONIC"],
 ["backwards wall",{local_receive_wall_utc_ns:"1709999999999999999"},"BACKWARD_WALL"],
 ["wall forward leap",{local_receive_wall_utc_ns:"1710000000600000000"},"WALL_STEP_OR_CLOCK_DRIFT"],
 ["remote non-synthetic",{source_class:"REAL_VENDOR"},"REAL_PROVIDER_NOT_IMPLEMENTED"]
]){
 test("elapsed pair denies "+name,()=>reason(elapsedSyntheticInDomain(base,{...later,...second},cp),code));
}
test("elapsed pair rejects missing step tolerance",()=>reason(elapsedSyntheticInDomain(base,later,{max_clock_error_ns:"1000000"}),"INVALID_CLOCK_POLICY"));
test("elapsed pair rejects missing or malformed second sample",()=>reason(elapsedSyntheticInDomain(base,{...later,local_receive_monotonic_ns:1},cp),"INVALID_CAPTURE"));
for(const [name,update,code] of [
 ["unknown sync",{sync_state:"UNKNOWN"},"UNKNOWN_CLOCK"],
 ["unhealthy sync",{sync_state:"DEGRADED"},"DEGRADED_CLOCK"],
 ["unknown bound",{estimated_clock_error_ns:null},"UNKNOWN_CLOCK_ERROR"],
 ["budget exceeded",{estimated_clock_error_ns:"1000001"},"CLOCK_ERROR_BUDGET_EXCEEDED"]
]){
 test("elapsed pair denies "+name,()=>reason(elapsedSyntheticInDomain(base,{...later,...update},cp),code));
}
test("source intervals can order either direction with invented trusted-format event timestamps",()=>{
 const a=checked(compareSyntheticSourceEvents(ev,next,ep));
 assert.equal(a.state,"ORDERED");assert.equal(a.order,"LEFT_BEFORE_RIGHT");
 const b=checked(compareSyntheticSourceEvents(next,ev,ep));
 assert.equal(b.state,"ORDERED");assert.equal(b.order,"RIGHT_BEFORE_LEFT");
});
test("source overlapping uncertainty intervals are ambiguous, never sorted by naive UTC",()=>{
 const b={...ev,provider_time_evidence_ref:"other",source_event_utc_ns:"1710000000000399999"};
 reason(compareSyntheticSourceEvents(ev,b,ep),"AMBIGUOUS_INTERVAL");
});
test("source adjacent uncertainty intervals with a shared boundary remain ambiguous",()=>{
 const b={...ev,provider_time_evidence_ref:"other",source_event_utc_ns:"1710000000000400000"};
 reason(compareSyntheticSourceEvents(ev,b,ep),"AMBIGUOUS_INTERVAL");
});
for(const [name,input,code] of [
 ["different instrument",{instrument_contract_id:"GBPUSD_SPOT_FIXTURE"},"INSTRUMENT_MISMATCH"],
 ["batch source semantics",{source_timestamp_semantics:"BATCH"},"UNSUPPORTED_TIMESTAMP_SEMANTICS"],
 ["send timestamp",{source_timestamp_semantics:"SEND"},"UNSUPPORTED_TIMESTAMP_SEMANTICS"],
 ["unknown semantics",{source_timestamp_semantics:"UNKNOWN"},"UNSUPPORTED_TIMESTAMP_SEMANTICS"],
 ["missing remote error",{provider_clock_error_ns:null},"UNKNOWN_PROVIDER_CLOCK"],
 ["missing source uncertainty",{source_event_uncertainty_ns:null},"UNKNOWN_PROVIDER_CLOCK"],
 ["high remote uncertainty",{provider_clock_error_ns:"1000001"},"PROVIDER_ERROR_BUDGET_EXCEEDED"],
 ["real provider statement",{source_class:"REAL_VENDOR"},"REAL_PROVIDER_NOT_IMPLEMENTED"],
 ["i64 signed overflow",{source_event_utc_ns:"9223372036854775808"},"INVALID_SOURCE_EVENT"],
 ["floating timestamp",{source_event_utc_ns:1.25},"INVALID_SOURCE_EVENT"],
 ["missing provenance",{provider_time_evidence_ref:null},"INVALID_SOURCE_EVENT"],
 ["large error interval",{source_event_uncertainty_ns:"9223372036854775807",provider_clock_error_ns:"1"},"UNCERTAINTY_INTERVAL_UNBOUNDED"]
]){
 test("source-event comparison fails closed for "+name,()=>{
  const policy=name==="large error interval"?{max_provider_error_ns:"1000000"}:ep;
  const r=compareSyntheticSourceEvents(ev,{...next,...input},policy);reason(r,code);
 });
}
test("source comparison rejects absent provider-error policy",()=>reason(compareSyntheticSourceEvents(ev,next,{}),"INVALID_CLOCK_POLICY"));
test("source comparison rejects null or array event",()=>{
 reason(compareSyntheticSourceEvents(null,next,ep),"INVALID_SOURCE_EVENT");
 reason(compareSyntheticSourceEvents(ev,[],ep),"INVALID_SOURCE_EVENT");
});
test("source parser accepts explicit negative signed i64 values in invented pre-epoch data",()=>{
 const x={...ev,source_event_utc_ns:"-9223372036854775808"};
 const y={...ev,source_event_utc_ns:"-9223372036854775700"};
 assert.equal(checked(compareSyntheticSourceEvents(x,y,{max_provider_error_ns:"1"})).state,"DEGRADED");
});
test("implementation source is pure and cannot read host time or call external services",()=>{
 const source=fs.readFileSync(new URL("../../src/clock/integrity.mjs",import.meta.url),"utf8");
 for(const forbidden of ["Date.now(", "process.hrtime(", "fetch(", "setTimeout(", "require(", "node:fs", "node:net", "node:http"])
  assert(!source.includes(forbidden),"FORBIDDEN_SIDE_EFFECT "+forbidden);
 assert(!source.includes("execution_authorized:true"));
});
