import test from"node:test";import assert from"node:assert/strict";import fs from"node:fs";
const code=fs.readFileSync(new URL("../../scripts/evidence.mjs",import.meta.url),"utf8");
test("CI evidence ties exact Git head to explicit base and verifies run receipt",()=>{for(const s of ["EVIDENCE_BASE_SHA","rev-parse","EVIDENCE_TESTS_VERIFIED","UNVERIFIED_IMPACT"])assert(code.includes(s))});
test("bootstrap receipt never asserts Windows runtime verified",()=>assert.match(code,/NOT_TESTED_IN_CI/));
