import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { hostPath, validateEffectiveConfig, validateReceipt } from "../../scripts/local/guard-hive-compose.mjs";
const script=fs.readFileSync(new URL("../../scripts/local/guard-hive-compose.mjs",import.meta.url),"utf8");
const fixture={
  checkout:"D:/Tools/hive-fairview-isolated",
  projectDirectory:"D:/Tools/hive-fairview-isolated",
  composeFiles:["D:/Tools/hive-fairview-isolated/docker-compose.yml",
    "D:/Tools/hive-fairview-isolated/compose.fairview.override.yml"],
  dataRoot:"D:/Tools/hive-fairview-data",
  projectsRoot:"D:/Projects",
  apiPort:"18000",
  dashboardPort:"13000",
  head:"2fbe0e6f5239c91d7ccae9e605a9f087f30ad095"
};
function volume(source,target,readonly=false) {
  return {type:"bind",source,target,read_only:readonly};
}
function mount(source,target,readonly=false) {
  return {Type:"bind",Source:source,Destination:target,RW:!readonly};
}
function labels() {
 return {
   "com.docker.compose.project":"hive-fairview-dev",
   "com.docker.compose.project.working_dir":fixture.projectDirectory,
   "com.docker.compose.project.config_files":fixture.composeFiles.join(",")
 };
}
function full() {
 const apiVol=[volume(fixture.dataRoot,"/var/lib/hive"),
   volume(fixture.projectsRoot,"/workspace/projects",true)];
 const apiMounts=[mount(fixture.dataRoot,"/var/lib/hive"),
   mount(fixture.projectsRoot,"/workspace/projects",true)];
 const pgvol=path.posix.join(fixture.dataRoot,"postgres");
 const rdvol=path.posix.join(fixture.dataRoot,"redis");
 return {
   plan:{name:"hive-fairview-dev",services:{
     api:{build:{context:fixture.checkout,dockerfile:"backend/Dockerfile"},
       environment:{HIVE_REPOSITORY_GIT_TIMEOUT_SECONDS:"30"},
       volumes:apiVol,
       ports:[{host_ip:"127.0.0.1",published:fixture.apiPort,target:8000,protocol:"tcp"}]},
     postgres:{volumes:[volume(pgvol,"/var/lib/postgresql/data")]},
     redis:{volumes:[volume(rdvol,"/data")]},
     "storage-init":{volumes:[volume(fixture.dataRoot,"/var/lib/hive")]},
     dashboard:{ports:[{host_ip:"127.0.0.1",published:fixture.dashboardPort,target:80}]}
   }},
   live:{
     api:{id:"api-1",image:"sha256:old",labels:labels(),mounts:apiMounts,
       ports:{"8000/tcp":[{HostIp:"127.0.0.1",HostPort:fixture.apiPort}]}},
     postgres:{id:"pg-1",image:"sha256:pg",labels:labels(),
       mounts:[mount(pgvol,"/var/lib/postgresql/data")]},
     redis:{id:"redis-1",image:"sha256:redis",labels:labels(),
       mounts:[mount(rdvol,"/data")]},
     dashboard:{id:"web-1",image:"sha256:web",labels:labels(),mounts:[],
       ports:{"80/tcp":[{HostIp:"127.0.0.1",HostPort:fixture.dashboardPort}]}}
   }
 };
}
const clone=x=>structuredClone(x);
test("matching isolated effective Compose and live Docker produce safe deterministic receipt",()=>{
 const x=full(); const r=validateEffectiveConfig(x.plan,x.live,fixture);
 assert.match(r.fingerprint,/^[0-9a-f]{64}$/);
 assert.equal(r.summary.ports.api,18000);
 assert.deepEqual(r,validateEffectiveConfig(x.plan,x.live,fixture));
});
test("omitted R5 override falls back to global :8000 and is rejected before mutation",()=>{
 const x=full();
 x.plan.services.api.ports[0].published="8000";
 assert.throws(()=>validateEffectiveConfig(x.plan,x.live,fixture),/PLANNED_PORT_COLLISION_OR_NON_LOOPBACK/);
});
test("default relative data root and missing override config list fail closed",()=>{
 const a=full();
 a.plan.services.api.volumes[0].source="D:/Tools/hive-fairview-isolated/.hive-data";
 assert.throws(()=>validateEffectiveConfig(a.plan,a.live,fixture),/PLANNED_VOLUME_SOURCE_MISMATCH/);
 const b=full();
 b.live.api.labels["com.docker.compose.project.config_files"]=fixture.composeFiles[0];
 assert.throws(()=>validateEffectiveConfig(b.plan,b.live,fixture),/COMPOSE_OVERRIDE_LIST_CHANGED/);
});
test("planned and running data roots must match, not merely declared expected root",()=>{
 const a=full();
 a.live.postgres.mounts[0].Source="D:/HIVE/data/postgres";
 assert.throws(()=>validateEffectiveConfig(a.plan,a.live,fixture),/LIVE_VOLUME_SOURCE_MISMATCH/);
 const b=full();
 b.live.api.mounts[1].RW=true;
 assert.throws(()=>validateEffectiveConfig(b.plan,b.live,fixture),/LIVE_VOLUME_MODE_MISMATCH/);
});
test("unexpected API and init mounts stop before any Docker mutation",()=>{
 const a=full();
 a.plan.services.api.volumes.push(volume("D:/HIVE/data","/global-data"));
 assert.throws(()=>validateEffectiveConfig(a.plan,a.live,fixture),/UNEXPECTED_API_MOUNT/);
 const b=full();
 b.plan.services["storage-init"].volumes.push(volume("D:/HIVE/data","/other"));
 assert.throws(()=>validateEffectiveConfig(b.plan,b.live,fixture),/UNEXPECTED_STORAGE_INIT_MOUNT/);
});
test("candidate timeout passthrough, build source, all four service labels and loopback are compulsory",()=>{
 const a=full();
 delete a.plan.services.api.environment.HIVE_REPOSITORY_GIT_TIMEOUT_SECONDS;
 assert.throws(()=>validateEffectiveConfig(a.plan,a.live,fixture),/CANDIDATE_GIT_TIMEOUT_NOT_WIRED/);
 const b=full();
 b.plan.services.api.build.context="D:/Projects/hive";
 assert.throws(()=>validateEffectiveConfig(b.plan,b.live,fixture),/BUILD_CONTEXT_NOT_CANDIDATE/);
 const c=full();
 c.live.redis.labels["com.docker.compose.project.working_dir"]="D:/HIVE";
 assert.throws(()=>validateEffectiveConfig(c.plan,c.live,fixture),/WORKING_DIRECTORY_DRIFT/);
 const d=full();
 d.plan.services.api.ports[0].host_ip="0.0.0.0";
 assert.throws(()=>validateEffectiveConfig(d.plan,d.live,fixture),/PLANNED_PORT_COLLISION_OR_NON_LOOPBACK/);
});
test("Docker Desktop bridge paths normalize without broad safe.directory or secret logging",()=>{
 assert.equal(hostPath("/run/desktop/mnt/host/d/Projects"),"d:/projects");
 assert.equal(hostPath("D:\\Projects"),"d:/projects");
 assert(!script.includes("Config.Env"));
 assert(!script.includes("docker compose down"));
 assert(!script.includes("reset --hard"));
 assert(script.includes('common.concat(["build","api"])'));
 assert(script.includes('common.concat(["up","-d","--no-deps","--no-build","api"])'));
});
test("backup requires independent restore and CAS manifest with digest",()=>{
 const okay={schema_version:1,compose_project:"hive-fairview-dev",data_root:fixture.dataRoot,
   postgres_restore_verified:true,postgres_restored_tables:17,cas_manifest_verified:true,
   cas_referenced_blobs:0,backup_file:"D:/private/backup.zip",backup_sha256:"a".repeat(64)};
 assert.doesNotThrow(()=>validateReceipt(okay,fixture));
 for(const bad of [
   {...okay,compose_project:"hive"},
   {...okay,data_root:"D:/HIVE/data"},
   {...okay,postgres_restore_verified:false},
   {...okay,cas_manifest_verified:false},
   {...okay,backup_sha256:"unknown"}
 ])assert.throws(()=>validateReceipt(bad,fixture));
});
test("CLI rejects deploy without known explicit args before any Docker process",()=>{
 const filename=fileURLToPath(new URL("../../scripts/local/guard-hive-compose.mjs",import.meta.url));
 const run=spawnSync(process.execPath,[filename,"--mode","recreate-api"],{encoding:"utf8"});
 assert.equal(run.status,1);
 assert.match(run.stderr,/REQUIRED_ARG_MISSING/);
 assert(!/password|token|postgresql:\/\//i.test(run.stderr));
});
