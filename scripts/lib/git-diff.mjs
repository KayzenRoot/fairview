// Git --name-status -z parser shared by CI evidence and affected-test selection.
// Deletions and both paths of renames/copies must be included or tests may be skipped.
export function parseGitDiffNameStatusZ(output) {
  if (typeof output !== "string") throw TypeError("GIT_DIFF_TEXT_REQUIRED");
  if (!output) return [];
  if (!output.endsWith("\0")) throw Error("TRUNCATED_GIT_DIFF");
  const tokens=output.slice(0,-1).split("\0"),paths=new Set();
  for(let i=0;i<tokens.length;){
    const status=tokens[i++];
    if(!/^(?:[ACDMRT]|R\d{1,3}|C\d{1,3})$/.test(status)) throw Error("UNSUPPORTED_GIT_CHANGE_STATUS: "+status);
    const oldOrSingle=tokens[i++];
    if(!oldOrSingle)throw Error("MISSING_GIT_PATH");
    paths.add(oldOrSingle);
    if(status.startsWith("R")||status.startsWith("C")){
      const newPath=tokens[i++];
      if(!newPath)throw Error("MISSING_RENAMED_GIT_PATH");
      paths.add(newPath);
    }
  }
  return [...paths];
}
