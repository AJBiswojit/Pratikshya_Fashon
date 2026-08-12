import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Accent,
  AtelierSection,
  EditorialHeading,
  MediaFrame,
  Rule,
  eyebrow,
  gap,
  useReveal,
} from "../../design-system";
import { imageRef } from "../../data/pratikshyaImageManifest";
import { getLiveStorefrontProducts } from "../../data/products";
import { navigationScopes } from "../../data/products/taxonomy";
import { getById as getMediaById } from "../../services/media/mediaRepository";
import taxonomyRepository from "../../services/taxonomyRepository";
import { cn } from "../../utils/cn";

/**
 * SHOP BY CATEGORY — landing section.
 *
 * The complete, customer-facing catalogue, arranged as editorial groups
 * (Women / Men / Kids / Accessories / Innerwear) instead of a single short
 * rail. Every card is resolved from the central taxonomyRepository — nothing
 * here hard-codes a category, a route or a picture:
 *
 *   · category cards use the category's managed ACTIVE banner when one is
 *     attached, otherwise the category's own manifest artwork (imageRef);
 *   · broad buckets (Men's Wear, Kids Wear) open into their routed
 *     subcategories, each card carrying a real product's catalogue image
 *     and linking to the subcategory's existing storefront route;
 *   · archived or non-customer-visible records simply drop out, and a card
 *     is only emitted when its route and its media both resolve.
 */

/**
 * Editorial grouping. This is presentation metadata only: it names the five
 * merchandising groups and maps them to taxonomy records that already exist.
 * The records themselves are always read from `taxonomyRepository`, so an
 * archived/renamed category disappears instead of leaving a broken card.
 * `expandSubcategories` groups resolve their category's routed subcategories
 * (falling back to the category card when none are individually routable).
 */
const CATEGORY_GROUPS = [
  {
    id: "women",
    label: "Women",
    categories: ["sarees", "lehengas", "bridal-couture", "kurtis-and-suits", "dupattas"],
  },
  { id: "men", label: "Men", categories: ["menswear"], expandSubcategories: true },
  { id: "kids", label: "Kids", categories: ["kidswear"], expandSubcategories: true },
  { id: "accessories", label: "Accessories", categories: ["bangles", "jewellery"] },
  { id: "innerwear", label: "Innerwear", categories: ["innerwear"] },
];

/** Reverse index: categoryId + subcategory name → existing storefront route. */
const buildSubcategoryRoutes = () => {
  const routes = new Map();
  Object.entries(navigationScopes).forEach(([path, scope]) => {
    const filters = scope?.filters ?? {};
    if (!filters.category || !filters.subcategory) return;
    const key = `${filters.category}::${String(filters.subcategory).toLowerCase()}`;
    if (!routes.has(key)) routes.set(key, path);
  });
  return routes;
};

const SUBCATEGORY_ROUTES = buildSubcategoryRoutes();

/** Managed ACTIVE banner beats the category's own artwork. */
const resolveCategoryImage = (category) => {
  const media = category.bannerMediaId ? getMediaById(category.bannerMediaId) : null;
  if (media?.status === "ACTIVE" && media.url) {
    return {
      id: media.id,
      src: media.url,
      alt: media.alt || category.name,
      category: media.tags?.[0] ?? "default",
    };
  }
  return imageRef(category.image);
};

const categoryCard = (category) => ({
  key: `category-${category.id}`,
  to: `/category/${category.slug}`,
  name: category.name,
  eyebrow: category.eyebrow || "",
  image: resolveCategoryImage(category),
  alt: `${category.name} collection at PRATIKSHYA FASHON`,
});

const subcategoryCard = (category, subcategory, route, product) => ({
  key: `subcategory-${category.id}-${subcategory.id}`,
  to: route,
  name: subcategory.name,
  eyebrow: "",
  image: product.image,
  alt: `${subcategory.name} collection at PRATIKSHYA FASHON`,
});

export default function ShopByCategory() {
  const reveal = useReveal();

  const active = taxonomyRepository.activeCategories();
  const activeById = new Map(active.map((category) => [category.id, category]));

  /* Reused from the shared, cached storefront list — New Arrivals on this
     same page already resolves it, so this adds no extra catalogue pass. */
  const products = getLiveStorefrontProducts();

  const groups = CATEGORY_GROUPS.map((group) => {
    const categories = (group.categories ?? [])
      .map((id) => activeById.get(id))
      .filter(Boolean)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const cards = [];

    if (group.expandSubcategories) {
      categories.forEach((category) => {
        const subcards = taxonomyRepository
          .activeSubcategories(category.id)
          .map((subcategory) => {
            const route = SUBCATEGORY_ROUTES.get(
              `${category.id}::${subcategory.name.toLowerCase()}`
            );
            if (!route) return null;
            const product = products.find(
              (entry) => entry.category === category.id && entry.subcategory === subcategory.name
            );
            if (!product) return null;
            return subcategoryCard(category, subcategory, route, product);
          })
          .filter(Boolean);

        /* A broad bucket keeps its own card only when it has no routed
           subcategories to open into. */
        if (subcards.length) cards.push(...subcards);
        else cards.push(categoryCard(category));
      });
    } else {
      categories.forEach((category) => cards.push(categoryCard(category)));
    }

    return { ...group, cards };
  }).filter((group) => group.cards.length > 0);

  if (!groups.length) return null;

  return (
    <AtelierSection id="shop-by-category">
      <EditorialHeading
        eyebrow="The Atelier"
        size="subsection"
        spacing={{ eyebrow: "mb-4", title: "mb-14" }}
      >
        Shop by <Accent>Category</Accent>
      </EditorialHeading>

      <div className="space-y-16 md:space-y-24">
        {groups.map((group) => (
          <section key={group.id} aria-labelledby={`shop-by-category-${group.id}`}>
            <div className="mb-6 md:mb-8">
              <h3 id={`shop-by-category-${group.id}`} className={cn(eyebrow.section, "text-accent")}>
                {group.label}
              </h3>
              <Rule width="w-16" tone="accent" className="mt-3" />
            </div>

            <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5", gap.tile)}>
              {group.cards.map((card, index) => (
                <motion.div
                  key={card.key}
                  {...reveal}
                  transition={{ ...reveal.transition, delay: Math.min(index % 5, 4) * 0.05 }}
                >
                  <Link
                    to={card.to}
                    className="group block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    <MediaFrame
                      image={card.image}
                      alt={card.alt}
                      aspect="portrait"
                      zoom="soft"
                      overlay="imageBottom"
                      className="mb-4 md:mb-5"
                    >
                      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 text-left">
                        {card.eyebrow ? (
                          <p className={cn(eyebrow.label, "text-ivory/80 mb-1")}>
                            {card.eyebrow}
                          </p>
                        ) : null}
                        <h4 className="font-display text-xl md:text-2xl font-light leading-tight text-white">
                          {card.name}
                        </h4>
                        <span className="mt-2 inline-flex items-center gap-1.5 font-ui text-[9px] uppercase tracking-[.2em] text-pearl transition-colors group-hover:text-white">
                          Shop Now
                          <ArrowRight
                            size={11}
                            className="transition-transform duration-300 group-hover:translate-x-0.5"
                          />
                        </span>
                      </div>
                    </MediaFrame>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AtelierSection>
  );
}
