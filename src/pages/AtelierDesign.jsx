import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import PratikshyaImage from "../components/PratikshyaImage";
import { imageRef } from "../data/pratikshyaImageManifest";
import { editorialCollections, offer, products } from "../data/pratikshyaMockData";

const navItems = [
  ["Women", "#women"], ["Bridal", "#bridal"], ["Men", "#men"], ["Kids", "#kids"], ["Jewellery", "#jewellery"], ["Collections", "#collections"],
];

const fabricDetails = {
  Silk: { desc: "Lustrous · Ceremonial · Refined", products: ["Pato Sarees", "Banarasi Silk", "Bridal Sarees"] },
  Cotton: { desc: "Breathable · Handwoven · Everyday", products: ["Cotton Sarees", "Soft Drapes", "Summer Edit"] },
  Designer: { desc: "Expressive · Detailed · Festive", products: ["Designer Sarees", "Party Lehengas", "Wedding Edit"] },
};

export default function AtelierDesign() {
  const [selectedFabric, setSelectedFabric] = useState("Silk");
  const materials = [
    { name: "Silk", desc: fabricDetails.Silk.desc, img: imageRef("fabric-silk") },
    { name: "Cotton", desc: fabricDetails.Cotton.desc, img: imageRef("fabric-cotton") },
    { name: "Designer", desc: fabricDetails.Designer.desc, img: imageRef("fabric-embroidered") },
  ];

  return (
    <main className="min-h-screen bg-[#f7f4f0] text-[#2a2015] font-[Cormorant_Garamond] selection:bg-[#8a3e22] selection:text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f7f4f0]/80 backdrop-blur-md border-b border-[#ddd8cf]/50">
        <div className="max-w-6xl mx-auto px-6 md:px-12 h-16 md:h-20 flex items-center justify-between">
          <a href="#top" className="text-xl md:text-2xl font-light tracking-tight hover:text-[#8a3e22] transition-colors">PRATIKSHYA FASHON</a>
          <div className="hidden md:flex gap-5 lg:gap-8 text-[10px] uppercase tracking-[0.15em] font-[Instrument_Sans] text-[#8a6e4a]">
            {navItems.map(([label, href]) => <a key={label} href={href} className="hover:text-[#8a3e22] transition-colors">{label}</a>)}
          </div>
        </div>
      </nav>

      <section id="top" className="relative min-h-[100dvh] overflow-hidden pt-20">
        <PratikshyaImage image="hero-atelier" alt="PRATIKSHYA FASHON silk and textile campaign" loading="eager" fetchPriority="high" className="absolute inset-0 w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f7f4f0]/90 via-[#f7f4f0]/40 to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 min-h-[100dvh] flex flex-col justify-center py-24 md:py-0">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}>
            <p className="font-[Instrument_Sans] text-[10px] uppercase tracking-[0.4em] text-[#8a3e22] mb-6">PRATIKSHYA FASHON · Ladies' Atelier</p>
            <h1 className="text-6xl md:text-[9rem] lg:text-[11rem] font-light leading-[0.82] tracking-tight mb-6 md:mb-8 text-[#2a2015]">DRESS THE<br />MOMENT. <span className="italic text-[#8a3e22]">KEEP THE STORY.</span></h1>
            <p className="font-[Instrument_Sans] text-sm md:text-base text-[#6a4e38] max-w-md leading-relaxed mb-10">Sarees, lehengas and heirloom details for the way you gather, celebrate and remember.</p>
            <a href="#women" className="inline-flex items-center gap-3 bg-[#2a2015] text-[#fdf8f3] px-8 py-4 text-xs uppercase tracking-[0.15em] font-[Instrument_Sans] hover:bg-[#8a3e22] transition-all">Explore Women's Edit <ArrowRight size={14} /></a>
          </motion.div>
        </div>
      </section>

      <section id="women" className="py-32 md:py-48 px-6 md:px-12 max-w-7xl mx-auto">
        <p className="font-[Instrument_Sans] text-[10px] uppercase tracking-[.3em] text-[#8a3e22] mb-4">Women's Collection</p>
        <h2 className="text-4xl md:text-7xl font-light tracking-tight mb-2">The <span className="italic text-[#8a3e22]">Saree</span> Edit</h2>
        <div className="w-16 h-px bg-[#8a3e22] mb-16" />
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {materials.map((material) => <motion.div key={material.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .6 }} className="group relative overflow-hidden aspect-[4/5]">
            <PratikshyaImage image={material.img} alt={`${material.name} saree and textile detail`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8"><h3 className="text-2xl md:text-4xl font-light text-white mb-2">{material.name}</h3><p className="text-[10px] md:text-xs text-[#ddd] font-[Instrument_Sans] tracking-wider">{material.desc}</p></div>
            <button onClick={() => setSelectedFabric(material.name)} className={`absolute top-4 right-4 px-3 py-1.5 text-[9px] uppercase tracking-[.15em] font-[Instrument_Sans] transition-all ${selectedFabric === material.name ? "bg-[#2a2015] text-white" : "bg-white/80 text-[#2a2015] hover:bg-[#2a2015] hover:text-white"}`}>Explore</button>
          </motion.div>)}
        </div>
      </section>

      <section className="py-24 md:py-32 px-6 md:px-12 bg-gradient-to-b from-[#f7f4f0] to-[#efeae3]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div><h3 className="text-3xl md:text-5xl font-light mb-4">{selectedFabric} <span className="italic text-[#8a3e22]">Stories</span></h3><p className="text-sm text-[#777] font-[Instrument_Sans] mb-8">{fabricDetails[selectedFabric].desc}</p><div className="w-12 h-px bg-[#8a3e22] mb-6" /><p className="text-sm text-[#555] leading-[1.85] mb-6">At PRATIKSHYA FASHON, every {selectedFabric.toLowerCase()} piece is selected for its drape, detail and the occasion it will become part of.</p><h4 className="text-[10px] uppercase tracking-[.2em] text-[#777] mb-3">Discover the edit</h4><div className="flex flex-wrap gap-2">{fabricDetails[selectedFabric].products.map((product) => <a key={product} href="#collections" className="px-3 py-1.5 border border-[#ddd] text-[10px] uppercase tracking-[.1em] font-[Instrument_Sans] hover:bg-[#2a2015] hover:text-white hover:border-[#2a2015] transition-all">{product}</a>)}</div></div>
          <div className="relative overflow-hidden aspect-[4/5] shadow-2xl shadow-[#2a2015]/10"><PratikshyaImage image={materials.find((item) => item.name === selectedFabric).img} alt={`${selectedFabric} textile detail`} className="w-full h-full object-cover" /></div>
        </div>
      </section>

      <section id="collections" className="py-24 md:py-36 px-6 md:px-12 bg-[#2a2015] text-[#fdf8f3]"><div className="max-w-7xl mx-auto"><h2 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight mb-4">Saree & <span className="italic text-[#c9a44c]">Lehenga</span></h2><p className="font-[Instrument_Sans] text-sm text-[#aaa] mb-14">Pato, cotton, silk, Banarasi, designer and wedding sarees alongside bridal, festive and party lehengas.</p><div className="grid md:grid-cols-2 gap-6 md:gap-8"><a href="#women" className="group relative overflow-hidden aspect-[4/3] md:aspect-[16/10]"><PratikshyaImage image="saree-banarasi" alt="Pato, Banarasi and silk saree collection" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" /><div className="absolute inset-0 bg-gradient-to-r from-[#2a2015]/60 to-transparent" /><div className="absolute bottom-6 left-6 md:bottom-10 md:left-10"><h3 className="text-3xl md:text-5xl font-light mb-2">Saree Collection</h3><p className="text-xs text-[#aaa]">Pato · cotton · silk · Banarasi · festive.</p></div></a><a href="#bridal" className="group relative overflow-hidden aspect-[4/3] md:aspect-[16/10]"><PratikshyaImage image="lehenga-bridal" alt="Bridal and wedding lehenga collection" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" /><div className="absolute inset-0 bg-gradient-to-l from-[#2a2015]/60 to-transparent" /><div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 text-right"><h3 className="text-3xl md:text-5xl font-light mb-2">Lehenga Collection</h3><p className="text-xs text-[#aaa]">Bridal · wedding · designer · party.</p></div></a></div></div></section>

      <section id="bridal" className="py-32 md:py-48 px-6 md:px-12 max-w-7xl mx-auto"><h2 className="text-3xl md:text-6xl lg:text-7xl font-light tracking-tight mb-4">The <span className="italic text-[#8a3e22]">Celebration</span> Edit</h2><p className="font-[Instrument_Sans] text-sm text-[#777] max-w-xl mb-16">A composed wardrobe for weddings and every gathering around them.</p><div className="grid md:grid-cols-2 gap-12 md:gap-20">{editorialCollections.map((collection) => <motion.article id={collection.anchor} key={collection.title} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .6 }} className="group"><div className="overflow-hidden aspect-[4/3] mb-6"><PratikshyaImage image={collection.image} alt={collection.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" /></div><p className="font-[Instrument_Sans] text-[10px] uppercase tracking-[.25em] text-[#8a3e22] mb-3">{collection.eyebrow}</p><h3 className="text-3xl md:text-4xl font-light mb-3">{collection.title}</h3><p className="font-[Instrument_Sans] text-sm leading-[1.8] text-[#777] max-w-md">{collection.description}</p></motion.article>)}</div></section>

      <section className="py-24 md:py-36 px-6 md:px-12 max-w-7xl mx-auto"><h2 className="text-3xl md:text-5xl font-light tracking-tight mb-14">Selected <span className="italic text-[#8a3e22]">Pieces</span></h2><div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">{products.map((product) => <a href="#collections" key={product.id} className="group"><div className="relative overflow-hidden bg-[#f0ebe6] aspect-[3/4] mb-5"><PratikshyaImage image={product.image} hoverImage={product.hoverImage} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" /><div className="absolute top-3 left-3 bg-[#8a3e22] text-white text-[9px] uppercase tracking-widest px-2 py-1">{product.label}</div></div><h4 className="text-base md:text-lg font-light mb-1">{product.name}</h4><div className="flex items-center gap-3 font-[Instrument_Sans] text-xs"><span className="text-[#2a2015] font-medium">₹{product.price.toLocaleString()}</span><span className="hidden sm:inline text-[#aaa] line-through">₹{product.originalPrice.toLocaleString()}</span></div></a>)}</div></section>

      <section className="py-24 md:py-36 px-6 md:px-12 bg-gradient-to-r from-[#8a3e22] to-[#5a2a18] text-[#fdf8f3] text-center relative overflow-hidden"><PratikshyaImage image={offer.images.atelier} alt="Festive fashion textile campaign" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity" /><div className="absolute inset-0 opacity-[.08]" style={{ backgroundImage: "radial-gradient(circle, #fdf8f3 1px, transparent 1px)", backgroundSize: "24px 24px" }} /><div className="relative z-10 max-w-3xl mx-auto"><h2 className="text-4xl md:text-7xl lg:text-8xl font-light tracking-tight mb-2">{offer.title}</h2><h3 className="text-xl md:text-3xl font-light text-[#e8d5c4] mb-6">{offer.subtitle}</h3><p className="font-[Instrument_Sans] text-sm text-[#e8c8b8] mb-10">{offer.desc}</p><a href="#collections" className="inline-flex items-center gap-3 bg-[#fdf8f3] text-[#8a3e22] px-10 py-4 text-xs uppercase tracking-[.2em] font-[Instrument_Sans] hover:bg-[#2a2015] hover:text-[#fdf8f3] transition-all">Shop the Edit <ArrowRight size={14} /></a></div></section>

      <section className="py-32 md:py-48 px-6 md:px-12 max-w-5xl mx-auto text-center"><h2 className="text-4xl md:text-6xl lg:text-8xl font-light tracking-tight mb-4">Our <span className="italic text-[#8a3e22]">Story</span></h2><p className="font-[Instrument_Sans] text-xs uppercase tracking-[.3em] text-[#777] mb-12">PRATIKSHYA FASHON</p><p className="font-[Instrument_Sans] text-sm md:text-base text-[#555] leading-[1.9] max-w-2xl mx-auto">PRATIKSHYA FASHON brings together the richness of textile craft and the joy of dressing for life’s most meaningful occasions. From the everyday grace of a cotton saree to bridal splendour, every piece is selected with warmth, intention and respect for tradition.</p></section>

      <footer className="bg-[#2a2015] text-[#fdf8f3] px-6 md:px-12 py-16"><div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10 mb-12"><div><h4 className="text-xl mb-4">PRATIKSHYA FASHON</h4><p className="font-[Instrument_Sans] text-xs text-[#aaa]">Fashion, textile and celebration—considered with care.</p></div><FooterColumn title="Women" items={["Sarees", "Pato Sarees", "Lehengas", "Innerwear"]} /><FooterColumn title="Occasions" items={["Bridal", "Wedding Wear", "Men + Groom", "Kids Festive"]} /><FooterColumn title="Customer Care" items={["Bangles + Jewellery", "New Arrivals", "About Us", "Policies + Contact"]} /></div><div className="max-w-7xl mx-auto pt-8 border-t border-[#3a2a1e] flex flex-wrap gap-3 justify-between text-[10px] text-[#666] font-[Instrument_Sans]"><span>© 2026 PRATIKSHYA FASHON</span><span>Privacy · Terms · Contact</span></div></footer>
    </main>
  );
}

function FooterColumn({ title, items }) { return <div><h5 className="text-[10px] uppercase tracking-[.2em] text-[#c9a44c] mb-4">{title}</h5><ul className="space-y-2 font-[Instrument_Sans] text-xs text-[#aaa]">{items.map((item) => <li key={item}><a href="#top" className="hover:text-white">{item}</a></li>)}</ul></div>; }
