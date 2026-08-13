/**
 * PRATIKSHYA FASHON — Homepage data-flow audit (Phase 21.7 / 21.8 / 21.10).
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

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { auditHomepageSections } from "../src/services/media/mediaExposure.js";
import { getLiveStorefrontProducts, productHref } from "../src/data/products/index.js";
import {
  resolveCategoryCover,
  resolveCollectionCover,
  resolveProductCover,
  selectSareeEditProducts,
} from "../src/services/media/mediaResolver.js";
import mediaRepository from "../src/services/media/mediaRepository.js";
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
/* SAREE EDIT — product/media ownership                                */
/* ------------------------------------------------------------------ */

const sareeEdit = selectSareeEditProducts();
const sourceOf = (entry) => entry?.src || entry?.url || entry?.thumbnail || "";
const localFileExists = (source) => {
  const value = sourceOf(source).split("?")[0];
  if (!value || !value.startsWith("/")) return Boolean(value);
  return existsSync(join(process.cwd(), "public", value.replace(/^\//, "")));
};

const duplicateProducts = sareeEdit.length - new Set(sareeEdit.map((row) => row.product.id)).size;
const duplicateImages = sareeEdit.length - new Set(sareeEdit.map((row) => sourceOf(row.image).split("?")[0])).size;
const crossProduct = [];
const brokenImages = [];
const invalidRoutes = [];
const invalidProducts = [];
const unrelatedMedia = [];
const genericEditorial = [];

sareeEdit.forEach((row) => {
  if (row.product.category !== "sarees" || row.product.status !== "PUBLISHED") {
    invalidProducts.push(row.product.id);
  }
  if (row.route !== productHref(row.product)) invalidRoutes.push(row.product.id);
  if (!localFileExists(row.image)) brokenImages.push(row.product.id);

  const primaryRecord = row.mediaId ? mediaRepository.getById(row.mediaId) : null;
  if (primaryRecord?.categoryId && primaryRecord.categoryId !== row.product.category) {
    unrelatedMedia.push(row.product.id);
  }
  if (
    row.image?.purpose ||
    String(primaryRecord?.source || "").toLowerCase().includes("house") ||
    (primaryRecord?.tags || []).includes("house")
  ) {
    genericEditorial.push(row.product.id);
  }

  row.mediaSet.gallery.forEach((item) => {
    const record = item.id ? mediaRepository.getById(item.id) : null;
    if (String(item.productId) !== String(row.product.id)) {
      crossProduct.push(`${row.product.id}:${item.id || sourceOf(item)}`);
    }
    if (record?.productId && String(record.productId) !== String(row.product.id)) {
      crossProduct.push(`${row.product.id}:${record.id}`);
    }
  });
});

const sareeEditComponent = readFileSync(
  join(process.cwd(), "src/components/storefront/SareeEditCarousel.jsx"),
  "utf8"
);
const hardcodedImagePattern = /(?:src|image)\s*=\s*["'](?:https?:|\/(?:images|library)\/)/g;
const hardcodedImages = sareeEditComponent.match(hardcodedImagePattern)?.length ?? 0;

line("## SAREE EDIT");
if (!sareeEdit.length) {
  line("(none)");
} else {
  line(
    pad("Order", 8) +
      pad("Product ID", 12) +
      pad("Product name", 39) +
      pad("Image filename", 43) +
      pad("Media ID", 24) +
      pad("Fallback source", 27) +
      "Route"
  );
  sareeEdit.forEach((row, index) => {
    line(
      pad(index + 1, 8) +
        pad(row.product.id, 12) +
        pad(row.product.name, 39) +
        pad(row.filename, 43) +
        pad(row.mediaId, 24) +
        pad(row.fallbackSource, 27) +
        row.route
    );
  });
}
line();
line(`Products: ${sareeEdit.length}`);
line(`Product IDs: ${sareeEdit.map((row) => row.product.id).join(", ") || "(none)"}`);
line(`Valid media: ${sareeEdit.length - brokenImages.length}`);
line(`Cross-product images: ${crossProduct.length}`);
line(`Duplicate products: ${duplicateProducts}`);
line(`Duplicate images: ${duplicateImages}`);
line(`Broken images: ${brokenImages.length}`);
line(`Hardcoded images: ${hardcodedImages}`);
line(`Generic editorial images: ${genericEditorial.length}`);
line(`Unrelated category images: ${unrelatedMedia.length}`);
line(`Invalid products: ${invalidProducts.length}`);
line(`Invalid routes: ${invalidRoutes.length}`);
line();

if (
  !sareeEdit.length ||
  duplicateProducts ||
  duplicateImages ||
  crossProduct.length ||
  brokenImages.length ||
  hardcodedImages ||
  genericEditorial.length ||
  unrelatedMedia.length ||
  invalidProducts.length ||
  invalidRoutes.length
) {
  process.exitCode = 1;
}

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
