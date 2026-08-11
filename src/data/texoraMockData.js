import { imageRef } from "./texoraImageManifest";

export const products = [
  { id: 1, name: "Ivory Banarasi Silk Saree", category: "Sarees", material: "Banarasi Silk", price: 8499, originalPrice: 12999, image: imageRef("saree-banarasi"), hoverImage: imageRef("saree-traditional"), label: "Heritage" },
  { id: 2, name: "Crimson Bridal Lehenga", category: "Lehengas", material: "Silk Zari", price: 48999, originalPrice: 72999, image: imageRef("lehenga-bridal"), hoverImage: imageRef("women-bridal-wear"), label: "Bridal" },
  { id: 3, name: "Navy Silk Sherwani", category: "Men", material: "Silk Blend", price: 12999, originalPrice: 18999, image: imageRef("groom-sherwani"), hoverImage: imageRef("men-sherwani"), label: "Groom" },
  { id: 4, name: "Golden Handwoven Dupatta", category: "Accessories", material: "Embroidered Silk", price: 2499, originalPrice: 3999, image: imageRef("accessory-dupattas"), hoverImage: imageRef("fabric-embroidered"), label: "Textile" },
  { id: 5, name: "Cotton Linen Kurta Set", category: "Men", material: "Cotton Linen", price: 3499, originalPrice: 4999, image: imageRef("men-kurta"), hoverImage: imageRef("fabric-linen"), label: "New" },
  { id: 6, name: "Designer Printed Saree", category: "Sarees", material: "Printed Georgette", price: 5999, originalPrice: 8999, image: imageRef("saree-printed"), hoverImage: imageRef("fabric-printed"), label: "Festive" },
  { id: 7, name: "Kids Ethnic Kurta Set", category: "Kids", material: "Cotton Silk", price: 1899, originalPrice: 2799, image: imageRef("kids-kurta-sets"), hoverImage: imageRef("kids-festive-wear"), label: "Kids" },
  { id: 8, name: "Handwoven Cotton Saree", category: "Sarees", material: "Cotton", price: 3999, originalPrice: 5799, image: imageRef("saree-cotton"), hoverImage: imageRef("fabric-cotton"), label: "Handloom" },
  { id: 9, name: "Silver Embroidered Lehenga", category: "Lehengas", material: "Embroidered Organza", price: 35999, originalPrice: 52999, image: imageRef("lehenga-designer"), hoverImage: imageRef("lehenga-party"), label: "Designer" },
  { id: 10, name: "Silk Chiffon Saree", category: "Sarees", material: "Silk Chiffon", price: 6999, originalPrice: 9999, image: imageRef("saree-silk"), hoverImage: imageRef("fabric-chiffon"), label: "Premium" },
];

export const offer = {
  title: "Seasonal Offer",
  subtitle: "40% Off",
  desc: "Celebrate the season with our curated textile collection. Limited time only.",
  code: "TEXORA40",
  images: {
    atelier: imageRef("fabric-cotton"),
  },
};
