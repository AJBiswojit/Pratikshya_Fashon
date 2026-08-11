import { Link, useParams } from "react-router-dom";
import {
  AtelierButton,
  AtelierSection,
  EditorialHeading,
  MediaFrame,
  PageHeader,
  body,
  eyebrow,
  formatPrice,
  price as priceType,
} from "../design-system";
import { getProductBySlug } from "../data/products";
import { cn } from "../utils/cn";
import NotFound from "./NotFound";

/**
 * The product page, ahead of the product page.
 *
 * A card has to link somewhere, so `/product/:slug` resolves to a real,
 * correctly-branded holding page rather than a 404: the piece, its plate and
 * its essential specification, with the way back into the catalogue.
 *
 * The full detail experience — gallery, size selection, add to bag, related
 * pieces — belongs to the next phase and will replace this file.
 */
export default function ProductPlaceholder() {
  const { slug } = useParams();
  const product = getProductBySlug(slug);

  if (!product) return <NotFound />;

  const specification = [
    ["Category", product.categoryLabel],
    ["Style", product.subcategory],
    ["Fabric", product.fabric],
    ["Craft", product.material],
    ["Occasion", product.occasion.join(", ")],
    ["Colours", product.colors.join(", ")],
    ["Sizes", product.sizes.join(", ")],
    ["Availability", product.availabilityLabel],
  ];

  return (
    <>
      <PageHeader
        eyebrow={product.collection}
        title={product.name}
        breadcrumb={[
          { label: "Shop", to: "/shop" },
          { label: product.categoryLabel },
          { label: product.name },
        ]}
        size="subsection"
      />

      <AtelierSection rhythm="none" width="wide" className="pb-24 md:pb-36">
        <div className="grid gap-12 md:grid-cols-12 md:gap-16">
          <MediaFrame
            image={product.image}
            alt={product.name}
            aspect="product"
            surface
            className="md:col-span-6 lg:col-span-5"
          />

          <div className="md:col-span-6 lg:col-span-6 lg:col-start-7">
            <div className={cn(priceType.row, "text-sm mb-8")}>
              <span className={priceType.current}>{formatPrice(product.price)}</span>
              {product.originalPrice ? (
                <span className={priceType.original}>{formatPrice(product.originalPrice)}</span>
              ) : null}
              {product.discount ? (
                <span className={priceType.discount}>{`${product.discount}% off`}</span>
              ) : null}
            </div>

            <EditorialHeading
              as="h2"
              size="subsection"
              eyebrow="Coming Soon"
              description="The full product experience — gallery, sizing and made-to-order enquiry — opens with the next chapter of the atelier. Everything below is confirmed."
              descriptionClassName={cn(body.editorial, "text-graphite max-w-md")}
              rule
              spacing={{ eyebrow: "mb-4", title: "mb-5", rule: "mb-6" }}
            >
              The <span className="italic text-accent">detail</span>
            </EditorialHeading>

            <dl className="mt-12 border-t border-mist/70">
              {specification
                .filter(([, value]) => value)
                .map(([term, value]) => (
                  <div
                    key={term}
                    className="grid grid-cols-3 gap-4 border-b border-mist/70 py-3.5"
                  >
                    <dt className={cn(eyebrow.label, "text-taupe")}>{term}</dt>
                    <dd className={cn(body.base, "col-span-2 text-ink")}>{value}</dd>
                  </div>
                ))}
            </dl>

            <div className="mt-12 flex flex-wrap gap-4">
              <AtelierButton as={Link} to="/shop" variant="primary" size="md">
                Back to the Collection
              </AtelierButton>
              <AtelierButton as={Link} to="/contact" variant="outline" size="md">
                Enquire
              </AtelierButton>
            </div>
          </div>
        </div>
      </AtelierSection>
    </>
  );
}
