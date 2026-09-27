#!/usr/bin/env node
import fs from "node:fs";import path from "node:path";import {sourcepackFingerprint} from "./lib/source-fingerprint.mjs";import{fileURLToPath}from"node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const mandatory=["SOURCE-HIERARCHY.md","PROJECT-OVERVIEW.md","REQUIREMENTS.md","SCOPE.md","ARCHITECTURE.md","SECURITY.md","TEST-BENCHMARK-PLAN.md","DEPLOYMENT.md","BACKLOG.md","DEFINITION-OF-DONE.md","DECISIONS-LEDGER.md","CHECKPOINT.md","CHECKPOINT.json","INTEGRATION-CONTRACTS.md","PROMPT-DELIVERY.md","work-orders/FV-BOOT-001.md","context-locks/FV-BOOT-001.md"];
let fail=false;
for(const p of mandatory){const full=path.join(root,".engineering",p);if(!fs.existsSync(full)||!fs.readFileSync(full,"utf8").trim()){console.error("[FAIL] "+p);fail=true;}}
const ledger=fs.readFileSync(path.join(root,".engineering/DECISIONS-LEDGER.md"),"utf8");
if(!ledger.includes("PDF")||!ledger.includes("Next Labs")){console.error("[FAIL] PDF_OR_BRAND_POLICY_MISSING");fail=true}
const checkpoint=JSON.parse(fs.readFileSync(path.join(root,".engineering/CHECKPOINT.json"),"utf8"));
if(checkpoint.status!=="DRAFT_NOT_APPROVED"&&checkpoint.last_audit!=="APPROVED") {console.error("[FAIL] CHECKPOINT_APPROVAL_UNPROVEN");fail=true}
const entries=mandatory.map(p=>[p,fs.readFileSync(path.join(root,".engineering",p),"utf8")]);
console.log("[INFO] sourcepack_sha256="+sourcepackFingerprint(entries));
if(fail)process.exit(1);console.log("[PASS] canonical source pack integrity");
