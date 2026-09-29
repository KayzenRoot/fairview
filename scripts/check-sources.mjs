#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {sourcepackFingerprint} from "./lib/source-fingerprint.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const mandatory=["SOURCE-HIERARCHY.md","PROJECT-OVERVIEW.md","REQUIREMENTS.md","SCOPE.md","ARCHITECTURE.md","SECURITY.md","TEST-BENCHMARK-PLAN.md","DEPLOYMENT.md","BACKLOG.md","DEFINITION-OF-DONE.md","DECISIONS-LEDGER.md","CHECKPOINT.md","CHECKPOINT.json","INTEGRATION-CONTRACTS.md","PROMPT-DELIVERY.md","work-orders/FV-FOUNDATION-002.md","context-locks/FV-FOUNDATION-002.md"];
const entries=[];let failed=false;
for(const p of mandatory){const full=path.join(root,".engineering",p);if(!fs.existsSync(full)||!fs.readFileSync(full,"utf8").trim()){console.error("[FAIL] MISSING_SOURCE "+p);failed=true;continue}entries.push([p,fs.readFileSync(full,"utf8")])}
if(failed)process.exit(1);
const decisions=fs.readFileSync(path.join(root,".engineering/DECISIONS-LEDGER.md"),"utf8");
if(!decisions.includes("PDF")||!decisions.includes("Next Labs")||!decisions.includes("D-009")){console.error("[FAIL] REQUIRED_OWNER_DECISIONS_MISSING");process.exit(1)}
const checkpoint=JSON.parse(fs.readFileSync(path.join(root,".engineering/CHECKPOINT.json"),"utf8"));
if(!["MIGRATION_DRAFT_NOT_APPROVED","APPROVED_REPO_BOOTSTRAP_ONLY"].includes(checkpoint.status)){console.error("[FAIL] INVALID_CHECKPOINT_STATUS");process.exit(1)}
if(checkpoint.status==="MIGRATION_DRAFT_NOT_APPROVED"&&checkpoint.independent_approval!==false){console.error("[FAIL] UNPROVEN_MIGRATION_APPROVAL");process.exit(1)}
console.log("[INFO] sourcepack_sha256="+sourcepackFingerprint(entries));
console.log("[PASS] current source pack and owner migration decisions");
