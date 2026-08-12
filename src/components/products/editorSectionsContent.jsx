/**
 * PRATIKSHYA FASHON — Product editor sections: Product Content, Media,
 * SEO and Publishing (Phase 13).
 *
 * The media section embeds a completeness summary only — the full media
 * manager stays the reusable Phase 12 surface, linked from here.
 */

import { Link } from "react-router-dom";
import { Check, ExternalLink, Film, Image as ImageIcon, Star } from "lucide-react";
import {
  PRODUCT_FLAG_OPTIONS,
  RETURN_ELIGIBILITY_OPTIONS,
  getProductStatusLabel,
} from "../../config/productCatalogConfig";
import { useProductMedia } from "../../hooks/useMedia";
import {
  Field,
  KeyValueEditor,
  ListEditor,
  Select,
  TextArea,
  TextInput,
  ToggleRow,
} from "./editorFields";

/* ------------------------------------------------------------------ */
/* 5 · Product content                                                 */
/* ------------------------------------------------------------------ */

export function SectionContent({ draft, patch }) {
  return (
    <div className="space-y-8">
      <Field
        label="Highlights"
        hint="Short bullet points shown beside the price."
      >
        <ListEditor
          ariaLabel="Product highlights"
          value={draft.highlights}
          onChange={(highlights) => patch({ highlights })}
          placeholder="Pure Banarasi Silk, handwoven border…"
        />
      </Field>

      <Field label="Specifications" hint="Structured facts, shown in the details accordion.">
        <KeyValueEditor
          value={draft.specifications}
          onChange={(specifications) => patch({ specifications })}
        />
      </Field>

      <Field
        label="Care instructions"
        hint="Blank falls back to the house care copy for the fabric."
      >
        <ListEditor
          ariaLabel="Care instructions"
          value={draft.careInstructions}
          onChange={(careInstructions) => patch({ careInstructions })}
          placeholder="Dry clean only…"
        />
      </Field>

      <div className="grid gap-6 lg:grid-cols-2">
        <Field
          label="Delivery information"
          hint="Stored once here — never hardcoded into components."
          htmlFor="pf-delivery"
        >
          <TextArea
            id="pf-delivery"
            rows={3}
            value={draft.deliveryInfo}
            onChange={(event) => patch({ deliveryInfo: event.target.value })}
            placeholder="Dispatch within 2–3 working days."
          />
        </Field>

        <div className="space-y-4">
          <Field label="Return eligibility" htmlFor="pf-return-eligibility">
            <Select
              id="pf-return-eligibility"
              value={draft.returnPolicy.eligibility}
              onChange={(event) =>
                patch({ returnPolicy: { ...draft.returnPolicy, eligibility: event.target.value } })
              }
              placeholder="House default"
              options={RETURN_ELIGIBILITY_OPTIONS.map((option) => ({
                value: option.id,
                label: option.label,
              }))}
            />
          </Field>
          <Field label="Return window" htmlFor="pf-return-window">
            <TextInput
              id="pf-return-window"
              value={draft.returnPolicy.window}
              onChange={(event) =>
                patch({ returnPolicy: { ...draft.returnPolicy, window: event.target.value } })
              }
              placeholder="7 days from delivery"
            />
          </Field>
          <Field label="Return notes" htmlFor="pf-return-notes">
            <TextArea
              id="pf-return-notes"
              rows={2}
              value={draft.returnPolicy.notes}
              onChange={(event) =>
                patch({ returnPolicy: { ...draft.returnPolicy, notes: event.target.value } })
              }
              placeholder="Unworn, with original tags."
            />
          </Field>
        </div>
      </div>

      <Field
        label="Customer-facing return line"
        hint="Composed automatically from the fields above — edit only to override."
        htmlFor="pf-return-line"
      >
        <TextArea
          id="pf-return-line"
          rows={2}
          value={draft.returnInfo}
          onChange={(event) => patch({ returnInfo: event.target.value })}
        />
      </Field>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6 · Media — summary of the Phase 12 register, never a second store  */
/* ------------------------------------------------------------------ */

export function SectionMedia({ draft, portal }) {
  const { items, summary } = useProductMedia(draft.id);
  const isSaved = Boolean(draft.id && draft.exists);
  const cover = items.find((item) => item.role === "COVER") ?? items[0];
  const mediaHref =
    portal === "admin"
      ? `/admin/products/${draft.id}/media`
      : `/employee/media/upload?product=${draft.id}`;

  if (!isSaved) {
    return (
      <div className="border border-mist/80 bg-canvas p-6">
        <p className="font-display text-xl font-light text-ink">Save the product first.</p>
        <p className="mt-2 max-w-lg font-ui text-sm leading-relaxed text-taupe">
          Media lives in the shared PRATIKSHYA FASHON media register and attaches to a product
          id. Once this product is saved, photos and film can be added, covered and reordered
          from the media manager.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border border-mist/80 bg-canvas p-4">
          <p className="font-ui text-[10px] uppercase tracking-[.18em] text-taupe">Cover</p>
          <p className="mt-2 flex items-center gap-2 font-ui text-sm text-ink">
            {summary.hasCover || draft.image ? (
              <>
                <Check size={14} className="text-ink" aria-hidden="true" /> Cover set
              </>
            ) : (
              <span className="text-accent">Needs cover</span>
            )}
          </p>
        </div>
        <div className="border border-mist/80 bg-canvas p-4">
          <p className="font-ui text-[10px] uppercase tracking-[.18em] text-taupe">Images</p>
          <p className="mt-2 flex items-center gap-2 font-ui text-sm text-ink">
            <ImageIcon size={14} aria-hidden="true" /> {summary.images} image{summary.images === 1 ? "" : "s"}
          </p>
        </div>
        <div className="border border-mist/80 bg-canvas p-4">
          <p className="font-ui text-[10px] uppercase tracking-[.18em] text-taupe">Videos</p>
          <p className="mt-2 flex items-center gap-2 font-ui text-sm text-ink">
            <Film size={14} aria-hidden="true" /> {summary.videos} video{summary.videos === 1 ? "" : "s"}
            <span className="text-[10px] uppercase tracking-[.14em] text-taupe">optional</span>
          </p>
        </div>
      </div>

      {cover?.url || cover?.thumbnail ? (
        <img
          src={cover.url || cover.thumbnail}
          alt={cover.alt || `${draft.name} cover`}
          className="h-56 w-full max-w-sm object-cover"
        />
      ) : draft.image ? (
        <img src={draft.image} alt={`${draft.name} catalogue plate`} className="h-56 w-full max-w-sm object-cover" />
      ) : null}

      <div className="border border-mist/80 bg-surface/40 p-5">
        <p className="font-ui text-sm leading-relaxed text-ink">
          Add photos and videos, set the cover and reorder the gallery in the media manager —
          the same register the storefront reads.
        </p>
        <Link
          to={mediaHref}
          className="mt-3 inline-flex items-center gap-2 border border-ink px-4 py-2 font-ui text-[10px] uppercase tracking-[.14em] text-ink transition-colors hover:bg-ink hover:text-ivory"
        >
          <Star size={12} aria-hidden="true" /> Manage media <ExternalLink size={11} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7 · SEO                                                             */
/* ------------------------------------------------------------------ */

export function SectionSeo({ draft, patch, errors }) {
  return (
    <div className="grid gap-6">
      <Field
        label="URL slug"
        required
        error={errors.slug}
        hint="Existing slugs are preserved so product URLs never break. Edit only with intent."
        htmlFor="pf-slug"
      >
        <TextInput
          id="pf-slug"
          value={draft.slug}
          onChange={(event) => patch({ slug: event.target.value })}
          placeholder="auto-from-product-name"
          autoComplete="off"
        />
      </Field>

      <Field label="SEO title" hint="Defaults to the product name when blank." htmlFor="pf-seo-title">
        <TextInput
          id="pf-seo-title"
          value={draft.seo.title}
          onChange={(event) => patch({ seo: { ...draft.seo, title: event.target.value } })}
        />
      </Field>

      <Field
        label="SEO description"
        hint="Shown in search results. Keep it under 160 characters."
        htmlFor="pf-seo-description"
      >
        <TextArea
          id="pf-seo-description"
          rows={3}
          value={draft.seo.description}
          onChange={(event) => patch({ seo: { ...draft.seo, description: event.target.value } })}
        />
      </Field>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8 · Publishing                                                      */
/* ------------------------------------------------------------------ */

export function SectionPublishing({ draft, patch, publishIssues }) {
  const flags = [
    { key: "isFeatured", ...PRODUCT_FLAG_OPTIONS[0] },
    { key: "isBestseller", ...PRODUCT_FLAG_OPTIONS[1] },
    { key: "isNew", ...PRODUCT_FLAG_OPTIONS[2] },
    { key: "isLimitedEdition", ...PRODUCT_FLAG_OPTIONS[3] },
    { key: "isTrending", ...PRODUCT_FLAG_OPTIONS[4] },
  ];

  return (
    <div className="space-y-8">
      <div className="border border-mist/80 bg-canvas p-5">
        <p className="font-ui text-[10px] uppercase tracking-[.18em] text-taupe">Current status</p>
        <p className="mt-2 font-display text-2xl font-light text-ink">
          {getProductStatusLabel(draft.status)}
        </p>
        {draft.review?.state === "REJECTED" && draft.review.rejectionReason ? (
          <p className="mt-3 border border-accent/40 bg-accent/[0.05] p-3 font-ui text-sm text-accent">
            Rejected — {draft.review.rejectionReason}
          </p>
        ) : null}
        {draft.review?.state === "PENDING" ? (
          <p className="mt-3 font-ui text-[11px] text-taupe">
            Submitted {draft.review.submittedAt ? new Date(draft.review.submittedAt).toLocaleString("en-IN") : ""}
            {draft.review.submittedBy ? ` by ${draft.review.submittedBy}` : ""} — awaiting review.
          </p>
        ) : null}
      </div>

      <div>
        <p className="mb-2 font-ui text-[10px] uppercase tracking-[.18em] text-ink">Merchandising flags</p>
        <div className="border border-mist/80 bg-canvas px-4 py-1">
          {flags.map((flag) => (
            <ToggleRow
              key={flag.key}
              label={flag.label}
              hint={flag.hint}
              checked={Boolean(draft[flag.key])}
              onChange={(checked) => patch({ [flag.key]: checked })}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 font-ui text-[10px] uppercase tracking-[.18em] text-ink">Inventory preparation</p>
        <p className="mb-3 font-ui text-[11px] text-taupe">
          Fields for Phase 14 — no stock movements are managed in this phase.
        </p>
        <div className="border border-mist/80 bg-canvas px-4 py-1">
          <ToggleRow
            label="Track inventory for this product"
            hint="Marks the product for future stock management."
            checked={Boolean(draft.inventoryTracked)}
            onChange={(checked) => patch({ inventoryTracked: checked })}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Low stock threshold" htmlFor="pf-low-stock">
            <TextInput
              id="pf-low-stock"
              type="number"
              min="0"
              value={draft.lowStockThreshold}
              onChange={(event) => patch({ lowStockThreshold: event.target.value })}
            />
          </Field>
          <Field label="Opening stock (placeholder)" htmlFor="pf-stock">
            <TextInput
              id="pf-stock"
              type="number"
              min="0"
              value={draft.stock}
              onChange={(event) => patch({ stock: event.target.value })}
            />
          </Field>
        </div>
      </div>

      {publishIssues.length ? (
        <div className="border border-accent/40 bg-accent/[0.05] p-4">
          <p className="font-ui text-[10px] uppercase tracking-[.18em] text-accent">Before publishing</p>
          <ul className="mt-2 space-y-1.5">
            {publishIssues.map((issue) => (
              <li key={issue} className="font-ui text-sm text-accent">
                — {issue}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="border border-mist/80 bg-canvas p-4 font-ui text-sm text-ink">
          ✓ This product meets every publishing requirement.
        </p>
      )}
    </div>
  );
}
