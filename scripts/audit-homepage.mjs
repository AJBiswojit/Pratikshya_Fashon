/**
 * PRATIKSHYA FASHON — Homepage data-flow audit (Phase 21.7).
 *
 * Proves that the homepage consumes the canonical taxonomy + media
 * architecture: it resolves every category/collection route from the managed
 * slugs and every plate from the central media resolver, then prints the
 * HOMEPAGE MEDIA REPORT and the HOMEPAGE REDIRECTION MATRIX.
 *
 * Read-only. No writes, no image bytes, no React.
 *
 * Usage:
 *   node --import ./scripts/node-loader/register.mjs scripts/audit-homepage.mjs
 */

import { auditHomepageSections } from "../src/services/media/mediaExposure.js";
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

const summarise = (rows) => {
  const library = rows.filter((row) => row.library && !row.broken).length;
  const fallback = rows.filter((row) => row.fallback).length;
  const broken = rows.filter((row) => row.broken).length;
  const mapped = rows.filter((row) => row.mapped).length;
  return { library, fallback, broken, mapped };
};

const printSection = (title, rows, keyOf) => {
  line(`## ${title}`);
  if (!rows.length) {
    line("(none)");
    line();
    return;
  }
  rows.forEach((row) => {
    const key = keyOf ? keyOf(row) : row.name ?? row.filename;
    line(`- ${pad(key, 26)} ${pad(row.filename, 34)} ${pad(row.usage, 22)} ${pad(row.mapped ? "mapped" : "unmapped", 10)} ${pad(row.broken ? "broken" : row.library ? "library" : "fallback", 10)} ${pad(row.scope, 12)}`);
  });
  const s = summarise(rows);
  line(`  → library ${s.library} · fallback ${s.fallback} · broken ${s.broken} · mapped ${s.mapped}`);
  line();
};

line("# HOMEPAGE MEDIA REPORT");
line();
line("Section · Asset · File · Usage · Mapped/Unmapped · Library/Fallback · Scope");
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
