import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {calculateImpact} from "../../scripts/lib/impact.mjs";
const code=fs.readFileSync(new URL("../../scripts/evidence.mjs",import.meta.url),"utf8");
const registry=JSON.parse(fs.readFileSync(new URL("../../harness/modules.json",import.meta.url),"utf8"));

test("exact Git HEAD and explicit base bind only a CI-verified evidence receipt",()=>{
 for(const marker of ["EVIDENCE_BASE_SHA","rev-parse","EVIDENCE_TESTS_VERIFIED","NO_VERIFIED_TEST_PROOF","source_checkpoint_sha256"])
  assert(code.includes(marker),marker);
});
test("a directly edited still-planned module or unknown path fails Evidence Bundle",()=>{
 assert(code.includes("impact.unknown.length||impact.direct_planned.length"));
 assert(!code.includes("impact.unknown.length||impact.planned.length"));
 const changed=calculateImpact(registry,["src/forex/deny.mjs"]);
 assert.deepEqual(changed.direct_planned,["forex"]);
 assert(changed.planned.includes("strategy-forex"));
 assert.equal(changed.unknown.length,0);
});
test("an active policy owner can provide proof with explicit untested planned downstream",()=>{
 const changed=calculateImpact(registry,["src/policy/eligibility.mjs"]);
 assert.deepEqual(changed.direct_active,["policy"]);
 assert.deepEqual(changed.direct_planned,[]);
 assert(changed.active.includes("policy"));
 assert(changed.active.includes("risk"));
 assert(changed.active.includes("ledger"));
 assert(changed.planned.includes("integration"));
 assert(code.includes("planned_reverse_dependents_not_executed:impact.planned"));
 assert(code.includes("directly_modified_active_modules:impact.direct_active"));
});
test("unknown path stays blocked even when its changed project docs select bootstrap",()=>{
 const changed=calculateImpact(registry,["docs/architecture/modules/policy.md","unowned/private-policy.mjs"]);
 assert.deepEqual(changed.unknown,["unowned/private-policy.mjs"]);
 assert.equal(changed.full,true);
});
test("CI evidence never claims real Windows-host or financial trading qualification",()=>{
 assert(code.includes("CHECKED_BY_WINDOWS_CI_NO_EXTERNAL_SERVICES"));
 assert(!code.includes("LIVE_APPROVED"));
 assert(!code.includes("HIVE_LOCAL_FULLY_FUNCTIONAL"));
});

test("an admitted synthetic clock owner is tested while its future consumers remain unexecuted",()=>{
 const impact=calculateImpact(registry,["src/clock/time.mjs"]);
 assert.deepEqual(impact.direct_active,["clock"]);
 assert.deepEqual(impact.direct_planned,[]);
 assert(impact.active.includes("clock"));
 assert(impact.active.includes("market-data"));
 assert(impact.active.includes("risk"));
 assert(impact.planned.includes("integration"));
 assert(code.includes("planned_reverse_dependents_not_executed:impact.planned"));
});

test("fictional market-data direct owner is tested while still-planned strategy consumers remain unexecuted",()=>{
 const impact=calculateImpact(registry,["src/market-data/quote.mjs"]);
 assert.deepEqual(impact.direct_active,["market-data"]);
 assert.deepEqual(impact.direct_planned,[]);
 assert(impact.active.includes("risk"));
 assert(impact.active.includes("replay"));
 for(const id of ["forex","cex","defi","integration"])assert(impact.planned.includes(id));
 assert(code.includes("planned_reverse_dependents_not_executed:impact.planned"));
});


test("fictional ledger direct ownership has executable tests without pretending downstream execution exists",()=>{
 const impact=calculateImpact(registry,["src/ledger/simulation.mjs"]);
 assert.deepEqual(impact.direct_active,["ledger"]);
 assert.deepEqual(impact.direct_planned,[]);
 assert(impact.active.includes("ledger"));
 assert(impact.active.includes("portfolio"));
 assert(impact.active.includes("execution"));
 assert(impact.active.includes("replay"));
 for(const id of ["integration"])
  assert(impact.planned.includes(id),"UNTESTED_REVERSE_DEPENDENCY "+id);
 assert(code.includes("planned_reverse_dependents_not_executed:impact.planned"));
});


test("FV-RISK-001 fake risk direct source is owned by executable harness, while reverse financial adapters remain blocked",()=>{
 const x=calculateImpact(registry,["src/risk/evaluate.mjs"]);
 assert.deepEqual(x.direct_active,["risk"]);
 assert.deepEqual(x.direct_planned,[]);
 assert(x.active.includes("risk"));
 assert(x.active.includes("portfolio"));
 assert(x.active.includes("execution"));
 assert(x.active.includes("replay"));
 for(const id of ["forex","cex","defi","integration"])
  assert(x.planned.includes(id),"UNTESTED_FINANCIAL_DEPENDENT "+id);
 assert(code.includes("planned_reverse_dependents_not_executed:impact.planned"));
});


test("FV-PORTFOLIO-001 real test ownership proves invented Portfolio seam but not still-planned financial execution",()=>{
 const x=calculateImpact(registry,["src/portfolio/projection.mjs"]);
 assert.deepEqual(x.direct_active,["portfolio"]);
 assert.deepEqual(x.direct_planned,[]);
 assert(x.active.includes("portfolio"));
 for(const id of ["strategy-forex","strategy-cex","strategy-defi","web","integration"])
  assert(x.planned.includes(id),"FUTURE_NOT_TESTED "+id);
 assert(code.includes("planned_reverse_dependents_not_executed:impact.planned"));
});


test("FV-EXECUTION-001 directly owned fake Execution stays separated from still-planned real providers",()=>{
 const impact=calculateImpact(registry,["src/execution/simulation.mjs"]);
 assert.deepEqual(impact.direct_active,["execution"]);
 assert.deepEqual(impact.direct_planned,[]);
 assert(impact.active.includes("execution"));
 assert(impact.active.includes("replay"));
 assert(impact.active.includes("observability"));
 for(const id of ["forex","cex","defi","integration"])
  assert(impact.planned.includes(id),"FUTURE_UNTESTED "+id);
 assert(code.includes("planned_reverse_dependents_not_executed:impact.planned"));
});


test("FV-REPLAY-001 direct invented source owner is actually tested while research and financial strategies remain untested",()=>{
 const impacted=calculateImpact(registry,["src/replay/deterministic.mjs"]);
 assert.deepEqual(impacted.direct_active,["replay"]);
 assert.deepEqual(impacted.direct_planned,[]);
 assert(impacted.active.includes("research"));
 for(const id of ["strategy-forex","strategy-cex","strategy-defi","ai","web","integration"])
  assert(impacted.planned.includes(id),"PLANNED_DEPENDENT_NOT_TESTED "+id);
 assert(code.includes("planned_reverse_dependents_not_executed:impact.planned"));
});


test("FV-OBSERVABILITY-001 real direct owned diagnostics still leave Web/Integration planned reverse dependents unexecuted",()=>{
 const x=calculateImpact(registry,["src/observability/diagnostics.mjs"]);
 assert.deepEqual(x.direct_active,["observability"]);
 assert.deepEqual(x.direct_planned,[]);
 for(const id of ["web","integration"])
  assert(x.planned.includes(id),"UNTESTED_OBSERVABILITY_DEPENDENT "+id);
 assert(code.includes("planned_reverse_dependents_not_executed:impact.planned"));
});


test("FV-RESEARCH-001 real directly owned synthetic A/A source has proof without promoting future AI/Web or real financial Integration",()=>{
 const x=calculateImpact(registry,["src/research/integrity.mjs"]);
 assert.deepEqual(x.direct_active,["research"]);
 assert.deepEqual(x.direct_planned,[]);
 assert(x.active.includes("research"));
 for(const id of ["ai","web","integration"])
  assert(x.planned.includes(id),"UNTESTED_RESEARCH_REVERSE "+id);
 const replay=calculateImpact(registry,["src/replay/deterministic.mjs"]);
 const data=calculateImpact(registry,["src/market-data/quote.mjs"]);
 assert(replay.active.includes("research")&&data.active.includes("research"));
 assert(code.includes("planned_reverse_dependents_not_executed:impact.planned"));
});
