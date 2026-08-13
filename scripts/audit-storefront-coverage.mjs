/**
 * PRATIKSHYA FASHON — Storefront coverage audit (Phase 23).
 *
 * For every ACTIVE category, compares the EXPECTED PUBLISHED PRODUCT IDS
 * (the canonical catalogue filtered by status = PUBLISHED and canonical
 * taxonomy) against the ACTUAL category-page PRODUCT IDS (what the listing
 * derives through the shared catalogue query).
 *
 * The audit fails when any of these is detected:
 *   · a published product missing from its category page
 *   · a duplicate Product ID on a category page
 *   · a product shown under the wrong category
 *   · a cross-category product (a product whose own category differs from
 *     the page it appears on)
 *
 * Expected: Missing = 0, Duplicates = 0, Wrong category = 0.
 *
 * Usage:
 *   npm run audit:storefront-coverage
 */

import catalogRepository from "../src/services/catalogRepository.js";
import taxonomyRepository from "../src/services/taxonomyRepository.js";
import { queryCatalogue } from "../src/data/products/query.js";

const line = (text = "") => console.log(text);
const pad = (value, width) => String(value ?? "—").padEnd(width);

const products = catalogRepository.all();
const published = products.filter((product) => product.status === "PUBLISHED");
const categories = taxonomyRepository.activeCategories();

const failures = [];
const rows = [];

categories.forEach((category) => {
  const expected = published
    .filter((product) => product.category === category.id)
    .map((product) => String(product.id))
    .sort();

  const actual = queryCatalogue({ scopeFilters: { category: category.id } }).results
    .map((product) => String(product.id))
    .sort();

  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);

  const missing = expected.filter((id) => !actualSet.has(id));
  const wrongCategory = actual.filter((id) => {
    const product = products.find((entry) => String(entry.id) === id);
    return !product || product.category !== category.id;
  });
  const duplicates = actual.filter((id, index) => actual.indexOf(id) !== index);

  rows.push({
    category: category.id,
    expectedCount: expected.length,
    actualCount: actual.length,
    missing,
    wrongCategory,
    duplicates,
  });

  if (missing.length) failures.push(`${category.id}: ${missing.length} missing`);
  if (wrongCategory.length) failures.push(`${category.id}: ${wrongCategory.length} wrong category`);
  if (duplicates.length) failures.push(`${category.id}: ${duplicates.length} duplicate IDs`);
});

line("# STOREFRONT COVERAGE AUDIT");
line();
line(
  pad("CATEGORY", 18) +
    pad("EXPECTED", 10) +
    pad("ACTUAL", 10) +
    pad("MISSING", 9) +
    pad("WRONG", 8) +
    pad("DUPES", 7)
);
rows.forEach((row) => {
  line(
    pad(row.category, 18) +
      pad(row.expectedCount, 10) +
      pad(row.actualCount, 10) +
      pad(row.missing.length, 9) +
      pad(row.wrongCategory.length, 8) +
      pad(row.duplicates.length, 7)
  );
  row.missing.forEach((id) => line(`    · missing ${id}`));
  row.wrongCategory.forEach((id) => line(`    · wrong category ${id}`));
  row.duplicates.forEach((id) => line(`    · duplicate ${id}`));
});

line();
line("# TOTALS");
line();
const totalMissing = rows.reduce((sum, row) => sum + row.missing.length, 0);
const totalWrong = rows.reduce((sum, row) => sum + row.wrongCategory.length, 0);
const totalDuplicates = rows.reduce((sum, row) => sum + row.duplicates.length, 0);
line(`Missing published products:  ${totalMissing}`);
line(`Wrong-category products:     ${totalWrong}`);
line(`Duplicate Product IDs:       ${totalDuplicates}`);

line();
if (failures.length) {
  line(`FAIL: ${failures.join("; ")}.`);
  process.exitCode = 1;
} else {
  line(
    "PASS: Missing = 0, Wrong category = 0, Duplicates = 0. " +
      "Every published product appears on its correct category page."
  );
}
