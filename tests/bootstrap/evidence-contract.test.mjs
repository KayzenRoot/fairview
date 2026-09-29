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
 const changed=calculateImpact(registry,["src/ledger/durable.mjs"]);
 assert.deepEqual(changed.direct_planned,["ledger"]);
 assert(changed.planned.includes("portfolio"));
 assert.equal(changed.unknown.length,0);
});
test("an active policy owner can provide proof with explicit untested planned downstream",()=>{
 const changed=calculateImpact(registry,["src/policy/eligibility.mjs"]);
 assert.deepEqual(changed.direct_active,["policy"]);
 assert.deepEqual(changed.direct_planned,[]);
 assert(changed.active.includes("policy"));
 assert(changed.planned.includes("risk"));
 assert(changed.planned.includes("ledger"));
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
 assert(impact.planned.includes("risk"));
 assert(impact.planned.includes("integration"));
 assert(code.includes("planned_reverse_dependents_not_executed:impact.planned"));
});

test("fictional market-data direct owner is tested while still-planned strategy consumers remain unexecuted",()=>{
 const impact=calculateImpact(registry,["src/market-data/quote.mjs"]);
 assert.deepEqual(impact.direct_active,["market-data"]);
 assert.deepEqual(impact.direct_planned,[]);
 for(const id of ["risk","forex","cex","defi","replay","integration"])assert(impact.planned.includes(id));
 assert(code.includes("planned_reverse_dependents_not_executed:impact.planned"));
});
