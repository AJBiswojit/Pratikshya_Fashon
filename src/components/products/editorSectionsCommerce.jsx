/**
 * PRATIKSHYA FASHON — Product editor sections: Pricing and Variants
 * (Phase 13). All arithmetic comes from the shared pricing engine; this
 * file only renders it.
 */

import { Plus, X } from "lucide-react";
import {
  COLOR_OPTIONS,
  GST_RATES,
  SIZE_OPTIONS,
  TAX_MODE_OPTIONS,
  VARIANT_STATUSES,
} from "../../config/productCatalogConfig";
import { DISCOUNT_TYPE_OPTIONS, computePricing } from "../../utils/pricing";
import { formatINR } from "../../utils/shopping";
import catalogRepository from "../../services/catalogRepository";
import { cn } from "../../utils/cn";
import { Field, NumberInput, Select, TextInput, inputClass, labelClass } from "./editorFields";

/* ------------------------------------------------------------------ */
/* 3 · Pricing                                                         */
/* ------------------------------------------------------------------ */

export function SectionPricing({ draft, patch }) {
  const pricing = draft.pricing;
  const computed = computePricing(pricing);
  const setPricing = (partial) => patch({ pricing: { ...pricing, ...partial } });
  const isCustomRate = pricing.customTaxRate;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="MRP (₹)"
          required
          hint="List price — the struck-through figure."
          htmlFor="pf-mrp"
        >
          <NumberInput
            id="pf-mrp"
            min="0"
            step="1"
            value={pricing.mrp}
            onChange={(event) => setPricing({ mrp: event.target.value })}
          />
        </Field>

        <Field
          label="Selling price (₹)"
          required
          hint="The house price. Cannot exceed MRP."
          htmlFor="pf-selling"
        >
          <NumberInput
            id="pf-selling"
            min="0"
            step="1"
            value={pricing.sellingPrice}
            onChange={(event) => setPricing({ sellingPrice: event.target.value })}
          />
        </Field>

        <Field label="Discount type" htmlFor="pf-discount-type">
          <Select
            id="pf-discount-type"
            value={pricing.discountType}
            onChange={(event) => setPricing({ discountType: event.target.value })}
            options={DISCOUNT_TYPE_OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
          />
        </Field>

        {pricing.discountType !== "none" ? (
          <Field
            label={pricing.discountType === "percentage" ? "Discount (%)" : "Discount (₹)"}
            hint={pricing.discountType === "percentage" ? "0–100." : "Cannot exceed the selling price."}
            htmlFor="pf-discount-value"
          >
            <NumberInput
              id="pf-discount-value"
              min="0"
              step={pricing.discountType === "percentage" ? "0.5" : "1"}
              value={pricing.discountValue}
              onChange={(event) => setPricing({ discountValue: event.target.value })}
            />
          </Field>
        ) : null}

        <div aria-live="polite" className="border border-mist/80 bg-canvas p-4 sm:col-span-2 lg:col-span-1">
          <p className={labelClass}>Final price</p>
          <p className="mt-2 font-display text-3xl font-light text-ink">
            {formatINR(computed.finalPrice)}
          </p>
          <p className="mt-1 font-ui text-[11px] text-taupe">
            {computed.discountAmount > 0
              ? `${formatINR(computed.discountAmount)} discount applied`
              : "No discount applied"}
            {computed.savings > 0 ? ` · saves ${formatINR(computed.savings)} on MRP` : ""}
          </p>
        </div>
      </div>

      {computed.errors.length ? (
        <ul
          role="alert"
          className="space-y-1.5 border border-accent/40 bg-accent/[0.05] p-4"
          aria-label="Pricing issues"
        >
          {computed.errors.map((error) => (
            <li key={error} className="font-ui text-sm text-accent">
              — {error}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="border-t border-mist/70 pt-6">
        <p className="font-ui text-[10px] uppercase tracking-[.24em] text-accent">Tax / GST</p>
        <p className="mt-2 max-w-xl font-ui text-[11px] leading-relaxed text-taupe">
          Preparation fields for production integration. This is a client demo — no legal GST
          claim is made from these values.
        </p>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Tax mode" htmlFor="pf-tax-mode">
            <Select
              id="pf-tax-mode"
              value={pricing.taxMode}
              onChange={(event) => setPricing({ taxMode: event.target.value })}
              options={TAX_MODE_OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
            />
          </Field>

          <Field label="GST rate" htmlFor="pf-tax-rate">
            <Select
              id="pf-tax-rate"
              value={isCustomRate ? "__custom__" : String(pricing.taxRate)}
              onChange={(event) => {
                if (event.target.value === "__custom__") {
                  setPricing({ customTaxRate: true });
                } else {
                  setPricing({ customTaxRate: false, taxRate: Number(event.target.value) });
                }
              }}
              options={[
                ...GST_RATES.map((rate) => ({ value: String(rate), label: `${rate}%` })),
                { value: "__custom__", label: "Custom rate…" },
              ]}
            />
          </Field>

          {isCustomRate ? (
            <Field label="Custom rate (%)" htmlFor="pf-tax-custom">
              <NumberInput
                id="pf-tax-custom"
                min="0"
                max="100"
                step="0.5"
                value={pricing.taxRate}
                onChange={(event) => setPricing({ taxRate: event.target.value })}
              />
            </Field>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4 · Variants                                                        */
/* ------------------------------------------------------------------ */

const emptyVariant = () => ({
  id: `var-new-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`,
  sku: "",
  color: "",
  size: "",
  priceOverride: "",
  stock: 0,
  barcode: "",
  status: VARIANT_STATUSES.ACTIVE,
});

export function SectionVariants({ draft, patch, errors }) {
  const variants = draft.variants;
  const pricing = computePricing(draft.pricing);

  const setVariant = (id, partial) =>
    patch({ variants: variants.map((variant) => (variant.id === id ? { ...variant, ...partial } : variant)) });

  const removeVariant = (id) => patch({ variants: variants.filter((variant) => variant.id !== id) });

  const variantSkus = variants.map((variant) => variant.sku).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-xl font-ui text-[11px] leading-relaxed text-taupe">
          Each variant pairs a colour with a size and may carry its own SKU, barcode and price
          override. Stock counts are preparation fields — movements arrive with Phase 14.
          Inactive variants stay stored but are hidden from customers.
        </p>
        <button
          type="button"
          onClick={() => patch({ variants: [...variants, emptyVariant()] })}
          className="inline-flex items-center gap-2 border border-ink px-4 py-2 font-ui text-[10px] uppercase tracking-[.14em] text-ink transition-colors hover:bg-ink hover:text-ivory"
        >
          <Plus size={12} aria-hidden="true" /> Add variant
        </button>
      </div>

      {errors.variants ? (
        <p role="alert" className="border border-accent/40 bg-accent/[0.05] p-3 font-ui text-sm text-accent">
          {errors.variants}
        </p>
      ) : null}

      {!variants.length ? (
        <p className="border border-mist/70 bg-canvas px-4 py-8 text-center font-ui text-sm text-taupe">
          No variants yet. A product without variants sells in its base colour and size.
        </p>
      ) : (
        <ul className="space-y-4">
          {variants.map((variant, index) => {
            const duplicateSku =
              variant.sku && variantSkus.filter((sku) => sku === variant.sku).length > 1;
            const clashWithRegister =
              variant.sku && catalogRepository.skuTaken(variant.sku, draft.id);

            return (
              <li key={variant.id} className="border border-mist/80 bg-canvas p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-ui text-[10px] uppercase tracking-[.18em] text-taupe">
                    Variant {index + 1}
                    {variant.status === VARIANT_STATUSES.INACTIVE ? " · inactive" : ""}
                  </p>
                  <button
                    type="button"
                    aria-label={`Remove variant ${index + 1}`}
                    onClick={() => removeVariant(variant.id)}
                    className="inline-flex items-center gap-1 font-ui text-[10px] uppercase tracking-[.14em] text-taupe transition-colors hover:text-accent"
                  >
                    <X size={12} aria-hidden="true" /> Remove
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Colour">
                    <Select
                      value={variant.color}
                      onChange={(event) => setVariant(variant.id, { color: event.target.value })}
                      placeholder="Choose colour"
                      options={[...new Set([...COLOR_OPTIONS, ...draft.colors, variant.color])]
                        .filter(Boolean)
                        .map((entry) => ({ value: entry, label: entry }))}
                      allowCustom
                    />
                  </Field>

                  <Field label="Size">
                    <Select
                      value={variant.size}
                      onChange={(event) => setVariant(variant.id, { size: event.target.value })}
                      placeholder="Choose size"
                      options={[...new Set([...SIZE_OPTIONS, ...draft.sizes, variant.size])]
                        .filter(Boolean)
                        .map((entry) => ({ value: entry, label: entry }))}
                      allowCustom
                    />
                  </Field>

                  <Field
                    label="Variant SKU"
                    error={duplicateSku || clashWithRegister ? "SKU must be unique." : ""}
                  >
                    <TextInput
                      value={variant.sku}
                      onChange={(event) =>
                        setVariant(variant.id, { sku: event.target.value.toUpperCase() })
                      }
                      placeholder={`${draft.sku || "SKU"}-${index + 1}`}
                    />
                  </Field>

                  <Field label="Barcode">
                    <TextInput
                      value={variant.barcode}
                      onChange={(event) => setVariant(variant.id, { barcode: event.target.value })}
                      placeholder="EAN / UPC"
                    />
                  </Field>

                  <Field label="Price" hint="Blank uses the product price.">
                    <div className="flex items-center gap-2">
                      <NumberInput
                        min="0"
                        step="1"
                        value={variant.priceOverride ?? ""}
                        onChange={(event) =>
                          setVariant(variant.id, {
                            priceOverride: event.target.value === "" ? "" : event.target.value,
                          })
                        }
                        aria-label={`Price override for variant ${index + 1}`}
                      />
                      <span className="whitespace-nowrap font-ui text-[10px] uppercase tracking-[.14em] text-taupe">
                        {variant.priceOverride === "" || variant.priceOverride == null
                          ? `= ${formatINR(pricing.finalPrice)}`
                          : "override"}
                      </span>
                    </div>
                  </Field>

                  <Field label="Stock (placeholder)">
                    <NumberInput
                      min="0"
                      step="1"
                      value={variant.stock}
                      onChange={(event) => setVariant(variant.id, { stock: event.target.value })}
                    />
                  </Field>

                  <Field label="Status">
                    <div className="flex gap-2" role="radiogroup" aria-label={`Variant ${index + 1} status`}>
                      {[VARIANT_STATUSES.ACTIVE, VARIANT_STATUSES.INACTIVE].map((status) => (
                        <button
                          key={status}
                          type="button"
                          role="radio"
                          aria-checked={variant.status === status}
                          onClick={() => setVariant(variant.id, { status })}
                          className={cn(
                            "border px-3 py-2 font-ui text-[10px] uppercase tracking-[.14em] transition-colors",
                            variant.status === status
                              ? "border-ink bg-ink text-ivory"
                              : "border-mist text-taupe hover:border-ink hover:text-ink"
                          )}
                        >
                          {status === VARIANT_STATUSES.ACTIVE ? "Active" : "Inactive"}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
