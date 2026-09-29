// Pure, deterministic changed-file impact graph. No I/O, network or LLM.
export function validateRegistry(registry) {
  if (registry.schema_version !== 1 || !Array.isArray(registry.modules)) throw Error("INVALID_REGISTRY_SCHEMA");
  const ids = new Set();
  for (const module of registry.modules) {
    if (!/^[a-z][a-z0-9-]*$/.test(module.id) || ids.has(module.id)) throw Error("INVALID_OR_DUPLICATE_MODULE_ID");
    ids.add(module.id);
    if (!["active","planned"].includes(module.state) || !Array.isArray(module.paths) || !module.paths.length ||
        !Array.isArray(module.tests) || !Array.isArray(module.depends_on)) throw Error("INVALID_MODULE");
    if (module.state === "active" && !module.tests.length) throw Error("ACTIVE_MODULE_MISSING_TESTS");
  }
  for (const m of registry.modules) for (const dep of m.depends_on) if (!ids.has(dep) || dep === m.id) throw Error("INVALID_DEPENDENCY");
  const visiting = new Set(), seen = new Set(), byId = new Map(registry.modules.map(m=>[m.id,m]));
  const visit = id => {
    if (visiting.has(id)) throw Error("CYCLIC_DEPENDENCY");
    if (seen.has(id)) return;
    visiting.add(id); for (const d of byId.get(id).depends_on) visit(d);
    visiting.delete(id); seen.add(id);
  };
  for (const id of ids) visit(id);
  for (const mod of registry.modules) if (mod.state === "active") {
    for (const dep of mod.depends_on) if (byId.get(dep).state !== "active") {
      throw Error("ACTIVE_DEPENDENCY_NOT_ACTIVE " + mod.id + " " + dep);
    }
  }
  return registry;
}
export function calculateImpact(registry, paths) {
  validateRegistry(registry);
  if (!Array.isArray(paths)) throw Error("INVALID_CHANGED_PATHS");
  const touched = new Set(), directOwners = new Set(), unknown = [], high = new Set(registry.high_impact ?? []);
  let full = false;
  for (const path of paths) {
    if (typeof path !== "string" || !path || path.startsWith("/") || path.includes("\\") || path.split("/").includes("..")) {
      unknown.push(String(path)); continue;
    }
    if ([...high].some(prefix => prefix.endsWith('/') ? path.startsWith(prefix) : path === prefix)) full = true;
    let matched = false;
    for (const mod of registry.modules) if (mod.paths.some(prefix=> prefix.endsWith("/") ? path.startsWith(prefix) : path===prefix)) {
      touched.add(mod.id); directOwners.add(mod.id); matched = true;
    }
    if (!matched) unknown.push(path);
  }
  if (unknown.length) full = true;
  if (full) for (const mod of registry.modules) if (mod.state==="active") touched.add(mod.id);
  const reverse = new Map(registry.modules.map(m=>[m.id,[]]));
  for (const mod of registry.modules) for (const parent of mod.depends_on) reverse.get(parent).push(mod.id);
  const queue=[...touched];
  while(queue.length){ const id=queue.shift();for(const dependent of reverse.get(id)){if(!touched.has(dependent)){touched.add(dependent);queue.push(dependent)}} }
  const planned=registry.modules.filter(m=>touched.has(m.id)&&m.state!=="active").map(m=>m.id);
  const active=registry.modules.filter(m=>touched.has(m.id)&&m.state==="active").map(m=>m.id);
  const direct_active=registry.modules.filter(m=>directOwners.has(m.id)&&m.state==="active").map(m=>m.id);
  const direct_planned=registry.modules.filter(m=>directOwners.has(m.id)&&m.state==="planned").map(m=>m.id);
  return {active,planned,direct_active,direct_planned,unknown,full,changed_files:paths};
}
