/**
 * PRATIKSHYA FASHON — Product access layer.
 *
 * Normalises the authored catalogue into the single record shape the whole
 * storefront reads, and exposes the lookups pages need. Everything derived
 * is computed once, at module load, so no component ever transforms product
 * data while rendering.
 *
 * The normalised record is a superset of what the Phase 2 `ProductCard`
 * expects (`name`, `category`, `price`, `originalPrice`, `label`, `image`,
 * `hoverImage`, `inStock`), which is why the card needs no changes to
 * display a catalogue product.
 */

import { imageRef } from "../pratikshyaImageManifest";
import catalogue from "./catalogue";
import {
  getCareInstructions,
  getDeliveryInfo,
  getGalleryImageIds,
  getProductDescription,
  getProductDetails,
  getProductSpecifications,
  getReturnInfo,
} from "./details";
import { categoryLabels, getCategory } from "./taxonomy";

/** `Sambalpuri Pato Silk Saree` → `sambalpuri-pato-silk-saree` */
export const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Reduces a string to lower-case words separated by single spaces.
 *
 * Both the searchable haystack and the shopper's term go through this, so
 * apostrophes, ampersands and punctuation can never cause a miss.
 */
export const normaliseSearchText = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Percentage saved, rounded, or null when the piece is not discounted. */
const percentOff = (price, originalPrice) =>
  typeof originalPrice === "number" && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

/**
 * The free-text haystack search matches against.
 *
 * Built once per product and lower-cased, so a keystroke costs one
 * `includes` per record rather than a fresh join.
 */
const buildTags = (product) =>
  [
    product.name,
    product.subcategory,
    categoryLabels[product.category] ?? product.category,
    product.gender,
    product.collection,
    product.fabric,
    product.material,
    ...(product.occasion ?? []),
    ...(product.colors ?? []),
    ...(product.badges ?? []),
  ].filter(Boolean);

/**
 * Availability drives two things the card already understands — whether the
 * piece can be bought now, and what the plate says when it cannot.
 */
const availabilityLabels = {
  "in-stock": "In Stock",
  "low-stock": "Only a Few Left",
  "made-to-order": "Available for Order",
  unavailable: "Currently Unavailable",
};

const normalise = (product, index) => {
  const slug = slugify(product.name);
  const id = `pf-${String(index + 1).padStart(3, "0")}`;
  const sku = product.sku ?? `PF-${product.category.slice(0, 4).toUpperCase()}-${String(index + 1).padStart(3, "0")}`;
  const discount = percentOff(product.price, product.originalPrice);
  const tags = buildTags(product);
  const badges = product.badges ?? [];
  const galleryIds = [
    product.image,
    product.hoverImage,
    ...(product.additionalImages ?? []),
    ...getGalleryImageIds(product),
  ].filter(Boolean);
  const images = [...new Set(galleryIds)].slice(0, 5).map(imageRef);

  return {
    /* Identity */
    id,
    slug,
    sku,
    name: product.name,

    /* Placement */
    category: product.category,
    categoryLabel: categoryLabels[product.category] ?? product.category,
    subcategory: product.subcategory,
    gender: product.gender,
    collection: product.collection,

    /* Price */
    price: product.price,
    originalPrice: product.originalPrice ?? null,
    discount,
    currency: "INR",

    /* Imagery — manifest refs, never raw URLs. */
    image: imageRef(product.image),
    hoverImage: product.hoverImage ? imageRef(product.hoverImage) : undefined,
    images,

    /* Attributes and variants */
    colors: product.colors ?? [],
    unavailableColors: product.unavailableColors ?? [],
    sizes: product.sizes ?? [],
    unavailableSizes: product.unavailableSizes ?? [],
    fabric: product.fabric,
    material: product.material,
    occasion: product.occasion ?? [],

    /* Reception */
    rating: product.rating ?? 0,
    reviewCount: product.reviewCount ?? 0,

    /* Inventory */
    availability: product.availability ?? "in-stock",
    availabilityLabel: availabilityLabels[product.availability ?? "in-stock"],
    stock: product.stock ?? 0,
    inStock: product.availability !== "unavailable",

    /* Product story — authored values win over category-aware defaults. */
    description: getProductDescription(product),
    details: getProductDetails(product),
    careInstructions: getCareInstructions(product),
    specifications: getProductSpecifications(product, sku),
    deliveryInfo: getDeliveryInfo(product),
    returnInfo: getReturnInfo(product),

    /* Merchandising */
    badges,
    /** `ProductCard` reads a single `label`; the first badge is the one shown. */
    label: badges[0] ?? null,
    isFeatured: Boolean(product.isFeatured),
    isNew: Boolean(product.isNew),
    isBestseller: Boolean(product.isBestseller),

    /**
     * Recommendation weight. A deterministic blend of rating, review volume
     * and merchandising flags — this is the "Recommended" sort order, and the
     * hook a future recommendation service would replace.
     */
    score:
      (product.rating ?? 0) * 20 +
      Math.min(product.reviewCount ?? 0, 300) / 10 +
      (product.isFeatured ? 25 : 0) +
      (product.isBestseller ? 15 : 0) +
      (product.isNew ? 8 : 0),

    /**
     * Recency proxy. The catalogue is authored oldest-first, so a later index
     * is a newer piece; flagged arrivals are pushed to the front of `newest`.
     */
    addedOrder: index + (product.isNew ? 1000 : 0),

    /* Search */
    tags,
    searchText: normaliseSearchText(tags.join(" ")),
  };
};

/** Every product in the catalogue, normalised. */
export const products = catalogue.map(normalise);

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

const bySlug = new Map(products.map((product) => [product.slug, product]));
const byId = new Map(products.map((product) => [product.id, product]));

export const getProductBySlug = (slug) => bySlug.get(slug) ?? null;
export const getProductById = (id) => byId.get(id) ?? null;
export const getProductByIdentifier = (value) => bySlug.get(value) ?? byId.get(value) ?? null;

/** Canonical URL for the reusable product-detail route. */
export const productHref = (product) => `/product/${product.slug}`;

/* ------------------------------------------------------------------ */
/* Derived vocabularies                                                */
/* ------------------------------------------------------------------ */

/**
 * The distinct values actually present in the catalogue, for the facets whose
 * options are inventory-driven rather than declared. Reading these from the
 * data means the filter panel can never offer a value that matches nothing.
 */
const distinct = (field, { multiple = false } = {}) => {
  const seen = new Set();
  products.forEach((product) => {
    const value = product[field];
    if (multiple) (value ?? []).forEach((entry) => seen.add(entry));
    else if (value) seen.add(value);
  });
  return [...seen];
};

export const catalogueValues = {
  subcategory: distinct("subcategory").sort((a, b) => a.localeCompare(b)),
  fabric: distinct("fabric").sort((a, b) => a.localeCompare(b)),
  material: distinct("material").sort((a, b) => a.localeCompare(b)),
  occasion: distinct("occasion", { multiple: true }),
  color: distinct("colors", { multiple: true }),
  size: distinct("sizes", { multiple: true }),
  collection: distinct("collection").sort((a, b) => a.localeCompare(b)),
};

/** Subcategories grouped by the category they belong to. */
export const subcategoriesByCategory = products.reduce((map, product) => {
  const list = map[product.category] ?? (map[product.category] = []);
  if (!list.includes(product.subcategory)) list.push(product.subcategory);
  return map;
}, {});

/** How many products sit in each category — used by the shop shortcuts. */
export const categoryCounts = products.reduce((counts, product) => {
  counts[product.category] = (counts[product.category] ?? 0) + 1;
  return counts;
}, {});

export { categoryLabels, getCategory };

export default products;
