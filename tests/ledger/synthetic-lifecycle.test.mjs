import test from 'node:test';
import assert from 'node:assert/strict';
import {beginSyntheticIntent,appendSyntheticLedgerEvent,replaySyntheticLedgerEvents} from '../../src/ledger/synthetic-lifecycle.mjs';

const scope = Object.freeze({venue_id:'demoVenue', legal_entity:'mockLegal',jurisdiction:'mockRegion',
 account_ref:'mockAccount',account_kind:'spot',instrument_contract_id:'asset_pair',strategy_family:'mockPaper',api_protocol:'testOnly'});
const grants = ['ACCOUNT_API','STRATEGY_PERMISSION','DATA_USE','OPERATOR_APPROVAL'].map((type,i)=>({
 type,ref:'evidence'+i,proof_sha256:'a'.repeat(64),reviewer_ref:'inventedReviewer',scope:{...scope},
 revoked:false,verified_at_utc:'2025-01-01T00:00:00.000Z',expires_at_utc:'2027-01-01T00:00:00.000Z',
 ...(type==='DATA_USE'?{data_scopes:['INTERNAL'],delivery:'TICK_COMPLETE'}:{})
}));
function request(){return {schema_version:0,source_class:'SYNTHETIC_FIXTURE',ledger_id:'mockLedger',
 intent_key:'mockIntent',quantity_units:'10',policy_request:{schema_version:0,scope:{...scope},mode:'PAPER',
 data_use:'INTERNAL',source_class:'SYNTHETIC_FIXTURE',now_utc:'2026-01-01T00:00:00.000Z',grants:structuredClone(grants)}};}
let counter=0;
function event(kind,add={}){return {schema_version:0,source_class:'SYNTHETIC_FIXTURE',
 event_id:'event'+(++counter),intent_key:'mockIntent',kind,...add};}
function begin(){const r=beginSyntheticIntent(request());assert.equal(r.status,'VALID_SYNTHETIC');return r.state;}
function step(state,kind,add={}){const r=appendSyntheticLedgerEvent(state,event(kind,add));assert.equal(r.status,'VALID_SYNTHETIC',r.reason_code);return r.state;}
function initialSend(){return step(begin(),'MARK_MAY_HAVE_SENT');}
function receipt(state,overrides={}){return {schema_version:0,source_class:'SYNTHETIC_FIXTURE',intent_key:state.intent_key,
 complete:true,filled_units:state.cumulative_filled_units,open:false,...overrides};}
const deny = (r,reason) => {assert.equal(r.status,'DENY');if(reason)assert.equal(r.reason_code,reason);
 assert.equal(r.fixture_only,true); assert.equal(r.durable,false);assert.equal(r.execution_authorized,false);};

test('real policy import binds wholly invented PAPER evidence, without granting actual authority',()=>{
 const s=begin();assert.equal(s.phase,'INTENT_RECORDED_SYNTHETIC');assert.deepEqual(s.policy_evidence_refs,grants.map(g=>g.ref));
 assert.equal(s.durable,false);assert.equal(s.execution_authorized,false);assert.equal(s.journal.length,0);
 assert(Object.isFrozen(s)&&Object.isFrozen(s.journal)&&Object.isFrozen(s.scope)&&Object.isFrozen(s.policy_evidence_refs));
});
test('all valid lifecycle outputs, even a complete full fill, remain non-durable and not authorized',()=>{
 let s=initialSend();s=step(s,'MOCK_ACK');s=step(s,'MOCK_FILL',{execution_id:'mockFill1',quantity_units:'4'});
 assert.equal(s.cumulative_filled_units,'4');assert.equal(s.phase,'PARTIAL_FILL_SYNTHETIC');
 s=step(s,'MOCK_FILL',{execution_id:'mockFill2',quantity_units:'6'});
 assert.equal(s.cumulative_filled_units,'10');assert.equal(s.phase,'FILLED_SYNTHETIC');
 assert.equal(s.execution_authorized,false);assert.equal(s.durable,false);assert.equal(s.journal.length,4);
});
test('delayed mock ACK after partial or full synthetic fill does not erase fill facts',()=>{
 let s=step(initialSend(),'MOCK_FILL',{execution_id:'fillAfterSend',quantity_units:'4'});
 s=step(s,'MOCK_ACK');assert.equal(s.phase,'PARTIAL_FILL_SYNTHETIC');assert.equal(s.cumulative_filled_units,'4');
 s=step(s,'MOCK_FILL',{execution_id:'otherFill',quantity_units:'6'});s=step(s,'MOCK_ACK');
 assert.equal(s.phase,'FILLED_SYNTHETIC');assert.equal(s.cumulative_filled_units,'10');
});
test('missing MAY_HAVE_SENT denies ACK, fill, cancellation and timeout',()=>{
 const s=begin();for(const k of ['MOCK_ACK','MOCK_FILL','MOCK_CANCEL_REQUEST','MOCK_TIMEOUT','MOCK_REJECT'])
 deny(appendSyntheticLedgerEvent(s,event(k,k==='MOCK_FILL'?{execution_id:'mockFill',quantity_units:'1'}:{})));
});
test('duplicate event IDs fail closed and keep previous state untouched',()=>{
 const s=begin(),e=event('MARK_MAY_HAVE_SENT');const next=appendSyntheticLedgerEvent(s,e).state;
 deny(appendSyntheticLedgerEvent(next,{...e,kind:'MOCK_ACK'}),'DUPLICATE_EVENT_ID');
 assert.equal(next.journal.length,1);assert.equal(s.journal.length,0);
});
test('duplicate execution IDs across distinct event IDs deny without doubling units',()=>{
 let s=step(initialSend(),'MOCK_FILL',{execution_id:'fill1',quantity_units:'3'});
 deny(appendSyntheticLedgerEvent(s,event('MOCK_FILL',{execution_id:'fill1',quantity_units:'1'})),'DUPLICATE_EXECUTION_ID');
 assert.equal(s.cumulative_filled_units,'3');
});
test('overflow and overfill are rejected without mutation',()=>{
 let s=step(initialSend(),'MOCK_FILL',{execution_id:'fill1',quantity_units:'9'});
 deny(appendSyntheticLedgerEvent(s,event('MOCK_FILL',{execution_id:'fill2',quantity_units:'2'})),'FILL_OVERFLOW_OR_OVERFILL');
 deny(appendSyntheticLedgerEvent(s,event('MOCK_FILL',{execution_id:'fill2',quantity_units:'18446744073709551615'})),'FILL_OVERFLOW_OR_OVERFILL');
 assert.equal(s.cumulative_filled_units,'9');
});
test('zero, negative, unsafe decimal and out-of-range quantity input denied',()=>{
 for(const v of ['0','-2','+4','1.5','1e3','01',' 2','18446744073709551616',3,1.5]){
  const x=request();x.quantity_units=v;deny(beginSyntheticIntent(x));
 }
});
test('malformed or real vendor request and non-PAPER policy always denied',()=>{
 const cases=[null,[],{},Object.create(null),{...request(),source_class:'REAL_VENDOR'},
  {...request(),extra:'privilege'}];
 for(const x of cases)deny(beginSyntheticIntent(x));
 const x=request();x.policy_request.source_class='REAL_VENDOR';deny(beginSyntheticIntent(x),'POLICY_NOT_SYNTHETIC_PAPER');
 const y=request();y.policy_request.mode='LIVE_CANDIDATE';deny(beginSyntheticIntent(y),'POLICY_NOT_SYNTHETIC_PAPER');
 const z=request();z.policy_request.grants[0].revoked=true;deny(beginSyntheticIntent(z),'POLICY_DENIED');
 const w=request();w.policy_request.grants[0].expires_at_utc='2025-01-02T00:00:00.000Z';deny(beginSyntheticIntent(w),'POLICY_DENIED');
});
test('wrong scope and forged or prototype-injected state are rejected',()=>{
 const s=initialSend();let x=request();x.policy_request.scope={...scope,account_ref:'*'};deny(beginSyntheticIntent(x));
 deny(appendSyntheticLedgerEvent({...s},event('MOCK_ACK')),'UNTRUSTED_STATE');
 deny(appendSyntheticLedgerEvent(Object.assign(Object.create(null),s),event('MOCK_ACK')),'UNTRUSTED_STATE');
 deny(appendSyntheticLedgerEvent(s,{...event('MOCK_ACK'),intent_key:'other'}),'INVALID_OR_CROSS_SCOPE_EVENT');
});
test('malformed getter/prototype event never escapes as an authorization exception',()=>{
 const s=initialSend();const x=event('MOCK_ACK');Object.defineProperty(x,'kind',{get(){throw Error('hostile')}});
 deny(appendSyntheticLedgerEvent(s,x));deny(appendSyntheticLedgerEvent(s,Object.create(null)));
 const z=request();Object.defineProperty(z,'policy_request',{get(){throw Error('hostile')}});deny(beginSyntheticIntent(z));
});
test('cancel request is not confirmation; full cancel needs separate fictional receipt',()=>{
 let s=step(initialSend(),'MOCK_CANCEL_REQUEST');assert.equal(s.phase,'CANCEL_REQUESTED_SYNTHETIC');
 assert.equal(s.locked,false);s=step(s,'MOCK_CANCEL_CONFIRMED');
 assert.equal(s.phase,'CANCEL_CONFIRMED_SYNTHETIC');assert.equal(s.execution_authorized,false);
});
test('late conflicting fill after cancel request is retained and locks discrepancy',()=>{
 let s=step(initialSend(),'MOCK_CANCEL_REQUEST');s=step(s,'MOCK_FILL',{execution_id:'lateFill',quantity_units:'3'});
 assert.equal(s.phase,'DISCREPANCY_LOCKED');assert.equal(s.locked,true);
 assert.equal(s.cumulative_filled_units,'3');assert.equal(s.journal.at(-1).execution_id,'lateFill');
 deny(appendSyntheticLedgerEvent(s,event('MOCK_FILL',{execution_id:'lateAgain',quantity_units:'2'})));
});
test('late conflicting fill after confirmed cancel locks discrepancy and keeps existing filled units',()=>{
 let s=step(initialSend(),'MOCK_FILL',{execution_id:'f1',quantity_units:'2'});
 s=step(s,'MOCK_CANCEL_REQUEST');s=step(s,'MOCK_CANCEL_CONFIRMED');
 s=step(s,'MOCK_FILL',{execution_id:'f2',quantity_units:'3'});
 assert.equal(s.cumulative_filled_units,'5');assert.equal(s.locked,true);assert.equal(s.phase,'DISCREPANCY_LOCKED');
});
test('mock rejection cannot override already observed synthetic fills',()=>{
 let s=step(initialSend(),'MOCK_FILL',{execution_id:'fillBeforeReject',quantity_units:'1'});
 deny(appendSyntheticLedgerEvent(s,event('MOCK_REJECT')),'ILLEGAL_REJECTION');
 assert.equal(s.cumulative_filled_units,'1');
});
test('timeout freezes unknown state and forbids blind resend, ACK and new fill',()=>{
 let s=step(initialSend(),'MOCK_TIMEOUT');assert.equal(s.phase,'UNKNOWN_NEEDS_RECONCILIATION');assert.equal(s.locked,true);
 for(const kind of ['MARK_MAY_HAVE_SENT','MOCK_ACK','MOCK_FILL','MOCK_CANCEL_REQUEST'])
 deny(appendSyntheticLedgerEvent(s,event(kind,kind==='MOCK_FILL'?{execution_id:'late',quantity_units:'1'}:{})));
});
test('incomplete mocked reconciliation remains locked and never grants broker authority',()=>{
 let s=step(initialSend(),'MOCK_TIMEOUT');s=step(s,'MOCK_RECONCILE',{receipt:receipt(s,{complete:false})});
 assert.equal(s.phase,'DISCREPANCY_LOCKED');assert.equal(s.execution_authorized,false);
 s=step(s,'MOCK_RECONCILE',{receipt:receipt(s,{complete:true,open:true})});
 assert.equal(s.phase,'DISCREPANCY_LOCKED');
});
test('complete matching fictional receipt resolves only the mock model while leaving lock closed',()=>{
 let s=step(initialSend(),'MOCK_FILL',{execution_id:'fill1',quantity_units:'2'});
 s=step(s,'MOCK_TIMEOUT');s=step(s,'MOCK_RECONCILE',{receipt:receipt(s)});
 assert.equal(s.phase,'SYNTHETIC_RECONCILED');assert.equal(s.locked,true);
 assert.equal(s.durable,false);assert.equal(s.execution_authorized,false);
 deny(appendSyntheticLedgerEvent(s,event('MARK_MAY_HAVE_SENT')));
});
test('contradictory complete mock receipt locks discrepancy without inventing missing fills',()=>{
 let s=step(initialSend(),'MOCK_TIMEOUT');s=step(s,'MOCK_RECONCILE',{receipt:receipt(s,{filled_units:'7'})});
 assert.equal(s.phase,'DISCREPANCY_LOCKED');assert.equal(s.cumulative_filled_units,'0');
});
test('malformed or forged mock receipt cannot bypass lock',()=>{
 const s=step(initialSend(),'MOCK_TIMEOUT');
 for(const r of [null,{},receipt(s,{source_class:'REAL_VENDOR'}),receipt(s,{intent_key:'other'}),
  receipt(s,{filled_units:'1.5'}),receipt(s,{complete:'yes'}),{...receipt(s),unknown:'field'}])
 deny(appendSyntheticLedgerEvent(s,event('MOCK_RECONCILE',{receipt:r})));
});
test('cannot replay event in wrong phase, wrong intent, missing event or unexpected extra fields',()=>{
 const s=initialSend();deny(appendSyntheticLedgerEvent(s,event('MOCK_CANCEL_CONFIRMED')));
 deny(appendSyntheticLedgerEvent(s,{...event('MOCK_ACK'),extra:'not_allowed'}));
 deny(appendSyntheticLedgerEvent(s,{...event('MOCK_ACK'),intent_key:'wrong'}));
 deny(appendSyntheticLedgerEvent(s,{...event('MOCK_ACK'),source_class:'REAL_VENDOR'}));
});
test('immutable past snapshots and journal facts survive later append and caller tampering',()=>{
 const s=initialSend();const t=step(s,'MOCK_ACK');
 assert(Object.isFrozen(s)&&Object.isFrozen(t)&&Object.isFrozen(t.journal)&&Object.isFrozen(t.journal[0]));
 assert.throws(()=>{t.journal[0].kind='FORGED'});assert.throws(()=>{t.scope.account_ref='other'});
 assert.equal(s.journal.length,1);assert.equal(t.journal.length,2);
});
test('replaying same invented event sequence reconstructs identical immutable state',()=>{
 const initial=request();const events=[event('MARK_MAY_HAVE_SENT'),event('MOCK_ACK'),
  event('MOCK_FILL',{execution_id:'f1',quantity_units:'3'}),event('MOCK_TIMEOUT')];
 const a=replaySyntheticLedgerEvents(initial,events),b=replaySyntheticLedgerEvents(initial,events);
 assert.equal(a.status,'VALID_SYNTHETIC');assert.deepEqual(a,b);assert.equal(a.state.locked,true);
});
test('replay fails closed on malformed input and does not skip invalid events',()=>{
 deny(replaySyntheticLedgerEvents(request(),null),'INVALID_REPLAY');
 deny(replaySyntheticLedgerEvents(request(),Array.from({length:65},()=>event('MOCK_ACK'))),'INVALID_REPLAY');
 deny(replaySyntheticLedgerEvents(request(),[event('MOCK_ACK')]),'ACK_WITHOUT_POSSIBLE_SEND');
});
test('bounded journal prevents unbounded activity even with invented input',()=>{
 const s=initialSend();
 for(let i=0;i<65;i++){
   const invalid=event('MOCK_FILL',{execution_id:'tooBig'+i,quantity_units:'11'});
   deny(appendSyntheticLedgerEvent(s,invalid),'FILL_OVERFLOW_OR_OVERFILL');
 }
 assert.equal(s.journal.length,1);
});
test('no filesystem, network, timers or real order function appears in owned implementation',async()=>{
 const fs=await import('node:fs');const source=fs.readFileSync(new URL('../../src/ledger/synthetic-lifecycle.mjs',import.meta.url),'utf8');
 for(const forbidden of ["from 'node:fs'","from 'node:net'","fetch(","Date.now(","setTimeout("])
   assert.equal(source.includes(forbidden),false,forbidden);
 assert.equal(/export function (transmit|sendOrder|writeLedger)/.test(source),false);
});
