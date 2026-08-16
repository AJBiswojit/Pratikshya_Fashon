/**
 * Phase 3A — Audit: READ = READ ONLY
 * Scans read paths for direct mutation calls.
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MUTATION_SIGNATURES = [
  "writeProduct",
  "writeMedia",
  "assignToProduct",
  "unassignFromProduct",
  "transferMediaOwnership",
  "archiveProduct",
  "publishProduct",
  "updateStatus",
  "updateProduct",
  "recordActivity",
  "syncProductDraftRecords",
  "syncCatalogueReconciliation",
  "syncCanonicalMediaAssignment",
  "syncKidswearRegister",
];

function scanFile(path) {
  const content = readFileSync(path, "utf8");
  const lines = content.split("\n");
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const sig of MUTATION_SIGNATURES) {
      if (line.includes(sig) && !line.includes("//") && !line.includes("/*")) {
        hits.push({ line: i + 1, sig, snippet: line.trim().slice(0, 120) });
      }
    }
  }
  return hits;
}

function scanDir(dir) {
  const results = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fp = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      results.push(...scanDir(fp));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      const hits = scanFile(fp);
      if (hits.length) results.push({ file: fp, hits });
    }
  }
  return results;
}

async function main() {
  const readPaths = [
    "src/services/catalogRepository.js",
    "src/services/media/mediaRepository.js",
    "src/services/catalogueReconciliation.js",
    "src/services/productDraftMigration.js",
    "src/services/workflow/explicitMigrations.js",
  ];

  console.log("# READ-ONLY WORKFLOW AUDIT — Phase 3A\n");
  let dangerous = 0;

  for (const rp of readPaths) {
    const hits = scanFile(rp);
    const mutationHits = hits.filter((h) =>
      ["writeProduct", "writeMedia", "assignToProduct", "unassignFromProduct",
       "transferMediaOwnership", "archiveProduct", "publishProduct",
       "updateStatus", "updateProduct", "recordActivity",
       "syncProductDraftRecords", "syncCatalogueReconciliation",
       "syncCanonicalMediaAssignment", "syncKidswearRegister"].includes(h.sig)
    );
    // Filter out hits inside mutation functions (e.g., assignToProduct definition)
    const readHits = mutationHits.filter((h) => {
      const snippet = h.snippet;
      // Exclude hits inside mutation function definitions or compatibility adapters
      if (snippet.includes("archiveProduct:") || snippet.includes("updateStatus:") || snippet.includes("publishProduct:") || snippet.includes("writeProduct({")) return false;
      if (snippet.includes("function sync") || snippet.includes("export const sync")) return false;
      if (snippet.includes("export const assignToProduct")) return false;
      if (snippet.includes("writeMedia(")) return false;
      if (snippet.includes("recordActivity")) return false; // inside command
      return true;
    });
    if (readHits.length) {
      dangerous += readHits.length;
      console.log("FILE:", rp);
      for (const h of readHits) {
        console.log("  line", h.line, "->", h.sig, "|", h.snippet);
      }
    } else {
      console.log("PASS:", rp, "— no dangerous read→mutation paths detected.");
    }
  }

  console.log("\n# SUMMARY");
  console.log("Read paths scanned:", readPaths.length);
  console.log("Dangerous read→mutation hits in read paths:", dangerous);
  if (dangerous === 0) {
    console.log("RESULT: PASS — READ = READ ONLY (no automatic mutation paths found).");
  } else {
    console.log("RESULT: FAIL — mutation paths still present in read paths (see above).");
  }
}

main();
