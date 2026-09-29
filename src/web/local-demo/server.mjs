import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {composeSyntheticOperatorReadModel} from "../read-model.mjs";

const HOST = "127.0.0.1";
const PORT = 4173;
const WEB_VERSION = "fv-web-001-local-read-v0";
const MOCK_UTC = "2026-09-15T12:00:02.000Z";
// Pinned digest of the single immutable quote-only synthetic research fixture.
const SYNTHETIC_RESEARCH_DIGEST = "5b53f5fab62aef559e1ebc9670887c18c4dff0c2b27f25109a52cbba42532fb4";
const FLAGS = Object.freeze([
  "fixture_only",
  "execution_authorized",
  "network_performed",
  "persisted",
  "authenticated_provider_evidence",
  "real_balance_verified",
  "kill_durable",
  "financial_reconciliation_complete",
  "real_market_performance_established",
  "comparative_benchmark_supported",
  "real_latency_measured",
  "real_alert_delivered",
  "mandatory_audit_satisfied",
  "model_inference_performed",
  "human_review_complete",
  "session_authenticated",
  "server_authorization_performed",
  "live_stream_connected",
  "operator_command_available",
]);
const MODEL_ENUMS = Object.freeze([
  "mock_view",
  "mode_label",
  "displayed_session_class",
  "stream_class",
  "risk_class",
  "portfolio_class",
  "diagnostic_class",
  "advisory_class",
  "incident_banner",
  "redaction_class",
]);
const MODEL_VALUES = Object.freeze({
  mock_view: new Set(["FICTIONAL_OVERVIEW_ONLY"]),
  mode_label: new Set(["SYNTHETIC_NONAUTHORITATIVE"]),
  displayed_session_class: new Set(["NOT_AUTHENTICATED_LOCAL_FIXTURE"]),
  stream_class: new Set(["BOUNDED_LOCAL_SEQUENCE_ONLY"]),
  risk_class: new Set(["MOCK_RISK_PASS_NOT_AUTHORIZATION", "MOCK_RISK_REFUSAL"]),
  portfolio_class: new Set([
    "FICTIONAL_BALANCE_AND_LEDGER_MATCH",
    "FICTIONAL_BALANCE_UNCERTAIN",
    "FICTIONAL_BALANCE_REJECTED",
  ]),
  diagnostic_class: new Set([
    "IN_PROCESS_DIAGNOSTIC_ONLY",
    "FICTIONAL_UNKNOWN_EVENT",
    "LOCAL_DIAGNOSTIC_REFUSAL",
  ]),
  advisory_class: new Set([
    "FIXED_TEMPLATE_MOCK_ONLY",
    "FIXED_TEMPLATE_INCOMPLETE",
    "FIXED_TEMPLATE_REFUSAL",
  ]),
  incident_banner: new Set(["NO_REAL_MONITORING_OR_BROKER_STATE"]),
  redaction_class: new Set(["ONLY_BOUNDED_ENUMS_NO_IDENTIFIERS"]),
});
const RESULT_STATUSES = new Set([
  "SYNTHETIC_LOCAL_READ_MODEL",
  "SYNTHETIC_LOCAL_READ_MODEL_DEGRADED",
  "DENY",
]);
const RESULT_REASONS = new Set([
  "ALL_FOUR_MOCKS_LOCAL_ONLY_NOT_LIVE",
  "ONE_OR_MORE_FICTIONAL_SOURCES_INCOMPLETE",
  "INVALID_LOCAL_VIEW_REQUEST",
  "INVALID_OR_CROSS_SCOPE_MOCK_SESSION",
  "HOSTILE_OR_OVERSIZED_LOCAL_VIEW_REQUEST",
  "REAL_BROWSER_DATA_OR_LOGIN_NOT_IMPLEMENTED",
  "NO_MUTATING_OR_LIVE_WEB_MODES",
  "CROSS_SCOPE_FAKE_READ_DENIED",
  "ACCEPTED_SOURCE_TRUST_BOUNDARY_FAILED",
]);
const SHARED_SCOPE = Object.freeze({
  tenant_id: "invented-tenant",
  account_id: "synthetic_acct_01",
  venue_id: "fake-venue-A",
  instrument_contract_id: "FICTIONAL_EURUSD_SPOT",
  strategy_family: "SIMULATED_ONE_LEG",
});
const policyScope = () => ({
  venue_id: SHARED_SCOPE.venue_id,
  legal_entity: "fictional_entity_01",
  jurisdiction: "ZZ_TEST_ONLY",
  account_ref: SHARED_SCOPE.account_id,
  account_kind: "SIMULATED",
  instrument_contract_id: SHARED_SCOPE.instrument_contract_id,
  strategy_family: SHARED_SCOPE.strategy_family,
  api_protocol: "SIMULATED_NO_NETWORK",
});
const grant = (type, index) => ({
  type,
  ref: `fictional-grant-${index}`,
  proof_sha256: String(index + 1).padStart(64, "0"),
  reviewer_ref: "fictional-reviewer",
  scope: policyScope(),
  revoked: false,
  verified_at_utc: "2026-09-01T00:00:00.000Z",
  expires_at_utc: "2026-10-01T00:00:00.000Z",
  ...(type === "DATA_USE" ? {data_scopes: ["INTERNAL"], delivery: "TICK_COMPLETE"} : {}),
});
const policy = () => ({
  schema_version: 0,
  scope: policyScope(),
  mode: "DEMO",
  data_use: "INTERNAL",
  source_class: "SYNTHETIC_FIXTURE",
  now_utc: "2026-09-15T12:00:00.000Z",
  grants: ["ACCOUNT_API", "STRATEGY_PERMISSION", "DATA_USE", "OPERATOR_APPROVAL"].map(grant),
});
const capture = (patch = {}) => ({
  schema_version: 0,
  source_class: "SYNTHETIC_FIXTURE",
  clock_domain_id: "invented-domain-1",
  receive_epoch_id: "invented-boot-1",
  instrument_contract_id: SHARED_SCOPE.instrument_contract_id,
  local_receive_monotonic_ns: "10000000000000001",
  local_receive_wall_utc_ns: "1700000000000000000",
  estimated_clock_error_ns: "100",
  sync_state: "HEALTHY",
  source_event_utc_ns: "1700000000000000000",
  source_event_uncertainty_ns: "50",
  source_timestamp_semantics: "EVENT",
  ...patch,
});
const quote = () => ({
  schema_version: 0,
  source_class: "SYNTHETIC_FIXTURE",
  quote_id: "invented-quote-1",
  provider_id: "fake-provider-A",
  feed_id: "mock-channel-1",
  venue_id: SHARED_SCOPE.venue_id,
  instrument_contract_id: SHARED_SCOPE.instrument_contract_id,
  bid: "1.2300",
  ask: "1.2400",
  price_scale: 4,
  bid_size: "100.00",
  ask_size: "120.00",
  quantity_scale: 2,
  book_depth_level: 2,
  quote_kind: "EXECUTABLE",
  data_use_scope: "SYNTHETIC_INTERNAL",
  data_rights_ref: "invented-rights-1",
  delivery: "NORMAL",
  transport_kind: "REPLAY",
  source_sequence_epoch: "mock-seq-1",
  provider_sequence: "10",
  full_snapshot: true,
  synthetic_fee_known: true,
  capture: capture(),
});
const quality = Object.freeze({
  max_receive_age_ns: "1000",
  max_local_clock_error_ns: "1000",
  min_depth_levels: 1,
  require_source_event_time: true,
});
const nowCapture = () => capture({
  local_receive_monotonic_ns: "10000000000000101",
  local_receive_wall_utc_ns: "1700000000000000100",
});
const mockPortfolio = () => Object.freeze({
  schema_version: 0,
  source_class: "SYNTHETIC_FIXTURE",
  scope: Object.freeze({...SHARED_SCOPE}),
  version: "p-v1",
  complete: true,
  unknown_effects: false,
  known_exposure_units: "100",
  unknown_possible_fill_units: "0",
  available_quote_minor: "100000",
  available_base_units: "10000",
  daily_loss_minor: "0",
  drawdown_minor: "0",
  recent_order_count: 0,
  seen_intent_keys: Object.freeze([]),
});
const mockLimits = () => Object.freeze({
  schema_version: 0,
  source_class: "SYNTHETIC_FIXTURE",
  scope: Object.freeze({...SHARED_SCOPE}),
  version: "l-v1",
  notional_scale: 2,
  max_order_notional_minor: "1000",
  max_total_exposure_units: "1000",
  max_daily_loss_minor: "1000",
  max_drawdown_minor: "1000",
  max_orders_per_window: 5,
  worst_case_cost_bps: 100,
});
const mockKill = (engaged = false) => Object.freeze({
  schema_version: 0,
  source_class: "SYNTHETIC_FIXTURE",
  scope: Object.freeze({...SHARED_SCOPE}),
  epoch: "k-v1",
  state_known: true,
  engaged,
  mock_replayed_after_restart: true,
});
const riskRequest = (scenario) => ({
  schema_version: 0,
  source_class: "SYNTHETIC_FIXTURE",
  intent: {
    schema_version: 0,
    intent_key: "invented-intent-1",
    scope: {...SHARED_SCOPE},
    side: "BUY",
    purpose: "OPEN",
    quantity_units: "100",
    limit_price: "1.2400",
    quote_id: "invented-quote-1",
    portfolio_version: "p-v1",
    limits_version: "l-v1",
    kill_epoch: "k-v1",
  },
  policy_request: policy(),
  quote: quote(),
  quality_policy: quality,
  now_capture: nowCapture(),
  previous_quote: null,
  portfolio: mockPortfolio(),
  limits: mockLimits(),
  kill: mockKill(scenario === "degraded"),
});
const ledgerIntent = () => ({
  schema_version: 0,
  source_class: "SYNTHETIC_FIXTURE",
  tenant_id: SHARED_SCOPE.tenant_id,
  account_id: SHARED_SCOPE.account_id,
  venue_id: SHARED_SCOPE.venue_id,
  instrument_contract_id: SHARED_SCOPE.instrument_contract_id,
  intent_key: "invented-intent-1",
  side: "BUY",
  quantity_units: "100",
  created_at_utc: "2026-09-15T12:00:00.000Z",
  policy_request: policy(),
});
const executionInput = (scenario) => ({
  schema_version: 0,
  source_class: "SYNTHETIC_FIXTURE",
  leg_id: "mock-leg-A",
  risk_request: riskRequest(scenario),
  ledger_intent: ledgerIntent(),
  mock_queue_capacity: 2,
});
const balance = () => Object.freeze({
  schema_version: 0,
  source_class: "SYNTHETIC_FIXTURE",
  scope: Object.freeze({...SHARED_SCOPE}),
  version: "BAL_V1",
  observed_at_utc: "2026-09-15T00:00:00.000Z",
  valid_until_utc: "2026-09-16T00:00:00.000Z",
  complete: true,
  transfer_state: "NONE",
  available_quote_minor: "100000",
  available_base_units: "10000",
  known_exposure_units: "100",
  daily_loss_minor: "0",
  drawdown_minor: "0",
  recent_order_count: 0,
  seen_intent_keys: Object.freeze([]),
  expected_filled_units: "0",
});
const portfolioRequest = () => ({
  schema_version: 0,
  source_class: "SYNTHETIC_FIXTURE",
  scope: {...SHARED_SCOPE},
  balance: balance(),
  ledger_intent: ledgerIntent(),
  ledger_events: [],
  run_at_utc: MOCK_UTC,
});
const advisoryRequest = () => {
  const event = {
    schema_version: 0,
    source_class: "SYNTHETIC_FIXTURE",
    event_id: "replay-event-0",
    kind: "QUOTE",
    insertion_index: 0,
    clock: quote().capture,
    payload: quote(),
  };
  const events = [event];
  return {
    schema_version: 0,
    source_class: "SYNTHETIC_FIXTURE",
    advisory_version: "fv-ai-001-fixed-template-v0",
    mode: "EXPLAIN_ONLY",
    risk_request: riskRequest("healthy"),
    research_request: {
      schema_version: 0,
      source_class: "SYNTHETIC_FIXTURE",
      research_version: "fv-research-001-v0",
      quality_policy: quality,
      cases: [{
        manifest: {
          schema_version: 0,
          source_class: "SYNTHETIC_FIXTURE",
          scenario_id: "invented-scenario-1",
          dataset_sha256: SYNTHETIC_RESEARCH_DIGEST,
          engine_version: "fv-replay-001-v0",
          model_version: "mock-ledger-risk-execution-v0",
          seed: "42",
          sort_policy: "SAME_CAPTURE_DOMAIN_MONOTONIC_INSERTION_V0",
          data_use_scope: "SYNTHETIC_INTERNAL",
        },
        events,
      }],
    },
  };
};
const operatorRequest = (scenario) => {
  const mockStream = {
    schema_version: 0,
    source_class: "SYNTHETIC_FIXTURE",
    source_epoch: "invented-epoch-1",
    last_seen_epoch: null,
    last_seen_sequence: null,
    next_sequence: 0,
    connection_state: "CONNECTED_LOCAL_FIXTURE",
  };
  return {
    schema_version: 0,
    source_class: "SYNTHETIC_FIXTURE",
    web_version: WEB_VERSION,
    mode: "READ_ONLY_FIXTURE",
    requested_scope: {...SHARED_SCOPE},
    mock_now_utc: MOCK_UTC,
    session: {
      schema_version: 0,
      source_class: "SYNTHETIC_FIXTURE",
      state: "ACTIVE_LOCAL_FIXTURE",
      role: scenario === "denied" ? "MOCK_OPERATOR" : "MOCK_VIEWER",
      tenant_id: SHARED_SCOPE.tenant_id,
      expires_at_utc: "2026-09-16T00:00:00.000Z",
    },
    stream: mockStream,
    risk_request: riskRequest(scenario),
    portfolio_request: portfolioRequest(),
    observability_request: {
      schema_version: 0,
      source_class: "SYNTHETIC_FIXTURE",
      execution_creation: executionInput(scenario),
      actions: [],
    },
    advisory_request: advisoryRequest(),
  };
};

const ROOT = new URL("./public/", import.meta.url);
const STATIC_ASSETS = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/assets/app.css", ["app.css", "text/css; charset=utf-8"]],
  ["/assets/app.js", ["app.js", "text/javascript; charset=utf-8"]],
]);
const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "connect-src 'self'",
  "img-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");

const responseHeaders = () => ({
  "Content-Security-Policy": CSP,
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
});
const isAllowedHost = (host, port) =>
  host === `127.0.0.1:${port}` || host === `localhost:${port}`;
const isAllowedOrigin = (origin, port) =>
  origin === undefined ||
  origin === `http://127.0.0.1:${port}` ||
  origin === `http://localhost:${port}`;

/**
 * Writes a local-preview response with the baseline no-store security headers.
 * @param {import("node:http").ServerResponse} res Response for the current request.
 * @param {number} status HTTP status code to send.
 * @param {unknown} body A fixed local message or already-redacted response value.
 * @param {Record<string, string>} [extraHeaders={}] Narrow route-specific headers, such as `Allow`.
 * @returns {void}
 */
function send(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {...responseHeaders(), ...extraHeaders});
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}
/**
 * Validates the accepted Web read model and copies only its fixed display enums and authority flags.
 * Raw fixture inputs and unrecognized values never cross the local API boundary.
 * @param {object} result Result returned by the accepted synthetic operator read-model composer.
 * @param {"healthy"|"degraded"|"denied"} scenario Fixed fixture key used for the public scenario label.
 * @returns {Readonly<object>} Frozen, bounded snapshot containing no raw fixture fields.
 */
function safeProjection(result, scenario) {
  if (!RESULT_STATUSES.has(result.status) || !RESULT_REASONS.has(result.reason_code)) {
    throw new Error("UNEXPECTED_ACCEPTED_READ_MODEL_ENUM");
  }
  const sourceModel = result.read_model;
  let readModel = null;
  if (sourceModel !== undefined) {
    const projected = {};
    for (const key of MODEL_ENUMS) {
      if (typeof sourceModel[key] !== "string" || !MODEL_VALUES[key].has(sourceModel[key])) {
        throw new Error("UNEXPECTED_ACCEPTED_READ_MODEL_VALUE");
      }
      projected[key] = sourceModel[key];
    }
    if (typeof sourceModel.hypothetical_pause_hint !== "boolean") {
      throw new Error("UNEXPECTED_ACCEPTED_READ_MODEL_VALUE");
    }
    projected.hypothetical_pause_hint = sourceModel.hypothetical_pause_hint;
    readModel = projected;
  }
  const flags = {};
  for (const key of FLAGS) {
    if (typeof result[key] !== "boolean" || result[key] !== (key === "fixture_only")) {
      throw new Error("UNEXPECTED_ACCEPTED_READ_MODEL_AUTHORITY_FLAG");
    }
    flags[key] = result[key];
  }
  return Object.freeze({
    schema_version: 0,
    scenario: scenario === "healthy" ? "HEALTHY_FIXTURE" : scenario === "degraded" ? "INCOMPLETE_FIXTURE" : "DENIED_FIXTURE",
    status: result.status,
    reason_code: result.reason_code,
    read_model: readModel,
    flags,
  });
}

/**
 * Composes one fixed invented scenario and returns its validated redacted display snapshot.
 * @param {"healthy"|"degraded"|"denied"} [scenario="healthy"] Allowlisted local fixture selector.
 * @returns {Readonly<object>} Snapshot with fixed enums and `fixture_only`/false authority flags.
 * @throws {TypeError} When the caller supplies a scenario outside the fixed fixture set.
 */
export function createDemoSnapshot(scenario = "healthy") {
  if (!["healthy", "degraded", "denied"].includes(scenario)) {
    throw new TypeError("Unknown synthetic scenario.");
  }
  const result = composeSyntheticOperatorReadModel(operatorRequest(scenario));
  return safeProjection(result, scenario);
}

/**
 * Accepts only the snapshot route with no query or one of its three fixed scenario queries.
 * @param {string|undefined} rawUrl Unparsed HTTP request target from Node's request object.
 * @returns {boolean} Whether the target exactly matches an allowed read-only API URL.
 */
function isAllowedApiTarget(rawUrl) {
  return rawUrl === "/api/demo-snapshot" ||
    rawUrl === "/api/demo-snapshot?scenario=healthy" ||
    rawUrl === "/api/demo-snapshot?scenario=degraded" ||
    rawUrl === "/api/demo-snapshot?scenario=denied";
}

/**
 * Creates the loopback preview server with exact host, origin, method, asset, and API allowlists.
 * @param {{port?: number}} [options={}] Local port; zero is allowed for isolated tests.
 * @returns {import("node:http").Server} Unstarted HTTP server; construction performs no bind or network I/O.
 * @throws {TypeError} When the requested port is not an integer from 0 through 65535.
 */
function createLocalDemoServer({port = PORT} = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new TypeError("Local preview port must be an integer between 0 and 65535.");
  }
  return createServer(async (req, res) => {
    const activePort = req.socket.localPort;
    const headers = responseHeaders();
    if (!isAllowedHost(req.headers.host ?? "", activePort)) {
      send(res, 403, {error: "HOST_NOT_ALLOWED"});
      return;
    }
    if (!isAllowedOrigin(req.headers.origin, activePort)) {
      send(res, 403, {error: "ORIGIN_NOT_ALLOWED"});
      return;
    }
    if (req.method !== "GET") {
      send(res, 405, {error: "METHOD_NOT_ALLOWED"}, {Allow: "GET"});
      return;
    }
    if (STATIC_ASSETS.has(req.url)) {
      const [file, type] = STATIC_ASSETS.get(req.url);
      try {
        const body = await readFile(new URL(file, ROOT));
        res.writeHead(200, {...headers, "Content-Type": type});
        res.end(body);
      } catch {
        send(res, 500, {error: "LOCAL_ASSET_UNAVAILABLE"});
      }
      return;
    }
    if (isAllowedApiTarget(req.url)) {
      const scenario = req.url?.endsWith("scenario=degraded") ? "degraded" :
        req.url?.endsWith("scenario=denied") ? "denied" : "healthy";
      try {
        send(res, 200, createDemoSnapshot(scenario));
      } catch {
        send(res, 503, {error: "SYNTHETIC_READ_MODEL_UNAVAILABLE"});
      }
      return;
    }
    send(res, 404, {error: "NOT_FOUND"});
  });
}

/**
 * Starts the preview exclusively on 127.0.0.1 and resolves only after the listener is ready.
 * Importing this module does not call this function or start a listener.
 * @param {{port?: number}} [options={}] Local port; zero asks the OS for an ephemeral test port.
 * @returns {Promise<import("node:http").Server>} The listening loopback-only server.
 */
export function startLocalDemo({port = PORT} = {}) {
  const server = createLocalDemoServer({port});
  return new Promise((resolveStart, rejectStart) => {
    const onError = (error) => {
      server.removeListener("listening", onListening);
      rejectStart(error);
    };
    const onListening = () => {
      server.removeListener("error", onError);
      resolveStart(server);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, HOST);
  });
}

const invokedAsScript = process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedAsScript) {
  try {
    await startLocalDemo();
    process.stdout.write(`Fairview synthetic local preview: http://${HOST}:${PORT}\n`);
  } catch {
    process.stderr.write("Could not start the local preview on 127.0.0.1:4173.\n");
    process.exitCode = 1;
  }
}
