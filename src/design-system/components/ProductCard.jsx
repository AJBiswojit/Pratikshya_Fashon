import { cn } from "../../utils/cn";
import { heading, price as priceType } from "../typography";
import AtelierBadge from "./AtelierBadge";
import MediaFrame from "./MediaFrame";

/**
 * The Atelier product card.
 *
 * Image plate, then a quiet two-line caption: name, then price. Everything
 * beyond that — category, original price, discount, badge, availability,
 * wishlist — is optional and off by default, so the card stays editorial
 * rather than turning into a marketplace tile.
 *
 * The whole card is one link; the wishlist control, when present, sits above
 * it and stops the click from propagating.
 *
 * `as` swaps the link element — pass the router's `Link` (with `to`) inside
 * the application, leave it alone for a plain anchor.
 */

export const formatPrice = (value) =>
  typeof value === "number" ? `₹${value.toLocaleString("en-IN")}` : value;

export const discountPercent = (current, original) =>
  typeof current === "number" && typeof original === "number" && original > current
    ? Math.round(((original - current) / original) * 100)
    : null;

export default function ProductCard({
  product,
  as: Tag = "a",
  href = "#",
  showCategory = false,
  showOriginalPrice = true,
  showDiscount = false,
  showBadge = true,
  showAvailability = false,
  onWishlist,
  isWishlisted = false,
  wishlistIcon: WishlistIcon,
  className = "",
  ...rest
}) {
  const {
    name,
    category,
    price,
    originalPrice,
    label,
    image,
    hoverImage,
    inStock = true,
    availabilityText = "",
  } = product;

  const discount = showDiscount ? discountPercent(price, originalPrice) : null;

  return (
    <Tag href={Tag === "a" ? href : undefined} className={cn("group", className)} {...rest}>
      <MediaFrame
        image={image}
        hoverImage={hoverImage}
        alt={name}
        aspect="product"
        zoom="strong"
        surface
        className="mb-5"
      >
        {showBadge && label ? (
          <AtelierBadge className="absolute top-3 left-3">{label}</AtelierBadge>
        ) : null}

        {showAvailability && !inStock ? (
          <span className="absolute inset-0 flex items-center justify-center bg-ink/50 font-ui text-[10px] uppercase tracking-[.2em] text-ivory">
            {availabilityText || "Currently unavailable"}
          </span>
        ) : null}

        {onWishlist ? (
          <button
            type="button"
            aria-label={isWishlisted ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
            aria-pressed={isWishlisted}
            onClick={(event) => {
              event.preventDefault();
              onWishlist(product);
            }}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center bg-white/80 text-ink transition-all hover:bg-ink hover:text-white"
          >
            {WishlistIcon ? (
              <WishlistIcon size={14} fill={isWishlisted ? "currentColor" : "none"} />
            ) : null}
          </button>
        ) : null}
      </MediaFrame>

      {showCategory && category ? (
        <p className="font-ui text-[10px] uppercase tracking-[.2em] text-taupe mb-1">
          {category}
        </p>
      ) : null}

      <h4 className={cn(heading.product, "mb-1")}>{name}</h4>

      <div className={priceType.row}>
        <span className={priceType.current}>{formatPrice(price)}</span>
        {showOriginalPrice && originalPrice ? (
          <span className={cn("hidden sm:inline", priceType.original)}>
            {formatPrice(originalPrice)}
          </span>
        ) : null}
        {discount ? <span className={priceType.discount}>{discount}% off</span> : null}
      </div>
      {showAvailability && inStock && availabilityText ? (
        <p className="mt-1.5 font-ui text-[9px] uppercase tracking-[.15em] text-accent">
          {availabilityText}
        </p>
      ) : null}
    </Tag>
  );
}
