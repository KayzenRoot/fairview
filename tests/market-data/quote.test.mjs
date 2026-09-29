import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {normalizeSyntheticClockSample} from "../../src/clock/time.mjs";
import {normalizeSyntheticQuote,assessSyntheticQuoteQuality,advanceSyntheticSequence} from "../../src/market-data/quote.mjs";
const capture=(p={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 clock_domain_id:"invented-domain-1",receive_epoch_id:"invented-boot-1",
 instrument_contract_id:"FICTIONAL_EURUSD_SPOT",
 local_receive_monotonic_ns:"10000000000000001",local_receive_wall_utc_ns:"1700000000000000000",
 estimated_clock_error_ns:"100",sync_state:"HEALTHY",source_event_utc_ns:"1700000000000000000",
 source_event_uncertainty_ns:"50",source_timestamp_semantics:"EVENT",...p});
const quote=(p={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",
 quote_id:"invented-quote-1",provider_id:"fake-provider-A",feed_id:"mock-channel-1",
 venue_id:"fake-venue-A",instrument_contract_id:"FICTIONAL_EURUSD_SPOT",
 bid:"1.2300",ask:"1.2400",price_scale:4,bid_size:"100.00",ask_size:"120.00",
 quantity_scale:2,book_depth_level:2,quote_kind:"EXECUTABLE",data_use_scope:"SYNTHETIC_INTERNAL",
 data_rights_ref:"invented-rights-1",delivery:"NORMAL",transport_kind:"REPLAY",
 source_sequence_epoch:"mock-seq-1",provider_sequence:"10",full_snapshot:true,synthetic_fee_known:true,
 capture:capture(),...p});
const quality=Object.freeze({max_receive_age_ns:"1000",max_local_clock_error_ns:"1000",min_depth_levels:1,require_source_event_time:true});
const now=(p={})=>capture({local_receive_monotonic_ns:"10000000000000101",local_receive_wall_utc_ns:"1700000000000000100",...p});
function deny(v,reason){assert.equal(v.reason_code,reason,JSON.stringify(v));assert.equal(v.fixture_only,true);assert.equal(v.execution_authorized,false);assert.equal(v.data_export_authorized,false);assert(Object.isFrozen(v));return v}
test("strict fictional two-sided fixed decimal preserves canonical prices above JS safe precision",()=>{
 const q=quote({bid:"123456789012345678901234.0001",ask:"123456789012345678901234.0002"});
 const n=normalizeSyntheticQuote(q);
 assert.equal(n.status,"VALID_SYNTHETIC");assert.equal(n.quote.bid,q.bid);assert(Object.isFrozen(n.quote));
 deny(n,"SYNTHETIC_RECORD_ONLY");assert.equal(JSON.parse(JSON.stringify(n)).quote.bid,q.bid);
});
test("synthetically complete quote can only become NON-AUTHORITATIVE research candidate",()=>{
 const q=assessSyntheticQuoteQuality(quote(),quality,now());
 assert.equal(q.status,"SYNTHETIC_CANDIDATE_ONLY");assert.equal(q.observed_elapsed_ns,"100");
 deny(q,"INVENTED_INPUT_COMPLETE_NO_AUTHORITY");
});
test("clock's actual accepted invented capture validator is the input seam",()=>{
 const c=normalizeSyntheticClockSample(capture());assert.equal(c.status,"VALID");
 assert.equal(normalizeSyntheticQuote(quote({capture:c.sample})).status,"VALID_SYNTHETIC");
});
const invalid=[
 ["null",null,"INVALID_QUOTE_SCHEMA"],["empty",{},"INVALID_QUOTE_SCHEMA"],
 ["array",[],"INVALID_QUOTE_SCHEMA"],["untrusted prototype",Object.create(null),"INVALID_QUOTE_SCHEMA"],
 ["real vendor",{source_class:"REAL_VENDOR"},"TRUSTED_PROVIDER_NOT_IMPLEMENTED"],
 ["unknown class",{source_class:"EXCHANGE"},"INVALID_QUOTE_SCHEMA"],
 ["bad schema",{schema_version:1},"INVALID_QUOTE_SCHEMA"],
 ["missing provider",{provider_id:""},"INVALID_QUOTE_SCHEMA"],
 ["wildcard feed",{feed_id:"*"},"INVALID_QUOTE_SCHEMA"],
 ["null instrument",{instrument_contract_id:null},"INVALID_QUOTE_SCHEMA"],
 ["unknown venue",{venue_id:"!"},"INVALID_QUOTE_SCHEMA"],
 ["bad price scale",{price_scale:19},"INVALID_QUOTE_SCHEMA"],
 ["bad quantity scale",{quantity_scale:-1},"INVALID_QUOTE_SCHEMA"],
 ["negative depth",{book_depth_level:-1},"INVALID_QUOTE_SCHEMA"],
 ["not boolean fee",{synthetic_fee_known:"yes"},"INVALID_QUOTE_SCHEMA"],
 ["unknown quote kind",{quote_kind:"FAKE"},"INVALID_QUOTE_SCHEMA"],
 ["unknown delivery",{delivery:"EXTRAPOLATED"},"INVALID_QUOTE_SCHEMA"],
 ["unlicensed use",{data_use_scope:"UNKNOWN"},"RIGHTS_UNVERIFIED"],
 ["unapproved resale",{data_use_scope:"REDISTRIBUTION"},"RIGHTS_UNVERIFIED"],
 ["rights ref missing",{data_rights_ref:null},"RIGHTS_UNVERIFIED"],
 ["sequence negative",{provider_sequence:"-1"},"INVALID_SEQUENCE"],
 ["sequence leading zero",{provider_sequence:"0001"},"INVALID_SEQUENCE"],
 ["sequence too large",{provider_sequence:"18446744073709551616"},"INVALID_SEQUENCE"],
 ["bid numeric",{bid:1.2},"MISSING_OR_INVALID_TWO_SIDED_PRICE"],
 ["float-coded bid",{bid:"1e1"},"MISSING_OR_INVALID_TWO_SIDED_PRICE"],
 ["signed ask",{ask:"-1.2400"},"MISSING_OR_INVALID_TWO_SIDED_PRICE"],
 ["price scale mismatch",{bid:"1.230"},"MISSING_OR_INVALID_TWO_SIDED_PRICE"],
 ["zero price",{bid:"0.0000"},"MISSING_OR_INVALID_TWO_SIDED_PRICE"],
 ["crossed book",{bid:"1.2500"},"CROSSED_BOOK"],
 ["size numeric",{bid_size:100},"INVALID_EXACT_SIZE"],
 ["size precision mismatch",{ask_size:"100.0"},"INVALID_EXACT_SIZE"],
 ["real clock in record",{capture:capture({source_class:"REAL_VENDOR"})},"INVALID_CAPTURE_TRUSTED_CLOCK_NOT_IMPLEMENTED"],
 ["wrong clock contract",{capture:capture({instrument_contract_id:"FICTIONAL_EURUSD_CFD"})},"CLOCK_INSTRUMENT_MISMATCH"],
 ["bad clock",{capture:capture({local_receive_monotonic_ns:4})},"INVALID_CAPTURE_INVALID_SAMPLE"]
];
for(const [label,part,code] of invalid){
 test("normalizer fail-closed "+label,()=>{
  const q=part===null||Array.isArray(part)||Object.getPrototypeOf(part)===null||Object.keys(part).length===0?part:quote(part);
  const v=normalizeSyntheticQuote(q);assert.equal(v.status,"DENY",label);deny(v,code);
 });
}
test("extra and missing schema fields fail, never silently grant trading permissions",()=>{
 const extra=quote({execution_authorized:true});
 deny(normalizeSyntheticQuote(extra),"INVALID_QUOTE_SCHEMA");
 const missing=quote();delete missing.quote_id;
 deny(normalizeSyntheticQuote(missing),"INVALID_QUOTE_SCHEMA");
});
for(const [label,patch,reason] of [
 ["backwards monotonic",{local_receive_monotonic_ns:"10000000000000000",local_receive_wall_utc_ns:"1700000000000001001"},"BACKWARD_MONOTONIC"],
 ["cross-domain",{clock_domain_id:"other"},"CROSS_DOMAIN"],
 ["restart",{receive_epoch_id:"invented-boot-2"},"CROSS_DOMAIN"],
 ["bad now contract",{instrument_contract_id:"FICTIONAL_ETHUSD"},"INVALID_NOW_CAPTURE"],
 ["unknown local clock",{sync_state:"UNKNOWN"},"UNKNOWN_CLOCK"],
 ["unbounded local clock",{estimated_clock_error_ns:null},"UNKNOWN_CLOCK"],
 ["clock outside configured error",{estimated_clock_error_ns:"1001"},"CLOCK_ERROR_BUDGET_EXCEEDED"]
]){
 test("quality rejects "+label,()=>{
  const r=assessSyntheticQuoteQuality(quote(),quality,now(patch));
  assert.equal(r.status,"NON_ACTIONABLE");deny(r,reason);
 });
}
test("stale feed cannot become candidate even with synthetic executable tag",()=>{
 const q=assessSyntheticQuoteQuality(quote(),quality,now({local_receive_monotonic_ns:"10000000000002002",local_receive_wall_utc_ns:"1700000000000002001"}));
 assert.equal(q.status,"NON_ACTIONABLE");deny(q,"STALE_FEED");
});
for(const [name,patch,why] of [
 ["sampled",{delivery:"SAMPLED"},"SAMPLED_THROTTLED_OR_UNKNOWN"],
 ["throttled",{delivery:"THROTTLED"},"SAMPLED_THROTTLED_OR_UNKNOWN"],
 ["unknown delivery",{delivery:"UNKNOWN"},"SAMPLED_THROTTLED_OR_UNKNOWN"],
 ["indicative",{quote_kind:"INDICATIVE"},"VENUE_QUOTE_NOT_EXECUTABLE"],
 ["no venue",{venue_id:null},"VENUE_QUOTE_NOT_EXECUTABLE"],
 ["missing ask size",{ask_size:null},"EXECUTABLE_SIZE_UNKNOWN"],
 ["zero bid size",{bid_size:"0.00"},"EXECUTABLE_SIZE_UNKNOWN"],
 ["no depth",{book_depth_level:null},"BOOK_DEPTH_INSUFFICIENT"],
 ["insufficient depth",{book_depth_level:1},"BOOK_DEPTH_INSUFFICIENT"],
 ["no synthetic fee",{synthetic_fee_known:false},"FEE_MODEL_UNKNOWN"],
 ["missing source time",{capture:capture({source_event_utc_ns:null,source_event_uncertainty_ns:null,source_timestamp_semantics:"UNKNOWN"})},"SOURCE_TIME_UNVERIFIED"],
 ["non-event source time",{capture:capture({source_timestamp_semantics:"BATCH"})},"SOURCE_TIME_UNVERIFIED"]
]){
 test("non-actionable quality "+name,()=>{
  const p=name==="insufficient depth"?{...quality,min_depth_levels:2}:quality;
  const q=assessSyntheticQuoteQuality(quote(patch),p,now());
  assert.equal(q.status,"NON_ACTIONABLE",name);deny(q,why);
 });
}
for(const [name,p] of [["missing",{}],["bad age",{...quality,max_receive_age_ns:123.5}],["bad error",{...quality,max_local_clock_error_ns:"-1"}],["bad depth",{...quality,min_depth_levels:0}],["bad time flag",{...quality,require_source_event_time:"yes"}]]){
 test("quality policy must be complete and explicit: "+name,()=>deny(assessSyntheticQuoteQuality(quote(),p,now()),"INVALID_QUALITY_POLICY"));
}
test("optional event-time requirement can be disabled for invented local-receive research",()=>{
 const q=quote({capture:capture({source_event_utc_ns:null,source_event_uncertainty_ns:null,source_timestamp_semantics:"UNKNOWN"})});
 const v=assessSyntheticQuoteQuality(q,{...quality,require_source_event_time:false},now());
 assert.equal(v.status,"SYNTHETIC_CANDIDATE_ONLY");deny(v,"INVENTED_INPUT_COMPLETE_NO_AUTHORITY");
});
test("first incremental event without full snapshot requires explicit snapshot",()=>{
 const v=advanceSyntheticSequence(null,quote({full_snapshot:false}));assert.equal(v.status,"RESNAPSHOT_REQUIRED");deny(v,"INITIAL_SNAPSHOT_REQUIRED");
});
test("invented full snapshot begins independent sequence epoch without proving real book",()=>{
 const v=advanceSyntheticSequence(null,quote());assert.equal(v.status,"CURRENT_SYNTHETIC");deny(v,"INVENTED_SNAPSHOT_ONLY");
});
const before=quote(),later=quote({quote_id:"invented-quote-2",provider_sequence:"11",full_snapshot:false});
test("contiguous same-feed same-epoch synthetic incremental preserves sequence",()=>{
 const v=advanceSyntheticSequence(before,later);assert.equal(v.status,"CURRENT_SYNTHETIC");assert.equal(v.sequence,"11");deny(v,"INVENTED_SEQUENCE_CONTIGUOUS");
});
for(const [name,patch,status,why] of [
 ["same sequence",{quote_id:"invented-quote-2",provider_sequence:"10"},"DUPLICATE","OUT_OF_ORDER_DUPLICATE"],
 ["lower sequence",{quote_id:"invented-quote-2",provider_sequence:"9"},"OUT_OF_ORDER","OUT_OF_ORDER_DUPLICATE"],
 ["gap",{quote_id:"invented-quote-2",provider_sequence:"12"},"GAP","SEQUENCE_GAP"],
 ["new epoch",{source_sequence_epoch:"new-session"},"RESNAPSHOT_REQUIRED","SEQUENCE_EPOCH_CHANGED"],
 ["different feed",{feed_id:"other"},"RESNAPSHOT_REQUIRED","SOURCE_SCOPE_CHANGED"],
 ["different contract",{instrument_contract_id:"OTHER",capture:capture({instrument_contract_id:"OTHER"})},"RESNAPSHOT_REQUIRED","SOURCE_SCOPE_CHANGED"],
 ["unexpected full snapshot",{quote_id:"invented-quote-2",provider_sequence:"11",full_snapshot:true},"RESNAPSHOT_REQUIRED","EXPLICIT_SNAPSHOT_RESET_REQUIRED"],
 ["unknown sequence",{provider_sequence:null},"RESNAPSHOT_REQUIRED","UNKNOWN_SEQUENCE"],
 ["ID replay with new sequence",{provider_sequence:"11"},"DENY","DUPLICATE_QUOTE_ID"]
]){
 test("sequence rejects "+name,()=>{const v=advanceSyntheticSequence(before,quote({...patch,full_snapshot:patch.full_snapshot??false}));assert.equal(v.status,status,name);deny(v,why)});
}
test("invalid prior record cannot be used as verified book state",()=>deny(advanceSyntheticSequence(quote({source_class:"REAL_VENDOR"}),later),"INVALID_PREVIOUS_QUOTE"));
test("sequence handler rejects untrusted next quote without external access",()=>deny(advanceSyntheticSequence(before,quote({source_class:"REAL_VENDOR"})),"TRUSTED_PROVIDER_NOT_IMPLEMENTED"));
test("no input source reads host time, sends orders or imports network clients",()=>{
 const s=fs.readFileSync(new URL("../../src/market-data/quote.mjs",import.meta.url),"utf8");
 for(const value of ["Date.now(", "process.hrtime(", "fetch(", "node:fs", "node:net", "node:http", "execution_authorized:true"])
  assert(!s.includes(value),"FORBIDDEN_SOURCE_OPERATION "+value);
});
