import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AtelierButton,
  AtelierSection,
  Breadcrumb,
  EmptyState,
  MediaFrame,
  Rule,
} from "../design-system";
import { imageRef } from "../data/pratikshyaImageManifest";
import { useCart } from "../context/CartContext";
import { formatINR } from "../utils/shopping";

/**
 * The checkout handoff — /checkout.
 *
 * Phase 6 ends at the threshold: the bag is complete and the order journey
 * is acknowledged, but address, delivery and payment belong to a later
 * phase. This page is a premium placeholder foundation — it renders safely
 * with or without a bag and never pretends to take an order.
 */
export default function Checkout() {
  const cart = useCart();
  const isEmpty = cart.items.length === 0;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Checkout — PRATIKSHYA FASHON";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  if (isEmpty) {
    return (
      <main>
        <AtelierSection rhythm="none" width="wide" className="pb-24 pt-28 sm:pt-32 md:pb-32">
          <Breadcrumb
            items={[{ label: "Bag", to: "/cart" }, { label: "Checkout" }]}
            className="mb-4"
          />
          <EmptyState
            eyebrow="Checkout"
            title="There is nothing to check out yet."
            description="Your bag is empty. Begin with the collection, and return here when your pieces are chosen."
            actions={
              <>
                <AtelierButton as={Link} to="/shop" variant="primary" size="md">
                  Explore the Collection
                </AtelierButton>
                <AtelierButton as={Link} to="/cart" variant="outline" size="md">
                  Return to Bag
                </AtelierButton>
              </>
            }
          />
        </AtelierSection>
      </main>
    );
  }

  return (
    <main>
      <AtelierSection rhythm="none" width="wide" className="pb-24 pt-28 sm:pt-32 md:pb-32">
        <Breadcrumb
          items={[{ label: "Bag", to: "/cart" }, { label: "Checkout" }]}
          className="mb-8 md:mb-10"
        />

        <div className="grid overflow-hidden bg-surface md:grid-cols-2">
          <MediaFrame
            image={imageRef("saree-banarasi")}
            alt="PRATIKSHYA FASHON heritage textile detail"
            aspect="portrait"
            overlay="imageBottom"
            className="min-h-72 md:min-h-[34rem]"
          />

          <div className="flex flex-col justify-center px-7 py-16 text-center md:px-14">
            <p className="font-ui text-[10px] uppercase tracking-[.3em] text-accent">
              The Order Journey
            </p>
            <h1 className="mt-5 font-display text-3xl font-light tracking-tight md:text-5xl">
              Your order journey continues here.
            </h1>
            <Rule width="w-16" tone="accent" className="mx-auto my-8" />
            <p className="mx-auto max-w-md font-ui text-sm leading-relaxed text-taupe">
              Address, delivery and secure payment arrive with a later phase of the
              atelier. Your {cart.count} {cart.count === 1 ? "piece" : "pieces"} —{" "}
              {formatINR(cart.totals.total)} in all — remain held in your bag.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <AtelierButton as={Link} to="/cart" variant="primary" size="md">
                Return to Bag <ArrowRight size={14} aria-hidden="true" />
              </AtelierButton>
              <AtelierButton as={Link} to="/shop" variant="outline" size="md">
                Continue Shopping
              </AtelierButton>
            </div>
          </div>
        </div>
      </AtelierSection>
    </main>
  );
}
