import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import PratikshyaImage from "../components/PratikshyaImage";
import { imageRef } from "../data/pratikshyaImageManifest";
import { editorialCollections, offer, products } from "../data/pratikshyaMockData";
import {
  Accent,
  AtelierButton,
  AtelierSection,
  Container,
  EditorialHeading,
  MediaFrame,
  ProductCard,
  Rule,
  body,
  distance,
  dotGrid,
  eyebrow,
  gap,
  grid,
  heading,
  header,
  imageTreatment,
  nav,
  overlays,
  transition,
  useEnter,
  useReveal,
} from "../design-system";

const navItems = [
  ["Women", "#women"], ["Bridal", "#bridal"], ["Men", "#men"], ["Kids", "#kids"], ["Jewellery", "#jewellery"], ["Collections", "#collections"],
];

const fabricDetails = {
  Silk: { desc: "Lustrous · Ceremonial · Refined", products: ["Pato Sarees", "Banarasi Silk", "Bridal Sarees"] },
  Cotton: { desc: "Breathable · Handwoven · Everyday", products: ["Cotton Sarees", "Soft Drapes", "Summer Edit"] },
  Designer: { desc: "Expressive · Detailed · Festive", products: ["Designer Sarees", "Party Lehengas", "Wedding Edit"] },
};

const footerColumns = [
  { title: "Women", items: ["Sarees", "Pato Sarees", "Lehengas", "Innerwear"] },
  { title: "Occasions", items: ["Bridal", "Wedding Wear", "Men + Groom", "Kids Festive"] },
  { title: "Customer Care", items: ["Bangles + Jewellery", "New Arrivals", "About Us", "Policies + Contact"] },
];

export default function AtelierDesign() {
  const [selectedFabric, setSelectedFabric] = useState("Silk");
  const heroEnter = useEnter(distance.long);
  const tileReveal = useReveal(distance.short);
  const articleReveal = useReveal(distance.medium);

  const materials = [
    { name: "Silk", desc: fabricDetails.Silk.desc, img: imageRef("fabric-silk") },
    { name: "Cotton", desc: fabricDetails.Cotton.desc, img: imageRef("fabric-cotton") },
    { name: "Designer", desc: fabricDetails.Designer.desc, img: imageRef("fabric-embroidered") },
  ];

  return (
    <main className="min-h-screen bg-canvas text-ink font-display selection:bg-accent selection:text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-canvas/80 backdrop-blur-md border-b border-mist/50">
        <Container width="content" padded className={`${header.height} flex items-center justify-between`}>
          <a href="#top" className={`${nav.brand} hover:text-accent ${transition.colors}`}>PRATIKSHYA FASHON</a>
          <div className={`hidden md:flex gap-5 lg:gap-8 ${nav.link} text-brass`}>
            {navItems.map(([label, href]) => <a key={label} href={href} className={`hover:text-accent ${transition.colors}`}>{label}</a>)}
          </div>
        </Container>
      </nav>

      <section id="top" className={`relative min-h-[100dvh] overflow-hidden ${header.offset}`}>
        <PratikshyaImage image="hero-atelier" alt="PRATIKSHYA FASHON silk and textile campaign" loading="eager" fetchPriority="high" className={`${imageTreatment.fill} ${imageTreatment.heroScale}`} />
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
          <MediaFrame as="a" href="#women" image="saree-banarasi" alt="Pato, Banarasi and silk saree collection" aspect="panorama" zoom="soft" overlay="inkLeft" className="group">
            <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10">
              <h3 className={`${heading.xl} mb-2`}>Saree Collection</h3>
              <p className={`${body.captionDisplay} text-ash`}>Pato · cotton · silk · Banarasi · festive.</p>
            </div>
          </MediaFrame>
          <MediaFrame as="a" href="#bridal" image="lehenga-bridal" alt="Bridal and wedding lehenga collection" aspect="panorama" zoom="soft" overlay="inkRight" className="group">
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

      <AtelierSection>
        <EditorialHeading size="subsection" spacing={{ title: "mb-14" }}>
          Selected <Accent>Pieces</Accent>
        </EditorialHeading>
        <div className={`${grid.products} ${gap.tile}`}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} href="#collections" />
          ))}
        </div>
      </AtelierSection>

      <AtelierSection
        tone="accent"
        width="prose"
        className="text-center relative overflow-hidden"
        innerClassName="relative z-10"
        backdrop={
          <>
            <PratikshyaImage image={offer.images.atelier} alt="Festive fashion textile campaign" className={imageTreatment.campaignBackdrop} />
            <div aria-hidden="true" className="absolute inset-0 opacity-[.08]" style={dotGrid} />
          </>
        }
      >
        <EditorialHeading size="campaign" spacing={{ title: "mb-2" }}>{offer.title}</EditorialHeading>
        <h3 className={`${heading.sm} text-blush mb-6`}>{offer.subtitle}</h3>
        <p className={`${body.base} text-blush-deep mb-10`}>{offer.desc}</p>
        <AtelierButton href="#collections" variant="inverse" size="lg">Shop the Edit <ArrowRight size={14} /></AtelierButton>
      </AtelierSection>

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

      <footer className="bg-ink text-ivory px-6 md:px-12 py-16">
        <Container className={`${grid.footer} ${gap.column} mb-12`}>
          <div>
            <h4 className={`${heading.footer} mb-4`}>PRATIKSHYA FASHON</h4>
            <p className={`${body.caption} text-ash`}>Fashion, textile and celebration—considered with care.</p>
          </div>
          {footerColumns.map((column) => <FooterColumn key={column.title} {...column} />)}
        </Container>
        <Container className={`pt-8 border-t border-ink-line flex flex-wrap gap-3 justify-between ${body.micro} text-ash-deep`}>
          <span>© 2026 PRATIKSHYA FASHON</span>
          <span>Privacy · Terms · Contact</span>
        </Container>
      </footer>
    </main>
  );
}

function FooterColumn({ title, items }) {
  return (
    <div>
      <h5 className={`${eyebrow.labelDisplay} text-gold mb-4`}>{title}</h5>
      <ul className={`space-y-2 ${body.caption} text-ash`}>
        {items.map((item) => <li key={item}><a href="#top" className="hover:text-white">{item}</a></li>)}
      </ul>
    </div>
  );
}
