// Deterministic public-repository baseline. Report categories/path ONLY, never matching bytes.
export const MAX_SCANNED_BYTES = 1500000;
export function forbiddenPath(repoPath) {
  if (typeof repoPath !== "string" || !repoPath || repoPath.startsWith("/") || repoPath.includes("\\") ||
      repoPath.split("/").some(part => !part || part === ".." || part === ".")) return "INVALID_PATH";
  const lower=repoPath.toLowerCase(),name=lower.split("/").at(-1);
  if (/^\.env(?:\..+)?$/.test(name)) return "ENV_FILE";
  if ([".npmrc",".pypirc",".netrc","id_rsa","id_ed25519","id_ecdsa","id_dsa","credentials.json","secrets.json","wallet.json","keystore.json"].includes(name)) return "CREDENTIAL_FILE";
  if (/\.(?:pem|key|p12|pfx|kdbx|tfstate|tfstate\.backup|jks)$/.test(name)) return "SECRET_OR_PRIVATE_BINARY";
  if (/^(?:\.aws\/credentials|\.ssh\/|\.kube\/config|\.docker\/config\.json)(?:$|\/)/.test(lower)) return "PRIVATE_CONFIG";
  return null;
}
export function suspiciousContent(text) {
  if (typeof text !== "string") throw new TypeError("TEXT_REQUIRED");
  const findings=[];
  const rules=[
    ["PRIVATE_KEY_HEADER", /-----BEGIN (?:OPENSSH |RSA |EC |DSA |ENCRYPTED )?PRIVATE KEY-----/],
    ["KNOWN_TOKEN_PREFIX", /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk_(?:live|test)_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|sk-proj-[A-Za-z0-9_-]{25,})\b/],
    ["AWS_ACCESS_ID", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
    ["LITERAL_SECRET_ASSIGNMENT", /\b(?:api[_-]?key|private[_-]?key|client[_-]?secret|secret|password|token)\s*[:=]\s*['"]?[A-Za-z0-9+/_=-]{28,}['"]?/i]
  ];
  for (const [category,pattern] of rules) if (pattern.test(text)) findings.push(category);
  return findings;
}
export function workflowHazards(repoPath,text) {
  if (!repoPath.startsWith(".github/workflows/") || !/\.ya?ml$/i.test(repoPath)) return [];
  const results=[];
  if (/^\s*pull_request_target\s*:/m.test(text)) results.push("PRIVILEGED_PR_TRIGGER");
  if (/^\s*workflow_run\s*:/m.test(text)) results.push("PRIVILEGED_CHAIN_TRIGGER_REQUIRES_REVIEW");
  if (/\bpermissions:\s*write-all\b/.test(text)) results.push("OVERBROAD_WORKFLOW_PERMISSIONS");
  if (/\$\{\{\s*secrets\./.test(text)) results.push("WORKFLOW_PRODUCT_SECRETS_NOT_ADMITTED");
  if (/^\s*id-token\s*:\s*write\b/m.test(text)) results.push("OIDC_PRIVILEGE_NOT_ADMITTED");
  if (/^\s*pull-requests\s*:\s*write\b/m.test(text)) results.push("PR_WRITE_NOT_ADMITTED");
  return results;
}
