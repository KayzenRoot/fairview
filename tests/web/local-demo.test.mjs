import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {once} from "node:events";
import {readFile} from "node:fs/promises";
import http from "node:http";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import vm from "node:vm";
import test from "node:test";
import {
  createDemoSnapshot,
  startLocalDemo,
} from "../../src/web/local-demo/server.mjs";

const SERVER_PATH = resolve("src/web/local-demo/server.mjs");
const APP_PATH = resolve("src/web/local-demo/public/app.js");
const FLAG_KEYS = [
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
];
const MODEL_KEYS = [
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
  "hypothetical_pause_hint",
];
const VIEW_CARD_IDS = Object.freeze({
  markets: "markets",
  strategies: "strategies",
  risk: "risk",
  portfolio: "portfolio",
  replay: "replay",
  incidents: "incident",
  advisory: "advisory",
  settings: "settings",
});

/**
 * Runs a test callback against an ephemeral server and always closes its loopback listener.
 * @param {(context: {server: import("node:http").Server, port: number}) => Promise<void>} run Test body.
 * @returns {Promise<void>} Resolves when the callback and server cleanup complete.
 */
async function withServer(run) {
  const server = await startLocalDemo({port: 0});
  const address = server.address();
  assert.equal(address.address, "127.0.0.1");
  assert.equal(server.listening, true);
  try {
    await run({server, port: address.port});
  } finally {
    await new Promise((resolveClose, rejectClose) => {
      server.close((error) => error ? rejectClose(error) : resolveClose());
    });
  }
}
/**
 * Sends one HTTP request to 127.0.0.1 while allowing tests to vary the checked headers and method.
 * @param {number} port Ephemeral local port returned by `withServer`.
 * @param {string} requestPath Exact request target to exercise.
 * @param {{host?: string, origin?: string, headers?: Record<string, string>, method?: string}} [options={}] Request variations.
 * @returns {Promise<{status: number, headers: import("node:http").IncomingHttpHeaders, body: string}>} Buffered local response.
 */
function request(port, requestPath, options = {}) {
  return new Promise((resolveResponse, rejectResponse) => {
    const headers = {
      host: options.host ?? `127.0.0.1:${port}`,
      ...(options.origin === undefined ? {} : {origin: options.origin}),
      ...(options.headers ?? {}),
    };
    const req = http.request({
      agent: false,
      hostname: "127.0.0.1",
      port,
      method: options.method ?? "GET",
      path: requestPath,
      headers,
    }, (res) => {
      res.setEncoding("utf8");
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => resolveResponse({status: res.statusCode, headers: res.headers, body}));
    });
    req.once("error", rejectResponse);
    req.end();
  });
}
const parseJson = (response) => JSON.parse(response.body);
/**
 * Creates a promise whose completion the test controls to make response races deterministic.
 * @template T
 * @returns {{promise: Promise<T>, resolve: (value: T) => void, reject: (reason?: unknown) => void}} Deferred controls.
 */
function deferred() {
  let resolvePromise;
  let rejectPromise;
  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return {promise, resolve: resolvePromise, reject: rejectPromise};
}
/**
 * Builds the minimal mutable DOM element shape consumed by the real preview script in VM tests.
 * @param {string} [value=""] Initial select value when modeling the scenario selector.
 * @returns {object} Fake element with text, dataset, attributes, and event-listener storage.
 */
function fakeElement(value = "") {
  return {
    textContent: "",
    value,
    hidden: false,
    dataset: {},
    attributes: new Map(),
    listeners: new Map(),
    addEventListener(type, listener) { this.listeners.set(type, listener); },
    setAttribute(name, attributeValue) { this.attributes.set(name, attributeValue); },
    removeAttribute(name) { this.attributes.delete(name); },
  };
}
/**
 * Executes the actual app script with a deterministic fake DOM and deferred same-origin fetches.
 * The harness captures the startup request so tests can resolve responses in any chosen order.
 * @param {string} [initialHash="#overview"] Initial browser hash for direct-route startup coverage.
 * @returns {Promise<{elements: Map<string, object>, requests: Array<object>, links: Array<object>, history: {lastUrl: string}, startupPromise: Promise<void>, selectScenario: (scenario: string) => Promise<void>, navigate: (viewId: string) => {prevented: boolean, url: string}, setHash: (hash: string) => void}>} UI controls and captured requests.
 */
async function createUiHarness(initialHash = "#overview") {
  const source = await readFile(APP_PATH, "utf8");
  const startupCall = "loadSnapshot(scenarioSelect.value);";
  const instrumentedSource = source.replace(
    startupCall,
    "globalThis.__startupSnapshotPromise = loadSnapshot(scenarioSelect.value);",
  );
  assert.notEqual(instrumentedSource, source, "capture the real startup request promise");

  const selectors = [
    "#snapshot-status", "#snapshot-status-text", "#snapshot-scenario", "#fixture-scenario",
    "#overview-panel", "#markets-panel", "#strategies-panel", "#risk-panel", "#portfolio-panel",
    "#replay-panel", "#incidents-panel", "#advisory-panel", "#settings-panel",
    "#scenario-control", "#mode-value",
    "#risk-value", "#portfolio-value", "#diagnostic-value", "#model-view",
    "#advisory-value", "#incident-value", "#session-value", "#pause-note-text",
    "#pause-note", "#scenario-value", "#breadcrumb-current", "#page-title",
    "#page-description",
    "#risk-view-card", "#risk-page-value", "#risk-pause-value", "#risk-page-context",
    "#portfolio-view-card", "#portfolio-page-value", "#portfolio-certainty", "#portfolio-page-context",
    "#incident-view-card", "#incident-page-banner", "#incident-page-diagnostic", "#incident-page-context",
    "#advisory-view-card", "#advisory-page-value", "#advisory-page-context",
    "#advisory-model-state", "#advisory-human-state",
    "#markets-view-card", "#markets-mode-value", "#markets-stream-value", "#markets-redaction-value", "#markets-page-context",
    "#strategies-view-card", "#strategies-mode-value", "#strategies-redaction-value", "#strategies-page-context",
    "#replay-view-card", "#replay-stream-value", "#replay-session-value", "#replay-redaction-value", "#replay-page-context",
    "#settings-view-card", "#settings-mode-value", "#settings-session-value", "#settings-redaction-value", "#settings-page-context",
  ];
  const elements = new Map(selectors.map((selector) => [selector, fakeElement()]));
  elements.get("#fixture-scenario").value = "healthy";
  elements.get("#advisory-model-state").textContent = "FALSE · NO MODEL";
  elements.get("#advisory-human-state").textContent = "FALSE · NO HUMAN APPROVAL";
  const links = [
    "overview", "markets", "strategies", "portfolio", "risk", "replay",
    "incidents", "advisory", "settings",
  ].map((view) => {
    const link = fakeElement();
    link.dataset.view = view;
    return link;
  });
  const document = {
    querySelector: (selector) => elements.get(selector) ?? null,
    querySelectorAll: (selector) => selector === "[data-view]" ? links : [],
  };
  const requests = [];
  const fetch = (url, options) => {
    const request = {url, options, ...deferred()};
    requests.push(request);
    return request.promise;
  };
  const location = {hash: initialHash};
  const history = {
    lastUrl: initialHash,
    replaceState(_state, _title, url) {
      this.lastUrl = url;
      location.hash = url;
    },
  };
  const hashListeners = new Map();
  const context = vm.createContext({
    document,
    fetch,
    history,
    location,
    window: {addEventListener(type, listener) { hashListeners.set(type, listener); }},
  });
  vm.runInContext(instrumentedSource, context, {filename: APP_PATH});
  return {
    elements,
    requests,
    links,
    history,
    startupPromise: context.__startupSnapshotPromise,
    selectScenario(scenario) {
      const selector = elements.get("#fixture-scenario");
      selector.value = scenario;
      return selector.listeners.get("change")();
    },
    navigate(viewId) {
      const link = links.find((candidate) => candidate.dataset.view === viewId);
      let prevented = false;
      link.listeners.get("click")({preventDefault() { prevented = true; }});
      return {prevented, url: history.lastUrl};
    },
    setHash(hash) {
      location.hash = hash;
      hashListeners.get("hashchange")();
    },
  };
}
/**
 * Creates a minimal successful JSON response, with an overridable body promise for late-body tests.
 * @param {object|undefined} snapshot Synthetic snapshot returned by the default body reader.
 * @param {() => Promise<object|undefined>} [json] Body reader, optionally deferred to control completion order.
 * @returns {{ok: boolean, headers: {get: (name: string) => string|null}, json: () => Promise<object|undefined>}} Fetch response stub.
 */
function apiResponse(snapshot, json = () => Promise.resolve(snapshot)) {
  return {
    ok: true,
    headers: {get: (name) => name === "content-type" ? "application/json; charset=utf-8" : null},
    json,
  };
}
/**
 * Asserts the selected fixture maps to its expected redacted labels and degraded/ready state.
 * @param {{elements: Map<string, {textContent: string, dataset: Record<string, string>}>}} harness Fake UI returned by `createUiHarness`.
 * @param {"healthy"|"degraded"|"denied"} selectedScenario Fixture whose visible state is being checked.
 * @returns {void}
 */
function assertDisplayedScenario(harness, selectedScenario) {
  const expected = {
    healthy: {
      scenario: "HEALTHY_FIXTURE",
      status: "ready",
      mode: "SYNTHETIC_NONAUTHORITATIVE",
      risk: "Mock risk · no authority",
      portfolio: "Fictional ledger match",
      hint: "NO HINT — HYPOTHETICAL ONLY",
      certainty: "COMPLETE SYNTHETIC FIXTURE",
      incidentBanner: "No live monitoring or broker state",
      diagnostic: "In-process diagnostic",
      advisory: "Fixed template only",
      marketMode: "Synthetic · non-authoritative",
      stream: "Bounded local synthetic sequence only",
      redaction: "Only bounded enums; no identifiers",
      session: "No authenticated session",
    },
    degraded: {
      scenario: "INCOMPLETE_FIXTURE",
      status: "degraded",
      mode: "SYNTHETIC_NONAUTHORITATIVE",
      risk: "Mock risk refused",
      portfolio: "Fictional ledger match",
      hint: "YES — HYPOTHETICAL ONLY",
      certainty: "INCOMPLETE SYNTHETIC FIXTURE",
      incidentBanner: "No live monitoring or broker state",
      diagnostic: "Local diagnostic refused",
      advisory: "Fixed template only",
      marketMode: "Synthetic · non-authoritative",
      stream: "Bounded local synthetic sequence only",
      redaction: "Only bounded enums; no identifiers",
      session: "No authenticated session",
    },
    denied: {
      scenario: "DENIED_FIXTURE",
      status: "denied",
      mode: "READ_MODEL_UNAVAILABLE",
      risk: "READ_MODEL_UNAVAILABLE",
      portfolio: "READ_MODEL_UNAVAILABLE",
      hint: "READ_MODEL_UNAVAILABLE",
      certainty: "READ_MODEL_UNAVAILABLE",
      incidentBanner: "READ_MODEL_UNAVAILABLE",
      diagnostic: "READ_MODEL_UNAVAILABLE",
      advisory: "READ_MODEL_UNAVAILABLE",
      marketMode: "READ_MODEL_UNAVAILABLE",
      stream: "READ_MODEL_UNAVAILABLE",
      redaction: "READ_MODEL_UNAVAILABLE",
      session: "READ_MODEL_UNAVAILABLE",
    },
  }[selectedScenario];
  assert.equal(harness.elements.get("#fixture-scenario").value, selectedScenario);
  assert.equal(harness.elements.get("#scenario-value").textContent, expected.scenario);
  assert.equal(harness.elements.get("#snapshot-status").dataset.state, expected.status);
  assert.equal(harness.elements.get("#mode-value").textContent, expected.mode);
  assert.equal(harness.elements.get("#risk-value").textContent, expected.risk);
  assert.equal(harness.elements.get("#snapshot-scenario").textContent, expected.scenario);
  assert.equal(harness.elements.get("#risk-page-value").textContent, expected.risk);
  assert.equal(harness.elements.get("#risk-pause-value").textContent, expected.hint);
  assert.equal(harness.elements.get("#portfolio-page-value").textContent, expected.portfolio);
  assert.equal(harness.elements.get("#portfolio-certainty").textContent, expected.certainty);
  assert.equal(harness.elements.get("#incident-page-banner").textContent, expected.incidentBanner);
  assert.equal(harness.elements.get("#incident-page-diagnostic").textContent, expected.diagnostic);
  assert.equal(harness.elements.get("#advisory-page-value").textContent, expected.advisory);
  assert.equal(harness.elements.get("#markets-mode-value").textContent, expected.marketMode);
  assert.equal(harness.elements.get("#markets-stream-value").textContent, expected.stream);
  assert.equal(harness.elements.get("#markets-redaction-value").textContent, expected.redaction);
  assert.equal(harness.elements.get("#strategies-mode-value").textContent, expected.marketMode);
  assert.equal(harness.elements.get("#strategies-redaction-value").textContent, expected.redaction);
  assert.equal(harness.elements.get("#replay-stream-value").textContent, expected.stream);
  assert.equal(harness.elements.get("#replay-session-value").textContent, expected.session);
  assert.equal(harness.elements.get("#replay-redaction-value").textContent, expected.redaction);
  assert.equal(harness.elements.get("#settings-mode-value").textContent, expected.marketMode);
  assert.equal(harness.elements.get("#settings-session-value").textContent, expected.session);
  assert.equal(harness.elements.get("#settings-redaction-value").textContent, expected.redaction);
  assert.equal(harness.elements.get("#advisory-model-state").textContent, "FALSE · NO MODEL");
  assert.equal(harness.elements.get("#advisory-human-state").textContent, "FALSE · NO HUMAN APPROVAL");
  for (const view of ["markets", "strategies", "risk", "portfolio", "replay", "incidents", "advisory", "settings"]) {
    const card = harness.elements.get(`#${VIEW_CARD_IDS[view]}-view-card`);
    assert.ok(card, `${view} value card exists in the fake DOM`);
    assert.equal(card.dataset.state, expected.status);
  }
}

/**
 * Asserts every dynamic value from all nine implemented views is cleared after an invalid response.
 * @param {{elements: Map<string, {textContent: string, dataset: Record<string, string>}>}} harness Fake UI under test.
 * @returns {void}
 */
function assertAllImplementedViewsUnavailable(harness) {
  for (const selector of [
    "#scenario-value", "#snapshot-scenario", "#mode-value", "#risk-value", "#portfolio-value",
    "#diagnostic-value", "#model-view", "#advisory-value", "#incident-value", "#session-value",
    "#risk-page-value", "#risk-pause-value", "#portfolio-page-value", "#portfolio-certainty",
    "#incident-page-banner", "#incident-page-diagnostic", "#advisory-page-value",
    "#markets-mode-value", "#markets-stream-value", "#markets-redaction-value",
    "#strategies-mode-value", "#strategies-redaction-value", "#replay-stream-value",
    "#replay-session-value", "#replay-redaction-value", "#settings-mode-value",
    "#settings-session-value", "#settings-redaction-value",
  ]) {
    const expected = ["#scenario-value", "#snapshot-scenario"].includes(selector)
      ? "SNAPSHOT_UNAVAILABLE"
      : "READ_MODEL_UNAVAILABLE";
    assert.equal(harness.elements.get(selector).textContent, expected, selector);
  }
  for (const view of ["markets", "strategies", "risk", "portfolio", "replay", "incidents", "advisory", "settings"]) {
    const selector = `#${VIEW_CARD_IDS[view]}-view-card`;
    const card = harness.elements.get(selector);
    assert.ok(card, `${selector} exists in the fake DOM`);
    assert.equal(card.dataset.state, "error", selector);
  }
  assert.equal(harness.elements.get("#advisory-model-state").textContent, "FALSE · NO MODEL");
  assert.equal(harness.elements.get("#advisory-human-state").textContent, "FALSE · NO HUMAN APPROVAL");
  for (const view of ["markets", "strategies", "replay", "settings"]) {
    assert.equal(harness.elements.get(`#${view}-page-context`).textContent,
      "Snapshot unavailable or invalid; earlier view values are cleared.", `${view} context`);
  }
}

/**
 * Asserts a valid response for a different requested fixture remains unavailable on every implemented view.
 * @param {{elements: Map<string, {textContent: string, value: string, dataset: Record<string, string>}>}} harness Fake UI returned by `createUiHarness`.
 * @param {"healthy"|"degraded"|"denied"} requestedScenario Scenario requested by the current selection.
 * @param {object} receivedSnapshot Valid synthetic snapshot whose scenario does not match the request.
 * @returns {void}
 */
function assertScenarioMismatchFailsClosed(harness, requestedScenario, receivedSnapshot) {
  assert.equal(harness.elements.get("#fixture-scenario").value, requestedScenario);
  assert.equal(harness.elements.get("#snapshot-status").dataset.state, "error");
  assert.equal(harness.elements.get("#snapshot-status-text").textContent, "Snapshot did not match the synthetic display contract.");

  const unavailableSelectors = [
    "#scenario-value", "#snapshot-scenario", "#mode-value", "#risk-value", "#portfolio-value",
    "#diagnostic-value", "#model-view", "#advisory-value", "#incident-value", "#session-value",
    "#risk-page-value", "#risk-pause-value", "#portfolio-page-value", "#portfolio-certainty",
    "#incident-page-banner", "#incident-page-diagnostic", "#advisory-page-value",
    "#markets-mode-value", "#markets-stream-value", "#markets-redaction-value",
    "#strategies-mode-value", "#strategies-redaction-value", "#replay-stream-value",
    "#replay-session-value", "#replay-redaction-value", "#settings-mode-value",
    "#settings-session-value", "#settings-redaction-value",
  ];
  for (const selector of unavailableSelectors) {
    const expected = ["#scenario-value", "#snapshot-scenario"].includes(selector)
      ? "SNAPSHOT_UNAVAILABLE"
      : "READ_MODEL_UNAVAILABLE";
    assert.equal(harness.elements.get(selector).textContent, expected, selector);
  }
  for (const selector of [
    "#risk-page-context", "#portfolio-page-context", "#incident-page-context", "#advisory-page-context",
    "#markets-page-context", "#strategies-page-context", "#replay-page-context", "#settings-page-context", "#pause-note-text",
  ]) {
    assert.equal(
      harness.elements.get(selector).textContent,
      "Snapshot unavailable or invalid; earlier view values are cleared.",
      selector,
    );
  }
  for (const view of ["markets", "strategies", "risk", "portfolio", "replay", "incidents", "advisory", "settings"]) {
    const selector = `#${VIEW_CARD_IDS[view]}-view-card`;
    assert.equal(harness.elements.get(selector).dataset.state, "error", selector);
  }

  const rendered = [...harness.elements.values()].map((element) => element.textContent).join(" ");
  const receivedLabels = [receivedSnapshot.scenario, receivedSnapshot.status, ...Object.values(receivedSnapshot.read_model ?? {})]
    .filter((value) => typeof value === "string");
  for (const label of receivedLabels) {
    assert.equal(rendered.includes(label), false, `wrong-scenario fixture label must not render: ${label}`);
  }
}

test("server import is inert and its supported starter binds only loopback", async () => {
  const moduleUrl = pathToFileURL(SERVER_PATH).href;
  const child = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", `await import(${JSON.stringify(moduleUrl)})`],
    {encoding: "utf8", timeout: 4000},
  );
  assert.equal(child.error, undefined, child.error?.message);
  assert.equal(child.status, 0, child.stderr);
  await withServer(async ({server}) => {
    assert.equal(server.address().address, "127.0.0.1");
    assert.equal(server.listening, true);
  });
});

test("healthy and incomplete snapshots invoke the accepted Web read model and expose enums only", async () => {
  const healthy = createDemoSnapshot("healthy");
  const incomplete = createDemoSnapshot("degraded");
  const denied = createDemoSnapshot("denied");
  assert.equal(healthy.status, "SYNTHETIC_LOCAL_READ_MODEL");
  assert.equal(healthy.reason_code, "ALL_FOUR_MOCKS_LOCAL_ONLY_NOT_LIVE");
  assert.equal(healthy.scenario, "HEALTHY_FIXTURE");
  assert.equal(incomplete.status, "SYNTHETIC_LOCAL_READ_MODEL_DEGRADED");
  assert.equal(incomplete.reason_code, "ONE_OR_MORE_FICTIONAL_SOURCES_INCOMPLETE");
  assert.equal(incomplete.scenario, "INCOMPLETE_FIXTURE");
  assert.equal(denied.status, "DENY");
  assert.equal(denied.reason_code, "INVALID_OR_CROSS_SCOPE_MOCK_SESSION");
  assert.equal(denied.scenario, "DENIED_FIXTURE");
  assert.equal(denied.read_model, null);
  assert.equal(denied.flags.fixture_only, true);
  assert.equal(healthy.read_model.mode_label, "SYNTHETIC_NONAUTHORITATIVE");
  assert.equal(healthy.read_model.hypothetical_pause_hint, false);
  assert.equal(incomplete.read_model.risk_class, "MOCK_RISK_REFUSAL");
  assert.equal(incomplete.read_model.hypothetical_pause_hint, true);
  assert.deepEqual(Object.keys(healthy), [
    "schema_version",
    "scenario",
    "status",
    "reason_code",
    "read_model",
    "flags",
  ]);
  assert.deepEqual(Object.keys(healthy.read_model).sort(), [...MODEL_KEYS].sort());
  assert.deepEqual(Object.keys(healthy.flags).sort(), [...FLAG_KEYS].sort());
  for (const snapshot of [healthy, incomplete, denied]) {
    assert.equal(snapshot.flags.fixture_only, true);
    for (const key of FLAG_KEYS.filter((name) => name !== "fixture_only")) {
      assert.equal(snapshot.flags[key], false, key);
    }
  }
  for (const raw of [
    "invented-tenant",
    "synthetic_acct_01",
    "fake-venue-A",
    "FICTIONAL_EURUSD_SPOT",
    "invented-quote-1",
    "invented-rights-1",
    "fictional-grant-1",
    "1.2300",
    "1.2400",
    "model_prompt",
    "session_token",
  ]) {
    assert.equal(JSON.stringify(healthy).includes(raw), false, raw);
    assert.equal(JSON.stringify(incomplete).includes(raw), false, raw);
  }
  assert.deepEqual(createDemoSnapshot("healthy"), healthy);
  assert.deepEqual(createDemoSnapshot("degraded"), incomplete);
  assert.deepEqual(createDemoSnapshot("denied"), denied);
  assert.throws(() => createDemoSnapshot("real"), /Unknown synthetic scenario/);
  const source = await readFile(SERVER_PATH, "utf8");
  assert.match(source, /composeSyntheticOperatorReadModel\(operatorRequest\(scenario\)\)/);
  assert.match(source, /composeSyntheticOperatorReadModel/);
  assert.doesNotMatch(source, /from ["'][^"']*replay\/deterministic\.mjs/);
});

test("only the fixed fixture scenarios are accepted", async () => {
  await withServer(async ({port}) => {
    for (const requestPath of [
      "/api/demo-snapshot",
      "/api/demo-snapshot?scenario=healthy",
      "/api/demo-snapshot?scenario=degraded",
      "/api/demo-snapshot?scenario=denied",
    ]) {
      const response = await request(port, requestPath);
      assert.equal(response.status, 200, requestPath);
    }
    for (const requestPath of [
      "/api/demo-snapshot?scenario=real",
      "/api/demo-snapshot?scenario=healthy&scenario=degraded",
      "/api/demo-snapshot?tenant_id=anything",
      "/api/demo-snapshot/",
      "/api/demo-snapshot%2f..",
      "/assets/../server.mjs",
      "/assets/%2e%2e/server.mjs",
      "//external.example/",
    ]) {
      const response = await request(port, requestPath);
      assert.equal(response.status, 404, requestPath);
      assert.equal(parseJson(response).error, "NOT_FOUND");
    }
  });
});

test("local page and assets are served with a restrictive same-origin-only policy", async () => {
  await withServer(async ({port}) => {
    const page = await request(port, "/");
    const css = await request(port, "/assets/app.css");
    const js = await request(port, "/assets/app.js");
    for (const response of [page, css, js]) {
      assert.equal(response.status, 200);
      assert.equal(response.headers["cache-control"], "no-store");
      assert.equal(response.headers["x-content-type-options"], "nosniff");
      assert.equal(response.headers["x-frame-options"], "DENY");
      assert.equal(response.headers["cross-origin-resource-policy"], "same-origin");
      assert.equal(response.headers["referrer-policy"], "no-referrer");
      assert.equal(response.headers["access-control-allow-origin"], undefined);
      assert.match(response.headers["content-security-policy"], /default-src 'none'/);
      assert.match(response.headers["content-security-policy"], /script-src 'self'/);
      assert.match(response.headers["content-security-policy"], /style-src 'self'/);
      assert.match(response.headers["content-security-policy"], /connect-src 'self'/);
      assert.doesNotMatch(response.headers["content-security-policy"], /unsafe-inline|https:|ws:/);
    }
    assert.match(page.headers["content-type"], /^text\/html/);
    assert.match(css.headers["content-type"], /^text\/css/);
    assert.match(js.headers["content-type"], /^text\/javascript/);
    assert.match(page.body, /SYNTHETIC_NONAUTHORITATIVE/);
    assert.match(page.body, /NÃO AUTORIZA NEGOCIAÇÃO/);
    assert.match(page.body, /NO REAL ALERT/);
    assert.match(page.body, /NO ACK/);
    assert.match(page.body, /NO MONITORING/);
    assert.match(page.body, /FIXED FICTIONAL TEMPLATE/);
    assert.match(page.body, /NOT INVESTMENT ADVICE/);
    assert.match(page.body, /NO HUMAN APPROVAL/);
    assert.match(page.body, /no login, live market data, or trading/i);
    for (const name of [
      "Overview", "Markets", "Strategies", "Portfolio", "Risk",
      "Replay", "Incidents", "Advisory", "Settings",
    ]) assert.match(page.body, new RegExp(name));
    assert.doesNotMatch(page.body, /PLANNED/i);
    for (const boundary of [
      "NO LIVE MARKET DATA", "NO QUOTES / NO ORDER BOOK / NO BROKER", "Fixed synthetic fixture only",
      "NO STRATEGY ENGINE", "NO SIGNAL / NO RECOMMENDATION", "NO BACKTEST / NO PERFORMANCE CLAIM",
      "NO HISTORICAL MARKET REPLAY", "NO BACKTEST / NO REAL PERFORMANCE",
      "BOUNDED LOCAL SYNTHETIC SEQUENCE ONLY", "NO LOGIN / NO ACCOUNT",
      "NO PROVIDER OR SECURITY SETTINGS", "READ-ONLY LOCAL PREVIEW",
    ]) assert.ok(page.body.includes(boundary), `missing permanent view boundary: ${boundary}`);
    assert.match(page.body, /id="markets-panel"[^]*id="strategies-panel"/);
    assert.match(page.body, /id="replay-panel"[^]*id="settings-panel"/);
    assert.doesNotMatch(page.body, /local_sequence|fixture_scope|account_id|api_key|provider_token/i);
    assert.match(css.body, /@media \(max-width: 820px\)/);
    assert.match(css.body, /@media \(max-width: 520px\)/);
    assert.match(js.body, /credentials: "omit"/);
    assert.match(js.body, /cache: "no-store"/);
    assert.match(js.body, /Object\.hasOwn\(views/);
    assert.doesNotMatch(js.body, /viewId in views/);
    assert.match(js.body, /\/api\/demo-snapshot\?scenario=/);
    assert.match(js.body, /latestSnapshotRequestId/);
    assert.match(js.body, /hasExactSnapshot/);
    assert.match(js.body, /hasExactModel/);
    assert.match(js.body, /hashchange/);
    assert.doesNotMatch(js.body, /innerHTML|insertAdjacentHTML|document\.write/);
    assert.doesNotMatch(js.body, /localStorage|sessionStorage|document\.cookie/);
    assert.doesNotMatch(js.body, /https?:\/\//);
  });
});

test("API returns only the real redacted model labels and keeps degraded state visible", async () => {
  await withServer(async ({port}) => {
    const healthy = await request(port, "/api/demo-snapshot?scenario=healthy");
    const incomplete = await request(port, "/api/demo-snapshot?scenario=degraded");
    const denied = await request(port, "/api/demo-snapshot?scenario=denied");
    for (const response of [healthy, incomplete, denied]) {
      assert.equal(response.status, 200);
      assert.equal(response.headers["content-type"], "application/json; charset=utf-8");
      assert.equal(response.headers["cache-control"], "no-store");
      assert.equal(response.headers["access-control-allow-origin"], undefined);
    }
    const good = parseJson(healthy);
    const degraded = parseJson(incomplete);
    const rejected = parseJson(denied);
    assert.equal(good.read_model.mode_label, "SYNTHETIC_NONAUTHORITATIVE");
    assert.equal(good.read_model.redaction_class, "ONLY_BOUNDED_ENUMS_NO_IDENTIFIERS");
    assert.equal(good.read_model.incident_banner, "NO_REAL_MONITORING_OR_BROKER_STATE");
    assert.equal(degraded.read_model.hypothetical_pause_hint, true);
    assert.equal(degraded.read_model.risk_class, "MOCK_RISK_REFUSAL");
    assert.equal(degraded.flags.fixture_only, true);
    assert.equal(degraded.flags.execution_authorized, false);
    assert.equal(rejected.status, "DENY");
    assert.equal(rejected.scenario, "DENIED_FIXTURE");
    assert.equal(rejected.read_model, null);
    assert.equal(rejected.flags.fixture_only, true);
    assert.equal(rejected.flags.session_authenticated, false);
    const js = await readFile(resolve("src/web/local-demo/public/app.js"), "utf8");
    assert.match(js, /fictional sources are incomplete; pause hint is hypothetical/);
    assert.match(js, /accepted read model denied this fixture; no current view is available/);
    assert.match(js, /READ_MODEL_UNAVAILABLE/);
  });
});

test("all nine implemented views support hash and mouse navigation without fetching another snapshot", async () => {
  const ui = await createUiHarness("#incidents");
  assert.equal(ui.elements.get("#incidents-panel").hidden, false);
  assert.equal(ui.elements.get("#overview-panel").hidden, true);
  assert.equal(ui.elements.get("#scenario-control").hidden, false);
  assert.equal(ui.links.find((link) => link.dataset.view === "incidents").attributes.get("aria-current"), "page");
  ui.requests[0].resolve(apiResponse(createDemoSnapshot("healthy")));
  await ui.startupPromise;

  const implementedViews = ["overview", "markets", "strategies", "portfolio", "risk", "replay", "incidents", "advisory", "settings"];
  for (const view of implementedViews) {
    const clickResult = ui.navigate(view);
    assert.deepEqual(clickResult, {prevented: true, url: `#${view}`});
    for (const panel of implementedViews) {
      assert.equal(ui.elements.get(`#${panel}-panel`).hidden, panel !== view, `${view} mouse navigation`);
    }
    assert.equal(ui.elements.get("#scenario-control").hidden, false);
    assert.equal(ui.elements.get("#snapshot-status").hidden, false);
    assert.equal(ui.links.find((link) => link.dataset.view === view).attributes.get("aria-current"), "page");
    assert.equal(ui.links.filter((link) => link.attributes.get("aria-current") === "page").length, 1);
    assert.equal(ui.requests.length, 1, `${view} mouse navigation reuses the shared snapshot`);
  }

  for (const view of implementedViews) {
    ui.setHash(`#${view}`);
    assert.equal(ui.elements.get(`#${view}-panel`).hidden, false, `${view} hash navigation`);
    assert.equal(ui.links.find((link) => link.dataset.view === view).attributes.get("aria-current"), "page");
    assert.equal(ui.links.filter((link) => link.attributes.get("aria-current") === "page").length, 1);
    assert.equal(ui.requests.length, 1, `${view} hash navigation reuses the shared snapshot`);
  }

  ui.setHash("#settings");
  assert.equal(ui.elements.get("#settings-panel").hidden, false);
  assert.equal(ui.elements.get("#scenario-control").hidden, false);
  assert.equal(ui.elements.get("#snapshot-status").hidden, false);
  assert.equal(ui.requests.length, 1);
});

test("all nine views render all three shared fixture states and clear while pending", async () => {
  const ui = await createUiHarness();
  ui.navigate("risk");
  ui.requests[0].resolve(apiResponse(createDemoSnapshot("healthy")));
  await ui.startupPromise;
  assertDisplayedScenario(ui, "healthy");

  for (const scenario of ["healthy", "degraded", "denied"]) {
    const requestCount = ui.requests.length;
    const pending = ui.selectScenario(scenario);
    assert.equal(ui.requests.length, requestCount + 1);
    assert.equal(ui.elements.get("#risk-page-value").textContent, "READ_MODEL_UNAVAILABLE");
    assert.equal(ui.elements.get("#risk-pause-value").textContent, "READ_MODEL_UNAVAILABLE");
    assert.equal(ui.elements.get("#portfolio-page-value").textContent, "READ_MODEL_UNAVAILABLE");
    assert.equal(ui.elements.get("#portfolio-certainty").textContent, "READ_MODEL_UNAVAILABLE");
    assert.equal(ui.elements.get("#risk-view-card").dataset.state, "loading");
    assert.equal(ui.elements.get("#portfolio-view-card").dataset.state, "loading");
    assert.equal(ui.elements.get("#incident-page-banner").textContent, "READ_MODEL_UNAVAILABLE");
    assert.equal(ui.elements.get("#incident-page-diagnostic").textContent, "READ_MODEL_UNAVAILABLE");
    assert.equal(ui.elements.get("#incident-view-card").dataset.state, "loading");
    assert.equal(ui.elements.get("#advisory-page-value").textContent, "READ_MODEL_UNAVAILABLE");
    assert.equal(ui.elements.get("#advisory-view-card").dataset.state, "loading");
    for (const view of ["markets", "strategies", "replay", "settings"]) {
      assert.equal(ui.elements.get(`#${view}-view-card`).dataset.state, "loading", `${view} loading state`);
      assert.equal(ui.elements.get(`#${view}-page-context`).textContent,
        "Loading a synthetic fixture; earlier view values are cleared.", `${view} pending context`);
    }

    const implementedViews = ["overview", "markets", "strategies", "portfolio", "risk", "replay", "incidents", "advisory", "settings"];
    for (const view of implementedViews) {
      ui.navigate(view);
      assert.equal(ui.elements.get(`#${view}-panel`).hidden, false);
      assert.equal(ui.elements.get("#scenario-control").hidden, false);
    }
    assert.equal(ui.requests.length, requestCount + 1, "view navigation reuses the pending request");

    ui.requests.at(-1).resolve(apiResponse(createDemoSnapshot(scenario)));
    await pending;
    assertDisplayedScenario(ui, scenario);
    assert.match(ui.elements.get("#risk-page-context").textContent, /synthetic/i);
    assert.match(ui.elements.get("#portfolio-page-context").textContent, /synthetic|fictional/i);
    assert.match(ui.elements.get("#incident-page-context").textContent, /synthetic|fictional|diagnostic/i);
    assert.match(ui.elements.get("#advisory-page-context").textContent, /synthetic|fictional|template/i);
    assert.match(ui.elements.get("#markets-page-context").textContent, /synthetic|market/i);
    assert.match(ui.elements.get("#strategies-page-context").textContent, /fixture|snapshot|strategy/i);
    assert.match(ui.elements.get("#replay-page-context").textContent, /synthetic|fixture|replay/i);
    assert.match(ui.elements.get("#settings-page-context").textContent, /fixture|preview/i);
    assert.equal(ui.elements.get("#snapshot-status-text").textContent.includes("denied"), scenario === "denied");
    const accepted = createDemoSnapshot(scenario);
    const rendered = [...ui.elements.values()].map((element) => element.textContent).join(" ");
    assert.equal(rendered.includes(accepted.reason_code), false, "reason codes are never rendered");

    for (const view of implementedViews) {
      ui.navigate(view);
      assert.equal(ui.elements.get(`#${view}-panel`).hidden, false);
      assertDisplayedScenario(ui, scenario);
    }
    assert.equal(ui.requests.length, requestCount + 1, "switching screens does not issue another request");
  }
});

test("browser UI fails closed on malformed, missing, forged, or unexpected snapshot data", async () => {
  const cases = [
    {
      name: "malformed JSON",
      response: () => apiResponse(undefined, () => Promise.reject(new SyntaxError("invalid JSON"))),
    },
    {name: "missing snapshot", response: () => apiResponse(undefined)},
    {
      name: "missing read model",
      response: () => {
        const snapshot = JSON.parse(JSON.stringify(createDemoSnapshot("degraded")));
        delete snapshot.read_model;
        return apiResponse(snapshot);
      },
    },
    {
      name: "forged authority flag",
      response: () => {
        const snapshot = JSON.parse(JSON.stringify(createDemoSnapshot("degraded")));
        snapshot.flags.execution_authorized = true;
        snapshot.reason_code = "RAW_REASON_SENTINEL";
        return apiResponse(snapshot);
      },
    },
    {
      name: "unlisted risk enum",
      response: () => {
        const snapshot = JSON.parse(JSON.stringify(createDemoSnapshot("degraded")));
        snapshot.read_model.risk_class = "REAL_RISK_PASS";
        return apiResponse(snapshot);
      },
    },
    {
      name: "unlisted portfolio enum",
      response: () => {
        const snapshot = JSON.parse(JSON.stringify(createDemoSnapshot("degraded")));
        snapshot.read_model.portfolio_class = "REAL_BALANCE_VERIFIED";
        return apiResponse(snapshot);
      },
    },
    {
      name: "unlisted diagnostic enum",
      response: () => {
        const snapshot = JSON.parse(JSON.stringify(createDemoSnapshot("degraded")));
        snapshot.read_model.diagnostic_class = "RAW_DIAGNOSTIC_SENTINEL";
        return apiResponse(snapshot);
      },
    },
    {
      name: "unlisted advisory enum",
      response: () => {
        const snapshot = JSON.parse(JSON.stringify(createDemoSnapshot("degraded")));
        snapshot.read_model.advisory_class = "REAL_ADVICE_SENTINEL";
        return apiResponse(snapshot);
      },
    },
    {
      name: "unlisted incident banner enum",
      response: () => {
        const snapshot = JSON.parse(JSON.stringify(createDemoSnapshot("degraded")));
        snapshot.read_model.incident_banner = "REAL_MONITORING_SENTINEL";
        return apiResponse(snapshot);
      },
    },
    {
      name: "unlisted overview enum",
      response: () => {
        const snapshot = JSON.parse(JSON.stringify(createDemoSnapshot("degraded")));
        snapshot.read_model.mock_view = "REAL_OVERVIEW_SENTINEL";
        return apiResponse(snapshot);
      },
    },
    {
      name: "unlisted session enum",
      response: () => {
        const snapshot = JSON.parse(JSON.stringify(createDemoSnapshot("degraded")));
        snapshot.read_model.displayed_session_class = "AUTHENTICATED_SESSION_SENTINEL";
        return apiResponse(snapshot);
      },
    },
    {
      name: "malformed mode label",
      response: () => {
        const snapshot = JSON.parse(JSON.stringify(createDemoSnapshot("degraded")));
        snapshot.read_model.mode_label = "REAL_MODE_SENTINEL";
        return apiResponse(snapshot);
      },
    },
    {
      name: "unlisted stream enum",
      response: () => {
        const snapshot = JSON.parse(JSON.stringify(createDemoSnapshot("degraded")));
        snapshot.read_model.stream_class = "LIVE_STREAM_SENTINEL";
        return apiResponse(snapshot);
      },
    },
    {
      name: "unlisted redaction enum",
      response: () => {
        const snapshot = JSON.parse(JSON.stringify(createDemoSnapshot("degraded")));
        snapshot.read_model.redaction_class = "RAW_DATA_SENTINEL";
        return apiResponse(snapshot);
      },
    },
    ...[
      "real_alert_delivered",
      "mandatory_audit_satisfied",
      "model_inference_performed",
      "human_review_complete",
      "session_authenticated",
      "server_authorization_performed",
      "live_stream_connected",
      "operator_command_available",
      "real_market_performance_established",
      "comparative_benchmark_supported",
      "network_performed",
      "authenticated_provider_evidence",
    ].map((flag) => ({
      name: `forged ${flag} flag`,
      response: () => {
        const snapshot = JSON.parse(JSON.stringify(createDemoSnapshot("degraded")));
        snapshot.flags[flag] = true;
        return apiResponse(snapshot);
      },
    })),
    {
      name: "unexpected raw prompt field",
      response: () => {
        const snapshot = JSON.parse(JSON.stringify(createDemoSnapshot("degraded")));
        snapshot.read_model.model_prompt = "RAW_PROMPT_SENTINEL";
        return apiResponse(snapshot);
      },
    },
    {
      name: "unexpected model field",
      response: () => {
        const snapshot = JSON.parse(JSON.stringify(createDemoSnapshot("degraded")));
        snapshot.read_model.synthetic_fixture_sentinel = "RAW_FIXTURE_SENTINEL";
        return apiResponse(snapshot);
      },
    },
    {
      name: "unexpected envelope field",
      response: () => {
        const snapshot = JSON.parse(JSON.stringify(createDemoSnapshot("degraded")));
        snapshot.private_fixture_sentinel = "RAW_ENVELOPE_SENTINEL";
        return apiResponse(snapshot);
      },
    },
    {
      name: "scenario and status mismatch",
      response: () => {
        const snapshot = JSON.parse(JSON.stringify(createDemoSnapshot("degraded")));
        snapshot.status = "SYNTHETIC_LOCAL_READ_MODEL";
        return apiResponse(snapshot);
      },
    },
    {
      name: "unlisted reason code",
      response: () => {
        const snapshot = JSON.parse(JSON.stringify(createDemoSnapshot("degraded")));
        snapshot.reason_code = "RAW_REASON_SENTINEL";
        return apiResponse(snapshot);
      },
    },
    {
      name: "non-success response",
      response: () => ({...apiResponse(createDemoSnapshot("degraded")), ok: false}),
    },
    {
      name: "non-JSON response",
      response: () => ({
        ...apiResponse(createDemoSnapshot("degraded")),
        headers: {get: () => "text/html"},
      }),
    },
  ];

  for (const invalid of cases) {
    const ui = await createUiHarness();
    ui.requests[0].resolve(apiResponse(createDemoSnapshot("healthy")));
    await ui.startupPromise;
    const pending = ui.selectScenario("degraded");
    ui.requests[1].resolve(invalid.response());
    await pending;
    assert.equal(ui.elements.get("#snapshot-status").dataset.state, "error", invalid.name);
    assertAllImplementedViewsUnavailable(ui);
    const rendered = [...ui.elements.values()].map((element) => element.textContent).join(" ");
    for (const sentinel of [
      "RAW_REASON_SENTINEL", "RAW_FIXTURE_SENTINEL", "RAW_ENVELOPE_SENTINEL", "REAL_RISK_PASS",
      "REAL_BALANCE_VERIFIED", "RAW_DIAGNOSTIC_SENTINEL", "REAL_ADVICE_SENTINEL",
      "REAL_MONITORING_SENTINEL", "REAL_OVERVIEW_SENTINEL", "AUTHENTICATED_SESSION_SENTINEL",
      "LIVE_STREAM_SENTINEL", "RAW_DATA_SENTINEL", "RAW_PROMPT_SENTINEL",
      "REAL_MODE_SENTINEL",
    ]) {
      assert.equal(rendered.includes(sentinel), false, `${invalid.name}: ${sentinel}`);
    }
  }
});

test("current denied response with a non-null read model fails closed on all nine views", async () => {
  const ui = await createUiHarness("#advisory");
  ui.requests[0].resolve(apiResponse(createDemoSnapshot("healthy")));
  await ui.startupPromise;

  const pending = ui.selectScenario("denied");
  const invalidDenied = JSON.parse(JSON.stringify(createDemoSnapshot("denied")));
  invalidDenied.read_model = {};
  ui.requests[1].resolve(apiResponse(invalidDenied));
  await pending;

  assert.equal(ui.elements.get("#advisory-panel").hidden, false);
  assert.equal(ui.elements.get("#snapshot-status").dataset.state, "error");
  assertAllImplementedViewsUnavailable(ui);
});

test("valid but wrong current scenario bodies fail closed on all nine views", async () => {
  for (const view of ["overview", "markets", "strategies", "portfolio", "risk", "replay", "incidents", "advisory", "settings"]) {
    const ui = await createUiHarness(`#${view}`);
    ui.requests[0].resolve(apiResponse(createDemoSnapshot("healthy")));
    await ui.startupPromise;

    const pending = ui.selectScenario("degraded");
    const wrongScenario = createDemoSnapshot("healthy");
    ui.requests[1].resolve(apiResponse(wrongScenario));
    await pending;

    assert.equal(ui.elements.get(`#${view}-panel`).hidden, false, `${view} remains selected`);
    assertScenarioMismatchFailsClosed(ui, "degraded", wrongScenario);
    assert.equal(ui.requests.length, 2, `${view} mismatch does not trigger a retry`);
  }
});

test("a current denied request rejects a fully valid healthy snapshot", async () => {
  const ui = await createUiHarness();
  ui.requests[0].resolve(apiResponse(createDemoSnapshot("healthy")));
  await ui.startupPromise;

  const pending = ui.selectScenario("denied");
  const request = ui.requests[1];
  const healthySnapshot = createDemoSnapshot("healthy");
  assert.equal(request.url, "/api/demo-snapshot?scenario=denied");
  assert.equal(healthySnapshot.scenario, "HEALTHY_FIXTURE");
  assert.equal(healthySnapshot.status, "SYNTHETIC_LOCAL_READ_MODEL");
  request.resolve(apiResponse(healthySnapshot));
  await pending;

  assertScenarioMismatchFailsClosed(ui, "denied", healthySnapshot);
  assert.equal(ui.requests.length, 2, "the mismatch is handled on the current request without another fetch");
});

test("a current healthy request rejects a valid denied snapshot across view navigation", async () => {
  const ui = await createUiHarness();
  ui.requests[0].resolve(apiResponse(createDemoSnapshot("healthy")));
  await ui.startupPromise;

  const pending = ui.selectScenario("healthy");
  const request = ui.requests[1];
  const deniedSnapshot = createDemoSnapshot("denied");
  assert.equal(request.url, "/api/demo-snapshot?scenario=healthy");
  assert.equal(deniedSnapshot.scenario, "DENIED_FIXTURE");
  assert.equal(deniedSnapshot.status, "DENY");

  ui.navigate("risk");
  ui.navigate("portfolio");
  ui.setHash("#overview");
  assert.equal(ui.requests.length, 2, "navigation preserves the current request without fetching again");
  request.resolve(apiResponse(deniedSnapshot));
  await pending;

  for (const view of ["overview", "markets", "strategies", "portfolio", "risk", "replay", "incidents", "advisory", "settings"]) {
    ui.navigate(view);
    assertScenarioMismatchFailsClosed(ui, "healthy", deniedSnapshot);
  }
  assert.equal(ui.requests.length, 2, "navigating after the mismatch still reuses the cleared shared state");
});

test("only the latest selected fixture response controls the displayed scenario", async () => {
  const races = [
    {stale: "healthy", latest: "denied"},
    {stale: "degraded", latest: "healthy"},
    {stale: "denied", latest: "degraded"},
  ];
  for (const {stale, latest} of races) {
    const ui = await createUiHarness();
    ui.requests[0].resolve(apiResponse(createDemoSnapshot("healthy")));
    await ui.startupPromise;

    const stalePromise = ui.selectScenario(stale);
    const staleRequest = ui.requests[1];
    const latestPromise = ui.selectScenario(latest);
    const latestRequest = ui.requests[2];
    assert.equal(staleRequest.url, `/api/demo-snapshot?scenario=${stale}`);
    assert.equal(latestRequest.url, `/api/demo-snapshot?scenario=${latest}`);

    latestRequest.resolve(apiResponse(createDemoSnapshot(latest)));
    await latestPromise;
    assertDisplayedScenario(ui, latest);

    staleRequest.resolve(apiResponse(createDemoSnapshot(stale)));
    await stalePromise;
    assertDisplayedScenario(ui, latest);
  }
});

test("late response-body completion and fetch errors cannot overwrite the latest fixture", async () => {
  const ui = await createUiHarness();
  ui.requests[0].resolve(apiResponse(createDemoSnapshot("healthy")));
  await ui.startupPromise;

  const body = deferred();
  const staleBodyPromise = ui.selectScenario("degraded");
  const staleBodyRequest = ui.requests[1];
  staleBodyRequest.resolve(apiResponse(undefined, () => body.promise));
  const latestDeniedPromise = ui.selectScenario("denied");
  const latestDeniedRequest = ui.requests[2];
  latestDeniedRequest.resolve(apiResponse(createDemoSnapshot("denied")));
  await latestDeniedPromise;
  assertDisplayedScenario(ui, "denied");

  body.resolve(createDemoSnapshot("degraded"));
  await staleBodyPromise;
  assertDisplayedScenario(ui, "denied");

  const staleBodyFailure = deferred();
  let signalBodyRead;
  const bodyReadStarted = new Promise((resolveBodyRead) => { signalBodyRead = resolveBodyRead; });
  const staleBodyFailurePromise = ui.selectScenario("healthy");
  const staleBodyFailureRequest = ui.requests[3];
  staleBodyFailureRequest.resolve(apiResponse(undefined, () => {
    signalBodyRead();
    return staleBodyFailure.promise;
  }));
  await bodyReadStarted;
  const latestDegradedPromise = ui.selectScenario("degraded");
  const latestDegradedRequest = ui.requests[4];
  latestDegradedRequest.resolve(apiResponse(createDemoSnapshot("degraded")));
  await latestDegradedPromise;
  assertDisplayedScenario(ui, "degraded");
  staleBodyFailure.reject(new SyntaxError("late stale body failure"));
  await staleBodyFailurePromise;
  assertDisplayedScenario(ui, "degraded");

  const staleErrorPromise = ui.selectScenario("healthy");
  const staleErrorRequest = ui.requests[5];
  const latestAfterFetchErrorPromise = ui.selectScenario("degraded");
  ui.requests[6].resolve(apiResponse(createDemoSnapshot("degraded")));
  await latestAfterFetchErrorPromise;
  assertDisplayedScenario(ui, "degraded");
  staleErrorRequest.reject(new Error("delayed local fetch failure"));
  await staleErrorPromise;
  assertDisplayedScenario(ui, "degraded");

  const currentErrorPromise = ui.selectScenario("healthy");
  ui.requests[7].reject(new Error("current local fetch failure"));
  await currentErrorPromise;
  assert.equal(ui.elements.get("#snapshot-status").dataset.state, "error");
  assertAllImplementedViewsUnavailable(ui);
});

test("unknown methods, hosts, and cross-origin requests fail closed without CORS", async () => {
  await withServer(async ({port}) => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]) {
      const response = await request(port, "/api/demo-snapshot", {method});
      assert.equal(response.status, 405, method);
      assert.equal(response.headers.allow, "GET");
      assert.equal(response.headers["access-control-allow-origin"], undefined);
      assert.equal(response.headers["cache-control"], "no-store");
    }
    for (const host of [
      "evil.example",
      `127.0.0.2:${port}`,
      `127.0.0.1.evil.example:${port}`,
      `localhost.evil.example:${port}`,
    ]) {
      const response = await request(port, "/", {host});
      assert.equal(response.status, 403, host);
      assert.equal(parseJson(response).error, "HOST_NOT_ALLOWED");
    }
    for (const origin of [
      "https://evil.example",
      `http://127.0.0.1.evil.example:${port}`,
      "null",
    ]) {
      const response = await request(port, "/api/demo-snapshot", {origin});
      assert.equal(response.status, 403, origin);
      assert.equal(parseJson(response).error, "ORIGIN_NOT_ALLOWED");
      assert.equal(response.headers["access-control-allow-origin"], undefined);
    }
    const localhost = await request(port, "/api/demo-snapshot", {
      host: `localhost:${port}`,
      origin: `http://localhost:${port}`,
    });
    assert.equal(localhost.status, 200);
  });
});
