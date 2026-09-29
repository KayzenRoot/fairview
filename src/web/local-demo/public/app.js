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
const hasView = (viewId) => Object.hasOwn(views, viewId);

const setText = (selector, value) => {
  const target = document.querySelector(selector);
  if (target) target.textContent = value;
};
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
function showUnavailable(message) {
  snapshotStatus.dataset.state = "error";
  statusText.textContent = message;
  setText("#scenario-value", "SNAPSHOT_UNAVAILABLE");
  markReadModelUnavailable();
}
function hasSafeFlags(flags) {
  if (!flags || Object.keys(flags).length !== flagKeys.length) return false;
  return flagKeys.every((key) =>
    Object.hasOwn(flags, key) && flags[key] === (key === "fixture_only"),
  );
}
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
async function loadSnapshot(scenario) {
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
    if (!response.ok || !response.headers.get("content-type")?.startsWith("application/json")) {
      showUnavailable("Local snapshot is unavailable.");
      return;
    }
    applySnapshot(await response.json());
  } catch {
    showUnavailable("Local snapshot is unavailable.");
  }
}
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
