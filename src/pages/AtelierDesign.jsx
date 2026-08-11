import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { products, offer } from "../data/texoraMockData";
import { useState } from "react";
import TexoraImage from "../components/TexoraImage";
import { imageRef } from "../data/texoraImageManifest";

export default function AtelierDesign() {
  const [selectedFabric, setSelectedFabric] = useState("Silk");
  const fabricDetails = {
    Silk: { desc: "Smooth · Lustrous · Refined", products: ["Bridal Lehenga", "Silk Saree", "Designer Lehenga"], color: "#8a3e22" },
    Cotton: { desc: "Breathable · Natural · Everyday", products: ["Cotton Saree", "Linen Kurta", "Handwoven Dupatta"], color: "#2a5a3a" },
    Linen: { desc: "Lightweight · Textured · Effortless", products: ["Linen Shirt", "Cotton Blend Saree", "Linen Dress"], color: "#7a6a4e" },
  };

  return (
    <main className="min-h-screen bg-[#f7f4f0] text-[#2a2015] font-[Cormorant_Garamond] selection:bg-[#8a3e22] selection:text-white">
      {/* Atelier Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f7f4f0]/80 backdrop-blur-md border-b border-[#ddd8cf]/50">
        <div className="max-w-6xl mx-auto px-6 md:px-12 h-16 md:h-20 flex items-center justify-between">
          <a href="#" className="text-xl md:text-2xl font-light tracking-tight hover:text-[#8a3e22] transition-colors">TEXORA ATELIER</a>
          <div className="hidden md:flex gap-8 text-[10px] uppercase tracking-[0.15em] font-[Instrument_Sans] text-[#8a6e4a]">
            {["Fabric", "Craft", "Collection", "Story"].map(i => (
              <a key={i} href="#" className="hover:text-[#8a3e22] transition-colors">{i}</a>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero - Macro Fabric */}
      <section className="relative min-h-[100dvh] overflow-hidden pt-20">
        <TexoraImage image="hero-atelier" alt="TEXORA atelier macro textile campaign" loading="eager" fetchPriority="high" className="absolute inset-0 w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f7f4f0]/90 via-[#f7f4f0]/40 to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 min-h-[100dvh] flex flex-col justify-center py-24 md:py-0">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}>
            <p className="font-[Instrument_Sans] text-[10px] uppercase tracking-[0.4em] text-[#8a3e22] mb-6">Textile Atelier</p>
            <h1 className="text-6xl md:text-[9rem] lg:text-[11rem] font-light leading-[0.82] tracking-tight mb-6 md:mb-8 text-[#2a2015]">CRAFTED BY<br />HAND. <span className="italic text-[#8a3e22]">WORN BY YOU.</span></h1>
            <p className="font-[Instrument_Sans] text-sm md:text-base text-[#6a4e38] max-w-md leading-relaxed mb-10">Every garment begins with the fabric. Every fabric begins with a story. Welcome to our atelier.</p>
            <a href="#discover" className="inline-flex items-center gap-3 bg-[#2a2015] text-[#fdf8f3] px-8 py-4 text-xs uppercase tracking-[0.15em] font-[Instrument_Sans] hover:bg-[#8a3e22] transition-all">Discover The Fabric <ArrowRight size={14} /></a>
          </motion.div>
        </div>
      </section>

      {/* Discover Fabric */}
      <section id="discover" className="py-32 md:py-48 px-6 md:px-12 max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-7xl font-light tracking-tight mb-2">Discover <span className="italic text-[#8a3e22]">The Fabric</span></h2>
        <div className="w-16 h-px bg-[#8a3e22] mb-16" />
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {[
            { name: "Silk", desc: "Smooth · Lustrous · Refined", img: imageRef("fabric-silk"), color: "#8a3e22" },
            { name: "Cotton", desc: "Breathable · Natural · Everyday", img: imageRef("fabric-cotton"), color: "#2a5a3a" },
            { name: "Linen", desc: "Lightweight · Textured · Effortless", img: imageRef("fabric-linen"), color: "#7a6a4e" },
          ].map(f => (
            <motion.div key={f.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="group relative overflow-hidden aspect-[4/5]">
              <TexoraImage image={f.img} alt={`${f.name} fabric close-up`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8">
                <h3 className="text-2xl md:text-4xl font-light text-white mb-2">{f.name}</h3>
                <p className="text-[10px] md:text-xs text-[#ddd] font-[Instrument_Sans] tracking-wider">{f.desc}</p>
              </div>
              <button onClick={() => setSelectedFabric(f.name)} className={`absolute top-4 right-4 px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] font-[Instrument_Sans] transition-all ${selectedFabric === f.name ? "bg-[#2a2015] text-white" : "bg-white/80 text-[#2a2015] hover:bg-[#2a2015] hover:text-white"}`}>
                Explore
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Fabric Details */}
      <section className="py-24 md:py-32 px-6 md:px-12 bg-gradient-to-b from-[#f7f4f0] to-[#efeae3]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div>
              <h3 className="text-3xl md:text-5xl font-[Cormorant_Garamond] font-light mb-4">{selectedFabric}</h3>
              <p className="text-sm text-[#777] font-[Instrument_Sans] mb-8">{fabricDetails[selectedFabric]?.desc}</p>
              <div className="w-12 h-px bg-[#8a3e22] mb-6" />
              <p className="text-sm text-[#555] leading-[1.85] mb-6">Every {selectedFabric.toLowerCase()} garment at TEXORA is hand-selected, inspected for texture, and designed to honor the material's natural properties.</p>
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#777] mb-3">Products in {selectedFabric}</h4>
              <div className="flex flex-wrap gap-2">
                {fabricDetails[selectedFabric]?.products.map(p => (
                  <a key={p} href="#" className="px-3 py-1.5 border border-[#ddd] text-[10px] uppercase tracking-[0.1em] font-[Instrument_Sans] hover:bg-[#2a2015] hover:text-white hover:border-[#2a2015] transition-all">{p}</a>
                ))}
              </div>
            </div>
            <div className="relative overflow-hidden aspect-[4/5] shadow-2xl shadow-[#2a2015]/10">
              <TexoraImage image={selectedFabric === "Silk" ? imageRef("fabric-silk") : selectedFabric === "Cotton" ? imageRef("fabric-cotton") : imageRef("fabric-linen")} alt={`${selectedFabric} textile detail`} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Craftsmanship Sequence */}
      <section className="py-32 md:py-48 px-6 md:px-12 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-6xl lg:text-7xl font-light tracking-tight mb-4">From Fabric <span className="italic text-[#8a3e22]">To Fashion</span></h2>
        <p className="font-[Instrument_Sans] text-sm text-[#777] max-w-md mb-16">A scroll-driven journey through the atelier process.</p>
        <div className="grid md:grid-cols-2 gap-16 md:gap-24">
          <div className="space-y-24">
            {[
              { step: "01", title: "Raw Material", desc: "Sourcing the finest fibers from across India." },
              { step: "02", title: "Hand Weaving", desc: "Master artisans weave tradition into every thread." },
              { step: "03", title: "Natural Dye", desc: "Colors drawn from earth, plants, and minerals." },
              { step: "04", title: "Tailored Finish", desc: "Cut and finished with precision and care." },
            ].map(item => (
              <motion.div key={item.step} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                <span className="text-6xl md:text-8xl font-light text-[#ddd] block mb-2">{item.step}</span>
                <h3 className="text-2xl md:text-3xl font-light mb-3">{item.title}</h3>
                <p className="text-sm text-[#777] font-[Instrument_Sans]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="sticky top-32 h-fit">
            <TexoraImage image="hero-atelier" alt="Atelier fabric craftsmanship sequence" className="w-full aspect-[4/5] object-cover shadow-xl shadow-[#2a2015]/10" />
          </div>
        </div>
      </section>

      {/* Saree + Lehenga Collections */}
      <section className="py-24 md:py-36 px-6 md:px-12 bg-[#2a2015] text-[#fdf8f3]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight mb-4">Saree & <span className="italic text-[#c9a44c]">Lehenga</span></h2>
          <div className="w-12 h-px bg-[#c9a44c] mb-14" />
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <a href="#" className="group relative overflow-hidden aspect-[4/3] md:aspect-[16/10]">
              <TexoraImage image="saree-banarasi" alt="Handwoven saree textile collection" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#2a2015]/60 to-transparent" />
              <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10">
                <h3 className="text-3xl md:text-5xl font-light mb-2">Saree Collection</h3>
                <p className="text-xs text-[#aaa]">Handwoven silk, cotton, and linen masterpieces.</p>
              </div>
            </a>
            <a href="#" className="group relative overflow-hidden aspect-[4/3] md:aspect-[16/10]">
              <TexoraImage image="lehenga-bridal" alt="Bridal lehenga atelier collection" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
              <div className="absolute inset-0 bg-gradient-to-l from-[#2a2015]/60 to-transparent" />
              <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 text-right">
                <h3 className="text-3xl md:text-5xl font-light mb-2">Lehenga Collection</h3>
                <p className="text-xs text-[#aaa]">Bridal and festive elegance.</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-24 md:py-36 px-6 md:px-12 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-[Cormorant_Garamond] font-light tracking-tight mb-14">Selected <span className="italic text-[#8a3e22]">Pieces</span></h2>
        <div className="grid md:grid-cols-4 gap-6 md:gap-8">
          {products.map(p => (
            <a href="#" key={p.id} className="group">
              <div className="relative overflow-hidden bg-[#f0ebe6] aspect-[3/4] mb-5">
                <TexoraImage image={p.image} hoverImage={p.hoverImage} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                <div className="absolute top-3 left-3 bg-[#8a3e22] text-white text-[9px] uppercase tracking-widest px-2 py-1">{p.label}</div>
              </div>
              <h4 className="text-base md:text-lg font-light mb-1">{p.name}</h4>
              <div className="flex items-center gap-3 font-[Instrument_Sans] text-xs">
                <span className="text-[#2a2015] font-medium">₹{p.price.toLocaleString()}</span>
                <span className="text-[#aaa] line-through">₹{p.originalPrice.toLocaleString()}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Offer */}
      <section className="py-24 md:py-36 px-6 md:px-12 bg-gradient-to-r from-[#8a3e22] to-[#5a2a18] text-[#fdf8f3] text-center relative overflow-hidden">
        <TexoraImage image={offer.images.atelier} alt="Seasonal textile offer fabric campaign" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity" />
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle, #fdf8f3 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-7xl lg:text-8xl font-light tracking-tight mb-2">{offer.title}</h2>
          <h3 className="text-xl md:text-3xl font-light text-[#e8d5c4] mb-6">Discover Our Seasonal Textile Edit</h3>
          <p className="font-[Instrument_Sans] text-sm text-[#e8c8b8] mb-10">Hand-selected pieces from our atelier collection. Limited quantities available.</p>
          <a href="#" className="inline-flex items-center gap-3 bg-[#fdf8f3] text-[#8a3e22] px-10 py-4 text-xs uppercase tracking-[0.2em] font-[Instrument_Sans] hover:bg-[#2a2015] hover:text-[#fdf8f3] transition-all">Shop the Edit <ArrowRight size={14} /></a>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-32 md:py-48 px-6 md:px-12 max-w-5xl mx-auto text-center">
        <h2 className="text-4xl md:text-6xl lg:text-8xl font-light tracking-tight mb-4">Our <span className="italic text-[#8a3e22]">Story</span></h2>
        <p className="font-[Instrument_Sans] text-xs uppercase tracking-[0.3em] text-[#777] mb-12">TEXORA by MediXO</p>
        <p className="font-[Instrument_Sans] text-sm md:text-base text-[#555] leading-[1.9] max-w-2xl mx-auto">Every garment at TEXORA begins with a conversation — between the artisan and the fiber, between tradition and modern expression. We believe luxury is not about price; it is about intention, craft, and the stories woven into every piece.</p>
      </section>

      {/* Footer */}
      <footer className="bg-[#2a2015] text-[#fdf8f3] px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10 mb-12">
          <div><h4 className="font-[Cormorant_Garamond] text-xl mb-4">TEXORA ATELIER</h4><p className="font-[Instrument_Sans] text-xs text-[#aaa]">Craft. Material. Fashion. A premium textile experience.</p></div>
          <div><h5 className="text-[10px] uppercase tracking-[0.2em] text-[#c9a44c] mb-4">Collections</h5>
            <ul className="space-y-2 font-[Instrument_Sans] text-xs text-[#aaa]">{["Sarees", "Lehengas", "Bridal", "Groom", "Kids", "Accessories"].map(i => <li key={i}><a href="#" className="hover:text-white">{i}</a></li>)}</ul>
          </div>
          <div><h5 className="text-[10px] uppercase tracking-[0.2em] text-[#c9a44c] mb-4">Fabrics</h5>
            <ul className="space-y-2 font-[Instrument_Sans] text-xs text-[#aaa]">{["Silk", "Cotton", "Linen", "Chiffon", "Georgette", "Velvet", "Organza"].map(i => <li key={i}><a href="#" className="hover:text-white">{i}</a></li>)}</ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-[#3a2a1e] flex justify-between text-[10px] text-[#666] font-[Instrument_Sans]"><span>© 2026 TEXORA by MediXO</span><span>Privacy · Terms</span></div>
      </footer>
    </main>
  );
}
