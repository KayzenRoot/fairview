// FV-POLICY-001: deterministic synthetic policy fixtures only.
// Never consume caller-supplied grants as real-world authorization.
export const POLICY_STATES=Object.freeze(["DENY","RESEARCH_ONLY","DEMO_ELIGIBLE","PAPER_ELIGIBLE","LIVE_CANDIDATE"]);
const MODES=Object.freeze({RESEARCH:"RESEARCH_ONLY",DEMO:"DEMO_ELIGIBLE",PAPER:"PAPER_ELIGIBLE",LIVE_CANDIDATE:"LIVE_CANDIDATE"});
const GRANT_TYPES=Object.freeze(["ACCOUNT_API","STRATEGY_PERMISSION","DATA_USE","OPERATOR_APPROVAL","PRODUCTION_EVIDENCE"]);
const DATA_USES=Object.freeze(["INTERNAL","DISPLAY","REDISTRIBUTION"]);
const SCOPE_FIELDS=Object.freeze(["venue_id","legal_entity","jurisdiction","account_ref","account_kind","instrument_contract_id","strategy_family","api_protocol"]);
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const HASH=/^[a-f0-9]{64}$/;
const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const identifier=x=>typeof x==="string"&&ID.test(x)&&x!=="*"&&x!=="ALL";
const utc=x=>typeof x==="string"&&ISO.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x?Date.parse(x):null;
function result(decision,reason_codes,refs=[],expiry=null,rights=[]){
 return Object.freeze({schema_version:0,decision,reason_codes:Object.freeze([...reason_codes]),authorization_evidence_refs:Object.freeze([...refs]),valid_until_utc:expiry,data_rights_scope:Object.freeze([...rights]),fixture_only:true,execution_authorized:false,risk_kernel_gate_required:true});
}
const deny=reason=>result("DENY",[reason]);
const matchingScope=(left,right)=>SCOPE_FIELDS.every(k=>left[k]===right[k]);
const validScope=s=>plain(s)&&SCOPE_FIELDS.every(k=>identifier(s[k]));
const validGrant=g=>plain(g)&&GRANT_TYPES.includes(g.type)&&identifier(g.ref)&&HASH.test(g.proof_sha256)&&identifier(g.reviewer_ref)&&validScope(g.scope)&&typeof g.revoked==="boolean"&&utc(g.verified_at_utc)!==null&&utc(g.expires_at_utc)!==null&&(!Object.hasOwn(g,"data_scopes")||(Array.isArray(g.data_scopes)&&g.data_scopes.length>0&&g.data_scopes.length<=3&&new Set(g.data_scopes).size===g.data_scopes.length&&g.data_scopes.every(s=>DATA_USES.includes(s))))&&(!Object.hasOwn(g,"delivery")||["SAMPLED","TICK_COMPLETE","UNKNOWN"].includes(g.delivery));
/**
 * Pure, deterministic eligibility classifications for invented fixtures.
 * This V0 deliberately has no trusted contract verifier: REAL_VENDOR is always DENY.
 * Even synthetic LIVE_CANDIDATE has execution_authorized=false.
 */
export function evaluateSyntheticEligibility(input){
 if(!plain(input)||input.schema_version!==0||!plain(input.scope)||!validScope(input.scope)||!Object.hasOwn(MODES,input.mode)||!DATA_USES.includes(input.data_use)||!["SYNTHETIC_FIXTURE","REAL_VENDOR"].includes(input.source_class)||utc(input.now_utc)===null||!Array.isArray(input.grants)||input.grants.length>16||(input.requires_tick_complete!==undefined&&typeof input.requires_tick_complete!=="boolean"))return deny("INVALID_REQUEST");
 if(input.source_class!=="SYNTHETIC_FIXTURE")return deny("TRUSTED_PROVIDER_NOT_IMPLEMENTED");
 const now=utc(input.now_utc);
 // Synthetic internal research is a fixture exercise, never venue/data entitlement.
 if(input.mode==="RESEARCH"&&input.data_use==="INTERNAL"&&!input.requires_tick_complete&&input.grants.length===0)return result("RESEARCH_ONLY",["SYNTHETIC_RESEARCH_ONLY"],[],null,["SYNTHETIC_INTERNAL"]);
 const byType=new Map(),refs=[];
 for(const g of input.grants){
  if(!validGrant(g))return deny("INVALID_GRANT_SCHEMA");
  if(!matchingScope(g.scope,input.scope))return deny("GRANT_SCOPE_MISMATCH");
  if(byType.has(g.type))return deny("AMBIGUOUS_GRANTS");
  if(g.revoked)return deny("REVOKED_EVIDENCE");
  if(utc(g.verified_at_utc)>now)return deny("FUTURE_VERIFICATION");
  if(utc(g.expires_at_utc)<=now||utc(g.expires_at_utc)<=utc(g.verified_at_utc))return deny("EXPIRED_EVIDENCE");
  byType.set(g.type,g);refs.push(g.ref);
 }
 const required=input.mode==="RESEARCH"?["DATA_USE"]:["ACCOUNT_API","STRATEGY_PERMISSION","DATA_USE","OPERATOR_APPROVAL",...(input.mode==="LIVE_CANDIDATE"?["PRODUCTION_EVIDENCE"]:[])];
 for(const type of required)if(!byType.has(type))return deny("MISSING_"+type);
 const data=byType.get("DATA_USE");
 if(!Array.isArray(data.data_scopes)||!data.data_scopes.includes(input.data_use))return deny("DATA_USE_NOT_GRANTED");
 if(input.requires_tick_complete&&data.delivery!=="TICK_COMPLETE")return deny("TICK_FIDELITY_UNPROVEN");
 const expiry=new Date(Math.min(...[...byType.values()].map(g=>utc(g.expires_at_utc)))).toISOString();
 return result(MODES[input.mode],["SYNTHETIC_CLASSIFICATION_ONLY"],refs,expiry,[input.data_use]);
}
