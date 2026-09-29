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
    description: "No account, holdings, balance, or performance data is connected.",
  },
  risk: {
    title: "Risk",
    description: "This preview has no live risk controls or trading authority.",
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
const displayLabel = (field, value) => displayLabels[field]?.[value] ?? "READ_MODEL_UNAVAILABLE";const snapshotStatus = document.querySelector("#snapshot-status");
const statusText = document.querySelector("#snapshot-status-text");
const scenarioSelect = document.querySelector("#fixture-scenario");
const overviewPanel = document.querySelector("#overview-panel");
const plannedPanel = document.querySelector("#planned-panel");
let currentView = "overview";
let latestSnapshotRequestId = 0;
const hasView = (viewId) => Object.hasOwn(views, viewId);

const setText = (selector, value) => {
  const target = document.querySelector(selector);
  if (target) target.textContent = value;
};
/**
 * Clears every read-model label and marks the hypothetical pause note as degraded.
 * This prevents an earlier snapshot from remaining visible after a rejected response.
 * @returns {void}
 */
function markReadModelUnavailable() {
  for (const selector of [
    "#mode-value",
    "#risk-value",
    "#portfolio-value",
    "#diagnostic-value",
    "#model-view",
    "#advisory-value",
    "#incident-value",
    "#session-value",
  ]) {
    setText(selector, "READ_MODEL_UNAVAILABLE");
  }
  for (const selector of ["#risk-value", "#portfolio-value", "#diagnostic-value", "#advisory-value"]) {
    document.querySelector(selector).dataset.state = "degraded";
  }
  setText("#pause-note-text", "No accepted view is available. No real operation is represented.");
  document.querySelector("#pause-note").dataset.state = "degraded";
}
/**
 * Displays a plain-text failure message and removes accepted model labels from the page.
 * @param {string} message Local status text; assigned through `textContent`, never parsed as HTML.
 * @returns {void}
 */
function showUnavailable(message) {
  snapshotStatus.dataset.state = "error";
  statusText.textContent = message;
  setText("#scenario-value", "SNAPSHOT_UNAVAILABLE");
  markReadModelUnavailable();
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
 * Validates the bounded snapshot contract before rendering mapped synthetic labels.
 * Unknown schemas, statuses, scenarios, or flags fail closed to unavailable display values.
 * @param {unknown} snapshot Value decoded from the local snapshot response.
 * @returns {void}
 */
function applySnapshot(snapshot) {
  if (
    snapshot?.schema_version !== 0 ||
    !statusValues.has(snapshot.status) ||
    !["HEALTHY_FIXTURE", "INCOMPLETE_FIXTURE", "DENIED_FIXTURE"].includes(snapshot.scenario) ||
    !hasSafeFlags(snapshot.flags)
  ) {
    showUnavailable("Snapshot did not match the synthetic display contract.");
    return;
  }
  const model = snapshot.read_model;
  if (model === null) {
    snapshotStatus.dataset.state = "degraded";
    statusText.textContent = "The accepted read model denied this fixture; no current view is available.";
    setText("#scenario-value", snapshot.scenario);
    markReadModelUnavailable();
    return;
  }
  if (
    !model ||
    model.mode_label !== "SYNTHETIC_NONAUTHORITATIVE" ||
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
  setText("#diagnostic-value", displayLabel("diagnostic_class", model.diagnostic_class));
  setText("#model-view", displayLabel("mock_view", model.mock_view));
  setText("#advisory-value", displayLabel("advisory_class", model.advisory_class));
  setText("#incident-value", displayLabel("incident_banner", model.incident_banner));
  setText("#session-value", displayLabel("displayed_session_class", model.displayed_session_class));
  const pauseNote = document.querySelector("#pause-note");
  pauseNote.dataset.state = model.hypothetical_pause_hint ? "degraded" : "ready";
  setText(
    "#pause-note-text",
    model.hypothetical_pause_hint
      ? "The only pause hint applies to this incomplete fictional fixture."
      : "No pause hint in this complete fixture. No real operation exists.",
  );
  for (const selector of ["#risk-value", "#portfolio-value", "#diagnostic-value", "#advisory-value"]) {
    document.querySelector(selector).dataset.state = degraded ? "degraded" : "complete";
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
  snapshotStatus.dataset.state = "loading";
  statusText.textContent = "Loading local fixture…";
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
    applySnapshot(snapshot);
  } catch {
    if (requestId !== latestSnapshotRequestId) return;
    showUnavailable("Local snapshot is unavailable.");
  }
}
/**
 * Selects a known page shell, falling back to Overview for unknown navigation identifiers.
 * Non-Overview entries remain explicitly planned placeholders without operational controls.
 * @param {string} viewId Requested fixed navigation key.
 * @returns {void}
 */
function applyView(viewId) {
  const view = hasView(viewId) ? views[viewId] : views.overview;
  currentView = hasView(viewId) ? viewId : "overview";
  const isOverview = currentView === "overview";
  overviewPanel.hidden = !isOverview;
  plannedPanel.hidden = isOverview;
  document.querySelector("#scenario-control").hidden = !isOverview;
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
scenarioSelect.addEventListener("change", () => loadSnapshot(scenarioSelect.value));
const initialView = location.hash.slice(1);
applyView(hasView(initialView) ? initialView : "overview");
loadSnapshot(scenarioSelect.value);
