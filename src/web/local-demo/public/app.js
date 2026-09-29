const views = Object.freeze({
  overview: {
    title: "Overview",
    description: "A read-only view of one fixed, invented scenario.",
  },
  markets: {
    title: "Markets",
    description: "Market data integrations are not part of this local preview.",
  },
  strategies: {
    title: "Strategies",
    description: "Strategy operations are not available in this development shell.",
  },
  portfolio: {
    title: "Portfolio",
    description: "Fictional portfolio class and uncertainty only; no account values are shown.",
  },
  risk: {
    title: "Risk",
    description: "Synthetic risk class and hypothetical pause hint; no trading authority.",
  },
  replay: {
    title: "Replay",
    description: "Replay is a planned workspace view; no performance claim is available.",
  },
  incidents: {
    title: "Incidents",
    description: "No monitoring, incident delivery, acknowledgement, or broker state is connected.",
  },
  advisory: {
    title: "Advisory",
    description: "No external model, recommendation, or human approval is connected.",
  },
  settings: {
    title: "Settings",
    description: "No account, security, provider, or operational settings are available.",
  },
});
const statusValues = new Set([
  "SYNTHETIC_LOCAL_READ_MODEL",
  "SYNTHETIC_LOCAL_READ_MODEL_DEGRADED",
  "DENY",
]);
const scenarioContracts = Object.freeze({
  HEALTHY_FIXTURE: "SYNTHETIC_LOCAL_READ_MODEL",
  INCOMPLETE_FIXTURE: "SYNTHETIC_LOCAL_READ_MODEL_DEGRADED",
  DENIED_FIXTURE: "DENY",
});
const scenarioLabels = Object.freeze({
  healthy: "HEALTHY_FIXTURE",
  degraded: "INCOMPLETE_FIXTURE",
  denied: "DENIED_FIXTURE",
});
const flagKeys = Object.freeze([
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
const modelKeys = Object.freeze([
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
]);
const snapshotKeys = Object.freeze([
  "schema_version",
  "scenario",
  "status",
  "reason_code",
  "read_model",
  "flags",
]);
const displayLabels = Object.freeze({
  mock_view: {FICTIONAL_OVERVIEW_ONLY: "Fictional overview"},
  risk_class: {
    MOCK_RISK_PASS_NOT_AUTHORIZATION: "Mock risk · no authority",
    MOCK_RISK_REFUSAL: "Mock risk refused",
  },
  portfolio_class: {
    FICTIONAL_BALANCE_AND_LEDGER_MATCH: "Fictional ledger match",
    FICTIONAL_BALANCE_UNCERTAIN: "Fictional balance uncertain",
    FICTIONAL_BALANCE_REJECTED: "Fictional balance rejected",
  },
  diagnostic_class: {
    IN_PROCESS_DIAGNOSTIC_ONLY: "In-process diagnostic",
    FICTIONAL_UNKNOWN_EVENT: "Fictional unknown event",
    LOCAL_DIAGNOSTIC_REFUSAL: "Local diagnostic refused",
  },
  advisory_class: {
    FIXED_TEMPLATE_MOCK_ONLY: "Fixed template only",
    FIXED_TEMPLATE_INCOMPLETE: "Fixed template incomplete",
    FIXED_TEMPLATE_REFUSAL: "Fixed template refused",
  },
  incident_banner: {NO_REAL_MONITORING_OR_BROKER_STATE: "No live monitoring or broker state"},
  displayed_session_class: {NOT_AUTHENTICATED_LOCAL_FIXTURE: "No authenticated session"},
});
const displayLabel = (field, value) => displayLabels[field]?.[value] ?? "READ_MODEL_UNAVAILABLE";
const riskClasses = new Set(Object.keys(displayLabels.risk_class));
const portfolioClasses = new Set(Object.keys(displayLabels.portfolio_class));
const snapshotStatus = document.querySelector("#snapshot-status");
const statusText = document.querySelector("#snapshot-status-text");
const scenarioSelect = document.querySelector("#fixture-scenario");
const overviewPanel = document.querySelector("#overview-panel");
const riskPanel = document.querySelector("#risk-panel");
const portfolioPanel = document.querySelector("#portfolio-panel");
const plannedPanel = document.querySelector("#planned-panel");
let currentView = "overview";
let latestSnapshotRequestId = 0;
const hasView = (viewId) => Object.hasOwn(views, viewId);

const setText = (selector, value) => {
  const target = document.querySelector(selector);
  if (target) target.textContent = value;
};
/**
 * Assigns a visual state to an existing value or card without using color as its only signal.
 * @param {string} selector Selector for a page value or containing card.
 * @param {string} state Allowlisted UI state such as loading, ready, degraded, denied, or error.
 * @returns {void}
 */
function setState(selector, state) {
  const target = document.querySelector(selector);
  if (target) target.dataset.state = state;
}
/**
 * Clears every read-model label on Overview, Risk, and Portfolio for a non-renderable state.
 * The scenario label is supplied only from a fixed local map, never from untrusted response text.
 * @param {"loading"|"degraded"|"denied"|"error"} state Current safe display state.
 * @param {string} scenarioLabel Fixed scenario display label or unavailable marker.
 * @returns {void}
 */
function markReadModelUnavailable(state = "error", scenarioLabel = "SNAPSHOT_UNAVAILABLE") {
  for (const selector of [
    "#mode-value",
    "#risk-value",
    "#portfolio-value",
    "#diagnostic-value",
    "#model-view",
    "#advisory-value",
    "#incident-value",
    "#session-value",
    "#risk-page-value",
    "#risk-pause-value",
    "#portfolio-page-value",
    "#portfolio-certainty",
  ]) {
    setText(selector, "READ_MODEL_UNAVAILABLE");
  }
  for (const selector of [
    "#risk-value", "#portfolio-value", "#diagnostic-value", "#advisory-value",
    "#risk-page-value", "#risk-pause-value", "#portfolio-page-value", "#portfolio-certainty",
    "#risk-page-context", "#portfolio-page-context", "#risk-view-card", "#portfolio-view-card", "#pause-note",
  ]) {
    setState(selector, state);
  }
  const stateCopy = {
    loading: "Loading a synthetic fixture; earlier view values are cleared.",
    degraded: "No accepted values are available for this synthetic fixture.",
    denied: "Denied synthetic fixture; no accepted read-model values are available.",
    error: "Snapshot unavailable or invalid; earlier view values are cleared.",
  }[state] ?? "No accepted synthetic view is available.";
  setText("#risk-page-context", stateCopy);
  setText("#portfolio-page-context", stateCopy);
  setText("#pause-note-text", stateCopy);
  setText("#scenario-value", scenarioLabel);
  setText("#snapshot-scenario", scenarioLabel);
}
/**
 * Displays a plain-text failure message and removes accepted model labels from the page.
 * @param {string} message Local status text; assigned through `textContent`, never parsed as HTML.
 * @returns {void}
 */
function showUnavailable(message) {
  snapshotStatus.dataset.state = "error";
  statusText.textContent = message;
  markReadModelUnavailable("error");
}
/**
 * Requires the complete fixed flag set with only `fixture_only` true.
 * These display flags are non-authoritative and cannot grant an operation.
 * @param {Record<string, unknown>|null|undefined} flags Flags received in the snapshot.
 * @returns {boolean} Whether the snapshot preserves the synthetic-only flag contract.
 */
function hasSafeFlags(flags) {
  if (!flags || Object.keys(flags).length !== flagKeys.length) return false;
  return flagKeys.every((key) =>
    Object.hasOwn(flags, key) && flags[key] === (key === "fixture_only"),
  );
}
/**
 * Requires the exact accepted redacted model shape so an added raw field fails closed.
 * @param {unknown} model Candidate read-model value.
 * @returns {boolean} Whether the value has exactly the known model keys.
 */
function hasExactModel(model) {
  return Boolean(
    model &&
    typeof model === "object" &&
    !Array.isArray(model) &&
    Object.keys(model).length === modelKeys.length &&
    modelKeys.every((key) => Object.hasOwn(model, key)),
  );
}
/**
 * Requires the exact public envelope so unknown response fields cannot become display inputs.
 * @param {unknown} snapshot Candidate local API response.
 * @returns {boolean} Whether the response has exactly the known snapshot keys.
 */
function hasExactSnapshot(snapshot) {
  return Boolean(
    snapshot &&
    typeof snapshot === "object" &&
    !Array.isArray(snapshot) &&
    Object.keys(snapshot).length === snapshotKeys.length &&
    snapshotKeys.every((key) => Object.hasOwn(snapshot, key)),
  );
}
/**
 * Validates the exact envelope, model, requested scenario, scenario/status pair, and flags before rendering.
 * Unknown or unexpected snapshot shapes fail closed to unavailable display values.
 * @param {unknown} snapshot Value decoded from the local snapshot response.
 * @param {"healthy"|"degraded"|"denied"} requestedScenario Scenario requested by the current UI selection.
 * @returns {void}
 */
function applySnapshot(snapshot, requestedScenario) {
  const expectedStatus = scenarioContracts[snapshot?.scenario];
  if (
    !hasExactSnapshot(snapshot) ||
    snapshot?.schema_version !== 0 ||
    !statusValues.has(snapshot.status) ||
    !expectedStatus ||
    snapshot.scenario !== scenarioLabels[requestedScenario] ||
    expectedStatus !== snapshot.status ||
    !hasSafeFlags(snapshot.flags)
  ) {
    showUnavailable("Snapshot did not match the synthetic display contract.");
    return;
  }
  const model = snapshot.read_model;
  if (snapshot.status === "DENY") {
    if (model !== null) {
      showUnavailable("Snapshot did not match the synthetic display contract.");
      return;
    }
    snapshotStatus.dataset.state = "denied";
    statusText.textContent = "The accepted read model denied this fixture; no current view is available.";
    markReadModelUnavailable("denied", snapshot.scenario);
    return;
  }
  if (
    !hasExactModel(model) ||
    model.mode_label !== "SYNTHETIC_NONAUTHORITATIVE" ||
    !riskClasses.has(model.risk_class) ||
    !portfolioClasses.has(model.portfolio_class) ||
    typeof model.hypothetical_pause_hint !== "boolean"
  ) {
    showUnavailable("Snapshot did not match the synthetic display contract.");
    return;
  }
  const degraded = snapshot.status !== "SYNTHETIC_LOCAL_READ_MODEL";
  snapshotStatus.dataset.state = degraded ? "degraded" : "ready";
  statusText.textContent = degraded
    ? "The fictional sources are incomplete; pause hint is hypothetical."
    : "Accepted mock sources composed a redacted local snapshot.";
  setText("#mode-value", model.mode_label);
  setText("#scenario-value", snapshot.scenario);
  setText("#risk-value", displayLabel("risk_class", model.risk_class));
  setText("#portfolio-value", displayLabel("portfolio_class", model.portfolio_class));
  setText("#risk-page-value", displayLabel("risk_class", model.risk_class));
  setText(
    "#risk-pause-value",
    model.hypothetical_pause_hint ? "YES — HYPOTHETICAL ONLY" : "NO HINT — HYPOTHETICAL ONLY",
  );
  setText("#portfolio-page-value", displayLabel("portfolio_class", model.portfolio_class));
  setText(
    "#portfolio-certainty",
    degraded ? "INCOMPLETE SYNTHETIC FIXTURE" : "COMPLETE SYNTHETIC FIXTURE",
  );
  setText("#snapshot-scenario", snapshot.scenario);
  setText("#diagnostic-value", displayLabel("diagnostic_class", model.diagnostic_class));
  setText("#model-view", displayLabel("mock_view", model.mock_view));
  setText("#advisory-value", displayLabel("advisory_class", model.advisory_class));
  setText("#incident-value", displayLabel("incident_banner", model.incident_banner));
  setText("#session-value", displayLabel("displayed_session_class", model.displayed_session_class));
  setText(
    "#risk-page-context",
    degraded
      ? "Incomplete synthetic sources; this class and pause hint are hypothetical only."
      : "Complete synthetic fixture; this fictional label carries no financial authority.",
  );
  setText(
    "#portfolio-page-context",
    degraded
      ? "Incomplete fictional sources; the class is uncertain and is not a real reconciliation."
      : "Complete fictional fixture; no account value or actual ledger is represented.",
  );
  const pauseNote = document.querySelector("#pause-note");
  pauseNote.dataset.state = model.hypothetical_pause_hint ? "degraded" : "ready";
  setText(
    "#pause-note-text",
    model.hypothetical_pause_hint
      ? "The only pause hint applies to this incomplete fictional fixture."
      : "No pause hint in this complete fixture. No real operation exists.",
  );
  for (const selector of ["#risk-value", "#portfolio-value", "#diagnostic-value", "#advisory-value"]) {
    setState(selector, degraded ? "degraded" : "ready");
  }
  for (const selector of ["#risk-page-value", "#risk-pause-value", "#portfolio-page-value", "#portfolio-certainty", "#risk-page-context", "#portfolio-page-context", "#risk-view-card", "#portfolio-view-card"]) {
    setState(selector, degraded ? "degraded" : "ready");
  }
}
/**
 * Fetches one fixed same-origin fixture and renders only if its monotonic request token is current.
 * Stale fetches, body completions, and errors are discarded so older selections cannot overwrite newer ones.
 * @param {"healthy"|"degraded"|"denied"} scenario Allowlisted synthetic fixture selected in the UI.
 * @returns {Promise<void>} Resolves after the current response or error has been handled.
 */
async function loadSnapshot(scenario) {
  const requestId = ++latestSnapshotRequestId;
  if (!["healthy", "degraded", "denied"].includes(scenario)) {
    showUnavailable("Unknown fixture scenario.");
    return;
  }
  markReadModelUnavailable("loading", `${scenarioLabels[scenario]} · REQUESTED`);
  snapshotStatus.dataset.state = "loading";
  statusText.textContent = "Loading the selected local fixture; previous values were cleared.";
  try {
    const response = await fetch(`/api/demo-snapshot?scenario=${scenario}`, {
      method: "GET",
      mode: "same-origin",
      credentials: "omit",
      cache: "no-store",
      redirect: "error",
    });
    if (requestId !== latestSnapshotRequestId) return;
    if (!response.ok || !response.headers.get("content-type")?.startsWith("application/json")) {
      showUnavailable("Local snapshot is unavailable.");
      return;
    }
    const snapshot = await response.json();
    if (requestId !== latestSnapshotRequestId) return;
    applySnapshot(snapshot, scenario);
  } catch {
    if (requestId !== latestSnapshotRequestId) return;
    showUnavailable("Local snapshot is unavailable.");
  }
}
/**
 * Selects Overview, Risk, or Portfolio, retaining the planned placeholder for other known entries.
 * All implemented screens share the same accepted snapshot and scenario selector.
 * @param {string} viewId Requested fixed navigation key.
 * @returns {void}
 */
function applyView(viewId) {
  const view = hasView(viewId) ? views[viewId] : views.overview;
  currentView = hasView(viewId) ? viewId : "overview";
  const isOverview = currentView === "overview";
  const isRisk = currentView === "risk";
  const isPortfolio = currentView === "portfolio";
  const isImplemented = isOverview || isRisk || isPortfolio;
  overviewPanel.hidden = !isOverview;
  riskPanel.hidden = !isRisk;
  portfolioPanel.hidden = !isPortfolio;
  plannedPanel.hidden = isImplemented;
  document.querySelector("#scenario-control").hidden = !isImplemented;
  snapshotStatus.hidden = !isImplemented;
  document.querySelector("#breadcrumb-current").textContent = view.title;
  document.querySelector("#page-title").textContent = view.title;
  document.querySelector("#page-description").textContent = view.description;
  document.querySelector("#planned-title").textContent = `${view.title} is planned`;
  document.querySelector("#planned-description").textContent = view.description;
  for (const link of document.querySelectorAll("[data-view]")) {
    if (link.dataset.view === currentView) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}
document.querySelectorAll("[data-view]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const viewId = link.dataset.view;
    if (!hasView(viewId)) return;
    event.preventDefault();
    history.replaceState(null, "", `#${viewId}`);
    applyView(viewId);
  });
});
window.addEventListener("hashchange", () => {
  const viewId = location.hash.slice(1);
  applyView(hasView(viewId) ? viewId : "overview");
});
scenarioSelect.addEventListener("change", () => loadSnapshot(scenarioSelect.value));
const initialView = location.hash.slice(1);
applyView(hasView(initialView) ? initialView : "overview");
loadSnapshot(scenarioSelect.value);
