/**
 * PRATIKSHYA FASHON — Catalogue taxonomy.
 *
 * The vocabulary the storefront is built from: what a product can be, how
 * those values are labelled and ordered in the interface, and which filter
 * every route applies.
 *
 * Nothing in here is presentational. Pages read this file so that adding a
 * fabric, an occasion or a whole category is a data change, never a UI one.
 */

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

/**
 * The shelf a piece physically belongs to. One value per product.
 *
 * `image` is a manifest id, used by the category shortcuts on the shop page,
 * so the taxonomy carries its own imagery rather than the page hard-coding it.
 */
export const categories = [
  {
    id: "sarees",
    label: "Sarees",
    eyebrow: "Six Yards",
    description: "Handloom, silk and pato sarees woven across Odisha and Banaras.",
    image: "saree-silk",
  },
  {
    id: "lehengas",
    label: "Lehengas",
    eyebrow: "The Ceremony",
    description: "Bridal, festive and designer lehengas cut for the long celebration.",
    image: "lehenga-bridal",
  },
  {
    id: "bridal-couture",
    label: "Bridal Couture",
    eyebrow: "The Trousseau",
    description: "Reception gowns, sangeet sets and trousseau pieces made to order.",
    image: "women-bridal-wear",
  },
  {
    id: "kurtis-and-suits",
    label: "Kurtis + Suits",
    eyebrow: "Everyday",
    description: "Quiet daily ethnic wear in cotton, linen and light silk.",
    image: "women-contemporary",
  },
  {
    id: "innerwear",
    label: "Innerwear",
    eyebrow: "The Foundation",
    description: "Petticoats, blouses and shapewear finished to the same standard.",
    image: "fabric-cotton",
  },
  {
    id: "dupattas",
    label: "Dupattas + Stoles",
    eyebrow: "The Drape",
    description: "Woven and embroidered drapes that finish a look.",
    image: "accessory-dupattas",
  },
  {
    id: "bangles",
    label: "Bangles",
    eyebrow: "The Stack",
    description: "Bridal sets, gold-finish bangles, kada and cuffs.",
    image: "bridal-bangles",
  },
  {
    id: "jewellery",
    label: "Jewellery",
    eyebrow: "Adornment",
    description: "Temple, kundan and polki pieces for the whole ceremony.",
    image: "bridal-jewellery",
  },
  {
    id: "menswear",
    label: "Men",
    eyebrow: "The Groom",
    description: "Kurta, sherwani and Nehru jackets tailored in-house.",
    image: "men-sherwani",
  },
  {
    id: "kidswear",
    label: "Kids",
    eyebrow: "Little Heirlooms",
    description: "Festive sets for children, made in the same cloth as the grown-ups'.",
    image: "kids-festive-wear",
  },
];

export const categoryLabels = Object.fromEntries(
  categories.map((category) => [category.id, category.label])
);

export const getCategory = (id) => categories.find((category) => category.id === id) ?? null;

/* ------------------------------------------------------------------ */
/* Facet vocabularies                                                  */
/* ------------------------------------------------------------------ */

export const genders = ["Women", "Men", "Kids", "Unisex"];

export const fabrics = [
  "Pato Silk",
  "Mulberry Silk",
  "Tussar Silk",
  "Banarasi Silk",
  "Katan Silk",
  "Cotton",
  "Cotton Silk",
  "Linen",
  "Chiffon",
  "Georgette",
  "Velvet",
  "Organza",
  "Raw Silk",
  "Brocade",
  "Modal",
  "Brass Alloy",
  "Silver Alloy",
];

export const materials = [
  "Handloom",
  "Powerloom",
  "Zari Work",
  "Zardozi",
  "Mirror Work",
  "Sequin",
  "Thread Embroidery",
  "Block Print",
  "Ikat",
  "Kundan",
  "Polki",
  "Gold Plated",
  "Oxidised Silver",
  "Pearl",
];

export const occasions = [
  "Bridal",
  "Wedding",
  "Reception",
  "Sangeet",
  "Mehendi",
  "Haldi",
  "Festive",
  "Puja",
  "Party",
  "Everyday",
  "Office",
  "Gifting",
];

export const collections = [
  {
    id: "heritage-weaves",
    label: "Heritage Weaves",
    description: "Looms of Odisha and Banaras, documented and preserved.",
    image: "saree-banarasi",
  },
  {
    id: "festive-edit",
    label: "Festive Edit",
    description: "The season of light, dressed.",
    image: "lehenga-party",
  },
  {
    id: "handloom-stories",
    label: "Handloom Stories",
    description: "Cloth traced back to the weaver who made it.",
    image: "saree-cotton",
  },
  {
    id: "bridal-trousseau",
    label: "Bridal Trousseau",
    description: "Every ceremony, considered as one wardrobe.",
    image: "women-bridal-wear",
  },
  {
    id: "everyday-atelier",
    label: "Everyday Atelier",
    description: "Ethnic wear light enough for a Tuesday.",
    image: "women-contemporary",
  },
  {
    id: "groom-atelier",
    label: "Groom Atelier",
    description: "Tailoring for the other half of the mandap.",
    image: "groom-sherwani",
  },
  {
    id: "little-heirlooms",
    label: "Little Heirlooms",
    description: "Made small, kept for good.",
    image: "kids-festive-wear",
  },
];

export const collectionLabels = Object.fromEntries(
  collections.map((collection) => [collection.id, collection.label])
);

/**
 * Swatch colours for the colour filter. Keys are the values products carry.
 */
export const colorSwatches = {
  Ivory: "#f2ece2",
  Gold: "#c9a44c",
  Maroon: "#6d1f2a",
  Wine: "#5c1f33",
  Red: "#9b2226",
  Rust: "#8a3e22",
  Saffron: "#d98324",
  Mustard: "#c9992c",
  Emerald: "#1f5741",
  Teal: "#1f5560",
  Navy: "#20304d",
  Indigo: "#33406b",
  Blush: "#e8d5c4",
  Rose: "#b76e79",
  Black: "#1c1a18",
  Silver: "#b8bcc0",
  Beige: "#d8c9b4",
  Sage: "#8a9a80",
};

export const colors = Object.keys(colorSwatches);

export const sizes = [
  "Free Size",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "2.4",
  "2.6",
  "2.8",
  "2.10",
  "38",
  "40",
  "42",
  "44",
  "2-3Y",
  "4-5Y",
  "6-7Y",
  "8-9Y",
  "10-12Y",
];

export const availabilityOptions = [
  { id: "in-stock", label: "In Stock" },
  { id: "low-stock", label: "Only a Few Left" },
  { id: "made-to-order", label: "Made to Order" },
];

export const ratingOptions = [
  { id: "4.5", label: "4.5 & above" },
  { id: "4", label: "4.0 & above" },
  { id: "3.5", label: "3.5 & above" },
];

/* ------------------------------------------------------------------ */
/* Price                                                               */
/* ------------------------------------------------------------------ */

/**
 * The price presets offered in the filter panel. `max: null` means open-ended.
 */
export const priceBands = [
  { id: "under-2000", label: "Under ₹2,000", min: 0, max: 2000 },
  { id: "2000-5000", label: "₹2,000 – ₹5,000", min: 2000, max: 5000 },
  { id: "5000-10000", label: "₹5,000 – ₹10,000", min: 5000, max: 10000 },
  { id: "10000-25000", label: "₹10,000 – ₹25,000", min: 10000, max: 25000 },
  { id: "25000-plus", label: "₹25,000 & above", min: 25000, max: null },
];

export const getPriceBand = (id) => priceBands.find((band) => band.id === id) ?? null;

/* ------------------------------------------------------------------ */
/* Sorting                                                             */
/* ------------------------------------------------------------------ */

export const sortOptions = [
  { id: "recommended", label: "Recommended" },
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "popularity", label: "Popularity" },
  { id: "rating", label: "Rating" },
];

export const defaultSort = "recommended";

/* ------------------------------------------------------------------ */
/* Filter facets                                                       */
/* ------------------------------------------------------------------ */

/**
 * Declares every filter the storefront supports.
 *
 * `field`    — the product property the facet reads.
 * `multiple` — whether a product can carry several values for it.
 * `kind`     — how the panel renders it: list, swatch, chip or band.
 *
 * The filter panel, the chip row, the URL serialiser and the facet counter
 * are all generated from this list, so a new facet needs no UI change.
 */
export const filterFacets = [
  { id: "category", label: "Category", field: "category", kind: "list", options: () => categories.map((c) => ({ id: c.id, label: c.label })) },
  { id: "subcategory", label: "Style", field: "subcategory", kind: "list", options: null },
  { id: "gender", label: "Worn By", field: "gender", kind: "list", options: () => genders.map((g) => ({ id: g, label: g })) },
  { id: "price", label: "Price", field: "price", kind: "band", options: () => priceBands.map((b) => ({ id: b.id, label: b.label })) },
  { id: "size", label: "Size", field: "sizes", multiple: true, kind: "chip", options: null },
  { id: "color", label: "Colour", field: "colors", multiple: true, kind: "swatch", options: null },
  { id: "fabric", label: "Fabric", field: "fabric", kind: "list", options: null },
  { id: "material", label: "Craft", field: "material", kind: "list", options: null },
  { id: "occasion", label: "Occasion", field: "occasion", multiple: true, kind: "list", options: null },
  { id: "collection", label: "Collection", field: "collection", kind: "list", options: () => collections.map((c) => ({ id: c.label, label: c.label })) },
  { id: "rating", label: "Rating", field: "rating", kind: "band", options: () => ratingOptions },
  { id: "availability", label: "Availability", field: "availability", kind: "list", options: () => availabilityOptions },
];

export const filterKeys = filterFacets.map((facet) => facet.id);

export const getFacet = (id) => filterFacets.find((facet) => facet.id === id) ?? null;

/* ------------------------------------------------------------------ */
/* Route scopes                                                        */
/* ------------------------------------------------------------------ */

/**
 * A scope is a named, pre-filtered view of the catalogue.
 *
 * Every storefront route — `/shop`, `/category/:slug`, `/collection/:slug`
 * and each of the navigation paths inherited from Phase 3 — resolves to one
 * of these. The page component is identical in all cases; only the scope
 * changes, which is what keeps the discovery engine single-sourced.
 *
 * `filters` are locked: they seed the query and are not shown as removable
 * chips, because removing them would contradict the URL you are on.
 */
const scope = (id, { title, eyebrow, description, image, filters = {}, breadcrumb = [] }) => ({
  id,
  title,
  eyebrow,
  description,
  image,
  filters,
  breadcrumb,
});

/** The eight canonical `/category/*` routes. */
export const categoryRoutes = {
  sarees: scope("sarees", {
    title: "Sarees",
    eyebrow: "Six Yards",
    description:
      "Pato, cotton, silk and Banarasi — the weaves the house was built on, catalogued by loom.",
    image: "saree-silk",
    filters: { category: "sarees" },
  }),
  lehengas: scope("lehengas", {
    title: "Lehengas",
    eyebrow: "The Ceremony",
    description: "Bridal, designer, party and festive lehengas, cut for the long night.",
    image: "lehenga-bridal",
    filters: { category: "lehengas" },
  }),
  bridal: scope("bridal", {
    title: "Bridal",
    eyebrow: "The Trousseau",
    description: "Everything worn by the bride, from the mehendi morning to the reception.",
    image: "women-bridal-wear",
    filters: { occasion: "Bridal" },
  }),
  wedding: scope("wedding", {
    title: "Wedding",
    eyebrow: "The Celebration",
    description: "Dressing the whole party — the couple, the family, the guests.",
    image: "lehenga-wine",
    filters: { occasion: "Wedding" },
  }),
  bangles: scope("bangles", {
    title: "Bangles",
    eyebrow: "The Stack",
    description: "Bridal sets, gold-finish bangles, kada and cuffs, sized by the pair.",
    image: "bridal-bangles",
    filters: { category: "bangles" },
  }),
  jewellery: scope("jewellery", {
    title: "Jewellery",
    eyebrow: "Adornment",
    description: "Temple, kundan and polki pieces made to sit with the weave, not against it.",
    image: "bridal-jewellery",
    filters: { category: "jewellery" },
  }),
  men: scope("men", {
    title: "Men",
    eyebrow: "The Groom",
    description: "Kurta, sherwani and Nehru jackets, tailored in the same atelier.",
    image: "men-sherwani",
    filters: { gender: "Men" },
  }),
  kids: scope("kids", {
    title: "Kids",
    eyebrow: "Little Heirlooms",
    description: "Festive sets for children, made in the cloth their parents are wearing.",
    image: "kids-festive-wear",
    filters: { gender: "Kids" },
  }),
};

/** The four canonical `/collection/*` routes. */
export const collectionRoutes = {
  "new-arrivals": scope("new-arrivals", {
    title: "New Arrivals",
    eyebrow: "Just In",
    description: "The pieces that reached the atelier floor this month.",
    image: "saree-ivory-silk",
    filters: { flag: "isNew" },
  }),
  festive: scope("festive", {
    title: "The Festive Edit",
    eyebrow: "Season of Light",
    description: "Everything for the festival calendar, from Puja mornings to Diwali night.",
    image: "lehenga-party",
    filters: { occasion: "Festive" },
  }),
  wedding: scope("wedding", {
    title: "The Wedding Edit",
    eyebrow: "The Long Celebration",
    description: "One wardrobe for every ceremony in the calendar.",
    image: "lehenga-wine",
    filters: { occasion: "Wedding" },
  }),
  featured: scope("featured", {
    title: "Featured",
    eyebrow: "House Selection",
    description: "Chosen by the atelier — the pieces we would put on you ourselves.",
    image: "women-bridal-wear",
    filters: { flag: "isFeatured" },
  }),
};

/**
 * The Phase 3 navigation paths that lead to product listings.
 *
 * These paths already exist in `navigationConfig` and were previously served
 * by the generic interior page. Mapping them here lets the same navigation
 * land on real inventory without adding a second set of URLs. Paths absent
 * from this table keep their Phase 3 behaviour.
 */
export const navigationScopes = {
  "/women": { filters: { gender: "Women" }, title: "Women" },
  "/women/pato-sarees": { filters: { category: "sarees", subcategory: "Pato Saree" } },
  "/women/cotton-sarees": { filters: { category: "sarees", subcategory: "Cotton Saree" } },
  "/women/silk-sarees": { filters: { category: "sarees", subcategory: "Silk Saree" } },
  "/women/banarasi-sarees": { filters: { category: "sarees", subcategory: "Banarasi Saree" } },
  "/women/printed-sarees": { filters: { category: "sarees", subcategory: "Printed Saree" } },
  "/women/designer-sarees": { filters: { category: "sarees", subcategory: "Designer Saree" } },
  "/women/bridal-lehengas": { filters: { category: "lehengas", subcategory: "Bridal Lehenga" } },
  "/women/party-lehengas": { filters: { category: "lehengas", subcategory: "Party Lehenga" } },
  "/women/designer-lehengas": { filters: { category: "lehengas", subcategory: "Designer Lehenga" } },
  "/women/kurtis-and-suits": { filters: { category: "kurtis-and-suits" } },
  "/women/innerwear": { filters: { category: "innerwear" } },
  "/women/dupattas-and-stoles": { filters: { category: "dupattas" } },

  "/bridal": { filters: { occasion: "Bridal" } },
  "/bridal/bridal-sarees": { filters: { category: "sarees", occasion: "Bridal" } },
  "/bridal/bridal-lehengas": { filters: { category: "lehengas", subcategory: "Bridal Lehenga" } },
  "/bridal/reception-wear": { filters: { occasion: "Reception" } },
  "/bridal/mehendi-and-haldi": { filters: { occasion: "Mehendi" } },
  "/bridal/sangeet-edit": { filters: { occasion: "Sangeet" } },
  "/bridal/trousseau-edit": { filters: { collection: "Bridal Trousseau" } },

  "/men": { filters: { gender: "Men" } },
  "/men/kurta": { filters: { category: "menswear", subcategory: "Kurta" } },
  "/men/kurta-pajama": { filters: { category: "menswear", subcategory: "Kurta Pajama" } },
  "/men/nehru-jackets": { filters: { category: "menswear", subcategory: "Nehru Jacket" } },
  "/men/groom": { filters: { gender: "Men", collection: "Groom Atelier" } },
  "/men/sherwani": { filters: { category: "menswear", subcategory: "Sherwani" } },
  "/men/wedding-kurta": { filters: { category: "menswear", occasion: "Wedding" } },

  "/kids": { filters: { gender: "Kids" } },
  "/kids/girls-ethnic-sets": { filters: { category: "kidswear", subcategory: "Girls Ethnic Set" } },
  "/kids/girls-lehenga-sets": { filters: { category: "kidswear", subcategory: "Girls Lehenga Set" } },
  "/kids/girls-festive-frocks": { filters: { category: "kidswear", subcategory: "Girls Festive Frock" } },
  "/kids/boys-kurta-sets": { filters: { category: "kidswear", subcategory: "Boys Kurta Set" } },
  "/kids/boys-sherwani": { filters: { category: "kidswear", subcategory: "Boys Sherwani" } },
  "/kids/boys-festive-shirts": { filters: { category: "kidswear", subcategory: "Boys Festive Shirt" } },

  "/jewellery": { filters: { category: "jewellery" } },
  "/jewellery/bridal-bangles": { filters: { category: "bangles", subcategory: "Bridal Bangles" } },
  "/jewellery/gold-finish-bangles": { filters: { category: "bangles", subcategory: "Gold-finish Bangles" } },
  "/jewellery/kada-and-cuffs": { filters: { category: "bangles", subcategory: "Kada + Cuffs" } },
  "/jewellery/earrings": { filters: { category: "jewellery", subcategory: "Earrings" } },
  "/jewellery/necklaces": { filters: { category: "jewellery", subcategory: "Necklaces" } },
  "/jewellery/maang-tikka": { filters: { category: "jewellery", subcategory: "Maang Tikka" } },
  "/jewellery/rings": { filters: { category: "jewellery", subcategory: "Rings" } },
  "/jewellery/bridal-jewellery": { filters: { category: "jewellery", occasion: "Bridal" } },
  "/jewellery/sets-and-pairings": { filters: { category: "jewellery", subcategory: "Jewellery Set" } },

  "/collections": {},
  "/collections/new-arrivals": { filters: { flag: "isNew" } },
  "/collections/festive-edit": { filters: { collection: "Festive Edit" } },
  "/collections/heritage-weaves": { filters: { collection: "Heritage Weaves" } },
  "/collections/handloom-stories": { filters: { collection: "Handloom Stories" } },
  "/collections/cotton": { filters: { fabric: "Cotton" } },
  "/collections/silk": { filters: { fabric: "Mulberry Silk" } },
  "/collections/linen": { filters: { fabric: "Linen" } },
  "/collections/chiffon": { filters: { fabric: "Chiffon" } },
};

/** True when a navigation path should render the storefront. */
export const hasNavigationScope = (pathname) =>
  Object.prototype.hasOwnProperty.call(navigationScopes, pathname);

export default {
  categories,
  genders,
  fabrics,
  materials,
  occasions,
  collections,
  colors,
  colorSwatches,
  sizes,
  availabilityOptions,
  ratingOptions,
  priceBands,
  sortOptions,
  filterFacets,
  categoryRoutes,
  collectionRoutes,
  navigationScopes,
};
