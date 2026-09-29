// FV-MARKET-DATA-001: PURE, invented-only quote normalization and sequence fixtures.
// No network, provider rights, executable financial price, actual order book or order authority.
import {normalizeSyntheticClockSample,elapsedWithinSyntheticDomain} from "../clock/time.mjs";
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const UINT=/^(?:0|[1-9][0-9]*)$/;
const FIXED=/^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/;
const MAX_U64=(1n<<64n)-1n;
const KIND=new Set(["EXECUTABLE","INDICATIVE","SNAPSHOT","HISTORICAL","UNKNOWN"]);
const DELIVERY=new Set(["NORMAL","SAMPLED","THROTTLED","UNKNOWN"]);
const TRANSPORT=new Set(["REPLAY","REST","WEBSOCKET","FIX","OTHER"]);
const FIELDS=Object.freeze(["schema_version","source_class","quote_id","provider_id","feed_id","venue_id",
 "instrument_contract_id","bid","ask","price_scale","bid_size","ask_size","quantity_scale","book_depth_level",
 "quote_kind","data_use_scope","data_rights_ref","delivery","transport_kind",
 "source_sequence_epoch","provider_sequence","full_snapshot","synthetic_fee_known","capture"]);
const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const id=x=>typeof x==="string"&&ID.test(x)&&x!=="*"&&x!=="ALL";
function u64(v){
 if(typeof v!=="string"||v.length>20||!UINT.test(v))return null;
 const n=BigInt(v);return n<=MAX_U64?n:null;
}
const scale=x=>Number.isInteger(x)&&x>=0&&x<=18;
function fixed(value,digits){
 if(typeof value!=="string"||value.length>48||!FIXED.test(value)||!scale(digits))return null;
 const parts=value.split(".");
 if((parts[1]?.length??0)!==digits)return null;
 return BigInt(parts[0]+(parts[1]??""));
}
function result(status,reason_code,extras={}){
 return Object.freeze({schema_version:0,status,reason_code,fixture_only:true,
  execution_authorized:false,data_export_authorized:false,real_venue_proven:false,...extras});
}
const deny=(reason)=>result("DENY",reason);
export function normalizeSyntheticQuote(raw){
 if(!plain(raw)||raw.schema_version!==0||!["SYNTHETIC_FIXTURE","REAL_VENDOR"].includes(raw.source_class))return deny("INVALID_QUOTE_SCHEMA");
 if(raw.source_class!=="SYNTHETIC_FIXTURE")return deny("TRUSTED_PROVIDER_NOT_IMPLEMENTED");
 if(Object.keys(raw).length!==FIELDS.length||!FIELDS.every(k=>Object.hasOwn(raw,k)))return deny("INVALID_QUOTE_SCHEMA");
 if(![raw.quote_id,raw.provider_id,raw.feed_id,raw.instrument_contract_id,raw.source_sequence_epoch].every(id)||
    !(raw.venue_id===null||id(raw.venue_id))||!KIND.has(raw.quote_kind)||
    !DELIVERY.has(raw.delivery)||!TRANSPORT.has(raw.transport_kind)||
    !scale(raw.price_scale)||!scale(raw.quantity_scale)||
    !(raw.book_depth_level===null||(Number.isInteger(raw.book_depth_level)&&raw.book_depth_level>=1&&raw.book_depth_level<=100))||
    typeof raw.full_snapshot!=="boolean"||typeof raw.synthetic_fee_known!=="boolean")return deny("INVALID_QUOTE_SCHEMA");
 if(raw.data_use_scope!=="SYNTHETIC_INTERNAL"||!id(raw.data_rights_ref))return deny("RIGHTS_UNVERIFIED");
 const seq=raw.provider_sequence===null?null:u64(raw.provider_sequence);
 if(raw.provider_sequence!==null&&seq===null)return deny("INVALID_SEQUENCE");
 const bid=fixed(raw.bid,raw.price_scale),ask=fixed(raw.ask,raw.price_scale);
 if(bid===null||ask===null||bid===0n||ask===0n)return deny("MISSING_OR_INVALID_TWO_SIDED_PRICE");
 if(bid>ask)return deny("CROSSED_BOOK");
 const bidSize=raw.bid_size===null?null:fixed(raw.bid_size,raw.quantity_scale);
 const askSize=raw.ask_size===null?null:fixed(raw.ask_size,raw.quantity_scale);
 if((raw.bid_size!==null&&bidSize===null)||(raw.ask_size!==null&&askSize===null))return deny("INVALID_EXACT_SIZE");
 const c=normalizeSyntheticClockSample(raw.capture);
 if(c.status!=="VALID")return deny("INVALID_CAPTURE_"+c.reason_code);
 if(c.sample.instrument_contract_id!==raw.instrument_contract_id)return deny("CLOCK_INSTRUMENT_MISMATCH");
 const quote=Object.freeze(Object.fromEntries(FIELDS.filter(k=>k!=="capture").map(k=>[k,raw[k]]).concat([["capture",c.sample]])));
 return result("VALID_SYNTHETIC","SYNTHETIC_RECORD_ONLY",{quote});
}
function config(p){
 if(!plain(p)||!Object.hasOwn(p,"max_receive_age_ns")||!Object.hasOwn(p,"max_local_clock_error_ns")||
   !Object.hasOwn(p,"min_depth_levels")||!Object.hasOwn(p,"require_source_event_time")||
   Object.keys(p).length!==4||!Number.isInteger(p.min_depth_levels)||p.min_depth_levels<1||p.min_depth_levels>100||
   typeof p.require_source_event_time!=="boolean")return null;
 const age=u64(p.max_receive_age_ns),err=u64(p.max_local_clock_error_ns);
 return age===null||err===null?null:{age,err,minDepth:p.min_depth_levels,source:p.require_source_event_time};
}
export function assessSyntheticQuoteQuality(raw,policy,nowCapture){
 const p=config(policy);
 if(!p)return deny("INVALID_QUALITY_POLICY");
 const n=normalizeSyntheticQuote(raw);
 if(n.status!=="VALID_SYNTHETIC")return n;
 const now=normalizeSyntheticClockSample(nowCapture);
 if(now.status!=="VALID"||now.sample.instrument_contract_id!==n.quote.instrument_contract_id)
  return result("NON_ACTIONABLE","INVALID_NOW_CAPTURE");
 const c=n.quote.capture;
 const elapsed=elapsedWithinSyntheticDomain(c,now.sample);
 if(elapsed.status!=="ELAPSED")return result("NON_ACTIONABLE",elapsed.reason_code);
 if(BigInt(elapsed.elapsed_ns)>p.age)return result("NON_ACTIONABLE","STALE_FEED");
 if(c.sync_state!=="HEALTHY"||now.sample.sync_state!=="HEALTHY"||
    c.estimated_clock_error_ns===null||now.sample.estimated_clock_error_ns===null)
   return result("NON_ACTIONABLE","UNKNOWN_CLOCK");
 if(BigInt(c.estimated_clock_error_ns)>p.err||BigInt(now.sample.estimated_clock_error_ns)>p.err)
  return result("NON_ACTIONABLE","CLOCK_ERROR_BUDGET_EXCEEDED");
 if(p.source&&(c.source_event_utc_ns===null||c.source_event_uncertainty_ns===null||c.source_timestamp_semantics!=="EVENT"))
  return result("NON_ACTIONABLE","SOURCE_TIME_UNVERIFIED");
 if(n.quote.delivery!=="NORMAL")return result("NON_ACTIONABLE","SAMPLED_THROTTLED_OR_UNKNOWN");
 if(n.quote.quote_kind!=="EXECUTABLE"||n.quote.venue_id===null)
  return result("NON_ACTIONABLE","VENUE_QUOTE_NOT_EXECUTABLE");
 if(n.quote.bid_size===null||n.quote.ask_size===null||
    fixed(n.quote.bid_size,n.quote.quantity_scale)===0n||
    fixed(n.quote.ask_size,n.quote.quantity_scale)===0n)
  return result("NON_ACTIONABLE","EXECUTABLE_SIZE_UNKNOWN");
 if(n.quote.book_depth_level===null||n.quote.book_depth_level<p.minDepth)
  return result("NON_ACTIONABLE","BOOK_DEPTH_INSUFFICIENT");
 if(!n.quote.synthetic_fee_known)return result("NON_ACTIONABLE","FEE_MODEL_UNKNOWN");
 return result("SYNTHETIC_CANDIDATE_ONLY","INVENTED_INPUT_COMPLETE_NO_AUTHORITY",
  {observed_elapsed_ns:elapsed.elapsed_ns,quote_id:n.quote.quote_id,clock_domain_id:c.clock_domain_id});
}
/** Each fixture contains a single synthetic linear sequence, never an actual exchange book. */
export function advanceSyntheticSequence(previous,next){
 const current=normalizeSyntheticQuote(next);
 if(current.status!=="VALID_SYNTHETIC")return current;
 const b=current.quote;
 if(b.provider_sequence===null)return result("RESNAPSHOT_REQUIRED","UNKNOWN_SEQUENCE");
 if(previous===null){
  return b.full_snapshot?result("CURRENT_SYNTHETIC","INVENTED_SNAPSHOT_ONLY",
   {sequence:b.provider_sequence,sequence_epoch:b.source_sequence_epoch}):
   result("RESNAPSHOT_REQUIRED","INITIAL_SNAPSHOT_REQUIRED");
 }
 const prev=normalizeSyntheticQuote(previous);
 if(prev.status!=="VALID_SYNTHETIC")return deny("INVALID_PREVIOUS_QUOTE");
 const a=prev.quote;
 if(a.provider_id!==b.provider_id||a.feed_id!==b.feed_id||a.instrument_contract_id!==b.instrument_contract_id)
  return result("RESNAPSHOT_REQUIRED","SOURCE_SCOPE_CHANGED");
 if(a.source_sequence_epoch!==b.source_sequence_epoch)return result("RESNAPSHOT_REQUIRED","SEQUENCE_EPOCH_CHANGED");
 if(a.provider_sequence===null)return result("RESNAPSHOT_REQUIRED","UNKNOWN_PREVIOUS_SEQUENCE");
 if(b.full_snapshot)return result("RESNAPSHOT_REQUIRED","EXPLICIT_SNAPSHOT_RESET_REQUIRED");
 const before=BigInt(a.provider_sequence),after=BigInt(b.provider_sequence);
 if(a.quote_id===b.quote_id&&before!==after)return deny("DUPLICATE_QUOTE_ID");
 if(before===after)return result("DUPLICATE","OUT_OF_ORDER_DUPLICATE");
 if(after<before)return result("OUT_OF_ORDER","OUT_OF_ORDER_DUPLICATE");
 if(after-before!==1n)return result("GAP","SEQUENCE_GAP");
 return result("CURRENT_SYNTHETIC","INVENTED_SEQUENCE_CONTIGUOUS",
  {sequence:b.provider_sequence,sequence_epoch:b.source_sequence_epoch});
}
