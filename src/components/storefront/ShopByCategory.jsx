import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Accent,
  AtelierSection,
  EditorialHeading,
  MediaFrame,
  eyebrow,
  gap,
  useReveal,
} from "../../design-system";
import { imageRef } from "../../data/pratikshyaImageManifest";
import { getById as getMediaById } from "../../services/media/mediaRepository";
import taxonomyRepository from "../../services/taxonomyRepository";
import { cn } from "../../utils/cn";

/**
 * SHOP BY CATEGORY — landing section.
 *
 * A horizontal rail of large, image-led category cards drawn from the one
 * taxonomy repository. Five cards sit across on desktop (three on tablet,
 * two on a phone), each a tall editorial 4:5 plate with the category name
 * and a "Shop Now" cue overlaid near the bottom.
 *
 * The picture inside a card comes from managed media when the category has
 * an ACTIVE banner attached, otherwise from the category's own manifest
 * artwork — never a second image database.
 */

/** Preferred, richly-imaged categories; the rail stays at five when a
    category is archived because the rest of the taxonomy fills in. */
const FEATURED_IDS = [
  "sarees",
  "lehengas",
  "kurtis-and-suits",
  "bridal-couture",
  "menswear",
  "kidswear",
];

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

export default function ShopByCategory() {
  const reveal = useReveal();

  const active = taxonomyRepository.activeCategories();
  const preferred = FEATURED_IDS.map((id) => active.find((category) => category.id === id)).filter(Boolean);
  const rest = active.filter((category) => !preferred.includes(category));
  const categories = [...preferred, ...rest].slice(0, 5);

  if (!categories.length) return null;

  return (
    <AtelierSection id="shop-by-category">
      <EditorialHeading
        eyebrow="The Atelier"
        size="subsection"
        spacing={{ eyebrow: "mb-4", title: "mb-14" }}
      >
        Shop by <Accent>Category</Accent>
      </EditorialHeading>

      <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5", gap.tile)}>
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            {...reveal}
            transition={{ ...reveal.transition, delay: Math.min(index % 5, 4) * 0.05 }}
          >
            <Link to={`/category/${category.slug}`} className="group block">
              <MediaFrame
                image={resolveCategoryImage(category)}
                alt={`${category.name} collection at PRATIKSHYA FASHON`}
                aspect="portrait"
                zoom="soft"
                overlay="imageBottom"
                className="mb-4 md:mb-5"
              >
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 text-left">
                  {category.eyebrow ? (
                    <p className={cn(eyebrow.label, "text-ivory/80 mb-1")}>
                      {category.eyebrow}
                    </p>
                  ) : null}
                  <h3 className="font-display text-xl md:text-2xl font-light leading-tight text-white">
                    {category.name}
                  </h3>
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
    </AtelierSection>
  );
}
