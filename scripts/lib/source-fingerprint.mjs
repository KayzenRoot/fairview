import crypto from "node:crypto";
// Canonical fingerprints are cross-platform, independent of autocrlf, output EOL and source enumeration.
export function normalizeCanonicalText(value) {
  if (typeof value !== "string") throw TypeError("CANONICAL_TEXT_REQUIRED");
  return value.replace(/\r\n?/g,"\n");
}
export function sourcepackFingerprint(entries) {
  if (!Array.isArray(entries)) throw TypeError("ENTRIES_REQUIRED");
  const hash=crypto.createHash("sha256"),names=new Set();
  for (const [name,body] of [...entries].sort((a,b)=>a[0].localeCompare(b[0],"en"))) {
    if(typeof name!=="string"||names.has(name))throw Error("DUPLICATE_OR_INVALID_CANONICAL_PATH");
    names.add(name);hash.update(name+"\0","utf8");hash.update(normalizeCanonicalText(body),"utf8");hash.update("\0");
  }
  return hash.digest("hex");
}
