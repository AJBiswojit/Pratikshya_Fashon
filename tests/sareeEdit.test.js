/**
 * Homepage Saree Edit — catalogue/taxonomy/product-media contract.
 *
 * These tests exercise the pure selector used by the React carousel. They do
 * not maintain a parallel fixture or image list: expected rows are resolved
 * from the live catalogue and canonical media register exactly as the page is.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { getLiveStorefrontProducts, productHref } from "../src/data/products/index.js";
import {
  SAREE_EDIT_PRODUCT_COUNT,
  selectSareeEditProducts,
} from "../src/services/media/mediaResolver.js";
import { getProductMediaSet } from "../src/services/media/productMediaSet.js";
import mediaRepository from "../src/services/media/mediaRepository.js";
import taxonomyRepository from "../src/services/taxonomyRepository.js";
import { resolveCategoryRoute } from "../src/services/taxonomyRouting.js";

const sourceOf = (source) => source?.src || source?.url || source?.thumbnail || "";

const localAssetExists = (source) => {
  const path = sourceOf(source).split("?")[0];
  if (!path.startsWith("/")) return Boolean(path);
  return existsSync(join(process.cwd(), "public", path.replace(/^\//, "")));
};

test("Saree Edit resolves eight active saree products through their exact product media sets", () => {
  const category = taxonomyRepository.findCategory("sarees");
  const rows = selectSareeEditProducts(getLiveStorefrontProducts());

  assert.equal(category.status, "ACTIVE");
  assert.equal(rows.length, SAREE_EDIT_PRODUCT_COUNT);

  rows.forEach((row) => {
    assert.equal(row.product.category, category.id, `${row.product.id} must be a saree`);
    assert.equal(row.product.status, "PUBLISHED", `${row.product.id} must be active/published`);
    assert.ok(row.image?.src, `${row.product.id} needs a primary image`);
    assert.equal(String(row.image.productId), String(row.product.id));

    const canonical = getProductMediaSet(row.product);
    assert.equal(row.mediaId, canonical.primary.id);
    assert.equal(sourceOf(row.image), sourceOf(canonical.primary));

    const record = row.mediaId ? mediaRepository.getById(row.mediaId) : null;
    if (record) {
      assert.equal(String(record.productId), String(row.product.id));
      if (record.categoryId) assert.equal(record.categoryId, category.id);
    }

    row.mediaSet.gallery.forEach((item) => {
      assert.equal(String(item.productId), String(row.product.id));
      const galleryRecord = item.id ? mediaRepository.getById(item.id) : null;
      if (galleryRecord?.productId) {
        assert.equal(String(galleryRecord.productId), String(row.product.id));
      }
    });
  });
});

test("Saree Edit order is deterministic, stable within a ranking tier and duplicate-free", () => {
  const first = selectSareeEditProducts();
  const second = selectSareeEditProducts();
  const ids = first.map((row) => row.product.id);
  const imageSources = first.map((row) => sourceOf(row.image).split("?")[0]);

  assert.deepEqual(second.map((row) => row.product.id), ids);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(imageSources).size, imageSources.length);
  assert.ok(!selectSareeEditProducts.toString().includes("Math.random"));

  for (let index = 1; index < first.length; index += 1) {
    const previous = first[index - 1];
    const current = first[index];
    assert.ok(previous.rankingTier <= current.rankingTier);
    if (previous.rankingTier === current.rankingTier) {
      assert.ok(String(previous.product.id).localeCompare(String(current.product.id)) < 0);
    }
  }
});

test("Saree Edit images exist and product/category links use canonical routing helpers", () => {
  const rows = selectSareeEditProducts();
  const categoryRoute = resolveCategoryRoute("sarees");

  assert.equal(categoryRoute?.href, "/category/sarees");
  rows.forEach((row) => {
    assert.ok(localAssetExists(row.image), `${row.filename} must exist`);
    assert.equal(row.route, productHref(row.product));
    assert.match(row.route, /^\/product\/[a-z0-9-]+$/);
  });
});

test("Saree Edit component contains no hardcoded image URL or image filename list", () => {
  const source = readFileSync(
    join(process.cwd(), "src/components/storefront/SareeEditCarousel.jsx"),
    "utf8"
  );

  assert.doesNotMatch(source, /(?:src|image)\s*=\s*["'](?:https?:|\/(?:images|library)\/)/);
  assert.doesNotMatch(source, /women-saree-[a-z0-9-]+\.(?:webp|jpe?g|png)/i);
  assert.match(source, /useSareeEditProducts\(\)/);
  assert.match(source, /resolveCategoryRoute\("sarees"\)/);
  assert.match(source, /SAREE_EDIT_AUTOPLAY_MS\s*=\s*2500/);
  assert.match(source, /sareeEditFrom(?:Left|Right)_650ms/);
  assert.match(source, /prefers-reduced-motion:\s*reduce/);
  assert.match(source, /loading="lazy"/);
});
