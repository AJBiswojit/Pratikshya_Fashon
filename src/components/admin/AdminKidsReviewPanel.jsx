/**
 * PRATIKSHYA FASHON — Kids reconciliation panel (Phase 22.1).
 *
 * KID-001 … KID-021 with everything the admin needs to finish the Kids
 * catalogue safely:
 *
 *   · preview thumbnail (contested media shows MEDIA ALREADY ASSIGNED)
 *   · Product ID, name, price, category, media count, Front/Side/Back/Detail
 *   · ownership, assigned employee, status, review flags, review issues
 *   · filters: ALL / DRAFT / NEEDS REVIEW / CONFLICT / READY TO PUBLISH /
 *     PUBLISHED
 *   · the five conflict decisions with confirmation:
 *       KEEP EXISTING PRODUCT · TRANSFER TO KID PRODUCT ·
 *       MERGE INTO EXISTING PRODUCT · CREATE SEPARATE PRODUCT · REVIEW LATER
 *
 * Every ownership-changing action routes through `reconcileKidsConflict`
 * and is logged in the shared activity diary.
 */

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, PackageCheck } from "lucide-react";
import StatusBadge from "../employee/StatusBadge";
import ProductDraftReviewPanel from "./ProductDraftReviewPanel";
import { useProducts } from "../../hooks/useProducts";
import {
  KIDS_CONFLICT_ACTIONS,
  KIDS_CONFLICT_ACTION_LABELS,
  getKidsReconciliationRows,
  publishProduct,
  reconcileKidsConflict,
} from "../../services/productWorkflow";
import { getProductStatusLabel } from "../../config/productCatalogConfig";
import { formatINR } from "../../utils/shopping";
import { categoryLabels } from "../../data/products/taxonomy";
import { employeeFullName } from "../../utils/employee";
import { getEmployee, loadEmployees } from "../../services/employees/employeeService";
import { reviewFlagLabel } from "../../services/productReviewFlags";

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "DRAFT", label: "Draft" },
  { id: "NEEDS_REVIEW", label: "Needs Review" },
  { id: "CONFLICT", label: "Conflict" },
  { id: "READY", label: "Ready to Publish" },
  { id: "PUBLISHED", label: "Published" },
];

const statusTone = { PUBLISHED: "ink", PENDING_REVIEW: "alert", DRAFT: "quiet", ARCHIVED: "muted" };

const matchesFilter = (row, filter) => {
  const status = row.product.status;
  switch (filter) {
    case "ALL":
      return true;
    case "DRAFT":
      return status === "DRAFT";
    case "NEEDS_REVIEW":
      return (
        status === "DRAFT" &&
        !row.ready &&
        (row.blockers.length > 0 || row.conflicts.length > 0 || row.issues.length > 0)
      );
    case "CONFLICT":
      return row.conflicts.length > 0;
    case "READY":
      return row.ready;
    case "PUBLISHED":
      return status === "PUBLISHED";
    default:
      return true;
  }
};

const previewSource = (row) => {
  const primary = row.mediaSet.primary;
  if (primary?.src) return primary.src;
  const contested = row.conflicts.find((conflict) => conflict.src);
  return contested?.src ?? null;
};

const viewChips = (row) => {
  const set = row.mediaSet;
  return ["front", "side", "back", "detail"]
    .filter((view) => set[view])
    .map((view) => view.charAt(0).toUpperCase() + view.slice(1));
};

const employeeName = (employeeId) => {
  if (!employeeId) return null;
  try {
    const employee = getEmployee(loadEmployees(), employeeId);
    return employee ? employeeFullName(employee) : employeeId;
  } catch {
    return employeeId;
  }
};

export default function AdminKidsReviewPanel({ actor, onNotice, focusId = null }) {
  const items = useProducts();
  const rows = useMemo(() => getKidsReconciliationRows(), [items]);
  const [filter, setFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState(focusId ?? null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    if (focusId) setExpandedId(focusId);
  }, [focusId]);

  const counts = useMemo(() => {
    const map = {};
    FILTERS.forEach((entry) => {
      map[entry.id] = rows.filter((row) => matchesFilter(row, entry.id)).length;
    });
    return map;
  }, [rows]);

  const filtered = useMemo(
    () => rows.filter((row) => matchesFilter(row, filter)),
    [rows, filter]
  );

  const runAction = (row, action) => {
    if (confirm?.productId !== row.product.id || confirm?.action !== action) {
      setConfirm({ productId: row.product.id, action });
      return;
    }
    setConfirm(null);
    const result = reconcileKidsConflict(row.product.id, action, actor);
    if (result.ok) {
      const extras =
        action === KIDS_CONFLICT_ACTIONS.TRANSFER && result.archivedOwners?.length
          ? ` Retired ${result.archivedOwners.join(", ")} (no media left).`
          : action === KIDS_CONFLICT_ACTIONS.MERGE && result.mergedInto
            ? ` Draft content merged into ${result.mergedInto}.`
            : action === KIDS_CONFLICT_ACTIONS.KEEP_EXISTING
              ? ` Draft archived.`
              : action === KIDS_CONFLICT_ACTIONS.SEPARATE
                ? ` The draft keeps its identity and needs new media.`
                : "";
      onNotice?.({
        tone: "ok",
        text: `${row.product.id}: ${KIDS_CONFLICT_ACTION_LABELS[action]}.${extras}`,
      });
    } else {
      onNotice?.({ tone: "warn", text: result.error });
    }
  };

  const publish = (row) => {
    const result = publishProduct(row.product.id, actor);
    if (result.ok) {
      onNotice?.({ tone: "ok", text: `${row.product.id} published to the storefront.` });
    } else {
      onNotice?.({
        tone: "warn",
        text: `Cannot publish ${row.product.id}: ${(result.errors ?? [result.error]).join(" ")}`,
      });
    }
  };

  return (
    <div>
      {/* Filters ------------------------------------------------------ */}
      <div className="mb-4 flex flex-wrap gap-1.5 border-b border-mist pb-4">
        {FILTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setFilter(entry.id)}
            className={`px-3 py-1.5 font-ui text-[10px] uppercase tracking-[.14em] transition-colors ${
              filter === entry.id
                ? "bg-ink text-ivory"
                : "text-taupe hover:bg-mist/60 hover:text-ink"
            }`}
            aria-pressed={filter === entry.id}
          >
            {entry.label} · {counts[entry.id] ?? 0}
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <p className="py-10 text-center font-ui text-sm text-taupe">
          No Kids products in this view.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((row) => {
            const product = row.product;
            const source = previewSource(row);
            const chips = viewChips(row);
            const assigned = employeeName(product.assignedEmployeeId);
            const actionArmed =
              confirm?.productId === product.id && confirm?.action;
            return (
              <li key={product.id} className="border border-mist bg-canvas">
                <div className="flex flex-col gap-4 p-3 md:flex-row">
                  {/* Preview ------------------------------------------------- */}
                  <div className="w-24 shrink-0">
                    <div className="relative aspect-[4/5] w-full overflow-hidden border border-mist bg-ivory">
                      {source ? (
                        <img src={source} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : null}
                      {row.conflicts.length ? (
                        <span className="absolute inset-x-0 bottom-0 bg-accent/90 px-1 py-0.5 text-center font-ui text-[8px] uppercase tracking-[.1em] text-ivory">
                          Already assigned
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-center font-ui text-[9px] uppercase tracking-[.1em] text-taupe">
                      {row.mediaSet.gallery.length || row.conflicts.length
                        ? `${row.mediaSet.gallery.length + row.conflicts.length} view${row.mediaSet.gallery.length + row.conflicts.length === 1 ? "" : "s"}`
                        : "No media"}
                    </p>
                  </div>

                  {/* Identity & merchandising -------------------------------- */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-ui text-[10px] uppercase tracking-[.2em] text-accent">
                        {product.id}
                      </span>
                      <StatusBadge
                        label={getProductStatusLabel(product.status)}
                        tone={statusTone[product.status] ?? "quiet"}
                      />
                      {row.ready ? (
                        <StatusBadge label="Ready to publish" tone="ink" />
                      ) : null}
                    </div>
                    <p className="truncate font-display text-lg font-light text-ink">
                      {product.name?.trim() || <span className="text-taupe">[Not yet defined]</span>}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 font-ui text-[11px] text-taupe">
                      <span>{formatINR(product.price)}</span>
                      {product.compareAtPrice > 0 ? (
                        <span>
                          compare-at {formatINR(product.compareAtPrice)}
                        </span>
                      ) : null}
                      <span>
                        {categoryLabels[product.category] ?? product.category}
                        {product.subcategory ? ` · ${product.subcategory}` : ""}
                      </span>
                      <span>
                        Views: {chips.length ? chips.join(" / ") : "unlabelled (single image)"}
                      </span>
                    </div>
                    <p className="font-ui text-[11px] text-taupe">
                      Ownership:{" "}
                      {row.conflicts.length
                        ? `media owned by ${[...new Set(row.conflicts.map((c) => c.ownerProductId))].join(", ")} — claimed by this draft`
                        : row.mediaSet.gallery.length
                          ? "owned by this product"
                          : "no media"}
                      {" · "}Assigned: {assigned ?? "—"}
                    </p>
                    {product.reviewFlags?.length ? (
                      <p className="font-ui text-[10px] text-accent">
                        Flags:{" "}
                        {product.reviewFlags
                          .map((flag) => reviewFlagLabel(flag))
                          .join(" · ")}
                      </p>
                    ) : null}
                    {row.issues.length ? (
                      <p className="font-ui text-[10px] text-taupe">
                        {row.issues.length} review issue{row.issues.length === 1 ? "" : "s"} —{" "}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(expandedId === product.id ? null : product.id)
                          }
                          className="underline-offset-2 hover:text-accent hover:underline"
                        >
                          review
                        </button>
                      </p>
                    ) : null}
                  </div>

                  {/* Actions -------------------------------------------------- */}
                  <div className="flex shrink-0 flex-col items-stretch gap-1.5 md:items-end">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(expandedId === product.id ? null : product.id)
                      }
                      className="inline-flex items-center justify-center gap-1 border border-ink px-3 py-1.5 font-ui text-[10px] uppercase tracking-[.12em] text-ink transition-colors hover:bg-ink hover:text-ivory"
                    >
                      {expandedId === product.id ? (
                        <ChevronUp size={11} aria-hidden="true" />
                      ) : (
                        <ChevronDown size={11} aria-hidden="true" />
                      )}
                      Review
                    </button>
                    {row.ready ? (
                      <button
                        type="button"
                        onClick={() => publish(row)}
                        className="inline-flex items-center justify-center gap-1 border border-accent px-3 py-1.5 font-ui text-[10px] uppercase tracking-[.12em] text-accent transition-colors hover:bg-accent hover:text-ivory"
                      >
                        <PackageCheck size={11} aria-hidden="true" /> Publish
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Conflict decisions ---------------------------------------- */}
                {row.conflicts.length ? (
                  <div className="border-t border-mist bg-ivory/60 px-3 py-2.5">
                    <p className="mb-2 font-ui text-[10px] uppercase tracking-[.16em] text-accent">
                      MEDIA ALREADY ASSIGNED — choose the reconciliation
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.values(KIDS_CONFLICT_ACTIONS).map((action) => {
                        const armed = actionArmed === action;
                        const destructive =
                          action === KIDS_CONFLICT_ACTIONS.TRANSFER ||
                          action === KIDS_CONFLICT_ACTIONS.MERGE ||
                          action === KIDS_CONFLICT_ACTIONS.KEEP_EXISTING ||
                          action === KIDS_CONFLICT_ACTIONS.SEPARATE;
                        return (
                          <button
                            key={action}
                            type="button"
                            onClick={() => runAction(row, action)}
                            className={`border px-2.5 py-1.5 font-ui text-[10px] uppercase tracking-[.1em] transition-colors ${
                              armed
                                ? "border-accent bg-accent text-ivory"
                                : destructive
                                  ? "border-mist text-taupe hover:border-accent hover:text-accent"
                                  : "border-mist text-taupe hover:border-ink hover:text-ink"
                            }`}
                          >
                            {armed ? "Confirm? " : ""}
                            {KIDS_CONFLICT_ACTION_LABELS[action]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Full review desk ----------------------------------------- */}
                {expandedId === product.id ? (
                  <div className="border-t border-mist p-3">
                    <ProductDraftReviewPanel product={product} actor={actor} onNotice={onNotice} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {counts.PUBLISHED === 0 && (
        <p className="mt-4 font-ui text-[10px] text-taupe">
          <CheckCircle2 size={11} className="mr-1 inline" aria-hidden="true" />
          Until a decision is taken, every KID draft stays invisible to customers — the
          existing published Kids products keep serving the storefront.
        </p>
      )}
    </div>
  );
}
