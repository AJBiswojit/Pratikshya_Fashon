/**
 * PRATIKSHYA FASHON — Product draft review panel (Phase 22).
 *
 * The admin side of one DRAFT: the complete group preview (ProductPreview),
 * the commercial fields, employee assignment, ownership-conflict resolution
 * and the workflow actions — Save / Submit / Approve & Publish / Archive.
 * Every action routes through the workflow service and the shared diary.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Archive, ArrowRight, Check, Save } from "lucide-react";
import ProductPreview from "../product/ProductPreview";
import StatusBadge from "../employee/StatusBadge";
import catalogRepository, { getPublishIssues } from "../../services/catalogRepository";
import {
  approveProduct,
  archiveProduct,
  changeProductId,
  getProductWorkflowView,
  publishProduct,
  submitProductForReview,
  transferMediaOwnership,
} from "../../services/productWorkflow";
import { CATEGORY_OPTIONS, getProductStatusLabel } from "../../config/productCatalogConfig";
import taxonomyRepository from "../../services/taxonomyRepository";
import { employeeFullName } from "../../utils/employee";
import { getEmployee, loadEmployees } from "../../services/employees/employeeService";

const fieldClass =
  "w-full border border-mist bg-canvas px-3 py-2 font-ui text-sm outline-none focus:border-accent";
const labelClass = "mb-1 block font-ui text-[10px] uppercase tracking-[.16em] text-taupe";

const statusTone = { PUBLISHED: "ink", PENDING_REVIEW: "alert", DRAFT: "quiet", ARCHIVED: "muted" };

export default function ProductDraftReviewPanel({ product, actor, onNotice }) {
  const [name, setName] = useState(product.name ?? "");
  const [category, setCategory] = useState(product.category ?? "");
  const [subcategory, setSubcategory] = useState(product.subcategory ?? "");
  const [price, setPrice] = useState(product.price > 0 ? String(product.price) : "");
  const [compareAt, setCompareAt] = useState(
    (product.compareAtPrice ?? product.originalPrice) > 0
      ? String(product.compareAtPrice ?? product.originalPrice)
      : ""
  );
  const [description, setDescription] = useState(product.description ?? "");
  const [confirmTransfer, setConfirmTransfer] = useState(null);
  const [newId, setNewId] = useState("");
  const [idEditing, setIdEditing] = useState(false);

  useEffect(() => {
    setName(product.name ?? "");
    setCategory(product.category ?? "");
    setSubcategory(product.subcategory ?? "");
    setPrice(product.price > 0 ? String(product.price) : "");
    setCompareAt(
      (product.compareAtPrice ?? product.originalPrice) > 0
        ? String(product.compareAtPrice ?? product.originalPrice)
        : ""
    );
    setDescription(product.description ?? "");
  }, [product]);

  const view = getProductWorkflowView(product);
  const conflicts = view?.conflicts ?? [];
  const issues = getPublishIssues(product);

  const save = () => {
    const patch = {
      name: name.trim(),
      category,
      subcategory,
      price: price === "" ? 0 : Number(price) || 0,
      compareAtPrice: compareAt === "" ? null : Number(compareAt) || null,
      description,
    };
    const pricingPatch = {
      pricing: {
        ...(product.pricing ?? {}),
        sellingPrice: patch.price,
        mrp: Math.max(patch.price, patch.compareAtPrice ?? 0),
      },
    };
    const result = catalogRepository.updateDraft(product.id, { ...patch, ...pricingPatch }, actor);
    if (result.ok) {
      onNotice?.({ tone: "ok", text: `Saved ${product.id}.` });
    } else {
      onNotice?.({ tone: "warn", text: result.error });
    }
  };

  const submit = () => {
    const result = submitProductForReview(product.id, actor);
    onNotice?.(
      result.ok
        ? { tone: "ok", text: `${product.id} submitted for review.` }
        : { tone: "warn", text: result.error ?? "Could not submit." }
    );
  };

  const approve = () => {
    const result = approveProduct(product.id, actor);
    onNotice?.(
      result.ok
        ? { tone: "ok", text: `${product.id} approved and published.` }
        : { tone: "warn", text: (result.errors ?? [result.error]).join(" ") }
    );
  };

  const publish = () => {
    const result = publishProduct(product.id, actor);
    onNotice?.(
      result.ok
        ? { tone: "ok", text: `${product.id} published.` }
        : { tone: "warn", text: (result.errors ?? [result.error]).join(" ") }
    );
  };

  const archive = () => {
    const result = archiveProduct(product.id, actor);
    onNotice?.(
      result.ok
        ? { tone: "ok", text: `${product.id} archived.` }
        : { tone: "warn", text: result.error }
    );
  };

  const resolveConflict = (conflict) => {
    if (confirmTransfer !== conflict.mediaId) {
      setConfirmTransfer(conflict.mediaId);
      return;
    }
    const result = transferMediaOwnership(conflict.mediaId, product.id, actor, { confirm: true });
    if (result.ok) {
      setConfirmTransfer(null);
      onNotice?.({ tone: "ok", text: `Ownership of ${conflict.file} moved to ${product.id}.` });
    } else {
      onNotice?.({ tone: "warn", text: result.error });
    }
  };

  const changeId = () => {
    const result = changeProductId(product.id, newId, actor);
    if (result.ok) {
      setIdEditing(false);
      setNewId("");
      onNotice?.({ tone: "ok", text: `Product ID changed to ${result.product.id}.` });
    } else {
      onNotice?.({ tone: "warn", text: result.error });
    }
  };

  const assignedEmployee = product.assignedEmployeeId
    ? getEmployee(loadEmployees(), product.assignedEmployeeId)
    : null;

  return (
    <div className="border border-mist bg-canvas">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mist px-4 py-3">
        <div>
          <p className="font-ui text-[10px] uppercase tracking-[.24em] text-accent">
            Product ID · {product.id}
          </p>
          <p className="font-display text-xl font-light text-ink">
            {product.name?.trim() || <span className="text-taupe">[Not yet defined]</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            label={getProductStatusLabel(product.status)}
            tone={statusTone[product.status] ?? "quiet"}
          />
          {assignedEmployee ? (
            <StatusBadge label={`Assigned · ${employeeFullName(assignedEmployee)}`} tone="ink" />
          ) : (
            <StatusBadge label="Unassigned" tone="quiet" />
          )}
          <Link
            to={`/admin/products/${product.id}`}
            className="font-ui text-[11px] text-accent underline-offset-2 hover:underline"
          >
            Open full record →
          </Link>
        </div>
      </div>

      <div className="grid gap-6 p-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* Complete group preview ---------------------------------- */}
        <ProductPreview product={product} category={product.category} />

        {/* Commercial fields --------------------------------------- */}
        <div className="space-y-4">
          {conflicts.length ? (
            <div className="border border-accent/40 bg-accent/5 px-3 py-2">
              <p className="font-ui text-[10px] uppercase tracking-[.16em] text-accent">
                Media ownership
              </p>
              {conflicts.map((conflict) => (
                <div
                  key={conflict.mediaId}
                  className="mt-1 flex flex-wrap items-center justify-between gap-2"
                >
                  <p className="font-ui text-[11px] text-ink/80">
                    {conflict.file} — MEDIA ALREADY ASSIGNED
                    {conflict.ownerProductId ? ` to ${conflict.ownerProductId}` : ""}
                  </p>
                  <button
                    type="button"
                    onClick={() => resolveConflict(conflict)}
                    className="border border-accent px-3 py-1.5 font-ui text-[10px] uppercase tracking-[.12em] text-accent transition-colors hover:bg-accent hover:text-ivory"
                  >
                    {confirmTransfer === conflict.mediaId
                      ? "Confirm transfer of ownership"
                      : "Transfer ownership to this draft"}
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div>
            <label htmlFor={`name-${product.id}`} className={labelClass}>
              Product name
            </label>
            <input
              id={`name-${product.id}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Boys Cotton Casual Set in Yellow"
              className={fieldClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`cat-${product.id}`} className={labelClass}>
                Category
              </label>
              <select
                id={`cat-${product.id}`}
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setSubcategory("");
                }}
                className={fieldClass}
              >
                <option value="">— Select category —</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`sub-${product.id}`} className={labelClass}>
                Subcategory
              </label>
              <select
                id={`sub-${product.id}`}
                value={subcategory}
                onChange={(event) => setSubcategory(event.target.value)}
                className={fieldClass}
              >
                <option value="">— Select subcategory —</option>
                {(taxonomyRepository.subcategoryOptionsFor(category) ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`price-${product.id}`} className={labelClass}>
                Price (₹)
              </label>
              <input
                id={`price-${product.id}`}
                type="number"
                min="0"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="1290"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor={`compare-${product.id}`} className={labelClass}>
                Compare-at price (₹)
              </label>
              <input
                id={`compare-${product.id}`}
                type="number"
                min="0"
                value={compareAt}
                onChange={(event) => setCompareAt(event.target.value)}
                placeholder="1690"
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor={`desc-${product.id}`} className={labelClass}>
              Description
            </label>
            <textarea
              id={`desc-${product.id}`}
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Fabric, fit, occasion — the commercial information a customer needs."
              className={fieldClass}
            />
          </div>

          {issues.length ? (
            <div className="border border-accent/40 bg-accent/5 px-3 py-2">
              <p className="font-ui text-[10px] uppercase tracking-[.16em] text-accent">
                Before publishing
              </p>
              <ul className="mt-1 list-disc pl-4 font-ui text-[11px] text-ink/80">
                {issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 border-t border-mist pt-4">
            <button
              type="button"
              onClick={save}
              className="inline-flex items-center gap-1.5 border border-ink bg-ink px-4 py-2 font-ui text-[10px] uppercase tracking-[.16em] text-ivory transition-colors hover:bg-transparent hover:text-ink"
            >
              <Save size={11} aria-hidden="true" /> Save Draft
            </button>
            <button
              type="button"
              onClick={submit}
              className="inline-flex items-center gap-1.5 border border-ink px-4 py-2 font-ui text-[10px] uppercase tracking-[.16em] text-ink transition-colors hover:bg-ink hover:text-ivory"
            >
              <ArrowRight size={11} aria-hidden="true" /> Submit for Review
            </button>
            <button
              type="button"
              onClick={approve}
              className="inline-flex items-center gap-1.5 border border-accent px-4 py-2 font-ui text-[10px] uppercase tracking-[.16em] text-accent transition-colors hover:bg-accent hover:text-ivory"
            >
              <Check size={11} aria-hidden="true" /> Approve &amp; Publish
            </button>
            <button
              type="button"
              onClick={publish}
              className="border border-mist px-4 py-2 font-ui text-[10px] uppercase tracking-[.16em] text-taupe transition-colors hover:border-ink hover:text-ink"
            >
              Publish
            </button>
            <button
              type="button"
              onClick={archive}
              className="inline-flex items-center gap-1.5 border border-mist px-4 py-2 font-ui text-[10px] uppercase tracking-[.16em] text-taupe transition-colors hover:border-accent hover:text-accent"
            >
              <Archive size={11} aria-hidden="true" /> Archive
            </button>
          </div>

          {idEditing ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-mist pt-3">
              <input
                value={newId}
                onChange={(event) => setNewId(event.target.value)}
                placeholder="KID-007"
                className="border border-mist bg-canvas px-3 py-2 font-ui text-sm outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={changeId}
                className="border border-ink px-3 py-2 font-ui text-[10px] uppercase tracking-[.14em] text-ink transition-colors hover:bg-ink hover:text-ivory"
              >
                Confirm ID change
              </button>
              <button
                type="button"
                onClick={() => setIdEditing(false)}
                className="border border-mist px-3 py-2 font-ui text-[10px] uppercase tracking-[.14em] text-taupe"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIdEditing(true)}
              className="font-ui text-[11px] text-taupe underline-offset-2 hover:text-accent hover:underline"
            >
              Change Product ID…
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
