import { useMemo } from "react";
import { MARKETING_PLACEMENTS } from "../config/mediaTypes";
import { useActivePlacementMedia } from "../hooks/useMedia";
import { resolvePlacementImage } from "../services/media/marketingMediaSource";
import { resolveHeroImageIds } from "../services/media/mediaResolver";
import HeroCarousel from "../components/storefront/HeroCarousel";
import SareeEditCarousel from "../components/storefront/SareeEditCarousel";
import ShopByCategory from "../components/storefront/ShopByCategory";
import NewArrivals from "../components/storefront/NewArrivals";
import SaleBanner from "../components/storefront/SaleBanner";
import CelebrationEdit from "../components/storefront/CelebrationEdit";
import {
  Accent,
  AtelierSection,
  EditorialHeading,
  MediaFrame,
  body,
  eyebrow,
  gap,
  grid,
  heading,
} from "../design-system";

export default function AtelierDesign() {
  /* Phase 12 seams. Each of these is the *same* frame the page has always
     had — only the picture inside it can now be replaced from the Admin
     Portal. With no ACTIVE marketing record the house artwork stands, so
     the layout, motion and treatment are untouched. The hero carousel
     honours an ACTIVE HOME_HERO record by letting it stand in for the
     lead editorial plate. */
  const heroMedia = useActivePlacementMedia(MARKETING_PLACEMENTS.HOME_HERO);
  const sareeMedia = useActivePlacementMedia(MARKETING_PLACEMENTS.SAREE_SECTION);
  const lehengaMedia = useActivePlacementMedia(MARKETING_PLACEMENTS.LEHENGA_SECTION);

  /* The hero reserves its five plates first; the editorial, category and sale
     seams below seed their exclusion set from this list so the homepage never
     shows the same photograph in several sections at once. */
  const heroImageIds = useMemo(() => resolveHeroImageIds(heroMedia), [heroMedia]);

  return (
    <main id="top">
      <HeroCarousel heroMedia={heroMedia} />

      <SareeEditCarousel />

      <AtelierSection id="collections" tone="ink">
        <EditorialHeading
          size="editorial"
          description="Pato, cotton, silk, Banarasi, designer and wedding sarees alongside bridal, festive and party lehengas."
          descriptionClassName={`${body.base} text-ash`}
          spacing={{ title: "mb-4", description: "mb-14" }}
        >
          Saree & <Accent tone="gold">Lehenga</Accent>
        </EditorialHeading>
        <div className={`${grid.pair} ${gap.tile}`}>
          <MediaFrame as="a" href="#women" image={resolvePlacementImage(sareeMedia, "saree-banarasi")} alt="Pato, Banarasi and silk saree collection" aspect="panorama" zoom="soft" overlay="inkLeft" className="group">
            <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10">
              <h3 className={`${heading.xl} mb-2`}>Saree Collection</h3>
              <p className={`${body.captionDisplay} text-ash`}>Pato · cotton · silk · Banarasi · festive.</p>
            </div>
          </MediaFrame>
          <MediaFrame as="a" href="#bridal" image={resolvePlacementImage(lehengaMedia, "lehenga-bridal")} alt="Bridal and wedding lehenga collection" aspect="panorama" zoom="soft" overlay="inkRight" className="group">
            <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 text-right">
              <h3 className={`${heading.xl} mb-2`}>Lehenga Collection</h3>
              <p className={`${body.captionDisplay} text-ash`}>Bridal · wedding · designer · party.</p>
            </div>
          </MediaFrame>
        </div>
      </AtelierSection>

      <CelebrationEdit excludeIds={heroImageIds} />

      <ShopByCategory excludeIds={heroImageIds} />

      <NewArrivals />

      <SaleBanner excludeIds={heroImageIds} />

      <AtelierSection rhythm="spacious" width="narrow" className="text-center">
        <EditorialHeading
          size="manifesto"
          description="PRATIKSHYA FASHON"
          descriptionClassName={`${eyebrow.caption} text-taupe`}
          spacing={{ title: "mb-4", description: "mb-12" }}
        >
          Our <Accent>Story</Accent>
        </EditorialHeading>
        <p className={`${body.story} text-graphite max-w-2xl mx-auto`}>PRATIKSHYA FASHON brings together the richness of textile craft and the joy of dressing for life’s most meaningful occasions. From the everyday grace of a cotton saree to bridal splendour, every piece is selected with warmth, intention and respect for tradition.</p>
      </AtelierSection>

    </main>
  );
}
