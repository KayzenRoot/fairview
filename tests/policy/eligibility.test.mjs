import test from "node:test";
import assert from "node:assert/strict";
import {evaluateSyntheticEligibility} from "../../src/policy/eligibility.mjs";
test("missing input is denied",()=>assert.equal(evaluateSyntheticEligibility(null).decision,"DENY"));
test("empty request is denied",()=>assert.equal(evaluateSyntheticEligibility({}).decision,"DENY"));
