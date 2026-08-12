import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import PratikshyaImage from "../components/PratikshyaImage";
import { imageRef } from "../data/pratikshyaImageManifest";
import { editorialCollections } from "../data/pratikshyaMockData";
import { MARKETING_PLACEMENTS } from "../config/mediaTypes";
import { useActivePlacementMedia } from "../hooks/useMedia";
import { resolvePlacementImage } from "../services/media/marketingMediaSource";
import ShopByCategory from "../components/storefront/ShopByCategory";
import NewArrivals from "../components/storefront/NewArrivals";
import SaleBanner from "../components/storefront/SaleBanner";
import {
  Accent,
  AtelierButton,
  AtelierSection,
  Container,
  EditorialHeading,
  MediaFrame,
  Rule,
  body,
  distance,
  eyebrow,
  gap,
  grid,
  heading,
  header,
  imageTreatment,
  overlays,
  useEnter,
  useReveal,
} from "../design-system";

const fabricDetails = {
  Silk: { desc: "Lustrous · Ceremonial · Refined", products: ["Pato Sarees", "Banarasi Silk", "Bridal Sarees"] },
  Cotton: { desc: "Breathable · Handwoven · Everyday", products: ["Cotton Sarees", "Soft Drapes", "Summer Edit"] },
  Designer: { desc: "Expressive · Detailed · Festive", products: ["Designer Sarees", "Party Lehengas", "Wedding Edit"] },
};

export default function AtelierDesign() {
  const [selectedFabric, setSelectedFabric] = useState("Silk");
  const heroEnter = useEnter(distance.long);
  const tileReveal = useReveal(distance.short);
  const articleReveal = useReveal(distance.medium);

  /* Phase 12 seams. Each of these is the *same* frame the page has always
     had — only the picture inside it can now be replaced from the Admin
     Portal. With no ACTIVE marketing record the house artwork stands, so
     the layout, motion and treatment are untouched. */
  const heroMedia = useActivePlacementMedia(MARKETING_PLACEMENTS.HOME_HERO);
  const sareeMedia = useActivePlacementMedia(MARKETING_PLACEMENTS.SAREE_SECTION);
  const lehengaMedia = useActivePlacementMedia(MARKETING_PLACEMENTS.LEHENGA_SECTION);

  const materials = [
    { name: "Silk", desc: fabricDetails.Silk.desc, img: imageRef("fabric-silk") },
    { name: "Cotton", desc: fabricDetails.Cotton.desc, img: imageRef("fabric-cotton") },
    { name: "Designer", desc: fabricDetails.Designer.desc, img: imageRef("fabric-embroidered") },
  ];

  return (
    <main>
      <section id="top" className={`relative min-h-[100dvh] overflow-hidden ${header.offset}`}>
        <PratikshyaImage image={resolvePlacementImage(heroMedia, "hero-atelier")} alt="PRATIKSHYA FASHON silk and textile campaign" loading="eager" fetchPriority="high" className={`${imageTreatment.fill} ${imageTreatment.heroScale}`} />
        <div aria-hidden="true" className={`absolute inset-0 ${overlays.heroScrim}`} />
        <Container width="content" padded className="relative z-10 min-h-[100dvh] flex flex-col justify-center py-24 md:py-0">
          <motion.div {...heroEnter}>
            <p className={`${eyebrow.hero} text-accent mb-6`}>PRATIKSHYA FASHON · Ladies' Atelier</p>
            <EditorialHeading as="h1" size="hero" spacing={{ title: "mb-6 md:mb-8" }} titleClassName="text-ink">
              DRESS THE<br />MOMENT. <Accent>KEEP THE STORY.</Accent>
            </EditorialHeading>
            <p className={`${body.lead} text-cocoa max-w-md mb-10`}>Sarees, lehengas and heirloom details for the way you gather, celebrate and remember.</p>
            <AtelierButton href="#women">Explore Women's Edit <ArrowRight size={14} /></AtelierButton>
          </motion.div>
        </Container>
      </section>

      <AtelierSection id="women" rhythm="spacious">
        <EditorialHeading
          eyebrow="Women's Collection"
          rule
          spacing={{ eyebrow: "mb-4", title: "mb-2", rule: "mb-16" }}
        >
          The <Accent>Saree</Accent> Edit
        </EditorialHeading>
        <div className={`${grid.tiles} ${gap.tile}`}>
          {materials.map((material) => (
            <MediaFrame
              as={motion.div}
              key={material.name}
              {...tileReveal}
              image={material.img}
              alt={`${material.name} saree and textile detail`}
              aspect="portrait"
              zoom="strong"
              overlay="imageBottom"
              className="group"
            >
              <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8">
                <h3 className={`${heading.md} text-white mb-2`}>{material.name}</h3>
                <p className={`text-[10px] md:text-xs text-pearl font-ui tracking-wider`}>{material.desc}</p>
              </div>
              <AtelierButton
                variant="toggle"
                size="micro"
                active={selectedFabric === material.name}
                onClick={() => setSelectedFabric(material.name)}
                className="absolute top-4 right-4"
              >
                Explore
              </AtelierButton>
            </MediaFrame>
          ))}
        </div>
      </AtelierSection>

      <AtelierSection
        tone="fade"
        rhythm="compact"
        width="content"
        innerClassName={`${grid.pair} ${gap.editorial} items-center`}
      >
        <div>
          <h3 className={`${heading.xl} mb-4`}>{selectedFabric} <Accent>Stories</Accent></h3>
          <p className={`${body.base} text-taupe mb-8`}>{fabricDetails[selectedFabric].desc}</p>
          <Rule width="w-12" className="mb-6" />
          <p className={`${body.serif} text-graphite mb-6`}>At PRATIKSHYA FASHON, every {selectedFabric.toLowerCase()} piece is selected for its drape, detail and the occasion it will become part of.</p>
          <h4 className={`${eyebrow.labelDisplay} text-taupe mb-3`}>Discover the edit</h4>
          <div className={`flex flex-wrap ${gap.chip}`}>
            {fabricDetails[selectedFabric].products.map((product) => (
              <AtelierButton key={product} href="#collections" variant="outline" size="chip">{product}</AtelierButton>
            ))}
          </div>
        </div>
        <MediaFrame
          image={materials.find((item) => item.name === selectedFabric).img}
          alt={`${selectedFabric} textile detail`}
          aspect="portrait"
          elevated
        />
      </AtelierSection>

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

      <AtelierSection id="bridal" rhythm="spacious">
        <EditorialHeading
          size="feature"
          description="A composed wardrobe for weddings and every gathering around them."
          descriptionClassName={`${body.base} text-taupe max-w-xl`}
          spacing={{ title: "mb-4", description: "mb-16" }}
        >
          The <Accent>Celebration</Accent> Edit
        </EditorialHeading>
        <div className={`${grid.pair} ${gap.editorial}`}>
          {editorialCollections.map((collection) => (
            <motion.article id={collection.anchor} key={collection.title} {...articleReveal} className="group">
              <MediaFrame image={collection.image} alt={collection.title} aspect="landscape" zoom="soft" className="mb-6" />
              <p className={`${eyebrow.editorial} text-accent mb-3`}>{collection.eyebrow}</p>
              <h3 className={`${heading.lg} mb-3`}>{collection.title}</h3>
              <p className={`${body.editorial} text-taupe max-w-md`}>{collection.description}</p>
            </motion.article>
          ))}
        </div>
      </AtelierSection>

      <ShopByCategory />

      <NewArrivals />

      <SaleBanner />

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
