import test from"node:test";import assert from"node:assert/strict";import fs from"node:fs";
const setup=fs.readFileSync(new URL("../../scripts/local/setup-windows.ps1",import.meta.url),"utf8");
const smoke=fs.readFileSync(new URL("../../scripts/local/check-hive.ps1",import.meta.url),"utf8");
test("windows pins exact GEF and HIVE and refuses mismatch",()=>{assert.match(setup,/866fe3af8cccc65c929aaf6a47a924401fa448b3/);assert.match(setup,/52bd3dab54dd4f16264072e198ed1fc23168f7fa/);assert.match(setup,/Pinned-Commit/);assert.match(setup,/HIVE_ENV_ROOT_CONFLICT/)});
test("never performs destructive Docker volume wipe",()=>{assert.doesNotMatch(setup,/down\s+--volumes|down\s+-v|Remove-Item.*HiveData/i)});
test("HIVE smoke actually tests READY and retrieval; semantic optional and gated",()=>{for(const s of ["READY","/retrieval/lexical","/retrieval/hybrid","/retrieval/semantic","SEMANTIC_PROVIDER_NOT_CONFIGURED","Where-Object { $null -ne $_ }","$project.project_id","$($index.error)"])assert(smoke.includes(s))});
