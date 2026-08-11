import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ProductCard, gap, useReveal } from "../../design-system";
import { productHref } from "../../data/products";
import { useWishlist } from "../../context/WishlistContext";
import { cn } from "../../utils/cn";

/**
 * The catalogue grid.
 *
 * Lays out Phase 2 product cards on the Atelier column rhythm: two up on
 * every phone and tablet, three from the laptop breakpoint upward.
 *
 * Three rather than four is deliberate. With the filter index occupying the
 * left column, four would render a card narrower than the landing page's
 * product tile; three keeps the plate at the scale the brand already uses.
 *
 * The card itself is untouched — this component only decides how many sit in
 * a row, what each one links to and which of them are saved. The first row is
 * eager-loaded; everything below the fold inherits the manifest's lazy
 * loading.
 */
export default function ProductGrid({ products, className = "" }) {
  const wishlist = useWishlist();
  const reveal = useReveal();

  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-3", gap.tile, className)}>
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          {...reveal}
          transition={{ ...reveal.transition, delay: Math.min(index % 8, 4) * 0.04 }}
        >
          <ProductCard
            product={product}
            as={Link}
            to={productHref(product)}
            showCategory
            showDiscount
            showAvailability
            onWishlist={wishlist.toggle}
            isWishlisted={wishlist.isSaved(product)}
            wishlistIcon={Heart}
          />
        </motion.div>
      ))}
    </div>
  );
}
