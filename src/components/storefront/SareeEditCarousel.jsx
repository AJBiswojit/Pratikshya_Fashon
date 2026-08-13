import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import PratikshyaImage from "../PratikshyaImage";
import { Accent, AtelierSection, EditorialHeading, eyebrow } from "../../design-system";
import { useSareeEditProducts } from "../../hooks/useMedia";
import { resolveCategoryRoute } from "../../services/taxonomyRouting";
import { formatINR } from "../../utils/shopping";
import { cn } from "../../utils/cn";

/** Product cadence requested for the homepage edit. */
export const SAREE_EDIT_AUTOPLAY_MS = 2500;

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
};

const wrap = (value, count) => ((value % count) + count) % count;
const twoDigits = (value) => String(value).padStart(2, "0");

const productAlt = (product) => {
  const details = [product.colors?.[0], product.subcategory].filter(Boolean).join(", ");
  return details ? `${product.name} — ${details}` : product.name;
};

const productMeta = (product) =>
  [product.fabric, product.colors?.[0], product.collection]
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 3);

function PriceLine({ product, inverse = false }) {
  if (product.price == null || product.price === "" || !Number.isFinite(Number(product.price))) return null;
  const hasReduction =
    product.originalPrice != null &&
    product.originalPrice !== "" &&
    Number.isFinite(Number(product.originalPrice)) &&
    Number(product.originalPrice) > Number(product.price);

  return (
    <p className={cn("flex flex-wrap items-center gap-2 font-ui text-xs", inverse ? "text-white" : "text-ink")}>
      <span className="font-medium">{formatINR(product.price)}</span>
      {hasReduction ? (
        <span className={cn("line-through", inverse ? "text-pearl" : "text-taupe")}>
          {formatINR(product.originalPrice)}
        </span>
      ) : null}
    </p>
  );
}

function ActiveSareeCard({ entry, slideNumber, slideCount, priority, animationClass, onSwipeClick }) {
  const { product, image, route } = entry;
  const meta = productMeta(product);

  return (
    <article
      aria-roledescription="slide"
      aria-label={`${slideNumber} of ${slideCount}: ${product.name}`}
      className={cn("min-w-0", animationClass)}
    >
      <Link
        to={route}
        onClick={onSwipeClick}
        aria-label={`View ${product.name}`}
        className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-surface">
          <PratikshyaImage
            image={image}
            category={product.category}
            alt={productAlt(product)}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            sizes="(min-width: 1024px) 42vw, (min-width: 768px) 58vw, 100vw"
            className="h-full w-full object-cover transition-transform duration-700 ease-out motion-reduce:transition-none group-hover:scale-[1.015]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7 md:p-8">
            <p className={cn(eyebrow.editorial, "mb-2 text-blush")}>
              {product.subcategory || product.categoryLabel}
            </p>
            <h3 className="max-w-xl font-display text-2xl font-light leading-[1.05] sm:text-3xl md:text-4xl">
              {product.name}
            </h3>
            <div className="mt-3">
              <PriceLine product={product} inverse />
            </div>
            {meta.length ? (
              <p className="mt-3 font-ui text-[10px] leading-relaxed tracking-[.08em] text-pearl">
                {meta.join(" · ")}
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}

function SareePreview({ entry, relation, onSelect, animationClass }) {
  const { product, image } = entry;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Show ${product.name} as the active saree`}
      className={cn(
        "group hidden min-w-0 self-end text-left opacity-70 transition-opacity duration-500 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:block",
        relation === "previous" && "md:hidden lg:block",
        animationClass
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface">
        <PratikshyaImage
          image={image}
          category={product.category}
          alt={productAlt(product)}
          loading="lazy"
          fetchPriority="low"
          sizes="(min-width: 1024px) 24vw, 36vw"
          className="h-full w-full object-cover transition-transform duration-700 ease-out motion-reduce:transition-none group-hover:scale-[1.02]"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/30 to-transparent" />
        <span className="absolute left-4 top-4 font-ui text-[9px] uppercase tracking-[.2em] text-white drop-shadow-sm">
          {relation}
        </span>
      </div>
      <div className="border-b border-mist py-4">
        <p className={cn(eyebrow.editorial, "mb-1.5 text-accent")}>
          {product.subcategory || product.categoryLabel}
        </p>
        <h3 className="font-display text-xl font-light leading-tight text-ink">{product.name}</h3>
        <div className="mt-2">
          <PriceLine product={product} />
        </div>
      </div>
    </button>
  );
}

/**
 * THE SAREE EDIT — a product carousel, not an image carousel.
 *
 * Each entry has already travelled through taxonomy, the live catalogue and
 * getProductMediaSet. This component only presents those verified rows. It
 * never selects an image, reads a filename or creates a product/category URL.
 */
export default function SareeEditCarousel() {
  const entries = useSareeEditProducts();
  const sareeRoute = resolveCategoryRoute("sarees");
  const count = entries.length;

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState("next");
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [touching, setTouching] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const touchStart = useRef(null);
  const didSwipe = useRef(false);

  useEffect(() => {
    if (count > 0 && index >= count) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    const update = () => setPageHidden(document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const move = useCallback(
    (step) => {
      if (count <= 1) return;
      setDirection(step < 0 ? "previous" : "next");
      setIndex((current) => wrap(current + step, count));
    },
    [count]
  );

  const goTo = useCallback(
    (target) => {
      if (count <= 1 || target === index) return;
      const forwardDistance = wrap(target - index, count);
      const backwardDistance = wrap(index - target, count);
      setDirection(forwardDistance <= backwardDistance ? "next" : "previous");
      setIndex(wrap(target, count));
    },
    [count, index]
  );

  const paused = reducedMotion || hovered || focusWithin || touching || pageHidden;

  useEffect(() => {
    if (paused || count <= 1) return undefined;
    const timer = window.setTimeout(() => move(1), SAREE_EDIT_AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [count, index, move, paused]);

  const onKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
  };

  const onTouchStart = (event) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    setTouching(true);
  };

  const onTouchEnd = (event) => {
    const start = touchStart.current;
    touchStart.current = null;
    setTouching(false);
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
      didSwipe.current = true;
      move(dx < 0 ? 1 : -1);
      window.setTimeout(() => {
        didSwipe.current = false;
      }, 0);
    }
  };

  const onActiveClick = (event) => {
    if (didSwipe.current) event.preventDefault();
  };

  if (!sareeRoute || count === 0) return null;

  const previousIndex = wrap(index - 1, count);
  const nextIndex = wrap(index + 1, count);
  const active = entries[index];
  const animationClass = reducedMotion
    ? ""
    : direction === "previous"
      ? "motion-safe:animate-[sareeEditFromLeft_650ms_cubic-bezier(0.22,1,0.36,1)]"
      : "motion-safe:animate-[sareeEditFromRight_650ms_cubic-bezier(0.22,1,0.36,1)]";

  return (
    <AtelierSection
      id="women"
      rhythm="spacious"
      aria-roledescription="carousel"
      aria-label="The Saree Edit"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocusWithin(false);
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => {
        touchStart.current = null;
        setTouching(false);
      }}
      className="touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
    >
      <header className="mb-10 md:mb-14">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <EditorialHeading
            eyebrow="Women's Collection"
            description="Discover the drapes, textures and colours that define the Pratikshya collection."
            descriptionClassName="max-w-xl font-ui text-sm leading-relaxed text-taupe"
            spacing={{ eyebrow: "mb-4", title: "mb-4", description: "" }}
          >
            The <Accent>Saree</Accent> Edit
          </EditorialHeading>

          {count > 1 ? (
            <div className="flex shrink-0 items-center gap-6 border-b border-mist pb-2 font-ui text-[10px] uppercase tracking-[.18em] text-ink">
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Show previous saree"
                className="group inline-flex items-center gap-2 py-2 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                <ArrowLeft size={13} aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5" />
                Previous
              </button>
              <span className="h-3 w-px bg-mist" aria-hidden="true" />
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Show next saree"
                className="group inline-flex items-center gap-2 py-2 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                Next
                <ArrowRight size={13} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <div className="overflow-hidden">
        <div className="grid min-w-0 items-end gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)] md:gap-6 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.18fr)_minmax(0,.72fr)] lg:gap-8">
          {count > 1 ? (
            <SareePreview
              key={`previous-${entries[previousIndex].product.id}`}
              entry={entries[previousIndex]}
              relation="previous"
              onSelect={() => goTo(previousIndex)}
              animationClass={animationClass}
            />
          ) : null}

          <ActiveSareeCard
            key={`active-${active.product.id}`}
            entry={active}
            slideNumber={index + 1}
            slideCount={count}
            priority={index === 0}
            animationClass={animationClass}
            onSwipeClick={onActiveClick}
          />

          {count > 1 ? (
            <SareePreview
              key={`next-${entries[nextIndex].product.id}`}
              entry={entries[nextIndex]}
              relation="next"
              onSelect={() => goTo(nextIndex)}
              animationClass={animationClass}
            />
          ) : null}
        </div>
      </div>

      <p
        className="sr-only"
        aria-live={paused ? "polite" : "off"}
        aria-atomic="true"
      >
        Showing {active.product.name}, slide {index + 1} of {count}.
      </p>

      <footer className="mt-8 flex flex-col gap-6 border-t border-mist pt-5 sm:flex-row sm:items-center sm:justify-between md:mt-10">
        <div className="flex items-center gap-4" aria-label={`Slide ${index + 1} of ${count}`}>
          <span className="font-display text-xl font-light tabular-nums text-ink">
            {twoDigits(index + 1)}
          </span>
          <span className="font-ui text-[10px] tracking-[.2em] text-taupe">/ {twoDigits(count)}</span>
          <div className="h-px w-20 overflow-hidden bg-mist sm:w-28" aria-hidden="true">
            <div
              className="h-full bg-accent transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${((index + 1) / count) * 100}%` }}
            />
          </div>
        </div>

        <Link
          to={sareeRoute.href}
          className="group inline-flex w-fit items-center gap-2 font-ui text-[10px] uppercase tracking-[.2em] text-ink transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Explore Sarees
          <ArrowRight size={13} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </footer>
    </AtelierSection>
  );
}
