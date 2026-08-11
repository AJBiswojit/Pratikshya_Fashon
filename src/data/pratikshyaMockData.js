import { imageRef } from "./pratikshyaImageManifest";

export const products = [
  { id: 1, name: "Heritage Banarasi Silk Saree", category: "Sarees", material: "Banarasi Silk", price: 8499, originalPrice: 12999, image: imageRef("saree-banarasi"), hoverImage: imageRef("saree-traditional"), label: "Heritage" },
  { id: 2, name: "Ivory Bridal Lehenga", category: "Lehengas", material: "Silk Zari", price: 48999, originalPrice: 72999, image: imageRef("lehenga-bridal"), hoverImage: imageRef("women-bridal-wear"), label: "Bridal" },
  { id: 3, name: "Rose Gold Bridal Bangles", category: "Jewellery", material: "Hand-finished Metalwork", price: 4299, originalPrice: 6499, image: imageRef("bridal-bangles"), hoverImage: imageRef("bridal-jewellery"), label: "Jewellery" },
  { id: 4, name: "Men's Ivory Wedding Kurta", category: "Men", material: "Silk Blend", price: 12999, originalPrice: 18999, image: imageRef("groom-sherwani"), hoverImage: imageRef("men-sherwani"), label: "Groom" },
  { id: 5, name: "Festive Designer Saree", category: "Sarees", material: "Printed Georgette", price: 5999, originalPrice: 8999, image: imageRef("saree-printed"), hoverImage: imageRef("fabric-printed"), label: "Festive" },
  { id: 6, name: "Handwoven Cotton Saree", category: "Sarees", material: "Cotton", price: 3999, originalPrice: 5799, image: imageRef("saree-cotton"), hoverImage: imageRef("fabric-cotton"), label: "Handloom" },
  { id: 7, name: "Kids Festive Kurta Set", category: "Kids", material: "Cotton Silk", price: 1899, originalPrice: 2799, image: imageRef("kids-kurta-sets"), hoverImage: imageRef("kids-festive-wear"), label: "Kids" },
  { id: 8, name: "Silver Embroidered Lehenga", category: "Lehengas", material: "Embroidered Organza", price: 35999, originalPrice: 52999, image: imageRef("lehenga-designer"), hoverImage: imageRef("lehenga-party"), label: "Designer" },
];

export const offer = {
  title: "Festive Edit",
  subtitle: "An occasion, beautifully considered.",
  desc: "A limited selection of sarees, lehengas and heirloom finishing touches for the season's celebrations.",
  code: "PRATIKSHYA40",
  images: { atelier: imageRef("fabric-cotton") },
};

export const editorialCollections = [
  { eyebrow: "Bridal + Wedding", title: "For the promises that become heirlooms.", description: "Bridal sarees, wedding lehengas, ceremonial jewellery and groom collections—composed for every part of the celebration.", image: "women-bridal-wear", anchor: "bridal" },
  { eyebrow: "Bangles + Jewellery", title: "The finishing language of an occasion.", description: "Bangles, earrings, necklaces, bracelets, rings and bridal jewellery chosen to hold the light.", image: "bridal-bangles", anchor: "jewellery" },
  { eyebrow: "Men + Groom", title: "A considered ceremonial wardrobe.", description: "Kurta, kurta pajama, ethnic wear and groom edits, tailored for the celebration.", image: "men-kurta", anchor: "men" },
  { eyebrow: "Little Celebrations", title: "Festive pieces for the youngest guests.", description: "Girls wear, boys wear, ethnic sets and party silhouettes with a gentle sense of occasion.", image: "kids-festive-wear", anchor: "kids" },
];
