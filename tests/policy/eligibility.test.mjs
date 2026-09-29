import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {evaluateSyntheticEligibility, POLICY_STATES} from "../../src/policy/eligibility.mjs";

const SCOPE=Object.freeze({
 venue_id:"fictional_venue_01",
 legal_entity:"fictional_entity_01",
 jurisdiction:"ZZ_TEST_ONLY",
 account_ref:"synthetic_acct_01",
 account_kind:"SIMULATED",
 instrument_contract_id:"TEST_EURUSD_SPOT",
 strategy_family:"SIMULATED_ONE_LEG",
 api_protocol:"SIMULATED_NO_NETWORK"
});
const NOW="2026-09-15T12:00:00.000Z";
const VERIFIED="2026-09-01T00:00:00.000Z";
const EXPIRY="2026-10-01T00:00:00.000Z";
const TYPES=["ACCOUNT_API","STRATEGY_PERMISSION","DATA_USE","OPERATOR_APPROVAL","PRODUCTION_EVIDENCE"];
const grant=(type,index=TYPES.indexOf(type),overrides={})=>({
 type,ref:"fictional_grant_"+(index+1),
 proof_sha256:(index+1).toString(16).padStart(64,"0"),reviewer_ref:"fictional_reviewer",
 scope:{...SCOPE},revoked:false,verified_at_utc:VERIFIED,expires_at_utc:EXPIRY,
 ...(type==="DATA_USE"?{data_scopes:["INTERNAL","DISPLAY"],delivery:"TICK_COMPLETE"}:{}),
 ...overrides
});
const grants=(types=TYPES)=>types.map((type,index)=>grant(type,TYPES.indexOf(type)??index));
const request=(overrides={})=>({
 schema_version:0,scope:{...SCOPE},mode:"DEMO",data_use:"INTERNAL",
 source_class:"SYNTHETIC_FIXTURE",now_utc:NOW,grants:grants(TYPES.slice(0,4)),
 ...overrides
});
const decision=(req,expected,reason)=>{const result=evaluateSyntheticEligibility(req);assert.equal(result.decision,expected);if(reason)assert(result.reason_codes.includes(reason),JSON.stringify(result));assert.equal(result.fixture_only,true);assert.equal(result.execution_authorized,false);assert.equal(result.risk_kernel_gate_required,true);return result;};

test("exposes the five synthetic-only status labels, not LIVE_APPROVED",()=>{
 assert.deepEqual(POLICY_STATES,["DENY","RESEARCH_ONLY","DEMO_ELIGIBLE","PAPER_ELIGIBLE","LIVE_CANDIDATE"]);
 assert(Object.isFrozen(POLICY_STATES));
 assert(!POLICY_STATES.includes("LIVE_APPROVED"));
});
test("missing, null or untyped input is denied",()=>{
 for(const bad of [null,undefined,{},[],false,"DEMO",Object.create(null)])decision(bad,"DENY","INVALID_REQUEST");
});
test("empty synthetic internal research is explicitly non-executable",()=>{
 const res=decision(request({mode:"RESEARCH",grants:[],data_use:"INTERNAL"}),"RESEARCH_ONLY","SYNTHETIC_RESEARCH_ONLY");
 assert.equal(res.valid_until_utc,null);
 assert.deepEqual(res.data_rights_scope,["SYNTHETIC_INTERNAL"]);
 assert.deepEqual(res.authorization_evidence_refs,[]);
});
test("synthetic display research requires an explicit data-use grant",()=>{
 decision(request({mode:"RESEARCH",data_use:"DISPLAY",grants:[]}),"DENY","MISSING_DATA_USE");
 const res=decision(request({mode:"RESEARCH",data_use:"DISPLAY",grants:[grant("DATA_USE")]}),"RESEARCH_ONLY");
 assert.deepEqual(res.data_rights_scope,["DISPLAY"]);
});
test("synthetic DEMO requires the complete four-grant set",()=>{
 const res=decision(request(),"DEMO_ELIGIBLE","SYNTHETIC_CLASSIFICATION_ONLY");
 assert.deepEqual(res.authorization_evidence_refs,grants(TYPES.slice(0,4)).map(g=>g.ref));
 assert.equal(res.valid_until_utc,EXPIRY);
});
test("synthetic PAPER classification cannot authorize an order",()=>{
 const res=decision(request({mode:"PAPER"}),"PAPER_ELIGIBLE");
 assert.equal(res.execution_authorized,false);
});
test("even full synthetic LIVE_CANDIDATE evidence is never live permission",()=>{
 const res=decision(request({mode:"LIVE_CANDIDATE",grants:grants()}),"LIVE_CANDIDATE");
 assert.equal(res.execution_authorized,false);
 assert.equal(res.fixture_only,true);
});
test("REAL_VENDOR data is denied even with all fictional grants",()=>{
 for(const mode of ["RESEARCH","DEMO","PAPER","LIVE_CANDIDATE"]){
  decision(request({mode,source_class:"REAL_VENDOR",grants:grants()}),"DENY","TRUSTED_PROVIDER_NOT_IMPLEMENTED");
 }
});
test("minimum expiry is conservative over all included evidence",()=>{
 const g=grants(TYPES.slice(0,4));
 g[1].expires_at_utc="2026-09-19T00:00:00.000Z";
 assert.equal(decision(request({grants:g}),"DEMO_ELIGIBLE").valid_until_utc,"2026-09-19T00:00:00.000Z");
});
test("outcomes are frozen, deterministic JSON and cannot gain authority",()=>{
 const a=decision(request(),"DEMO_ELIGIBLE"),b=decision(request(),"DEMO_ELIGIBLE");
 assert.deepEqual(a,b);
 assert(Object.isFrozen(a)&&Object.isFrozen(a.reason_codes)&&Object.isFrozen(a.authorization_evidence_refs)&&Object.isFrozen(a.data_rights_scope));
 assert.equal(JSON.parse(JSON.stringify(a)).execution_authorized,false);
});
for(const [label,overrides] of [
 ["unsupported schema",{schema_version:1}],["missing jurisdiction",{scope:{...SCOPE,jurisdiction:undefined}}],
 ["wildcard venue",{scope:{...SCOPE,venue_id:"*"}}],["ALL legal entity",{scope:{...SCOPE,legal_entity:"ALL"}}],
 ["unsupported mode",{mode:"LIVE"}],["unknown source class",{source_class:"UNVERIFIED_VENDOR"}],
 ["missing clock",{now_utc:null}],["invalid leap day",{now_utc:"2026-02-29T00:00:00.000Z"}],
 ["noncanonical UTC",{now_utc:"2026-09-15T12:00:00Z"}],["unknown data use",{data_use:"PUBLIC_EXPORT"}],
 ["missing grants array",{grants:null}],["too many evidence records",{grants:Array.from({length:17},(_,i)=>grant("ACCOUNT_API",i,{ref:"unique_"+i}))}],
 ["invalid tick flag",{requires_tick_complete:"true"}]
])test("malformed request DENY: "+label,()=>decision(request(overrides),"DENY","INVALID_REQUEST"));
for(const field of Object.keys(SCOPE)){
 test("scope match is strict for "+field,()=>{
  const g=grants(TYPES.slice(0,4));g[0].scope[field]="another_synthetic_scope";
  decision(request({grants:g}),"DENY","GRANT_SCOPE_MISMATCH");
 });
}
for(const type of TYPES.slice(0,4)){
 test("missing "+type+" grant fails closed",()=>{
  const g=grants(TYPES.slice(0,4)).filter(x=>x.type!==type);
  decision(request({grants:g}),"DENY","MISSING_"+type);
 });
}
test("synthetic live candidate requires a distinct production evidence record",()=>{
 decision(request({mode:"LIVE_CANDIDATE"}),"DENY","MISSING_PRODUCTION_EVIDENCE");
});
test("revoked grant blocks even previously plausible eligibility",()=>{
 const g=grants(TYPES.slice(0,4));g[1].revoked=true;
 decision(request({grants:g}),"DENY","REVOKED_EVIDENCE");
});
test("expired evidence at the evaluation instant is denied",()=>{
 const g=grants(TYPES.slice(0,4));g[2].expires_at_utc=NOW;
 decision(request({grants:g}),"DENY","EXPIRED_EVIDENCE");
});
test("an expiry earlier than evidence verification is denied",()=>{
 const g=grants(TYPES.slice(0,4));g[2].expires_at_utc=VERIFIED;
 decision(request({grants:g}),"DENY","EXPIRED_EVIDENCE");
});
test("future-dated approval receipt cannot grant access",()=>{
 const g=grants(TYPES.slice(0,4));g[3].verified_at_utc="2026-09-16T00:00:00.000Z";
 decision(request({grants:g}),"DENY","FUTURE_VERIFICATION");
});
test("duplicate grant types are ambiguous, even with different reference IDs",()=>{
 const g=grants(TYPES.slice(0,4));g.push(grant("ACCOUNT_API",8));
 decision(request({grants:g}),"DENY","AMBIGUOUS_GRANTS");
});
test("one evidence reference cannot be reused as distinct grant types",()=>{
 const g=grants(TYPES.slice(0,4));g[1].ref=g[0].ref;
 decision(request({grants:g}),"DENY","DUPLICATE_EVIDENCE_REF");
});
test("only DATA_USE grants may carry data rights",()=>{
 const g=grants(TYPES.slice(0,4));g[0].data_scopes=["DISPLAY"];
 decision(request({grants:g}),"DENY","UNEXPECTED_GRANT_RIGHTS");
});
test("unlicensed redistribution must not pass as display or internal data access",()=>{
 const g=grants(TYPES.slice(0,4));
 decision(request({grants:g,data_use:"REDISTRIBUTION"}),"DENY","DATA_USE_NOT_GRANTED");
 g[2].data_scopes=["REDISTRIBUTION"];
 decision(request({grants:g,data_use:"REDISTRIBUTION"}),"DEMO_ELIGIBLE");
});
test("sampled or unknown delivery cannot prove tick completeness",()=>{
 for(const delivery of ["SAMPLED","UNKNOWN",undefined]){
  const g=grants(TYPES.slice(0,4));
  if(delivery===undefined)delete g[2].delivery;else g[2].delivery=delivery;
  decision(request({requires_tick_complete:true,grants:g}),"DENY","TICK_FIDELITY_UNPROVEN");
 }
});
test("tick-complete evidence remains only a synthetic classification",()=>{
 const res=decision(request({requires_tick_complete:true}),"DEMO_ELIGIBLE");
 assert.equal(res.execution_authorized,false);
});
for(const [label,modify] of [
 ["missing hash",g=>delete g.proof_sha256],
 ["hash object with throwing coercion",g=>g.proof_sha256={toString(){throw Error("unsafe coercion");}}],
 ["missing reviewer",g=>g.reviewer_ref=""],
 ["missing ref",g=>g.ref=""],
 ["revoked must be Boolean",g=>g.revoked="false"],
 ["invalid evidence timestamp",g=>g.verified_at_utc="yesterday"],
 ["duplicate rights",g=>g.data_scopes=["DISPLAY","DISPLAY"]],
 ["unsupported data right",g=>g.data_scopes=["UNLICENSED"]],
 ["unrecognized provider delivery",g=>g.delivery="MAGIC_COMPLETE"]
]){
 test("malformed evidence DENY: "+label,()=>{
  const g=grants(TYPES.slice(0,4));modify(g[2]);
  decision(request({grants:g}),"DENY","INVALID_GRANT_SCHEMA");
 });
}
test("throwing getters from untrusted caller fail closed, not exception",()=>{
 const q=request();
 Object.defineProperty(q,"mode",{get(){throw Error("malformed input");}});
 decision(q,"DENY","INVALID_REQUEST");
 const gg=grants(TYPES.slice(0,4));
 Object.defineProperty(gg[0],"scope",{get(){throw Error("malformed grant");}});
 decision(request({grants:gg}),"DENY","INVALID_REQUEST");
});
test("pure synthetic evaluator has no direct outbound network or signing code",()=>{
 const src=fs.readFileSync(new URL("../../src/policy/eligibility.mjs",import.meta.url),"utf8");
 for(const pattern of [/\bfetch\s*\(/,/\bWebSocket\b/,/\bchild_process\b/,/\bprivateKey\b/,/\bsignTransaction\b/])assert(!pattern.test(src),pattern.toString());
});
