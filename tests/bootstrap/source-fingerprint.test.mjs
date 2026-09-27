import test from"node:test";import assert from"node:assert/strict";
import{sourcepackFingerprint,normalizeCanonicalText}from"../../scripts/lib/source-fingerprint.mjs";
test("Windows CRLF and Unix LF produce identical Source Pack fingerprint",()=>{
 const unix=[["ARCHITECTURE.md","# Architecture\nCross-check\n"],["CHECKPOINT.json",'{"version":1}\n']];
 const windows=[["ARCHITECTURE.md","# Architecture\r\nCross-check\r\n"],["CHECKPOINT.json",'{"version":1}\r\n']];
 assert.equal(sourcepackFingerprint(unix),sourcepackFingerprint(windows));
});
test("Source Pack enumeration order does not change fingerprint",()=>{
 const e=[["B.md","b\n"],["A.md","a\n"]];assert.equal(sourcepackFingerprint(e),sourcepackFingerprint(e.slice().reverse()));
});
test("changed canonical source changes fingerprint and duplicates reject",()=>{
 assert.notEqual(sourcepackFingerprint([["A.md","a"]]),sourcepackFingerprint([["A.md","b"]]));
 assert.throws(()=>sourcepackFingerprint([["A.md","a"],["A.md","a"]]),/DUPLICATE/);
 assert.equal(normalizeCanonicalText("x\ry\r\nz"),"x\ny\nz");
});
