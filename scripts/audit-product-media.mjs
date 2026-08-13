/**
 * PRATIKSHYA FASHON — Product media consistency audit (Phase 21.9).
 *
 * Reports, for every live storefront product:
 *
 *   PRODUCT ID
 *   PRODUCT NAME
 *   PRIMARY
 *   HOVER
 *   ALTERNATES
 *   GROUP KEY
 *   SOURCE
 *   PRODUCT MATCH
 *   STATUS
 *
 * Fails (exit 1) if any product card can resolve an image that belongs
 * to another product.
 *
 * Usage:
 *   node --import ./scripts/node-loader/register.mjs scripts/audit-product-media.mjs
 *   npm run audit:product-media
 */

import { getLiveStorefrontProducts } from "../src/data/products/index.js";
import {
  getProductMediaSet,
  PRODUCT_MEDIA_STATUS,
} from "../src/services/media/productMediaSet.js";
import mediaRepository from "../src/services/media/mediaRepository.js";

const line = (text = "") => console.log(text);
const pad = (value, width) => String(value ?? "—").padEnd(width);

const fileOf = (source) => {
  if (!source) return "—";
  return (
    source.fileName ||
    source.currentFilename ||
    (source.src || source.url || "").split("/").pop() ||
    source.id ||
    "—"
  );
};

const viewsOf = (set) =>
  ["front", "side", "back", "detail"]
    .filter((view) => set[view])
    .join(",") || (set.hasAlternate ? "gallery" : "—");

const products = getLiveStorefrontProducts();
const rows = products.map((product) => {
  const set = getProductMediaSet(product);
  const primaryFile = fileOf(set.primary);
  const hoverFile = set.hasAlternate ? fileOf(set.hover) : "same";
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    primary: primaryFile,
    hover: hoverFile,
    alternates: viewsOf(set),
    groupKey: set.groupKey || "—",
    source: set.source,
    match: set.match,
    status: set.status,
    set,
  };
});

const counts = {
  OK: 0,
  NO_ALTERNATE: 0,
  NEEDS_REVIEW: 0,
  CROSS_PRODUCT_REFERENCE: 0,
};
rows.forEach((row) => {
  if (counts[row.status] !== undefined) counts[row.status] += 1;
});

const crossings = [];
rows.forEach((row) => {
  row.set.gallery.forEach((item) => {
    if (item.productId && String(item.productId) !== String(row.id)) {
      crossings.push({
        productId: row.id,
        name: row.name,
        file: fileOf(item),
        owner: item.productId,
      });
    }
    const record = item.id ? mediaRepository.getById(item.id) : null;
    if (record?.productId && String(record.productId) !== String(row.id)) {
      crossings.push({
        productId: row.id,
        name: row.name,
        file: fileOf(item),
        owner: record.productId,
      });
    }
  });
  if (row.set.hasAlternate && row.set.hover?.productId && String(row.set.hover.productId) !== String(row.id)) {
    crossings.push({
      productId: row.id,
      name: row.name,
      file: fileOf(row.set.hover),
      owner: row.set.hover.productId,
    });
  }
});

line("# PRODUCT MEDIA CONSISTENCY AUDIT");
line();
line(
  pad("ID", 10) +
    pad("NAME", 36) +
    pad("PRIMARY", 42) +
    pad("HOVER", 42) +
    pad("ALT", 16) +
    pad("SOURCE", 10) +
    pad("MATCH", 10) +
    "STATUS"
);

rows.forEach((row) => {
  line(
    pad(row.id, 10) +
      pad(row.name, 36) +
      pad(row.primary, 42) +
      pad(row.hover, 42) +
      pad(row.alternates, 16) +
      pad(row.source, 10) +
      pad(row.match, 10) +
      row.status
  );
});

line();
line(
  `  → ${rows.length} products · OK ${counts.OK} · NO_ALTERNATE ${counts.NO_ALTERNATE} · ` +
    `NEEDS_REVIEW ${counts.NEEDS_REVIEW} · CROSS_PRODUCT_REFERENCE ${counts.CROSS_PRODUCT_REFERENCE}`
);
line();

if (crossings.length) {
  line("# CROSS PRODUCT REFERENCES");
  line();
  crossings.forEach((entry) => {
    line(`  ${entry.productId} (${entry.name}) → ${entry.file} belongs to ${entry.owner}`);
  });
  line();
  line("FAIL: a product card can resolve an image belonging to another product.");
  process.exitCode = 1;
} else if (counts.CROSS_PRODUCT_REFERENCE > 0) {
  line("FAIL: CROSS_PRODUCT_REFERENCE status present.");
  process.exitCode = 1;
} else {
  line("PASS: every product card primary and hover belongs to that product.");
}
