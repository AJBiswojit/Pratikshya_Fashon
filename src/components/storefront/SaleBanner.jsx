import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import PratikshyaImage from "../../components/PratikshyaImage";
import {
  AtelierButton,
  AtelierSection,
  EditorialHeading,
  body,
  dotGrid,
  eyebrow,
  imageTreatment,
} from "../../design-system";
import { useActivePlacementMedia } from "../../hooks/useMedia";
import { resolveSaleBackdrop } from "../../services/media/mediaResolver";
import { MARKETING_PLACEMENTS } from "../../config/mediaTypes";
import offerRepository from "../../services/offers/offerRepository";
import taxonomyRepository from "../../services/taxonomyRepository";
import { cn } from "../../utils/cn";

/**
 * SALE BANNER — landing campaign band.
 *
 * A wide editorial band composed like the reference campaign, but with
 * PRATIKSHYA's own accent treatment and content that is *derived* rather
 * than hardcoded. The headline, discount figure and CTA are read from the
 * one offer repository — the highest-priority live percentage offer on a
 * collection (the festive edit when it is live) — and the destination is
 * that collection's real route. With no active campaign the band falls back
 * to a tasteful house statement and still never fabricates a discount.
 */
export default function SaleBanner({ excludeIds = null }) {
  const festiveMedia = useActivePlacementMedia(MARKETING_PLACEMENTS.FESTIVE_SECTION);
  const usedIds = new Set(excludeIds ?? []);

  const activeOffers = offerRepository.list({ status: "ACTIVE" });
  const collectionOffers = activeOffers.filter(
    (offer) =>
      offer.type === "PERCENTAGE" &&
      (offer.includedCollections || []).length > 0
  );
  const festive = collectionOffers.find((offer) =>
    (offer.includedCollections || []).includes("festive-edit")
  );
  const campaign =
    festive ||
    [...collectionOffers].sort((a, b) => b.priority - a.priority)[0] ||
    null;

  const collection =
    taxonomyRepository.findCollection(campaign?.includedCollections?.[0] || "festive-edit") ||
    taxonomyRepository.findCollection("festive-edit");

  const ctaTo =
    collection?.displayStatus === "ACTIVE"
      ? `/collection/${collection.slug}`
      : "/shop";

  const heading =
    (campaign && taxonomyRepository.getCollectionLabel(campaign.includedCollections?.[0])) ||
    collection?.name ||
    "Festive Edit";

  const discount = campaign ? `${campaign.discountValue}% OFF` : null;
  const line =
    campaign?.description ||
    "Enjoy selected pieces from the season's edit at PRATIKSHYA FASHON.";

  return (
    <AtelierSection
      tone="accent"
      rhythm="none"
      className="relative overflow-hidden"
      innerClassName="relative z-10 py-24 md:py-36"
      backdrop={
        <>
          <PratikshyaImage
            image={resolveSaleBackdrop(festiveMedia, usedIds)}
            alt="PRATIKSHYA FASHON festive sale campaign"
            className={imageTreatment.campaignBackdrop}
          />
          <div aria-hidden="true" className="absolute inset-0 opacity-[.08]" style={dotGrid} />
        </>
      }
    >
      <div className="grid md:grid-cols-[1.4fr_1fr] items-center gap-12">
        <div className="text-center md:text-left">
          <p className={cn(eyebrow.section, "text-blush mb-5")}>Limited Time</p>
          <EditorialHeading
            as="h2"
            size="campaign"
            titleClassName="text-ivory"
            spacing={{ title: "mb-6" }}
          >
            {heading}
          </EditorialHeading>
          <p className={cn(body.base, "text-blush-deep max-w-md mx-auto md:mx-0 mb-10")}>
            {line}
          </p>
          <AtelierButton
            as={Link}
            to={ctaTo}
            variant="inverse"
            size="lg"
          >
            Shop the Edit <ArrowRight size={14} />
          </AtelierButton>
        </div>

        {discount ? (
          <div className="text-center md:text-right">
            <p className="font-display text-6xl md:text-8xl font-light leading-none text-ivory">
              {discount.replace(" OFF", "")}
              <span className="block md:inline md:ml-4 text-gold text-2xl md:text-3xl tracking-widest">
                OFF
              </span>
            </p>
          </div>
        ) : null}
      </div>
    </AtelierSection>
  );
}
