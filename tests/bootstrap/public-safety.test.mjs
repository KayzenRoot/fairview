import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {forbiddenPath,suspiciousContent,workflowHazards} from "../../scripts/lib/public-safety.mjs";
test("refuses .env at any depth including .env.example",()=>{
 for(const path of [".env",".env.example","src/.env","services/x/.env.production","scripts/.ENV.TEST"])assert.equal(forbiddenPath(path),"ENV_FILE",path);
});
test("blocks key, credentials and path traversal",()=>{
 for(const path of ["id_ed25519","deployment/private.pem","ops/.aws/credentials","../secrets.json",".npmrc"])assert(forbiddenPath(path),path);
 assert.equal(forbiddenPath("src/config/schema.ts"),null);
});
test("detects known token classes from assembled synthetic fixtures without logging values",()=>{
 const github="gh"+"p_"+"a".repeat(35);
 const aws="AK"+"IA"+"A".repeat(16);
 const literal="api_key"+": "+"b".repeat(32);
 assert(suspiciousContent(github).includes("KNOWN_TOKEN_PREFIX"));
 assert(suspiciousContent(aws).includes("AWS_ACCESS_ID"));
 assert(suspiciousContent(literal).includes("LITERAL_SECRET_ASSIGNMENT"));
 assert(suspiciousContent("-----BEGIN "+"RSA PRIVATE KEY-----").includes("PRIVATE_KEY_HEADER"));
});
test("safe non-secret architecture prose is not a secret",()=>{
 assert.deepEqual(suspiciousContent("No API keys, wallet signing keys or .env files in Git."),[]);
});
test("risky workflow trigger and workflow secrets blocked in workflow files only",()=>{
 const dangerous=["on:","  pull_request_target:", "permissions: write-all"].join("\n");
 assert(workflowHazards(".github/workflows/unsafe.yml",dangerous).includes("PRIVILEGED_PR_TRIGGER"));
 assert(workflowHazards(".github/workflows/unsafe.yml",dangerous).includes("OVERBROAD_WORKFLOW_PERMISSIONS"));
 assert.deepEqual(workflowHazards("docs/workflows.md",dangerous),[]);
});
test("project gitignore bans all local env files without exception",()=>{
 const content=fs.readFileSync(new URL("../../.gitignore",import.meta.url),"utf8").replace(/\r\n/g,"\n");
 assert(content.includes(".env\n"));
 assert(content.includes("**/.env.*"));
 assert(!content.includes("!.env.example"));
});
test("existing CI grants no production secret or privileged PR workflow",()=>{
 const yml=fs.readFileSync(new URL("../../.github/workflows/foundation.yml",import.meta.url),"utf8");
 assert.deepEqual(workflowHazards(".github/workflows/foundation.yml",yml),[]);
 assert(yml.includes("Public repository security gate"));
 assert(yml.includes("persist-credentials: false"));
 assert(yml.includes("contents: read"));
});
test("public gate guards both all-tree CI scan and opt-in staged-index hook",()=>{
 const scan=fs.readFileSync(new URL("../../scripts/security-scan.mjs",import.meta.url),"utf8");
 const hook=fs.readFileSync(new URL("../../.githooks/pre-commit",import.meta.url),"utf8");
 assert(scan.includes('["ls-files","--stage","-z"]'));
 assert(scan.includes('["show",":"+e.name]'));
 assert(scan.includes("UNSCANNED_BINARY"));
 assert(hook.includes("--staged"));
});
