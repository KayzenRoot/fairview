// FV-LEDGER-001: deterministic invented fixtures only. No persistence, I/O or external order authority.
import { evaluateSyntheticEligibility } from '../policy/eligibility.mjs';

const owned = new WeakSet();
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const UNITS = /^(?:0|[1-9][0-9]*)$/;
const MAX_UNITS = (1n << 64n) - 1n;
const MAX_EVENTS = 64;
const TYPES = new Set(['MARK_MAY_HAVE_SENT', 'MOCK_ACK', 'MOCK_FILL', 'MOCK_CANCEL_REQUEST',
  'MOCK_CANCEL_CONFIRMED', 'MOCK_TIMEOUT', 'MOCK_REJECT', 'MOCK_RECONCILE']);
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x) &&
  Object.getPrototypeOf(x) === Object.prototype;
const id = x => typeof x === 'string' && ID.test(x) && x !== '*' && x !== 'ALL';
const units = (x, allowZero = false) => {
  if (typeof x !== 'string' || x.length > 20 || !UNITS.test(x)) return null;
  const n = BigInt(x);
  return n <= MAX_UNITS && (allowZero || n > 0n) ? n : null;
};
const exactKeys = (o, keys) => plain(o) && Object.keys(o).length === keys.length &&
  keys.every(k => Object.hasOwn(o, k));
const base = (status, reason_code, extras = {}) => Object.freeze({ schema_version: 0, status,
  reason_code, fixture_only: true, durable: false, execution_authorized: false, ...extras });
const deny = reason => base('DENY', reason);
const freezeState = s => {
  const state = Object.freeze({ ...s, scope: Object.freeze({ ...s.scope }),
    policy_evidence_refs: Object.freeze([...s.policy_evidence_refs]),
    journal: Object.freeze(s.journal.map(e => Object.freeze({ ...e }))) });
  owned.add(state);
  return state;
};
const eventFields = {
  MARK_MAY_HAVE_SENT: [], MOCK_ACK: [], MOCK_FILL: ['execution_id', 'quantity_units'],
  MOCK_CANCEL_REQUEST: [], MOCK_CANCEL_CONFIRMED: [], MOCK_TIMEOUT: [], MOCK_REJECT: [],
  MOCK_RECONCILE: ['receipt']
};

export function beginSyntheticIntent(input) {
  try {
    if (!exactKeys(input, ['schema_version','source_class','ledger_id','intent_key','quantity_units','policy_request']) ||
        input.schema_version !== 0 || input.source_class !== 'SYNTHETIC_FIXTURE' ||
        !id(input.ledger_id) || !id(input.intent_key) || units(input.quantity_units) === null)
      return deny('INVALID_INTENT');
    if (!plain(input.policy_request) || input.policy_request.mode !== 'PAPER' ||
        input.policy_request.source_class !== 'SYNTHETIC_FIXTURE') return deny('POLICY_NOT_SYNTHETIC_PAPER');
    const decision = evaluateSyntheticEligibility(input.policy_request);
    if (decision?.decision !== 'PAPER_ELIGIBLE' || decision.fixture_only !== true ||
        decision.execution_authorized !== false || !plain(input.policy_request.scope))
      return deny('POLICY_DENIED');
    const scope = input.policy_request.scope;
    const bound = ['venue_id','legal_entity','jurisdiction','account_ref','account_kind',
      'instrument_contract_id','strategy_family','api_protocol'];
    if (!exactKeys(scope, bound) || !bound.every(k => id(scope[k])) ||
        !Array.isArray(decision.authorization_evidence_refs) ||
        !decision.authorization_evidence_refs.every(id)) return deny('UNBOUND_POLICY_SCOPE');
    const state = freezeState({ledger_id: input.ledger_id, intent_key: input.intent_key,
      quantity_units: input.quantity_units, cumulative_filled_units: '0',
      phase: 'INTENT_RECORDED_SYNTHETIC', locked: false, scope: Object.fromEntries(bound.map(k => [k, scope[k]])),
      policy_evidence_refs: decision.authorization_evidence_refs, journal: [],
      fixture_only: true, durable: false, execution_authorized: false});
    return base('VALID_SYNTHETIC','IN_MEMORY_INTENT_ONLY',{state});
  } catch { return deny('INVALID_INTENT'); }
}

export function appendSyntheticLedgerEvent(state, event) {
  try {
    if (!owned.has(state) || !Object.isFrozen(state) || !Object.isFrozen(state.journal))
      return deny('UNTRUSTED_STATE');
    if (!plain(event) || event.schema_version !== 0 || event.source_class !== 'SYNTHETIC_FIXTURE' ||
        !TYPES.has(event.kind) || !id(event.event_id) || event.intent_key !== state.intent_key ||
        !exactKeys(event, ['schema_version','source_class','event_id','intent_key','kind',...eventFields[event.kind]]))
      return deny('INVALID_OR_CROSS_SCOPE_EVENT');
    if (state.journal.length >= MAX_EVENTS) return deny('JOURNAL_CAPACITY_REACHED');
    if (state.journal.some(e => e.event_id === event.event_id)) return deny('DUPLICATE_EVENT_ID');
    const filled = BigInt(state.cumulative_filled_units);
    const total = BigInt(state.quantity_units);
    let phase = state.phase, locked = state.locked, cumulative = filled;
    let receipt = null;
    if (event.kind === 'MARK_MAY_HAVE_SENT') {
      if (phase !== 'INTENT_RECORDED_SYNTHETIC') return deny('ILLEGAL_TRANSITION');
      phase = 'MAY_HAVE_SENT_SYNTHETIC';
    } else if (event.kind === 'MOCK_ACK') {
      if (!['MAY_HAVE_SENT_SYNTHETIC','PARTIAL_FILL_SYNTHETIC','FILLED_SYNTHETIC'].includes(phase))
        return deny('ACK_WITHOUT_POSSIBLE_SEND');
      if (phase === 'MAY_HAVE_SENT_SYNTHETIC') phase = 'ACKNOWLEDGED_SYNTHETIC';
    } else if (event.kind === 'MOCK_FILL') {
      if (!id(event.execution_id) || units(event.quantity_units) === null) return deny('INVALID_FILL');
      if (state.journal.some(e => e.execution_id === event.execution_id)) return deny('DUPLICATE_EXECUTION_ID');
      if (!['MAY_HAVE_SENT_SYNTHETIC','ACKNOWLEDGED_SYNTHETIC','PARTIAL_FILL_SYNTHETIC',
        'CANCEL_REQUESTED_SYNTHETIC','CANCEL_CONFIRMED_SYNTHETIC','REJECTED_SYNTHETIC'].includes(phase))
        return deny('FILL_WITHOUT_POSSIBLE_SEND_OR_AFTER_LOCK');
      cumulative += units(event.quantity_units);
      if (cumulative > total) return deny('FILL_OVERFLOW_OR_OVERFILL');
      if (['CANCEL_REQUESTED_SYNTHETIC','CANCEL_CONFIRMED_SYNTHETIC','REJECTED_SYNTHETIC'].includes(phase)) {
        phase = 'DISCREPANCY_LOCKED'; locked = true;
      } else phase = cumulative === total ? 'FILLED_SYNTHETIC' : 'PARTIAL_FILL_SYNTHETIC';
    } else if (event.kind === 'MOCK_CANCEL_REQUEST') {
      if (!['MAY_HAVE_SENT_SYNTHETIC','ACKNOWLEDGED_SYNTHETIC','PARTIAL_FILL_SYNTHETIC'].includes(phase))
        return deny('ILLEGAL_CANCEL_REQUEST');
      phase = 'CANCEL_REQUESTED_SYNTHETIC';
    } else if (event.kind === 'MOCK_CANCEL_CONFIRMED') {
      if (phase !== 'CANCEL_REQUESTED_SYNTHETIC') return deny('CANCEL_NOT_REQUESTED');
      phase = 'CANCEL_CONFIRMED_SYNTHETIC';
    } else if (event.kind === 'MOCK_TIMEOUT') {
      if (!['MAY_HAVE_SENT_SYNTHETIC','ACKNOWLEDGED_SYNTHETIC','PARTIAL_FILL_SYNTHETIC',
        'CANCEL_REQUESTED_SYNTHETIC'].includes(phase)) return deny('ILLEGAL_TIMEOUT');
      phase = 'UNKNOWN_NEEDS_RECONCILIATION'; locked = true;
    } else if (event.kind === 'MOCK_REJECT') {
      if (phase !== 'MAY_HAVE_SENT_SYNTHETIC') return deny('ILLEGAL_REJECTION');
      phase = 'REJECTED_SYNTHETIC';
    } else if (event.kind === 'MOCK_RECONCILE') {
      if (!['UNKNOWN_NEEDS_RECONCILIATION','DISCREPANCY_LOCKED'].includes(phase))
        return deny('RECONCILIATION_NOT_REQUIRED');
      const r = event.receipt;
      if (!exactKeys(r,['schema_version','source_class','intent_key','complete','filled_units','open']) ||
          r.schema_version !== 0 || r.source_class !== 'SYNTHETIC_FIXTURE' || r.intent_key !== state.intent_key ||
          typeof r.complete !== 'boolean' || typeof r.open !== 'boolean' || units(r.filled_units,true) === null)
        return deny('INVALID_MOCK_RECEIPT');
      receipt = Object.freeze({complete:r.complete, filled_units:r.filled_units, open:r.open});
      if (r.complete && !r.open && BigInt(r.filled_units) === filled) {
        phase = 'SYNTHETIC_RECONCILED'; locked = true; // separate fresh risk/policy admission required.
      } else { phase = 'DISCREPANCY_LOCKED'; locked = true; }
    }
    const recorded = {event_id:event.event_id,kind:event.kind};
    if (event.kind === 'MOCK_FILL') { recorded.execution_id=event.execution_id; recorded.quantity_units=event.quantity_units; }
    if (receipt) { recorded.mock_receipt_complete=receipt.complete; recorded.mock_filled_units=receipt.filled_units; recorded.mock_open=receipt.open; }
    const next = freezeState({...state,phase,locked,cumulative_filled_units:cumulative.toString(),
      journal:[...state.journal,recorded]});
    return base('VALID_SYNTHETIC',phase,{state:next});
  } catch { return deny('INVALID_EVENT_OR_STATE'); }
}

// Replay is only a repeatable in-memory fixture; never a transaction log or crash-recovery proof.
export function replaySyntheticLedgerEvents(initial, events) {
  try {
    if (!Array.isArray(events) || events.length > MAX_EVENTS) return deny('INVALID_REPLAY');
    let result = beginSyntheticIntent(initial);
    if (result.status !== 'VALID_SYNTHETIC') return result;
    for (const event of events) {
      result = appendSyntheticLedgerEvent(result.state,event);
      if (result.status !== 'VALID_SYNTHETIC') return result;
    }
    return result;
  } catch { return deny('INVALID_REPLAY'); }
}
