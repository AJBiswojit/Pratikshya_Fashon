/**
 * PRATIKSHYA FASHON — Kids product reconciliation audit (Phase 22.1).
 *
 * Audits all Kids media in the canonical library against the product
 * register and reports, per asset:
 *
 *   MEDIA ID · FILENAME · PATH · GROUP KEY · VIEW · EXISTING PRODUCT ·
 *   DRAFT PRODUCT · CATEGORY · SUBCATEGORY · STATUS · OWNERSHIP STATE
 *
 * Plus the summary the phase requires: media groups, single-image and
 * multi-view products, existing-product conflicts, potential same-product
 * groups, needs review, ready to publish, published, unassigned media,
 * cross-product media, duplicate ownership and invalid references.
 *
 * Fails (exit 1) unless:
 *   Cross-product media   = 0
 *   Invalid references    = 0
 *   Duplicate ownership   = 0
 *
 * Usage:
 *   npm run audit:kids-products
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import mediaRepository from "../src/services/media/mediaRepository.js";
import catalogRepository from "../src/services/catalogRepository.js";
import { buildMediaGroups } from "../src/services/media/mediaGroups.js";
import { getWorkflowMetrics } from "../src/services/productWorkflow.js";

const line = (text = "") => console.log(text);
const pad = (value, width) => String(value ?? "—").padEnd(width);

const fileName = (item) =>
  String(
    item.currentFilename ||
      item.fileName ||
      (item.url || item.thumbnail || "").split("/").pop() ||
      item.id ||
      ""
  ).toLowerCase();

const kidsNumberFrom = (file) => {
  const match = String(file || "").match(/^kids-(\d+)\.\w+$/i);
  return match ? Number(match[1]) : null;
};

const kidsMedia = mediaRepository
  .getAll()
  .filter((item) => /^kids-\d{3}\.\w+$/i.test(fileName(item)))
  .sort((a, b) => fileName(a).localeCompare(fileName(b)));

const products = catalogRepository.all();
const productById = new Map(products.map((product) => [String(product.id), product]));

const metrics = getWorkflowMetrics();

/* ------------------------------------------------------------------ */
/* Per-asset inventory                                                 */
/* ------------------------------------------------------------------ */

const ownershipState = (media, draft) => {
  const ownerId = media.productId ? String(media.productId) : null;
  const claimed = Boolean(draft?.mediaIds?.some((id) => String(id) === String(media.id)));
  if (ownerId && claimed && String(draft?.id) !== ownerId) {
    return `CONFLICT — owned by ${ownerId}, claimed by ${draft.id}`;
  }
  if (ownerId) return `OWNED by ${ownerId}`;
  if (claimed) return `CLAIMED by ${draft?.id} (no register owner)`;
  return "UNASSIGNED";
};

const rows = kidsMedia.map((media) => {
  const number = kidsNumberFrom(fileName(media));
  const draftId = number ? `KID-${String(number).padStart(3, "0")}` : null;
  const draft = draftId ? productById.get(draftId) ?? null : null;
  const owner = media.productId ? productById.get(String(media.productId)) ?? null : null;
  return {
    media,
    draft,
    owner,
    state: ownershipState(media, draft),
    crossProduct: owner ? owner.category !== "kidswear" : false,
    invalidReference: !existsSync(join(process.cwd(), "public", "library", fileName(media))),
  };
});

/* ------------------------------------------------------------------ */
/* Cross-product / duplicate-ownership / invalid references            */
/* ------------------------------------------------------------------ */

const byFile = new Map();
rows.forEach((row) => {
  const file = fileName(row.media);
  if (!byFile.has(file)) byFile.set(file, new Set());
  byFile.get(file).add(String(row.media.productId ?? ""));
});
const duplicateOwnership = [...byFile.values()].filter((owners) => owners.size > 1);

const crossProductRows = rows.filter((row) => row.crossProduct);
const invalidRows = rows.filter((row) => row.invalidReference);

const kidsGroups = buildMediaGroups(
  kidsMedia.map((item) => ({ ...item, fileName: fileName(item) }))
);

line("# KIDS PRODUCT RECONCILIATION AUDIT");
line();
line(
  pad("MEDIA ID", 24) +
    pad("FILENAME", 22) +
    pad("PATH", 26) +
    pad("GROUP KEY", 12) +
    pad("VIEW", 11) +
    pad("EXISTING", 10) +
    pad("DRAFT", 10) +
    pad("CATEGORY", 11) +
    pad("SUBCATEGORY", 26) +
    pad("STATUS", 10) +
    "OWNERSHIP"
);
rows.forEach((row) => {
  line(
    pad(row.media.id, 24) +
      pad(row.media.currentFilename || row.media.fileName || "—", 22) +
      pad(row.media.url || row.media.filePath || "—", 26) +
      pad(row.media.groupKey || "—", 12) +
      pad(row.media.view || "standalone", 11) +
      pad(row.media.productId || "—", 10) +
      pad(row.draft?.id || "—", 10) +
      pad(row.media.categoryId || row.draft?.category || "—", 11) +
      pad(row.draft?.subcategory || "—", 26) +
      pad(row.draft?.status || "—", 10) +
      row.state
  );
});

line();
line("# SUMMARY");
line();
line(`Total Kids media:                  ${metrics.kids.totalMedia}`);
line(`Total media groups:                ${metrics.kids.totalGroups}`);
line(`Single-image products:             ${metrics.kids.singleImageProducts}`);
line(`Multi-view products:               ${metrics.kids.multiViewProducts}`);
line(`Existing-product conflicts:        ${metrics.kids.existingProductConflicts}`);
line(`Potential same-product groups:     ${metrics.kids.potentialSameProductGroups}`);
line(`Needs review:                      ${metrics.kids.needsReview}`);
line(`Ready to publish:                  ${metrics.kids.readyToPublish}`);
line(`Published (KID products):          ${metrics.kids.publishedKidDrafts}`);
line(`Published (existing Kids category): ${metrics.kids.publishedProducts}`);
line(`Unassigned media:                  ${metrics.kids.unassignedMedia}`);
line(`Cross-product media:               ${crossProductRows.length}`);
crossProductRows.forEach((row) =>
  line(`  · ${fileName(row.media)} owned by ${row.media.productId} (not kidswear)`)
);
line(`Duplicate ownership:               ${duplicateOwnership.length}`);
duplicateOwnership.forEach((owners) =>
  line(`  · ${[...owners].join(", ")} share one file`)
);
line(`Invalid references:                ${invalidRows.length}`);
invalidRows.forEach((row) => line(`  · ${fileName(row.media)} missing from public/library`));

line();
line("# SAFETY (expected 0 / 0 / 0)");
line(`Cross-product media:  ${crossProductRows.length}`);
line(`Invalid references:   ${invalidRows.length}`);
line(`Duplicate ownership:  ${duplicateOwnership.length}`);

const failures = [];
if (crossProductRows.length) failures.push("cross-product media");
if (invalidRows.length) failures.push("invalid references");
if (duplicateOwnership.length) failures.push("duplicate ownership");

line();
if (failures.length) {
  line(`FAIL: ${failures.join(", ")}.`);
  process.exitCode = 1;
} else {
  line(
    "PASS: one physical product → one Product ID; no cross-product media, no invalid references, no duplicate ownership."
  );
}
