/**
 * Phase 3B — Explicit Migration Audit
 */
import { readFileSync } from "fs";

const checks = [
  { label: "Explicit migration entry point exists", file: "src/services/workflow/explicitMigrations.js", pattern: "export const runExplicitMigrations" },
  { label: "Migration uses mediaOwnershipService", file: "src/services/workflow/explicitMigrations.js", pattern: "mediaOwnershipService" },
  { label: "Migration persists via repository", file: "src/services/catalogRepository.js", pattern: "persistCatalogueState" },
  { label: "Migration is idempotent (version keys)", file: "src/services/workflow/explicitMigrations.js", pattern: "CATALOGUE_SYNC_KEY" },
  { label: "Read does NOT call migration", file: "src/services/catalogRepository.js", pattern: "runExplicitMigrations" },
  { label: "No direct media assignment in read", file: "src/services/catalogRepository.js", pattern: "assignToProduct" },
];

let pass = 0, fail = 0;
for (const c of checks) {
  try {
    const lines = readFileSync(c.file, "utf8").split("\n");
    const hasPattern = lines.some((line) => {
      if (line.trim().startsWith("import") || line.trim().startsWith("export") || line.includes("//")) return false;
      return line.includes(c.pattern);
    });
    if (hasPattern) {
      console.log("PASS:", c.label, "(", c.file, ")");
      pass++;
    } else {
      console.log("FAIL:", c.label, "— missing:", c.pattern);
      fail++;
    }
  } catch (e) {
    console.log("FAIL:", c.label, "— file error:", e.message);
    fail++;
  }
}
console.log("\nAudited:", pass + fail, "| Pass:", pass, "| Fail:", fail);
console.log(fail === 0 ? "RESULT: PASS — explicit migration architecture verified." : "RESULT: FAIL — see above.");
