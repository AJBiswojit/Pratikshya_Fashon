/**
 * PRATIKSHYA FASHON — Homepage data-flow audit (Phase 21.7 / 21.8).
 *
 * Proves that the homepage consumes the canonical taxonomy + media
 * architecture: it resolves every category/collection route from the managed
 * slugs and every plate from the central media resolver, then prints:
 *
 *   1. the HOMEPAGE MEDIA REPORT (per-section, per-item, with the actual file,
 *      media id, source classification, usage and fallback reason),
 *   2. the HOMEPAGE REDIRECTION MATRIX,
 *   3. the NO-SOURCE-MEDIA register (every surface with no relevant
 *      photography, where house artwork is the correct answer).
 *
 * Read-only. No writes, no image bytes, no React.
 *
 * Usage:
 *   node --import ./scripts/node-loader/register.mjs scripts/audit-homepage.mjs
 *   npm run audit:homepage
 */

import { auditHomepageSections } from "../src/services/media/mediaExposure.js";
import { getLiveStorefrontProducts } from "../src/data/products/index.js";
import {
  resolveCategoryCover,
  resolveCollectionCover,
  resolveProductCover,
} from "../src/services/media/mediaResolver.js";
import taxonomyRepository from "../src/services/taxonomyRepository.js";
import {
  resolveCategoryRoute,
  resolveCollectionRoute,
} from "../src/services/taxonomyRouting.js";

const line = (text = "") => console.log(text);
const pad = (value, width) => String(value ?? "—").padEnd(width);

/* ------------------------------------------------------------------ */
/* HOMEPAGE MEDIA REPORT                                               */
/* ------------------------------------------------------------------ */

const report = auditHomepageSections();

const tally = (rows) => {
  const counts = {
    REAL_LIBRARY: 0,
    PRODUCT_GALLERY: 0,
    TAXONOMY_DERIVED: 0,
    HOUSE_FALLBACK: 0,
    NO_SOURCE_MEDIA: 0,
    broken: 0,
  };
  rows.forEach((row) => {
    if (row.broken) counts.broken += 1;
    if (counts[row.source] !== undefined) counts[row.source] += 1;
  });
  return counts;
};

const printSection = (title, rows, keyOf) => {
  line(`## ${title}`);
  if (!rows.length) {
    line("(none)");
    line();
    return;
  }
  line(
    pad("Item", 28) +
      pad("Filename", 36) +
      pad("Source", 18) +
      pad("Usage", 20) +
      "Fallback reason"
  );
  rows.forEach((row) => {
    const key = keyOf ? keyOf(row) : row.name ?? row.filename;
    line(
      pad(key, 28) +
        pad(row.filename, 36) +
        pad(row.source, 18) +
        pad(row.usage, 20) +
        (row.reason ?? "—")
    );
  });
  const t = tally(rows);
  line(
    `  → REAL_LIBRARY ${t.REAL_LIBRARY} · PRODUCT_GALLERY ${t.PRODUCT_GALLERY} · ` +
      `TAXONOMY_DERIVED ${t.TAXONOMY_DERIVED} · HOUSE_FALLBACK ${t.HOUSE_FALLBACK} · ` +
      `NO_SOURCE_MEDIA ${t.NO_SOURCE_MEDIA} · broken ${t.broken}`
  );
  line();
};

line("# HOMEPAGE MEDIA REPORT");
line();
printSection("HERO", report.hero);
printSection("EDITORIAL", report.editorial);
printSection("SHOP BY CATEGORY", report.shopByCategory, (row) => `${row.group} · ${row.name}`);
printSection("COLLECTIONS", report.collections);
printSection("NEW ARRIVALS", report.newArrivals, (row) => row.name);
printSection("SALE", [report.sale]);

/* ------------------------------------------------------------------ */
/* HOMEPAGE REDIRECTION MATRIX                                         */
/* ------------------------------------------------------------------ */

const matrix = [
  ["Sarees", resolveCategoryRoute("sarees")],
  ["Lehengas", resolveCategoryRoute("lehengas")],
  ["Men's Wear", resolveCategoryRoute("menswear")],
  ["Kids Wear", resolveCategoryRoute("kidswear")],
  ["Jewellery", resolveCategoryRoute("jewellery")],
  ["Accessories (Bangles)", resolveCategoryRoute("bangles")],
  ["Collections (Festive Edit)", resolveCollectionRoute("festive-edit")],
  ["Collections (New Arrivals)", resolveCollectionRoute("new-arrivals")],
  ["Collections (Featured)", resolveCollectionRoute("featured")],
];

line("# HOMEPAGE REDIRECTION MATRIX");
line();
line(pad("Element", 30) + pad("Destination", 30) + "Status");
matrix.forEach(([label, resolved]) => {
  const ok = resolved ? resolved.href : null;
  line(pad(label, 30) + pad(ok ?? "—", 30) + (ok ? "resolved" : "UNROUTABLE"));
});
line();

/* ------------------------------------------------------------------ */
/* NO SOURCE MEDIA                                                     */
/* ------------------------------------------------------------------ */

line("# NO SOURCE MEDIA");
line();
line("Surfaces where no relevant Pratikshya photography exists — the premium");
line("house artwork is the correct answer (never a wrong image).");
line();

const noSourceCategories = taxonomyRepository
  .activeCategories()
  .filter((category) => resolveCategoryCover(category)?.reason === "NO_SOURCE_MEDIA")
  .map((category) => category.name);

const noSourceCollections = taxonomyRepository
  .activeCollections()
  .filter((collection) => resolveCollectionCover(collection)?.reason === "NO_SOURCE_MEDIA")
  .map((collection) => collection.name);

const noSourceProducts = getLiveStorefrontProducts()
  .filter((product) => resolveProductCover(product)?.reason === "NO_SOURCE_MEDIA")
  .map((product) => `${product.name} (${product.id})`);

line(`Categories:  ${noSourceCategories.length ? noSourceCategories.join(", ") : "(none)"}`);
line(`Collections: ${noSourceCollections.length ? noSourceCollections.join(", ") : "(none)"}`);
line(`Products:    ${noSourceProducts.length}`);
if (noSourceProducts.length) {
  noSourceProducts.forEach((product) => line(`  - ${product}`));
}
line();

/* ------------------------------------------------------------------ */
/* TAXONOMY SUMMARY                                                    */
/* ------------------------------------------------------------------ */

const categories = taxonomyRepository.categories();
const activeCategories = taxonomyRepository.activeCategories();
const collections = taxonomyRepository.collections();
line("# TAXONOMY");
line();
line(`Total categories: ${categories.length}`);
line(`Active categories: ${activeCategories.length}`);
line(`Archived categories: ${categories.filter((c) => c.status === "ARCHIVED").length}`);
line(`Total collections: ${collections.length}`);
line(`Active collections: ${collections.filter((c) => c.displayStatus === "ACTIVE").length}`);
line();
