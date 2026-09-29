import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {CLOCK_SYNC_STATES,SOURCE_TIME_SEMANTICS,normalizeSyntheticClockSample,elapsedWithinSyntheticDomain,compareSyntheticSourceEventOrder} from "../../src/clock/time.mjs";

const sample=(override={})=>({
 schema_version:0,source_class:"SYNTHETIC_FIXTURE",clock_domain_id:"fictional_host_A_process_1",
 receive_epoch_id:"fictional_boot_01",instrument_contract_id:"FICTIONAL_EURUSD_SPOT",
 local_receive_monotonic_ns:"10000000000000001",local_receive_wall_utc_ns:"1700000000000000000",
 estimated_clock_error_ns:"100",sync_state:"HEALTHY",
 source_event_utc_ns:"1700000000000000000",source_event_uncertainty_ns:"50",
 source_timestamp_semantics:"EVENT",...override
});
const accept=s=>{const r=normalizeSyntheticClockSample(s);assert.equal(r.status,"VALID",JSON.stringify(r));assert.equal(r.fixture_only,true);assert.equal(r.trading_authorized,false);assert.equal(r.remote_latency_claim_allowed,false);return r};
const deny=(r,reason)=>{assert.equal(r.status,"DENY",JSON.stringify(r));assert.equal(r.reason_code,reason);assert.equal(r.trading_authorized,false);assert.equal(r.remote_latency_claim_allowed,false);return r};

test("known sync and provider timestamp semantics remain explicit and immutable",()=>{
 assert.deepEqual(CLOCK_SYNC_STATES,["HEALTHY","DEGRADED","UNSYNCHRONIZED","UNKNOWN"]);
 assert.deepEqual(SOURCE_TIME_SEMANTICS,["EVENT","BATCH","SEND","UNKNOWN"]);
 assert(Object.isFrozen(CLOCK_SYNC_STATES)&&Object.isFrozen(SOURCE_TIME_SEMANTICS));
});
test("validated lossless nanosecond sample stays immutable with exact JSON strings",()=>{
 const r=accept(sample());
 assert(Object.isFrozen(r)&&Object.isFrozen(r.sample));
 assert.equal(r.sample.local_receive_monotonic_ns,"10000000000000001");
 assert.equal(JSON.parse(JSON.stringify(r)).sample.local_receive_monotonic_ns,"10000000000000001");
});
test("REAL_VENDOR time is denied without genuine independently adopted provider evidence",()=>{
 deny(normalizeSyntheticClockSample(sample({source_class:"REAL_VENDOR"})),"TRUSTED_CLOCK_NOT_IMPLEMENTED");
});
for(const [i,x] of [null,undefined,{},[],false,0,"2026-09-29",Object.create(null)].entries()){
 test("malformed top-level synthetic input is DENY case "+i,()=>deny(normalizeSyntheticClockSample(x),"INVALID_SAMPLE"));
}
for(const [label,patch,reason="INVALID_SAMPLE"] of [
 ["wrong schema",{schema_version:1}],["unknown class",{source_class:"CLOUD_MODEL"}],
 ["missing domain",{clock_domain_id:""}],["wildcard domain",{clock_domain_id:"*"}],
 ["missing boot epoch",{receive_epoch_id:""}],["unknown sync label",{sync_state:"MAGIC"}],
 ["numeric unsafe nanosecond",{local_receive_monotonic_ns:Number.MAX_SAFE_INTEGER+20}],
 ["numeric wall",{local_receive_wall_utc_ns:1700000000000000000}],
 ["negative monotonic",{local_receive_monotonic_ns:"-1"}],
 ["noncanonical leading zero",{local_receive_monotonic_ns:"0001"}],
 ["noncanonical negative zero",{local_receive_wall_utc_ns:"-0"}],
 ["monotonic above signed i64",{local_receive_monotonic_ns:"9223372036854775808"}],
 ["wall below signed i64",{local_receive_wall_utc_ns:"-9223372036854775809"}],
 ["source time above signed i64",{source_event_utc_ns:"9223372036854775808"}],
 ["clock error above unsigned u64",{estimated_clock_error_ns:"18446744073709551616"}],
 ["negative local error",{estimated_clock_error_ns:"-1"}],
 ["source uncertainty overflow",{source_event_uncertainty_ns:"18446744073709551616"}],
 ["invalid source time semantics",{source_timestamp_semantics:"HTTP_RECEIVE"}],
 ["no source time marked as event",{source_event_utc_ns:null,source_event_uncertainty_ns:null}, "INCONSISTENT_SOURCE_TIMESTAMP"],
 ["source uncertainty without source time",{source_event_utc_ns:null,source_timestamp_semantics:"UNKNOWN"},"INCONSISTENT_SOURCE_TIMESTAMP"]
]){
 test("malformed or inconsistent sample DENY: "+label,()=>deny(normalizeSyntheticClockSample(sample(patch)),reason));
}
test("missing or additional schema fields never silently become authority",()=>{
 const missing=sample();delete missing.receive_epoch_id;
 deny(normalizeSyntheticClockSample(missing),"INVALID_SAMPLE");
 deny(normalizeSyntheticClockSample(sample({execution_authorized:true})),"INVALID_SAMPLE");
});
test("signed i64 extrema and unsigned u64 extrema survive normalization as strings",()=>{
 const p=sample({local_receive_monotonic_ns:"9223372036854775807",
 local_receive_wall_utc_ns:"-9223372036854775808",source_event_utc_ns:"9223372036854775807",
 estimated_clock_error_ns:"18446744073709551615",source_event_uncertainty_ns:"18446744073709551615"});
 const r=accept(p);assert.equal(r.sample.local_receive_wall_utc_ns,"-9223372036854775808");
 assert.equal(r.sample.estimated_clock_error_ns,"18446744073709551615");
});
test("absent source time stays explicitly unknown, never zero",()=>{
 const r=accept(sample({source_event_utc_ns:null,source_event_uncertainty_ns:null,source_timestamp_semantics:"UNKNOWN"}));
 assert.equal(r.sample.source_event_utc_ns,null);
 deny(compareSyntheticSourceEventOrder(r.sample,sample()),"UNKNOWN_SOURCE_TIME");
});
test("same-domain elapsed is exact BigInt and never a remote latency claim",()=>{
 const r=elapsedWithinSyntheticDomain(sample(),sample({
 local_receive_monotonic_ns:"10000000000000124",local_receive_wall_utc_ns:"1700000000000000123"}));
 assert.equal(r.status,"ELAPSED");
 assert.equal(r.elapsed_ns,"123");
 assert.equal(r.remote_latency_claim_allowed,false);
 assert.equal(r.trading_authorized,false);
});
test("simultaneous local receive samples have exact elapsed zero",()=>{
 const r=elapsedWithinSyntheticDomain(sample(),sample());
 assert.equal(r.status,"ELAPSED");assert.equal(r.elapsed_ns,"0");
});
for(const [label,override] of [
 ["different process",{clock_domain_id:"fictional_host_A_process_2"}],
 ["different host",{clock_domain_id:"fictional_host_B_process_1"}],
 ["restart epoch",{receive_epoch_id:"fictional_boot_02"}]
])test("monotonic duration CROSS_DOMAIN on "+label,()=>{
 deny(elapsedWithinSyntheticDomain(sample(),sample(override)),"CROSS_DOMAIN");
});
test("backwards monotonic reading in same domain fails closed",()=>{
 deny(elapsedWithinSyntheticDomain(sample(),sample({local_receive_monotonic_ns:"10000000000000000"})),"BACKWARD_MONOTONIC");
});
test("backward wall-clock step cannot be silently used for UTC correlation",()=>{
 deny(elapsedWithinSyntheticDomain(sample(),sample({local_receive_monotonic_ns:"10000000000000002",
  local_receive_wall_utc_ns:"1699999999999999999"})),"BACKWARD_WALL");
});
test("elapsed function rejects any malformed or untrusted endpoint",()=>{
 deny(elapsedWithinSyntheticDomain(sample(),sample({source_class:"REAL_VENDOR"})),"TRUSTED_CLOCK_NOT_IMPLEMENTED");
});
test("disjoint declared synthetic event windows establish hypothetical ordering only",()=>{
 const a=sample();
 const b=sample({clock_domain_id:"fictional_other_host",receive_epoch_id:"fictional_other_boot",
  source_event_utc_ns:"1700000000000001000"});
 const before=compareSyntheticSourceEventOrder(a,b),after=compareSyntheticSourceEventOrder(b,a);
 assert.equal(before.status,"BEFORE");
 assert.equal(after.status,"AFTER");
 for(const v of [before,after]){
  assert.equal(v.reason_code,"SYNTHETIC_DISJOINT_EVENT_INTERVALS");
  assert.equal(v.remote_latency_claim_allowed,false);
  assert.equal(v.trading_authorized,false);
 }
});
test("overlapping or exactly touching event uncertainty windows cannot establish order",()=>{
 for(const delta of ["0","200","300"]){
  const b=sample({source_event_utc_ns:(1700000000000000000n+BigInt(delta)).toString()});
  const result=compareSyntheticSourceEventOrder(sample(),b);
  assert.equal(result.status,"AMBIGUOUS");assert.equal(result.reason_code,"OVERLAPPING_UNCERTAINTY");
 }
});
test("declared uncertainty dominates arbitrarily large nanosecond presentation",()=>{
 const a=sample({estimated_clock_error_ns:"5000"});
 const b=sample({source_event_utc_ns:"1700000000000001000"});
 const result=compareSyntheticSourceEventOrder(a,b);
 assert.equal(result.status,"AMBIGUOUS");
});
test("instruments must be identical before comparing synthetic event timestamps",()=>{
 deny(compareSyntheticSourceEventOrder(sample(),sample({instrument_contract_id:"FICTIONAL_EURUSD_CFD"})),"INSTRUMENT_MISMATCH");
});
for(const semantics of ["BATCH","SEND","UNKNOWN"]){
 test("provider "+semantics+" timestamp is not actionable event UTC",()=>{
  deny(compareSyntheticSourceEventOrder(sample(),sample({source_timestamp_semantics:semantics})),"NON_EVENT_TIMESTAMP_SEMANTICS");
 });
}
for(const sync of ["DEGRADED","UNSYNCHRONIZED","UNKNOWN"]){
 test("synthetic provider event order requires HEALTHY sync, not "+sync,()=>{
  deny(compareSyntheticSourceEventOrder(sample(),sample({sync_state:sync})),"CLOCK_UNSYNCHRONIZED");
 });
}
for(const property of ["estimated_clock_error_ns","source_event_uncertainty_ns"]){
 test("UNKNOWN_CLOCK when one party has no bound on "+property,()=>{
  deny(compareSyntheticSourceEventOrder(sample(),sample({[property]:null})),"UNKNOWN_CLOCK");
 });
}
test("untrusted throwing getters cannot escape the pure evaluator",()=>{
 const invalid=sample();Object.defineProperty(invalid,"clock_domain_id",{get(){throw Error("untrusted");}});
 deny(normalizeSyntheticClockSample(invalid),"INVALID_SAMPLE");
 deny(elapsedWithinSyntheticDomain(sample(),invalid),"INVALID_SAMPLE");
});
test("clock module does not read actual host time or connect to any network",()=>{
 const src=fs.readFileSync(new URL("../../src/clock/time.mjs",import.meta.url),"utf8");
 for(const pattern of [/Date\.now\s*\(/,/performance\.now\s*\(/,/process\.hrtime/,/\bfetch\s*\(/,/WebSocket/,/child_process/,/setSystemTime/,/ntpdate/])assert(!pattern.test(src),pattern.toString());
});
