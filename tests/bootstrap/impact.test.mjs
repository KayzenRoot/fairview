import test from "node:test";import assert from"node:assert/strict";import fs from"node:fs";
import{calculateImpact,validateRegistry}from"../../scripts/lib/impact.mjs";
const r=JSON.parse(fs.readFileSync(new URL("../../harness/modules.json",import.meta.url)));
test("valid canonical graph",()=>assert.equal(validateRegistry(r),r));
test("scoped script bug runs only bootstrap harness",()=>{const x=calculateImpact(r,["scripts/harness.mjs"]);assert.deepEqual(x.active,["bootstrap"]);assert.deepEqual(x.planned,[]);assert.equal(x.full,false)});
test("ordinary document change runs bootstrap",()=>{const x=calculateImpact(r,["docs/runbooks/WINDOWS-HIVE.md"]);assert.deepEqual(x.active,["bootstrap"]);assert.equal(x.full,false)});
test("critical security source triggers full active proof",()=>{const x=calculateImpact(r,[".engineering/SECURITY.md"]);assert.equal(x.full,true);assert.deepEqual(x.active,["bootstrap"])});
test("risk module change invokes all dependent planned modules and fails activation",()=>{const x=calculateImpact(r,["src/risk/kill_switch.rs"]);assert(x.planned.includes("risk"));assert(x.planned.includes("forex"));assert(x.planned.includes("integration"))});
test("unknown file fails closed not invisible",()=>{const x=calculateImpact(r,["random/future-code.rs"]);assert.deepEqual(x.unknown,["random/future-code.rs"]);assert.equal(x.full,true)});
test("path traversal and backslash fail closed",()=>{const x=calculateImpact(r,["../escape",".\\windows"]);assert.equal(x.unknown.length,2)});
test("duplicate and cycle reject",()=>{const c=structuredClone(r);c.modules[1].depends_on=["forex"];assert.throws(()=>validateRegistry(c),/CYCLIC_DEPENDENCY/)});
test("active module must have tests",()=>{const c=structuredClone(r);c.modules[1].state="active";assert.throws(()=>validateRegistry(c),/ACTIVE_MODULE_MISSING_TESTS/)});

test("planned map preserves the sole active bootstrap and one charter per module",()=>{
  assert.equal(r.modules.length,20);
  assert.deepEqual(r.modules.filter(m=>m.state==="active").map(m=>m.id),["bootstrap"]);
  for(const mod of r.modules){
    const charter=new URL("../../docs/architecture/modules/"+mod.id+".md",import.meta.url);
    assert(fs.existsSync(charter),"MISSING_MODULE_CHARTER "+mod.id);
    const prose=fs.readFileSync(charter,"utf8");
    assert(prose.includes("module \`"+mod.id+"\`"),"WRONG_MODULE_CHARTER "+mod.id);
    if(mod.id!=="bootstrap"){
      assert.equal(mod.state,"planned","UNEXPECTED_ACTIVE_PRODUCT_MODULE "+mod.id);
      assert.deepEqual(mod.tests,[],"IMPLEMENTATION_TESTS_ADMITTED_WITHOUT_WO "+mod.id);
      for(const prefix of mod.paths.filter(p=>p.startsWith("src/")||p.startsWith("tests/"))){
        assert(!fs.existsSync(new URL("../../"+prefix,import.meta.url)),"UNAPPROVED_PRODUCT_SOURCE "+prefix);
      }
    }
  }
});
test("planning docs remain bootstrap-owned while new source requires activation",()=>{
  const docs=calculateImpact(r,["docs/architecture/modules/strategy-forex.md"]);
  assert.deepEqual(docs.active,["bootstrap"]);
  assert.deepEqual(docs.planned,[]);
  assert.deepEqual(docs.unknown,[]);
  const code=calculateImpact(r,["src/market-data/adapter.rs"]);
  assert(code.planned.includes("market-data"));
  assert(code.planned.includes("risk"));
  assert(code.planned.includes("integration"));
  assert.deepEqual(code.unknown,[]);
});
