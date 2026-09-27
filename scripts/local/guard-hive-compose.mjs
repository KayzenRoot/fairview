#!/usr/bin/env node
// FV-BOOT-001 R7: validate effective Compose config before ANY isolated API mutation.
// Rendered Compose JSON (may contain credentials) is held in memory and never logged.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const LOCK=JSON.parse(fs.readFileSync(path.join(REPO,".integrations/hive-fv-maintenance.lock.json"),"utf8"));
const PROJECT="hive-fairview-dev";
const DRIVE=/^[a-zA-Z]:[\\/]/;

export function hostPath(raw) {
  if(typeof raw!=="string"||!raw.trim())throw Error("HOST_PATH_MISSING");
  let s=raw.trim().replace(/\\/g,"/").replace(/\/+$/,"").toLowerCase();
  const bridge=s.match(/^\/(?:run\/desktop\/mnt\/host|host_mnt)\/([a-z])\/(.+)$/);
  if(bridge)s=bridge[1]+":/"+bridge[2];
  return s;
}
function assert(ok,reason) { if(!ok)throw Error(reason); }
function canonicalInput(s) {
  assert(typeof s==="string"&&s.length>0,"REQUIRED_PATH_MISSING");
  const absolute=fs.realpathSync(s);
  assert(path.isAbsolute(absolute),"ABSOLUTE_PATH_REQUIRED");
  return absolute;
}
function serviceVolume(volumes,target) {
  const matches=(volumes||[]).filter(x=>x.target===target);
  assert(matches.length===1,"VOLUME_MISSING_OR_AMBIGUOUS");
  assert(matches[0].type==="bind","BIND_REQUIRED");
  return matches[0];
}
function actualMount(mounts,target) {
  const matches=(mounts||[]).filter(x=>x.Destination===target);
  assert(matches.length===1,"LIVE_MOUNT_MISSING_OR_AMBIGUOUS");
  assert(matches[0].Type==="bind","LIVE_BIND_REQUIRED");
  return matches[0];
}
function requireMount(planned,live,target,source,readonly) {
  const a=serviceVolume(planned,target),b=actualMount(live,target);
  assert(hostPath(a.source)===hostPath(source),"PLANNED_VOLUME_SOURCE_MISMATCH");
  assert(hostPath(b.Source)===hostPath(source),"LIVE_VOLUME_SOURCE_MISMATCH");
  assert(Boolean(a.read_only)===readonly,"PLANNED_VOLUME_MODE_MISMATCH");
  assert(Boolean(b.RW)===!readonly,"LIVE_VOLUME_MODE_MISMATCH");
}
function planPort(ports,target,published) {
  const matches=(ports||[]).filter(x=>Number(x.target)===target);
  assert(matches.length===1,"PLANNED_PORT_AMBIGUOUS");
  const x=matches[0];
  assert(String(x.published)===String(published)&&x.host_ip==="127.0.0.1"&&
    (!x.protocol||x.protocol==="tcp"),"PLANNED_PORT_COLLISION_OR_NON_LOOPBACK");
}
function livePort(ports,target,published) {
  const matches=(ports?.[String(target)+"/tcp"]||[]);
  assert(matches.length===1,"LIVE_PORT_AMBIGUOUS");
  assert(matches[0].HostIp==="127.0.0.1"&&String(matches[0].HostPort)===String(published),
    "LIVE_PORT_NOT_ISOLATED");
}
function sameConfigurationLabels(live,opts) {
  const labels=live.labels||{};
  assert(labels["com.docker.compose.project"]===PROJECT,"WRONG_LIVE_COMPOSE_PROJECT");
  assert(hostPath(labels["com.docker.compose.project.working_dir"]||"")===
    hostPath(opts.projectDirectory),"WORKING_DIRECTORY_DRIFT");
  const fromLabel=String(labels["com.docker.compose.project.config_files"]||"").split(",").filter(Boolean).map(hostPath);
  assert(fromLabel.length===opts.composeFiles.length&&
    fromLabel.every((s,i)=>s===hostPath(opts.composeFiles[i])),"COMPOSE_OVERRIDE_LIST_CHANGED");
}
export function validateEffectiveConfig(rendered,live,opts) {
  assert(rendered?.name===PROJECT,"COMPOSE_PROJECT_FALLBACK");
  for(const n of ["api","postgres","redis","storage-init","dashboard"]) {
    assert(rendered.services?.[n],"COMPOSE_SERVICE_MISSING");
  }
  for(const n of ["api","postgres","redis","dashboard"])sameConfigurationLabels(live[n],opts);
  const api=rendered.services.api,pg=rendered.services.postgres,rd=rendered.services.redis;
  const init=rendered.services["storage-init"],dash=rendered.services.dashboard;
  assert(hostPath(api.build?.context||"")===hostPath(opts.checkout),"BUILD_CONTEXT_NOT_CANDIDATE");
  assert(String(api.environment?.HIVE_REPOSITORY_GIT_TIMEOUT_SECONDS)==="30",
    "CANDIDATE_GIT_TIMEOUT_NOT_WIRED");
  requireMount(api.volumes,live.api.mounts,"/workspace/projects",opts.projectsRoot,true);
  requireMount(api.volumes,live.api.mounts,"/var/lib/hive",opts.dataRoot,false);
  requireMount(pg.volumes,live.postgres.mounts,"/var/lib/postgresql/data",
    path.join(opts.dataRoot,"postgres"),false);
  requireMount(rd.volumes,live.redis.mounts,"/data",path.join(opts.dataRoot,"redis"),false);
  assert(hostPath(serviceVolume(init.volumes,"/var/lib/hive").source)===hostPath(opts.dataRoot),
    "STORAGE_INIT_DATA_ROOT_DRIFT");
  planPort(api.ports,8000,opts.apiPort);
  livePort(live.api.ports,8000,opts.apiPort);
  planPort(dash.ports,80,opts.dashboardPort);
  livePort(live.dashboard.ports,80,opts.dashboardPort);
  const safe={
    project:PROJECT,head:opts.head,
    sources:{checkout:hostPath(opts.checkout),data:hostPath(opts.dataRoot),
      projects:hostPath(opts.projectsRoot),projectDirectory:hostPath(opts.projectDirectory),
      files:opts.composeFiles.map(hostPath)},
    ports:{api:Number(opts.apiPort),dashboard:Number(opts.dashboardPort)},
    existingIds:Object.fromEntries(["api","postgres","redis","dashboard"].map(n=>[n,live[n].id])),
    existingApiImage:live.api.image
  };
  return {summary:safe,fingerprint:crypto.createHash("sha256").update(JSON.stringify(safe)).digest("hex")};
}
export function validateReceipt(receipt,opts) {
  assert(receipt?.schema_version===1&&receipt?.compose_project===PROJECT,
    "BACKUP_SCOPE_UNVERIFIED");
  assert(hostPath(receipt.data_root||"")===hostPath(opts.dataRoot),"BACKUP_ROOT_MISMATCH");
  assert(receipt.postgres_restore_verified===true&&
    Number.isInteger(receipt.postgres_restored_tables)&&receipt.postgres_restored_tables>=1,
    "POSTGRES_RESTORE_NOT_PROVEN");
  assert(receipt.cas_manifest_verified===true&&
    Number.isInteger(receipt.cas_referenced_blobs)&&receipt.cas_referenced_blobs>=0,
    "CAS_INTEGRITY_NOT_PROVEN");
  assert(typeof receipt.backup_file==="string"&&/^[a-f0-9]{64}$/i.test(receipt.backup_sha256||""),
    "BACKUP_SHA_MISSING");
}
function parseArgs(argv) {
  const out={composeFiles:[],mode:"plan"};
  const names={"--mode":"mode","--checkout":"checkout","--data-root":"dataRoot",
    "--projects-root":"projectsRoot","--project-directory":"projectDirectory",
    "--compose-file":"composeFile","--private-env-file":"envFile","--api-port":"apiPort",
    "--dashboard-port":"dashboardPort","--backup-receipt":"backupReceipt"};
  for(let i=0;i<argv.length;i+=2) {
    const key=names[argv[i]],value=argv[i+1];
    assert(key&&value!==undefined,"ARGUMENTS_INVALID");
    if(key==="composeFile")out.composeFiles.push(value);
    else {assert(out[key]===undefined||(key==="mode"&&out[key]==="plan"),"DUPLICATE_ARGUMENT");out[key]=value;}
  }
  assert(["plan","recreate-api"].includes(out.mode),"MODE_INVALID");
  for(const key of ["checkout","dataRoot","projectsRoot","projectDirectory","apiPort","dashboardPort"]) {
    assert(out[key],"REQUIRED_ARG_MISSING");
  }
  assert(out.composeFiles.length>0,"EXPLICIT_COMPOSE_FILES_REQUIRED");
  out.checkout=canonicalInput(out.checkout);
  out.dataRoot=canonicalInput(out.dataRoot);
  out.projectsRoot=canonicalInput(out.projectsRoot);
  out.projectDirectory=canonicalInput(out.projectDirectory);
  out.composeFiles=out.composeFiles.map(canonicalInput);
  if(out.envFile)out.envFile=canonicalInput(out.envFile);
  if(out.backupReceipt)out.backupReceipt=canonicalInput(out.backupReceipt);
  assert(out.composeFiles.every(x=>!x.includes(",")),"COMPOSE_FILENAME_UNSUPPORTED");
  assert(hostPath(out.dataRoot)!==hostPath("D:/HIVE")&&
    !hostPath(out.dataRoot).startsWith(hostPath("D:/HIVE")+"/"),"GLOBAL_HIVE_ROOT_FORBIDDEN");
  assert(hostPath(out.dataRoot)!==hostPath(out.projectsRoot),"DATA_AND_PROJECTS_MIXED");
  assert(out.apiPort!=="8000"&&out.dashboardPort!=="3000","DEFAULT_GLOBAL_PORT_FORBIDDEN");
  for(const k of ["apiPort","dashboardPort"])assert(/^[0-9]{4,5}$/.test(out[k])&&
    Number(out[k])>=1024&&Number(out[k])<=65535,"PORT_INVALID");
  if(fs.existsSync(path.join(out.projectDirectory,".env"))) {
    assert(out.envFile,"EXISTING_PRIVATE_ENV_FILE_MUST_BE_EXPLICIT");
  }
  assert(out.mode!=="recreate-api"||out.backupReceipt,"BACKUP_RECEIPT_REQUIRED");
  return out;
}
function exec(program,args,opts={}) {
  try {return execFileSync(program,args,{encoding:"utf8",stdio:["ignore","pipe","pipe"],
    timeout:opts.timeout||30000,maxBuffer:6*1024*1024,env:opts.env||process.env,
    cwd:opts.cwd||undefined,windowsHide:true}).trim();}
  catch {throw Error(opts.code||"NATIVE_COMMAND_FAILED");}
}
function dockerJson(args,code) {
  const output=exec("docker",args,{code});
  try{return JSON.parse(output);}catch{throw Error("DOCKER_JSON_UNAVAILABLE");}
}
function service(opts,serviceName) {
  const ids=exec("docker",["ps","--filter","label=com.docker.compose.project="+PROJECT,
    "--filter","label=com.docker.compose.service="+serviceName,"--format","{{.ID}}"],
    {code:"ISOLATED_SERVICE_UNAVAILABLE"}).split(/\r?\n/).filter(Boolean);
  assert(ids.length===1,"ISOLATED_SERVICE_AMBIGUOUS");
  const id=ids[0];
  return {id,labels:dockerJson(["inspect","--format","{{json .Config.Labels}}",id],
      "LIVE_LABELS_UNAVAILABLE"),
    mounts:dockerJson(["inspect","--format","{{json .Mounts}}",id],
      "LIVE_MOUNTS_UNAVAILABLE"),
    ports:dockerJson(["inspect","--format","{{json .NetworkSettings.Ports}}",id],
      "LIVE_PORTS_UNAVAILABLE"),
    image:exec("docker",["inspect","--format","{{.Image}}",id],{code:"LIVE_IMAGE_UNAVAILABLE"})};
}
async function health(port) {
  let err;
  for(let i=0;i<30;i++) {
    try {
      const abort=AbortSignal.timeout(5000);
      const response=await fetch("http://127.0.0.1:"+port+"/api/v1/health",{signal:abort});
      if(response.ok && (await response.json()).status==="ok")return;
      err="ISOLATED_API_UNHEALTHY";
    } catch {err="ISOLATED_API_UNHEALTHY";}
    await new Promise(resolve=>setTimeout(resolve,2000));
  }
  throw Error(err||"ISOLATED_API_UNHEALTHY");
}
async function verifyBackup(receiptFile,opts) {
  assert(!hostPath(receiptFile).startsWith(hostPath(REPO)+"/"),"BACKUP_RECEIPT_IN_PUBLIC_REPO");
  const receipt=JSON.parse(fs.readFileSync(receiptFile,"utf8"));
  validateReceipt(receipt,opts);
  const backup=canonicalInput(receipt.backup_file);
  assert(!hostPath(backup).startsWith(hostPath(REPO)+"/"),"BACKUP_IN_PUBLIC_REPO");
  const digest=crypto.createHash("sha256");
  for await(const chunk of fs.createReadStream(backup))digest.update(chunk);
  assert(digest.digest("hex").toLowerCase()===receipt.backup_sha256.toLowerCase(),
    "BACKUP_DIGEST_MISMATCH");
  return crypto.createHash("sha256").update(fs.readFileSync(receiptFile)).digest("hex");
}
async function main() {
  const opts=parseArgs(process.argv.slice(2));
  assert(LOCK.scope==="ISOLATED_LOCAL_DEV_ONLY"&&
    LOCK.status==="DEV_CANDIDATE_VERIFIED"&&
    LOCK.validation.validate_conclusion==="success"&&
    LOCK.validation.integration_conclusion==="success","CANDIDATE_NOT_HOSTED_VERIFIED");
  const origin=exec("git",["-C",opts.checkout,"remote","get-url","origin"],{code:"GIT_ORIGIN_UNAVAILABLE"});
  assert(/^(https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)KayzenRoot\/hive(\.git)?$/i.test(origin),
    "UNEXPECTED_HIVE_ORIGIN");
  opts.head=exec("git",["-C",opts.checkout,"rev-parse","HEAD"],{code:"GIT_HEAD_UNAVAILABLE"});
  assert(opts.mode==="plan"?
      [LOCK.base_release_commit,LOCK.candidate_sha].includes(opts.head):
      opts.head===LOCK.candidate_sha,"HIVE_SOURCE_HEAD_MISMATCH");
  assert(!exec("git",["-C",opts.checkout,"status","--porcelain=v1","--untracked-files=no"],
    {code:"GIT_STATUS_UNAVAILABLE"}),"HIVE_SOURCE_DIRTY");
  assert(exec("docker",["info","--format","{{.OSType}}"],{code:"DOCKER_INFO_UNAVAILABLE"})==="linux",
    "DOCKER_LINUX_ENGINE_REQUIRED");
  const common=["compose","-p",PROJECT,"--project-directory",opts.projectDirectory];
  for(const file of opts.composeFiles)common.push("-f",file);
  if(opts.envFile)common.push("--env-file",opts.envFile);
  const env={...process.env,HIVE_DATA_ROOT:opts.dataRoot,
    HIVE_PROJECTS_ROOT:opts.projectsRoot,HIVE_API_PORT:String(opts.apiPort),
    HIVE_DASHBOARD_PORT:String(opts.dashboardPort),HIVE_REPOSITORY_GIT_TIMEOUT_SECONDS:"30"};
  // Explicit environment and Compose argv are reused UNCHANGED for config, build and up.
  function snapshot() {
    const raw=exec("docker",common.concat(["config","--format","json"]),
      {env,code:"EFFECTIVE_COMPOSE_CONFIG_FAILED"});
    let rendered;
    try{rendered=JSON.parse(raw);}catch{throw Error("COMPOSE_CONFIG_JSON_INVALID");}
    const live=Object.fromEntries(["api","postgres","redis","dashboard"].map(s=>[s,service(opts,s)]));
    const proof=validateEffectiveConfig(rendered,live,opts);
    return {proof,live};
  }
  let {proof,live}=snapshot();
  await health(opts.apiPort);
  console.log("[PASS] EFFECTIVE_COMPOSE_MATCH "+proof.fingerprint.slice(0,16)+
    " project="+PROJECT+" head="+opts.head.slice(0,12)+" API="+opts.apiPort);
  if(opts.mode==="plan") {
    console.log("[INFO] PLAN_ONLY_NO_MUTATION. Rerun recreate-api with off-repository verified backup receipt.");
    return;
  }
  const receiptHash=await verifyBackup(opts.backupReceipt,opts);
  console.log("[PASS] OFF_REPO_BACKUP_RECEIPT "+receiptHash.slice(0,16));
  // Re-render and re-read live containers immediately before the first mutation.
  const again=snapshot();
  assert(again.proof.fingerprint===proof.fingerprint,"COMPOSE_CONFIG_DRIFT_BEFORE_WRITE");
  const old=live;
  exec("docker",common.concat(["build","api"]),{env,timeout:12*60*1000,code:"ISOLATED_API_BUILD_FAILED"});
  // Same exact Compose arguments, project directory, files, private env source and overrides.
  exec("docker",common.concat(["up","-d","--no-deps","--no-build","api"]),
    {env,timeout:3*60*1000,code:"ISOLATED_API_RECREATE_FAILED"});
  const after=Object.fromEntries(["api","postgres","redis","dashboard"].map(s=>[s,service(opts,s)]));
  for(const n of ["postgres","redis","dashboard"]) {
    assert(after[n].id===old[n].id,"NON_API_SERVICE_CHANGED");
  }
  assert(after.api.id!==old.api.id&&after.api.image!==old.api.image,
    "CANDIDATE_API_IMAGE_NOT_REPLACED");
  validateEffectiveConfig(
    JSON.parse(exec("docker",common.concat(["config","--format","json"]),
      {env,code:"POST_DEPLOY_COMPOSE_FAILED"})),after,opts);
  await health(opts.apiPort);
  console.log("[PASS] ISOLATED_API_REBUILT_NON_API_UNCHANGED previous_image="+
    old.api.image.slice(0,19)+" new_image="+after.api.image.slice(0,19));
  console.log("[BOUNDARY] No indexing, semantic CURRENT, MCP handshake or global HIVE action implied.");
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  main().catch(error=>{const code=/^[A-Z0-9_]+$/.test(error.message)?error.message:
    "R7_PREFLIGHT_OR_RECREATE_FAILED";console.error("[BLOCKED] "+code);process.exitCode=1;});
}
