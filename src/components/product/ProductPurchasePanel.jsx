import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, MapPin, RotateCcw, ShoppingBag, Star, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AtelierBadge,
  AtelierButton,
  discountPercent,
  formatPrice,
  heading,
  transition,
} from "../../design-system";
import { colorSwatches } from "../../data/products/taxonomy";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { getMaxQuantity } from "../../utils/shopping";
import { cn } from "../../utils/cn";
import QuantityStepper from "../cart/QuantityStepper";

const isFreeSizeOnly = (sizes = []) => sizes.length === 0 || (sizes.length === 1 && sizes[0] === "Free Size");

const sizeLabelFor = (product) => {
  if (product.category === "kidswear") return "Age / Size";
  if (product.category === "bangles") return "Bangle Size";
  if (product.category === "sarees") return "Blouse Size";
  return "Size";
};

const availabilityCopy = (product) => {
  if (product.availability === "unavailable") return "Currently unavailable";
  if (product.availability === "made-to-order") return "Available for order · Made for you";
  if (product.availability === "low-stock") return `Only ${Math.max(product.stock, 1)} ${product.stock === 1 ? "piece" : "pieces"} left`;
  return "In stock · Ready to dispatch";
};

function Feedback({ message, kind = "success", action = null }) {
  return (
    <AnimatePresence mode="wait">
      {message ? (
        <motion.div
          key={message}
          role={kind === "error" ? "alert" : "status"}
          aria-live="polite"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={cn(
            "mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-ui text-[11px] tracking-wide",
            kind === "error" ? "text-accent" : "text-cocoa"
          )}
        >
          <span className="inline-flex items-center gap-2">
            {kind === "success" ? <Check size={14} aria-hidden="true" /> : null}
            {message}
          </span>
          {kind === "success" ? action : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function DeliveryCheck({ product }) {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState("");

  const check = (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      setResult("Please enter a valid 6-digit pincode.");
      return;
    }
    setResult(
      product.availability === "made-to-order"
        ? `Made-to-order delivery is available to ${pincode}.`
        : `Delivery is available to ${pincode}.`
    );
  };

  return (
    <div className="border-t border-mist/80 pt-6">
      <div className="mb-3 flex items-center gap-3">
        <MapPin size={16} strokeWidth={1.5} className="text-accent" aria-hidden="true" />
        <div>
          <p className="font-ui text-[10px] uppercase tracking-[.18em] text-ink">Delivery</p>
          <p className="mt-1 font-ui text-xs text-taupe">Enter your pincode to check availability.</p>
        </div>
      </div>
      <form onSubmit={check} className="flex max-w-sm border-b border-ink">
        <label htmlFor={`pincode-${product.id}`} className="sr-only">Delivery pincode</label>
        <input
          id={`pincode-${product.id}`}
          value={pincode}
          onChange={(event) => {
            setPincode(event.target.value.replace(/\D/g, "").slice(0, 6));
            setResult("");
          }}
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="751001"
          className="min-w-0 flex-1 bg-transparent py-2 font-ui text-sm text-ink outline-none placeholder:text-taupe/70"
        />
        <button type="submit" className="px-2 font-ui text-[10px] uppercase tracking-[.16em] text-accent hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent">
          Check
        </button>
      </form>
      {result ? <p role="status" className="mt-2 font-ui text-[11px] text-cocoa">{result}</p> : null}
    </div>
  );
}

export default function ProductPurchasePanel({ product }) {
  const wishlist = useWishlist();
  const cart = useCart();
  const navigate = useNavigate();
  const requiresSize = !isFreeSizeOnly(product.sizes);
  const availableColors = product.colors.filter((color) => !product.unavailableColors.includes(color));
  const [color, setColor] = useState(availableColors[0] ?? null);
  const [size, setSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState({ message: "", kind: "success" });
  const isSaved = wishlist.isSaved(product);
  const unavailable = product.availability === "unavailable";
  const maximum = getMaxQuantity(product);
  const discount = discountPercent(product.price, product.originalPrice);

  useEffect(() => {
    setColor(availableColors[0] ?? null);
    setSize(null);
    setQuantity(1);
    setFeedback({ message: "", kind: "success" });
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!feedback.message) return undefined;
    const timer = window.setTimeout(() => setFeedback({ message: "", kind: "success" }), 4200);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const badges = useMemo(
    () =>
      [
        product.isNew ? "New" : null,
        product.isBestseller ? "Bestseller" : null,
        product.isFeatured ? "Featured" : null,
        ...product.badges,
      ]
        .filter(Boolean)
        .filter((badge, index, list) => list.indexOf(badge) === index)
        .slice(0, 2),
    [product]
  );

  const selection = { color, size: requiresSize ? size : product.sizes[0] ?? null, quantity };

  const validate = () => {
    if (unavailable) {
      setFeedback({ message: "This piece is currently unavailable.", kind: "error" });
      return false;
    }
    if (product.colors.length && !color) {
      setFeedback({ message: "Please select an available colour.", kind: "error" });
      return false;
    }
    if (requiresSize && !size) {
      setFeedback({ message: `Please select a ${sizeLabelFor(product).toLowerCase()}.`, kind: "error" });
      return false;
    }
    return true;
  };

  const addToCart = () => {
    if (!validate()) return;
    const result = cart.addToCart(product, selection);
    setFeedback({
      message: result.message,
      kind: result.ok ? "success" : "error",
      showBag: result.ok,
    });
  };

  const buyNow = () => {
    if (!validate()) return;
    const held = cart.getCartItemQuantity(product, selection);
    const result = held > 0 ? { ok: true } : cart.addToCart(product, selection);
    if (!result.ok) {
      setFeedback({ message: result.message, kind: "error" });
      return;
    }
    navigate("/checkout");
  };

  const toggleWishlist = () => {
    wishlist.toggle(product);
    setFeedback({
      message: isSaved ? "Removed from your wishlist." : "Saved to your wishlist.",
      kind: "success",
    });
  };

  return (
    <div className="min-w-0 md:pt-1">
      <div className="flex flex-wrap gap-2">
        {badges.map((badge, index) => (
          <AtelierBadge key={badge} variant={index === 0 ? "accent" : "ink"}>{badge}</AtelierBadge>
        ))}
      </div>

      <p className="mt-6 font-ui text-[10px] uppercase tracking-[.22em] text-accent">
        {product.categoryLabel} · {product.subcategory}
      </p>
      <h1 className={cn(heading.xl, "mt-3 max-w-xl text-[2.45rem] leading-[.98] sm:text-5xl lg:text-[3.25rem]")}>
        {product.name}
      </h1>

      <a href="#product-details" className="mt-5 inline-flex items-center gap-2 font-ui text-xs text-graphite hover:text-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent">
        <span className="flex text-gold" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} size={13} strokeWidth={1.4} fill={index < Math.round(product.rating) ? "currentColor" : "none"} />
          ))}
        </span>
        <span className="font-medium text-ink">{product.rating.toFixed(1)}</span>
        <span className="text-taupe">{product.reviewCount.toLocaleString("en-IN")} Reviews</span>
        <span className="sr-only">Rated {product.rating} out of 5</span>
      </a>

      <div className="mt-7 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-mist/80 pb-7">
        <span className="font-display text-3xl text-ink">{formatPrice(product.price)}</span>
        {product.originalPrice ? (
          <span className="font-ui text-sm text-taupe line-through">{formatPrice(product.originalPrice)}</span>
        ) : null}
        {discount ? (
          <span className="font-ui text-[10px] uppercase tracking-[.16em] text-accent">{discount}% off</span>
        ) : null}
        <span className="w-full font-ui text-[10px] text-taupe">
          {product.pricing?.taxMode === "EXCLUSIVE" && Number(product.pricing?.taxRate) > 0
            ? `Exclusive of ${product.pricing.taxRate}% GST`
            : "Inclusive of all taxes"}
        </span>
      </div>

      <div className="mt-6 flex items-center gap-2 font-ui text-[11px] tracking-wide text-cocoa">
        <span className={cn("h-1.5 w-1.5 rounded-full", unavailable ? "bg-taupe" : product.availability === "low-stock" ? "bg-accent" : "bg-gold")} aria-hidden="true" />
        {availabilityCopy(product)}
      </div>

      {product.colors.length ? (
        <fieldset className="mt-8">
          <legend className="font-ui text-[10px] uppercase tracking-[.18em] text-ink">
            Colour <span className="ml-2 normal-case tracking-normal text-taupe">{color ?? "Select"}</span>
          </legend>
          <div className="mt-4 flex flex-wrap gap-4">
            {product.colors.map((option) => {
              const disabled = product.unavailableColors.includes(option);
              const selected = color === option;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={disabled}
                  aria-label={`${option}${disabled ? ", unavailable" : ""}`}
                  aria-pressed={selected}
                  onClick={() => setColor(option)}
                  className={cn(
                    "group/swatch flex items-center gap-2 font-ui text-[11px] text-graphite outline-none",
                    "focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-canvas",
                    disabled && "cursor-not-allowed opacity-35 line-through"
                  )}
                >
                  <span
                    className={cn("flex h-7 w-7 items-center justify-center rounded-full border border-ink/15", selected && "ring-1 ring-accent ring-offset-3 ring-offset-canvas")}
                    style={{ backgroundColor: colorSwatches[option] ?? "#d7d0c8" }}
                    aria-hidden="true"
                  >
                    {selected ? <Check size={12} className={cn(["Ivory", "Gold", "Blush", "Beige", "Silver"].includes(option) ? "text-ink" : "text-white")} /> : null}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {requiresSize ? (
        <fieldset className="mt-8">
          <div className="flex items-baseline justify-between gap-4">
            <legend className="font-ui text-[10px] uppercase tracking-[.18em] text-ink">{sizeLabelFor(product)}</legend>
            <span className="font-ui text-[10px] text-taupe">Select one</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((option) => {
              const disabled = product.unavailableSizes.includes(option);
              return (
                <AtelierButton
                  key={option}
                  variant="toggle"
                  size="chip"
                  active={size === option}
                  disabled={disabled}
                  aria-label={`${option}${disabled ? ", unavailable" : ""}`}
                  onClick={() => setSize(option)}
                  className={cn("min-w-12 justify-center border border-mist bg-transparent", disabled && "cursor-not-allowed opacity-30 line-through")}
                >
                  {option}
                </AtelierButton>
              );
            })}
          </div>
        </fieldset>
      ) : product.sizes?.[0] ? (
        <p className="mt-8 font-ui text-[10px] uppercase tracking-[.18em] text-ink">
          Drape <span className="ml-2 normal-case tracking-normal text-taupe">{product.sizes[0]}</span>
        </p>
      ) : null}

      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-mist/80 py-5 sm:grid-cols-3">
        {[
          ["Fabric", product.fabric],
          ["Craft", product.material],
          ["Occasion", product.occasion.slice(0, 2).join(", ")],
        ].filter(([, value]) => value).map(([term, value]) => (
          <div key={term}>
            <dt className="font-ui text-[9px] uppercase tracking-[.16em] text-taupe">{term}</dt>
            <dd className="mt-1 font-display text-base text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-7 flex items-center justify-between gap-5">
        <span className="font-ui text-[10px] uppercase tracking-[.18em] text-ink">Quantity</span>
        <QuantityStepper
          value={quantity}
          max={Math.max(maximum, 1)}
          onChange={setQuantity}
          label={`Quantity of ${product.name}`}
        />
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3">
        <AtelierButton
          onClick={addToCart}
          disabled={unavailable}
          variant="primary"
          size="md"
          className="col-span-2 justify-center disabled:cursor-not-allowed disabled:bg-taupe"
        >
          <ShoppingBag size={15} aria-hidden="true" /> Add to Cart
        </AtelierButton>
        <AtelierButton
          onClick={buyNow}
          disabled={unavailable}
          variant="outline"
          size="md"
          className="justify-center px-3 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Buy Now
        </AtelierButton>
        <AtelierButton
          onClick={toggleWishlist}
          variant="outline"
          size="md"
          aria-pressed={isSaved}
          className={cn("justify-center px-3", isSaved && "border-accent text-accent")}
        >
          <Heart size={15} fill={isSaved ? "currentColor" : "none"} aria-hidden="true" />
          <span className="hidden min-[390px]:inline">{isSaved ? "Saved" : "Wishlist"}</span>
        </AtelierButton>
      </div>
      <Feedback
        message={feedback.message}
        kind={feedback.kind}
        action={
          feedback.showBag ? (
            <button
              type="button"
              onClick={cart.openDrawer}
              className={cn(
                "inline-flex items-center gap-1.5 font-ui text-[10px] uppercase tracking-[.16em] text-accent underline-offset-4 hover:underline",
                transition.colors,
                "focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
              )}
            >
              View Bag
            </button>
          ) : null
        }
      />

      <div className="mt-8 space-y-6">
        <DeliveryCheck product={product} />
        <div className="grid gap-5 border-t border-mist/80 pt-6 sm:grid-cols-2">
          <div className="flex gap-3">
            <Truck size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <p className="font-ui text-[10px] uppercase tracking-[.16em]">Complimentary Delivery</p>
              <p className="mt-1 font-ui text-[11px] leading-relaxed text-taupe">{product.deliveryInfo}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <RotateCcw size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <p className="font-ui text-[10px] uppercase tracking-[.16em]">Considered Returns</p>
              <p className="mt-1 font-ui text-[11px] leading-relaxed text-taupe">{product.returnInfo}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-mist bg-canvas/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
        <AtelierButton onClick={addToCart} disabled={unavailable} variant="primary" size="md" className="justify-center px-3 disabled:bg-taupe">
          Add to Cart
        </AtelierButton>
        <AtelierButton onClick={buyNow} disabled={unavailable} variant="outline" size="md" className="justify-center bg-canvas px-3 disabled:opacity-40">
          Buy Now
        </AtelierButton>
      </div>
    </div>
  );
}
