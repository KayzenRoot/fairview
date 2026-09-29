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
 * @returns {Promise<{elements: Map<string, object>, requests: Array<object>, startupPromise: Promise<void>, selectScenario: (scenario: string) => Promise<void>}>} UI controls and captured requests.
 */
async function createUiHarness() {
  const source = await readFile(APP_PATH, "utf8");
  const startupCall = "loadSnapshot(scenarioSelect.value);";
  const instrumentedSource = source.replace(
    startupCall,
    "globalThis.__startupSnapshotPromise = loadSnapshot(scenarioSelect.value);",
  );
  assert.notEqual(instrumentedSource, source, "capture the real startup request promise");

  const selectors = [
    "#snapshot-status", "#snapshot-status-text", "#fixture-scenario",
    "#overview-panel", "#planned-panel", "#scenario-control", "#mode-value",
    "#risk-value", "#portfolio-value", "#diagnostic-value", "#model-view",
    "#advisory-value", "#incident-value", "#session-value", "#pause-note-text",
    "#pause-note", "#scenario-value", "#breadcrumb-current", "#page-title",
    "#page-description", "#planned-title", "#planned-description",
  ];
  const elements = new Map(selectors.map((selector) => [selector, fakeElement()]));
  elements.get("#fixture-scenario").value = "healthy";
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
  const context = vm.createContext({
    document,
    fetch,
    history: {replaceState() {}},
    location: {hash: "#overview"},
  });
  vm.runInContext(instrumentedSource, context, {filename: APP_PATH});
  return {
    elements,
    requests,
    startupPromise: context.__startupSnapshotPromise,
    selectScenario(scenario) {
      const selector = elements.get("#fixture-scenario");
      selector.value = scenario;
      return selector.listeners.get("change")();
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
    },
    degraded: {
      scenario: "INCOMPLETE_FIXTURE",
      status: "degraded",
      mode: "SYNTHETIC_NONAUTHORITATIVE",
      risk: "Mock risk refused",
    },
    denied: {
      scenario: "DENIED_FIXTURE",
      status: "degraded",
      mode: "READ_MODEL_UNAVAILABLE",
      risk: "READ_MODEL_UNAVAILABLE",
    },
  }[selectedScenario];
  assert.equal(harness.elements.get("#fixture-scenario").value, selectedScenario);
  assert.equal(harness.elements.get("#scenario-value").textContent, expected.scenario);
  assert.equal(harness.elements.get("#snapshot-status").dataset.state, expected.status);
  assert.equal(harness.elements.get("#mode-value").textContent, expected.mode);
  assert.equal(harness.elements.get("#risk-value").textContent, expected.risk);
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
    assert.match(page.body, /no login, live market data, or trading/i);
    for (const name of [
      "Overview", "Markets", "Strategies", "Portfolio", "Risk",
      "Replay", "Incidents", "Advisory", "Settings",
    ]) assert.match(page.body, new RegExp(name));
    assert.match(css.body, /@media \(max-width: 820px\)/);
    assert.match(css.body, /@media \(max-width: 520px\)/);
    assert.match(js.body, /credentials: "omit"/);
    assert.match(js.body, /cache: "no-store"/);
    assert.match(js.body, /Object\.hasOwn\(views/);
    assert.doesNotMatch(js.body, /viewId in views/);
    assert.match(js.body, /\/api\/demo-snapshot\?scenario=/);
    assert.doesNotMatch(js.body, /innerHTML|insertAdjacentHTML|document\.write/);
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

  const staleErrorPromise = ui.selectScenario("healthy");
  const staleErrorRequest = ui.requests[3];
  const latestDegradedPromise = ui.selectScenario("degraded");
  const latestDegradedRequest = ui.requests[4];
  latestDegradedRequest.resolve(apiResponse(createDemoSnapshot("degraded")));
  await latestDegradedPromise;
  assertDisplayedScenario(ui, "degraded");

  staleErrorRequest.reject(new Error("delayed local fetch failure"));
  await staleErrorPromise;
  assertDisplayedScenario(ui, "degraded");

  const currentErrorPromise = ui.selectScenario("healthy");
  ui.requests[5].reject(new Error("current local fetch failure"));
  await currentErrorPromise;
  assert.equal(ui.elements.get("#snapshot-status").dataset.state, "error");
  assert.equal(ui.elements.get("#scenario-value").textContent, "SNAPSHOT_UNAVAILABLE");
  assert.equal(ui.elements.get("#mode-value").textContent, "READ_MODEL_UNAVAILABLE");
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
