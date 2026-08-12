# PRATIKSHYA FASHON — Media ingestion report (Phase 21.4)

Generated: 2026-08-12T21:22:21.970Z

This file is produced by `npm run media:optimize`. Source originals under
`public/media` and `public/images` are never deleted. Application surfaces
read `public/library` plus the existing house plates.

## Inventory

| Measure | Count |
| --- | ---: |
| Total images | 179 |
| Optimized | 169 |
| Skipped (already web-ready house plates) | 10 |
| Exact duplicates | 5 |
| Possible duplicates | 2 |
| Mapped | 143 |
| Unmapped | 5 |
| Needs review | 31 |
| Broken | 0 |
| Large originals (≥ 1.5 MB) | 26 |
| Low-resolution (< 400px wide) | 0 |
| Mapped to products | 70 |
| Mapped to categories | 172 |

## Storage

| | |
| --- | --- |
| Before (source files scanned) | 103.8 MB |
| After (optimized library + untouched house plates) | 20.6 MB |
| Reduction | 80.2% |

Tradeoff: originals remain in `public/media` so high-resolution recoverability
is preserved. The application never reads those originals at runtime.

## Taxonomy

- Categories mapped: 9
- Subcategories mapped: 7
- Collections mapped: 6
- Distinct products with slotted media: 26

## Usage roles

| Role | Assets |
| --- | ---: |
| Hero | 15 |
| Category | 71 |
| Product | 70 |
| Editorial | 33 |
| New arrival | 10 |
| Sale | 46 |
| Collection | 43 |
| AI Shopping | 101 |
| AI Mirror | 70 |

## Manual review

### Unmapped

- `media/accesories/anklet/0de41338fe996ffa7c75d03013bd00be.jpg.jpeg`
- `media/accesories/anklet/3b0d429b9398dfc186ebd35beb9ef0ea.jpg.jpeg`
- `media/accesories/anklet/3d3be3f654b9be8b97b93eb95fec52cb.jpg.jpeg`
- `media/accesories/anklet/aded103d73a5036c2dd8f0a92c971d3f.jpg.jpeg`
- `media/accesories/anklet/dbfc4599cffcdb9f07ab09e9c63a19fe.jpg.jpeg`

### Needs review

- `media/men/Kurta pajama/kurta_pajama1/05fa125acce4310784740803bf51aba9.jpg.jpeg`
- `media/men/Kurta pajama/kurta_pajama1/side1.png`
- `media/men/Kurta pajama/kurta_pajama2/05fa125acce4310784740803bf51aba9.jpg.jpeg`
- `media/men/Kurta pajama/kurta_pajama2/ChatGPT Image Aug 12, 2026, 04_37_55 PM.png`
- `media/men/Kurta pajama/kurta_pajama2/WhatsApp Image 2026-08-12 at 4.46.51 PM.jpeg`
- `media/men/Kurta pajama/kurta_pajama3/57f3b75bc519cf772d40c576ed5673ad.jpg.jpeg`
- `media/men/Kurta pajama/kurta_pajama3/ChatGPT Image Aug 12, 2026, 04_42_44 PM.png`
- `media/men/sherwani_marriage/s4/a_I_am_making_a_ecomm (3).jpeg`
- `media/men/sherwani_marriage/s4/b_I_am_making_a_ecomm (2).jpeg`
- `media/men/sherwani_marriage/s4/download (9).jpg`
- `media/men/sherwani_marriage/s5/a_making_a_ecommerce_a.jpeg`
- `media/men/sherwani_marriage/s5/b_making_a_ecommerce_a.jpeg`
- `media/men/sherwani_marriage/s6/a_making_a_ecommerce_a (1).jpeg`
- `media/men/sherwani_marriage/s6/b_making_a_ecommerce_a (1).jpeg`
- `media/men/sherwani_marriage/s6/Royal Indian groom aesthetics with timeless elegance, tradition and modern charm_ 🤵✨.jpg`
- `media/women/saree/bandhani/b1/a_making_a_ecommerce_a (2).png`
- `media/women/saree/bandhani/b1/b_making_a_ecommerce_a (4).png`
- `media/women/saree/bandhani/b1/Stunning Bandhani Saree Look ❤️ Traditional Indian Saree Style for Weddings & Festivals.jpg`
- `media/women/saree/chanderi/c1/a_making_a_ecommerce_a (1).png`
- `media/women/saree/chanderi/c1/b_making_a_ecommerce_a (3).png`
- `media/women/saree/chanderi/c1/Buy Chanderi Silk Sarees Online at Priyanka Raajiv.jpg`
- `media/women/saree/cotton sarees/cs6/a_I_am_making_a_ecomm.jpeg`
- `media/women/saree/cotton sarees/cs6/b_I_am_making_a_ecomm.jpeg`
- `media/women/saree/silk sarees/silk saree 3/🧡 Rust Orange Cotton Silk Saree with Green Border  Timeless Traditional Saree Inspiration.jpg`
- `media/women/saree/silk sarees/silk saree 3/gpt-image-1.5-high-fidelity_a_Form_different_angle.png`
- `media/women/saree/silk sarees/silk saree 3/seedream-4.5_b_Form_different_angle.jpeg`
- `media/women/saree/silk sarees/silk saree1/a_I_am_making_a_ecomm.png`
- `media/women/saree/silk sarees/silk saree1/a2710dae0bbee399d7877513a3764382.jpg.jpeg`
- `media/women/saree/silk sarees/silk saree1/b_I_am_making_a_ecomm.png`
- `media/women/saree/silk sarees/silk sarees6/A photograph of a person in a traditional Indian saree with copper zari work, in a blurred indoor.jpg`
- `media/women/saree/silk sarees/silk sarees6/b_i_need_this_image_fr.png`

### Exact duplicates (kept, not deleted)

- `media/men/Kurta pajama/kurta_pajama2/05fa125acce4310784740803bf51aba9.jpg.jpeg` → pm-ing-432e99d311fe
- `media/women/marriage/g1/a_making_a_ecommerce_a.png` → pm-ing-ef18fdfbf784
- `media/women/marriage/g4/b_making_a_ecommerce_a.png` → pm-ing-30cbd2a119ae
- `media/women/saree/baranasi/banarasi pata/1786538988732~2.jpg.jpeg` → pm-ing-9f8e8c1d2d91
- `media/women/saree/baranasi/banarasi pata/54d67fd8fc113bc7354738157e934e66.jpg.jpeg` → pm-ing-9771ff5c286c
