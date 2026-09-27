import test from"node:test";import assert from"node:assert/strict";import fs from"node:fs";
import{parseGitDiffNameStatusZ as parse}from"../../scripts/lib/git-diff.mjs";
test("captures ordinary modifications, additions and crucially deletions",()=>assert.deepEqual(parse("M\0src/risk/x.rs\0A\0src/cex/y.rs\0D\0src/forex/z.rs\0"),["src/risk/x.rs","src/cex/y.rs","src/forex/z.rs"]));
test("rename crosses module boundary and tests both old and new owners",()=>assert.deepEqual(parse("R100\0src/cex/old.rs\0src/defi/new.rs\0"),["src/cex/old.rs","src/defi/new.rs"]));
test("dedupes path copies and accepts empty diff",()=>{assert.deepEqual(parse("C092\0src/cex/a.rs\0src/cex/a.rs\0"),["src/cex/a.rs"]);assert.deepEqual(parse(""),[])});
test("rejects partial, unmerged and unrecognized input",()=>{assert.throws(()=>parse("M\0src/x"),/TRUNCATED/);assert.throws(()=>parse("U\0src/x\0"),/UNSUPPORTED/);assert.throws(()=>parse("R100\0src/x\0"),/MISSING_RENAMED/)});
test("both impact selection and evidence generation use shared deletion-aware parser",()=>{
 const h=fs.readFileSync(new URL("../../scripts/harness.mjs",import.meta.url),"utf8");
 const e=fs.readFileSync(new URL("../../scripts/evidence.mjs",import.meta.url),"utf8");
 for (const code of [h,e]) {assert(code.includes("parseGitDiffNameStatusZ"));assert(code.includes("--find-renames"));assert(!code.includes("--diff-filter=ACMR\""));}
});
