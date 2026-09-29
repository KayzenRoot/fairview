import test from "node:test";
import assert from "node:assert/strict";
import {createSyntheticLedger,appendSyntheticLedgerEvent} from "../../src/ledger/simulation.mjs";
const scope=()=>({venue_id:"MOCK_V",legal_entity:"MOCK_E",jurisdiction:"TEST_R",account_ref:"MOCK_A",account_kind:"DEMO",instrument_contract_id:"MOCK_FX",strategy_family:"MOCK_ONE",api_protocol:"MOCK"});
const grant=type=>({type,ref:"REF_"+type,proof_sha256:"a".repeat(64),reviewer_ref:"TEST_REVIEWER",scope:scope(),revoked:false,verified_at_utc:"2026-09-01T00:00:00.000Z",expires_at_utc:"2026-10-01T00:00:00.000Z",...(type==="DATA_USE"?{data_scopes:["INTERNAL"],delivery:"SAMPLED"}:{})});
const policy=()=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",scope:scope(),mode:"DEMO",data_use:"INTERNAL",now_utc:"2026-09-29T00:00:00.000Z",grants:["ACCOUNT_API","STRATEGY_PERMISSION","DATA_USE","OPERATOR_APPROVAL"].map(grant)});
const intent=(patch={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",tenant_id:"MOCK_T",account_id:"MOCK_A",venue_id:"MOCK_V",instrument_contract_id:"MOCK_FX",intent_key:"INT_1",side:"BUY",quantity_units:"10",created_at_utc:"2026-09-29T00:00:00.000Z",policy_request:policy(),...patch});
const ev=(sequence,type,patch={})=>({schema_version:0,source_class:"SYNTHETIC_FIXTURE",intent_key:"INT_1",event_id:"EV_"+sequence,sequence:String(sequence),captured_at_utc:"2026-09-29T00:00:00.000Z",type,attempt_id:"ATT_1",quantity_units:null,execution_id:null,receipt:null,...patch});
const newLog=()=>{const r=createSyntheticLedger(intent());assert.equal(r.status,"CREATED",JSON.stringify(r));return r.ledger;};
const apply=(s,e)=>{const r=appendSyntheticLedgerEvent(s,e);assert.equal(r.status,"APPLIED",JSON.stringify(r));return r.ledger;};
const sent=()=>apply(newLog(),ev(1,"MAY_HAVE_SENT"));
const receipt=(p={})=>({source_class:"SYNTHETIC_FIXTURE",complete:true,account_id:"MOCK_A",venue_id:"MOCK_V",instrument_contract_id:"MOCK_FX",cursor:"MOCK_CURSOR",reported_filled_units:"0",order_status:"OPEN",...p});
const noAuthority=r=>{assert.equal(r.fixture_only,true);assert.equal(r.persisted,false);assert.equal(r.execution_authorized,false);};
test("synthetic local-intent fixture cannot authorize execution or claim durability",()=>{const r=createSyntheticLedger(intent());assert.equal(r.status,"CREATED");assert.equal(r.ledger.phase,"INTENT_DURABLE");assert.equal(r.ledger.filled_units,"0");noAuthority(r);noAuthority(r.ledger);});

test("forged real venue and incomplete synthetic scope cannot initialize",()=>{
 const real=createSyntheticLedger(intent({source_class:"REAL_VENDOR"}));
 assert.equal(real.status,"DENY");assert.equal(real.reason_code,"REAL_VENUE_NOT_SUPPORTED");
 for(const patch of [{quantity_units:"0"},{quantity_units:"1.5"},{account_id:"OTHER"},{venue_id:"OTHER"},{intent_key:"*"},{created_at_utc:"yesterday"}]){
  const result=createSyntheticLedger(intent(patch));assert.equal(result.status,"DENY",JSON.stringify(patch));
 }
});
test("an expired fictional policy never initializes an intent",()=>{
 const p=policy();p.now_utc="2026-10-01T00:00:00.000Z";
 const r=createSyntheticLedger(intent({policy_request:p}));
 assert.equal(r.status,"DENY");assert.equal(r.reason_code,"POLICY_FIXTURE_NOT_ELIGIBLE");
});
test("an explicit presend marker is required before ACK or simulated fill",()=>{
 const s=newLog();
 for(const type of ["ACK","LOST_ACK","CRASH_RESTART","CANCEL_REQUESTED"]){
  const r=appendSyntheticLedgerEvent(s,ev(1,type));assert.equal(r.status,"DENY");
  assert.equal(r.ledger,s);
 }
 const sentState=sent();
 assert.equal(sentState.phase,"MAY_HAVE_SENT");
 assert.equal(sentState.attempt_id,"ATT_1");noAuthority(sentState);
});
test("ACK is a fictional event, and no extra send attempt is admitted",()=>{
 const ack=apply(sent(),ev(2,"ACK"));
 assert.equal(ack.phase,"ACKNOWLEDGED");
 const extra=appendSyntheticLedgerEvent(ack,ev(3,"MAY_HAVE_SENT",{attempt_id:"ATT_2"}));
 assert.equal(extra.status,"DENY");assert.equal(extra.reason_code,"UNAUTHORIZED_ATTEMPT_REUSE");
});
test("duplicate identical event is idempotent while conflicting duplicate freezes",()=>{
 const s=sent();const same=appendSyntheticLedgerEvent(s,ev(1,"MAY_HAVE_SENT"));
 assert.equal(same.status,"IGNORED_DUPLICATE");assert.equal(same.ledger,s);
 const conflict=appendSyntheticLedgerEvent(s,ev(1,"ACK"));
 assert.equal(conflict.status,"LOCKED");assert.equal(conflict.ledger.phase,"DISCREPANCY_LOCKED");
 assert.equal(conflict.ledger.unknown_external_effect,true);
});
test("a gap in the ordered local fixture does not silently mend evidence",()=>{
 const s=sent();
 const gap=appendSyntheticLedgerEvent(s,ev(3,"ACK"));
 assert.equal(gap.reason_code,"EVENT_SEQUENCE_GAP");assert.equal(gap.ledger,s);
 assert.equal(s.events.length,1);
});
test("invented partial fills preserve exact integer cumulative units",()=>{
 const s=apply(sent(),ev(2,"FILL",{quantity_units:"4",execution_id:"EXEC_1"}));
 assert.equal(s.phase,"PARTIALLY_FILLED");assert.equal(s.filled_units,"4");
 const full=apply(s,ev(3,"FILL",{quantity_units:"6",execution_id:"EXEC_2"}));
 assert.equal(full.phase,"FILLED");assert.equal(full.filled_units,"10");noAuthority(full);
 const late=appendSyntheticLedgerEvent(full,ev(4,"ACK"));
 assert.equal(late.status,"DENY");
});
test("two events may not reuse the same execution ID or overfill the intent",()=>{
 const p=apply(sent(),ev(2,"FILL",{quantity_units:"4",execution_id:"EXEC_1"}));
 const same=appendSyntheticLedgerEvent(p,ev(3,"FILL",{quantity_units:"2",execution_id:"EXEC_1"}));
 assert.equal(same.status,"LOCKED");assert.equal(same.reason_code,"CONFLICTING_EXECUTION_ID");
 assert.equal(same.ledger.filled_units,"4");
 const over=appendSyntheticLedgerEvent(p,ev(3,"FILL",{quantity_units:"7",execution_id:"EXEC_2"}));
 assert.equal(over.status,"LOCKED");assert.equal(over.reason_code,"OVERFILL_DISCREPANCY");
 assert.equal(over.ledger.filled_units,"4");
});

test("lost ACK and late ACK never establish a complete remote result",()=>{
 const unknown=apply(sent(),ev(2,"LOST_ACK"));
 assert.equal(unknown.phase,"UNKNOWN_NEEDS_RECONCILIATION");
 assert.equal(unknown.unknown_external_effect,true);
 const late=apply(unknown,ev(3,"ACK"));
 assert.equal(late.phase,"UNKNOWN_NEEDS_RECONCILIATION");
 const attempted=appendSyntheticLedgerEvent(late,ev(4,"MAY_HAVE_SENT",{attempt_id:"ATT_2"}));
 assert.equal(attempted.status,"DENY");
});
test("a complete matching invented receipt can resolve a synthetic unknown",()=>{
 const unknown=apply(sent(),ev(2,"LOST_ACK"));
 const resolved=apply(unknown,ev(3,"RECONCILE",{receipt:receipt()}));
 assert.equal(resolved.phase,"ACKNOWLEDGED");
 assert.equal(resolved.unknown_external_effect,false);
 assert.equal(resolved.filled_units,"0");noAuthority(resolved);
});
test("incomplete history locks unknown external effects conservatively",()=>{
 const unknown=apply(sent(),ev(2,"CRASH_RESTART"));
 const attempted=appendSyntheticLedgerEvent(unknown,ev(3,"RECONCILE",{receipt:receipt({complete:false})}));
 assert.equal(attempted.status,"LOCKED");assert.equal(attempted.reason_code,"INCOMPLETE_SYNTHETIC_HISTORY");
 assert.equal(attempted.ledger.phase,"DISCREPANCY_LOCKED");
 assert.equal(attempted.ledger.unknown_external_effect,true);
});
test("an invented receipt with mismatched scope or contradictory amounts is denied or locked",()=>{
 const unknown=apply(sent(),ev(2,"LOST_ACK"));
 const mismatch=appendSyntheticLedgerEvent(unknown,ev(3,"RECONCILE",{receipt:receipt({account_id:"OTHER"})}));
 assert.equal(mismatch.status,"DENY");assert.equal(mismatch.reason_code,"INVALID_RECONCILIATION_RECEIPT");
 const conflict=appendSyntheticLedgerEvent(unknown,ev(3,"RECONCILE",{receipt:receipt({order_status:"FILLED"})}));
 assert.equal(conflict.status,"LOCKED");
 assert.equal(conflict.ledger.phase,"DISCREPANCY_LOCKED");
});
test("cancel request does not claim cancel; late partial fill remains recorded",()=>{
 const p=apply(apply(sent(),ev(2,"ACK")),ev(3,"FILL",{quantity_units:"4",execution_id:"EXEC_1"}));
 const cancel=apply(p,ev(4,"CANCEL_REQUESTED"));
 assert.equal(cancel.phase,"CANCEL_REQUESTED");
 const late=apply(cancel,ev(5,"FILL",{quantity_units:"2",execution_id:"EXEC_2"}));
 assert.equal(late.phase,"CANCEL_REQUESTED");
 assert.equal(late.filled_units,"6");
 const confirmed=apply(late,ev(6,"CANCEL_CONFIRMED"));
 assert.equal(confirmed.phase,"CANCELED_CONFIRMED");
 assert.equal(confirmed.filled_units,"6");
});
test("a cancellation message cannot clear unknown effects",()=>{
 const unknown=apply(sent(),ev(2,"LOST_ACK"));
 const r=apply(unknown,ev(3,"CANCEL_CONFIRMED"));
 assert.equal(r.phase,"UNKNOWN_NEEDS_RECONCILIATION");
 assert.equal(r.unknown_external_effect,true);
});
test("invented real-vendor events are denied even in an invented prior ledger",()=>{
 const s=sent();
 const r=appendSyntheticLedgerEvent(s,ev(2,"ACK",{source_class:"REAL_VENDOR"}));
 assert.equal(r.status,"DENY");assert.equal(r.reason_code,"REAL_VENUE_NOT_SUPPORTED");
 assert.equal(r.ledger,s);
});
test("pure replay and inputs are deterministic and immutable",()=>{
 function run(){let s=sent();s=apply(s,ev(2,"ACK"));return apply(s,ev(3,"FILL",{quantity_units:"4",execution_id:"EXEC_1"}));}
 const a=run(),b=run();assert.deepEqual(a,b);
 assert(Object.isFrozen(a));assert(Object.isFrozen(a.events));assert(Object.isFrozen(a.events[1]));
 assert(Object.isFrozen(a.intent));assert.equal(a.persisted,false);
});
test("untrusted malformed event quantities and attempts are denied without state mutation",()=>{
 const s=sent();
 for(const patch of [{quantity_units:"1.5"},{quantity_units:"-1"},{attempt_id:"OTHER"},{event_id:"*"},{sequence:"4"},{captured_at_utc:"invalid"}]){
  const r=appendSyntheticLedgerEvent(s,ev(2,"FILL",{quantity_units:"1",execution_id:"EXEC_2",...patch}));
  assert.equal(r.status,"DENY",JSON.stringify(patch));assert.equal(r.ledger,s);
 }
});
