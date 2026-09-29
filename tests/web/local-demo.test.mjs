import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {once} from "node:events";
import {readFile} from "node:fs/promises";
import http from "node:http";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import test from "node:test";
import {
  createDemoSnapshot,
  startLocalDemo,
} from "../../src/web/local-demo/server.mjs";

const SERVER_PATH = resolve("src/web/local-demo/server.mjs");
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
  assert.equal(healthy.flags.fixture_only, true);
  for (const key of FLAG_KEYS.filter((name) => name !== "fixture_only")) {
    assert.equal(healthy.flags[key], false, key);
    assert.equal(incomplete.flags[key], false, key);
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

test("only the fixed healthy and incomplete fixture query values are accepted", async () => {
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
