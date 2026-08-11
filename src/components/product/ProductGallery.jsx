import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, Minus, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import PratikshyaImage from "../PratikshyaImage";
import { cn } from "../../utils/cn";

function GalleryThumbnail({ image, index, active, productName, onSelect, className = "" }) {
  return (
    <button
      type="button"
      aria-label={`View image ${index + 1} of ${productName}`}
      aria-current={active ? "true" : undefined}
      onClick={() => onSelect(index)}
      className={cn(
        "relative h-20 w-16 shrink-0 overflow-hidden bg-surface outline-none transition-opacity",
        "focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        active ? "opacity-100 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-accent" : "opacity-55 hover:opacity-100",
        className
      )}
    >
      <PratikshyaImage
        image={image}
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover"
        sizes="64px"
      />
    </button>
  );
}

function ImageViewer({ product, images, initialIndex, onClose, onIndexChange }) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const closeRef = useRef(null);
  const previousFocus = useRef(document.activeElement);

  const show = useCallback(
    (nextIndex) => {
      const bounded = (nextIndex + images.length) % images.length;
      setIndex(bounded);
      setZoom(1);
      onIndexChange(bounded);
    },
    [images.length, onIndexChange]
  );

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus?.();
    };
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") show(index - 1);
      if (event.key === "ArrowRight") show(index + 1);
      if (event.key === "+" || event.key === "=") setZoom(2);
      if (event.key === "-") setZoom(1);
      if (event.key === "Tab") {
        const controls = document.querySelectorAll("[data-viewer-control]");
        const focusable = [...controls];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, onClose, show]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} image viewer`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-ink text-ivory"
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/15 px-4 sm:px-6">
        <p className="font-ui text-[10px] uppercase tracking-[.2em] text-ash">
          {index + 1} / {images.length}
        </p>
        <p className="hidden max-w-[50vw] truncate font-display text-lg sm:block">{product.name}</p>
        <div className="flex items-center gap-1">
          <button
            data-viewer-control
            type="button"
            aria-label={zoom === 1 ? "Zoom in" : "Zoom out"}
            onClick={() => setZoom((value) => (value === 1 ? 2 : 1))}
            className="p-3 text-ivory transition-colors hover:text-gold focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold"
          >
            {zoom === 1 ? <Plus size={18} /> : <Minus size={18} />}
          </button>
          <button
            data-viewer-control
            ref={closeRef}
            type="button"
            aria-label="Close image viewer"
            onClick={onClose}
            className="p-3 text-ivory transition-colors hover:text-gold focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-auto">
        <button
          data-viewer-control
          type="button"
          aria-label="Previous image"
          onClick={() => show(index - 1)}
          className="fixed left-3 top-1/2 z-10 flex h-11 w-11 items-center justify-center bg-ink/65 text-ivory transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold sm:left-6"
        >
          <ChevronLeft size={20} />
        </button>

        <div className={cn("flex min-h-full items-center justify-center p-5 sm:p-16", zoom > 1 && "items-start justify-start")}>
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={(event) => {
              if (zoom === 1 && event.target === event.currentTarget) onClose();
            }}
            className={cn(
              "mx-auto flex items-center justify-center transition-[width] duration-500",
              zoom === 1 ? "h-full max-h-[calc(100vh-12rem)] w-full" : "w-[180vw] sm:w-[130vw]"
            )}
          >
            <PratikshyaImage
              image={images[index]}
              alt={`${product.name}, gallery image ${index + 1}`}
              className={cn(
                zoom === 1
                  ? "h-auto w-auto max-h-[calc(100vh-12rem)] max-w-full object-contain"
                  : "h-auto w-full object-contain"
              )}
              loading="eager"
              sizes={zoom === 1 ? "100vw" : "180vw"}
            />
          </motion.div>
        </div>

        <button
          data-viewer-control
          type="button"
          aria-label="Next image"
          onClick={() => show(index + 1)}
          className="fixed right-3 top-1/2 z-10 flex h-11 w-11 items-center justify-center bg-ink/65 text-ivory transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold sm:right-6"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex h-24 shrink-0 items-center justify-center gap-2 overflow-x-auto border-t border-white/15 px-4">
        {images.map((image, imageIndex) => (
          <GalleryThumbnail
            key={`${image.id ?? image.src}-${imageIndex}`}
            image={image}
            index={imageIndex}
            active={imageIndex === index}
            productName={product.name}
            onSelect={show}
            className="h-16 w-12 bg-white/10"
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function ProductGallery({ product }) {
  const images = product.images?.length ? product.images : [product.image].filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const touchStart = useRef(null);

  useEffect(() => {
    setActiveIndex(0);
    setViewerOpen(false);
  }, [product.id]);

  const show = (index) => setActiveIndex((index + images.length) % images.length);
  const closeViewer = useCallback(() => setViewerOpen(false), []);

  const onTouchEnd = (event) => {
    if (touchStart.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(distance) > 45) show(activeIndex + (distance < 0 ? 1 : -1));
    touchStart.current = null;
  };

  return (
    <div className="md:sticky md:top-24 md:self-start">
      <div className="flex flex-col-reverse gap-3 sm:flex-row md:gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:w-16 sm:flex-col sm:overflow-visible sm:pb-0">
          {images.map((image, index) => (
            <GalleryThumbnail
              key={`${image.id ?? image.src}-${index}`}
              image={image}
              index={index}
              active={index === activeIndex}
              productName={product.name}
              onSelect={show}
            />
          ))}
        </div>

        <div
          className="group relative min-w-0 flex-1 overflow-hidden bg-surface aspect-[4/5] max-h-[72svh] md:max-h-none"
          onTouchStart={(event) => {
            touchStart.current = event.touches[0].clientX;
          }}
          onTouchEnd={onTouchEnd}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0.45 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.25 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <PratikshyaImage
                image={images[activeIndex]}
                alt={`${product.name}, view ${activeIndex + 1} of ${images.length}`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                loading={activeIndex === 0 ? "eager" : "lazy"}
                fetchPriority={activeIndex === 0 ? "high" : "auto"}
                sizes="(min-width: 1024px) 48vw, (min-width: 768px) 46vw, 100vw"
              />
            </motion.div>
          </AnimatePresence>

          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            aria-label={`Open full-screen image viewer for ${product.name}`}
            className="absolute inset-0 flex items-end justify-end p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ivory"
          >
            <span className="flex items-center gap-2 bg-ivory/90 px-3 py-2 font-ui text-[9px] uppercase tracking-[.16em] text-ink backdrop-blur-sm transition-colors group-hover:bg-ink group-hover:text-ivory">
              <Maximize2 size={13} aria-hidden="true" /> View
            </span>
          </button>

          <div className="pointer-events-none absolute bottom-4 left-4 flex gap-1.5 sm:hidden" aria-hidden="true">
            {images.map((image, index) => (
              <span key={image.id ?? index} className={cn("h-1 w-1 rounded-full", index === activeIndex ? "bg-accent" : "bg-ivory/70")} />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-right font-ui text-[9px] uppercase tracking-[.16em] text-taupe">
        Swipe or select a view · Click to explore
      </p>

      <AnimatePresence>
        {viewerOpen ? (
          <ImageViewer
            product={product}
            images={images}
            initialIndex={activeIndex}
            onClose={closeViewer}
            onIndexChange={setActiveIndex}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
