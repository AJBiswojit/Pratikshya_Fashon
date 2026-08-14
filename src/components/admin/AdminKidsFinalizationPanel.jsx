/**
 * PRATIKSHYA FASHON — Kids finalization workspace (Phase 22.2).
 *
 * The admin desk for the 21 CONFIRMED Kids products:
 *
 *   kids-001.webp → KID-001 … kids-021.webp → KID-021
 *   21 media assets = 21 SEPARATE products, never merged.
 *
 * It shows, for every product: image, Product ID, name, price, category,
 * status, employee, media ownership and review flags — with search and the
 * Status / Assignment / Ready-to-publish / Needs-review filters, the
 * 9-point completion checklist, employee assignment, explicit ownership
 * decisions and the manual APPROVE → PUBLISH steps.
 *
 * Nothing publishes automatically. Every ownership decision is explicit
 * and logged through the shared workflow service and activity diary.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronDown, ChevronUp, PackageCheck, Search, ShieldCheck } from "lucide-react";
import StatusBadge from "../employee/StatusBadge";
import ProductDraftReviewPanel from "./ProductDraftReviewPanel";
import { useProducts } from "../../hooks/useProducts";
import {
  KIDS_CHECKLIST_ITEMS,
  KIDS_STAGES,
  KIDS_STAGE_LABELS,
  approveKidsProduct,
  getKidsFinalizationRows,
  getKidsFinalizationSummary,
  publishKidsProduct,
  returnKidsProductToDraft,
} from "../../services/kidsProductFinalization";
import {
  KIDS_CONFLICT_ACTIONS,
  assignProductToEmployee,
} from "../../services/productWorkflow";
import { reconcileKidsConflict } from "../../services/productWorkflow";
import { getProductStatusLabel } from "../../config/productCatalogConfig";
import { reviewFlagLabel } from "../../services/productReviewFlags";
import { categoryLabels } from "../../data/products/taxonomy";
import { formatINR } from "../../utils/shopping";
import { employeeFullName } from "../../utils/employee";
import { getActiveAssignmentEmployees, loadEmployees } from "../../services/employees/employeeService";
import { PERMISSIONS } from "../../config/employeePermissions";

/* The four decisions section 2 requires on every ownership conflict. */
const CONFLICT_BUTTONS = [
  { action: KIDS_CONFLICT_ACTIONS.KEEP_EXISTING, label: "Keep Existing" },
  { action: KIDS_CONFLICT_ACTIONS.TRANSFER, label: "Transfer to" },
  { action: KIDS_CONFLICT_ACTIONS.SEPARATE, label: "Create Separate Product" },
  { action: KIDS_CONFLICT_ACTIONS.REVIEW_LATER, label: "Review Later" },
];

const STATUS_FILTERS = [
  { id: "ALL", label: "All" },
  { id: KIDS_STAGES.DRAFT, label: "Draft" },
  { id: KIDS_STAGES.EMPLOYEE_REVIEW, label: "Employee review" },
  { id: KIDS_STAGES.SUBMITTED, label: "Submitted" },
  { id: KIDS_STAGES.APPROVED, label: "Approved" },
  { id: KIDS_STAGES.PUBLISHED, label: "Published" },
];

const QUALITY_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "READY", label: "Ready to publish" },
  { id: "NEEDS_REVIEW", label: "Needs review" },
  { id: "CONFLICT", label: "Ownership conflict" },
  { id: "INCOMPLETE", label: "Checklist incomplete" },
];

const ASSIGNMENT_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "ASSIGNED", label: "Assigned" },
  { id: "UNASSIGNED", label: "Unassigned" },
];

const statusTone = { PUBLISHED: "ink", PENDING_REVIEW: "alert", DRAFT: "quiet", ARCHIVED: "muted" };

const eligibleEmployees = () => {
  try {
    return getActiveAssignmentEmployees(loadEmployees(), {
      requiredPermission: PERMISSIONS.PRODUCTS_MANAGE,
    });
  } catch {
    return [];
  }
};

const matchesQuality = (row, filter) => {
  switch (filter) {
    case "READY":
      return row.ready;
    case "NEEDS_REVIEW":
      return !row.ready && row.stage !== KIDS_STAGES.PUBLISHED;
    case "CONFLICT":
      return row.conflicts.length > 0 || row.ownershipIssues.length > 0;
    case "INCOMPLETE":
      return !row.checklist.complete;
    default:
      return true;
  }
};

const previewSource = (row) => {
  const primary = row.mediaSet?.primary;
  if (primary?.src) return primary.src;
  const contested = (row.conflicts ?? []).find((conflict) => conflict.src);
  if (contested?.src) return contested.src;
  return row.media?.url || row.media?.thumbnail || null;
};

export default function AdminKidsFinalizationPanel({ actor, onNotice, focusId = null }) {
  const items = useProducts();
  const rows = useMemo(() => getKidsFinalizationRows(), [items]);
  const summary = useMemo(() => getKidsFinalizationSummary(rows), [rows]);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [qualityFilter, setQualityFilter] = useState("ALL");
  const [assignmentFilter, setAssignmentFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState(focusId ?? null);
  const [confirm, setConfirm] = useState(null);
  const [showChecklist, setShowChecklist] = useState(true);

  useEffect(() => {
    if (focusId) setExpandedId(focusId);
  }, [focusId]);

  const employees = useMemo(() => eligibleEmployees(), [items]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "ALL" && row.stage !== statusFilter) return false;
      if (!matchesQuality(row, qualityFilter)) return false;
      if (assignmentFilter === "ASSIGNED" && !row.assignedEmployeeId) return false;
      if (assignmentFilter === "UNASSIGNED" && row.assignedEmployeeId) return false;
      if (!term) return true;
      return [
        row.productId,
        row.mediaFile,
        row.product?.name,
        row.product?.subcategory,
        row.assignedEmployeeName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [rows, query, statusFilter, qualityFilter, assignmentFilter]);

  const runConflictAction = (row, action) => {
    const key = `${row.productId}:${action}`;
    if (confirm !== key) {
      setConfirm(key);
      return;
    }
    setConfirm(null);
    const result = reconcileKidsConflict(row.productId, action, actor);
    if (result.ok) {
      const extra =
        action === KIDS_CONFLICT_ACTIONS.TRANSFER && result.archivedOwners?.length
          ? ` Retired ${result.archivedOwners.join(", ")} (no media left).`
          : action === KIDS_CONFLICT_ACTIONS.KEEP_EXISTING
            ? " The draft was archived; the existing product keeps the media."
            : action === KIDS_CONFLICT_ACTIONS.SEPARATE
              ? " The Product ID is kept; the product now needs its own media."
              : "";
      onNotice?.({ tone: "ok", text: `${row.productId}: decision recorded.${extra}` });
    } else {
      onNotice?.({ tone: "warn", text: result.error });
    }
  };

  const assign = (row, employeeId) => {
    const result = assignProductToEmployee(row.productId, employeeId || null, actor);
    onNotice?.(
      result.ok
        ? {
            tone: "ok",
            text: employeeId
              ? `${row.productId} assigned to ${employeeId}.`
              : `${row.productId} unassigned.`,
          }
        : { tone: "warn", text: result.error }
    );
  };

  const approve = (row) => {
    const result = approveKidsProduct(row.productId, actor);
    onNotice?.(
      result.ok
        ? { tone: "ok", text: `${row.productId} approved — publish it when you are ready.` }
        : { tone: "warn", text: (result.errors ?? [result.error]).join(" ") }
    );
  };

  const publish = (row) => {
    const result = publishKidsProduct(row.productId, actor);
    onNotice?.(
      result.ok
        ? { tone: "ok", text: `${row.productId} published to /category/kids.` }
        : { tone: "warn", text: (result.errors ?? [result.error]).join(" ") }
    );
  };

  const sendBack = (row) => {
    const key = `${row.productId}:return`;
    if (confirm !== key) {
      setConfirm(key);
      return;
    }
    setConfirm(null);
    const result = returnKidsProductToDraft(row.productId, "Returned for further review.", actor);
    onNotice?.(
      result.ok
        ? { tone: "ok", text: `${row.productId} returned to draft.` }
        : { tone: "warn", text: result.error }
    );
  };

  return (
    <div>
      {/* Confirmed-identity statement --------------------------------- */}
      <p className="mb-4 flex flex-wrap items-center gap-2 border border-mist bg-ivory/60 px-3 py-2 font-ui text-[11px] text-ink/80">
        <ShieldCheck size={13} className="text-accent" aria-hidden="true" />
        <span>
          Confirmed identity: <strong>21 separate Kids products</strong> — kids-001.webp → KID-001 …
          kids-021.webp → KID-021. Similar is not the same: these products can never be merged, and
          each owns only its own image.
        </span>
        <StatusBadge label={`${summary.identityConfirmed}/21 confirmed`} tone="ink" />
      </p>

      {/* Summary ------------------------------------------------------ */}
      <dl className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Total", summary.total],
          ["Draft", summary.draft],
          ["Review", summary.review],
          ["Ready", summary.ready],
          ["Published", summary.published],
          ["Complete", `${summary.checklistComplete}/21`],
        ].map(([label, value]) => (
          <div key={label} className="border border-mist bg-canvas px-3 py-2">
            <dt className="font-ui text-[9px] uppercase tracking-[.18em] text-taupe">{label}</dt>
            <dd className="font-display text-xl font-light text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {/* Search & filters --------------------------------------------- */}
      <div className="mb-4 space-y-3 border-b border-mist pb-4">
        <label className="flex items-center gap-2 border border-mist bg-canvas px-3 py-2">
          <Search size={13} className="text-taupe" aria-hidden="true" />
          <span className="sr-only">Search Kids products</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by Product ID, media filename, name, subcategory or employee…"
            className="w-full bg-transparent font-ui text-sm outline-none"
          />
        </label>

        {[
          { title: "Status", options: STATUS_FILTERS, value: statusFilter, set: setStatusFilter },
          { title: "Quality", options: QUALITY_FILTERS, value: qualityFilter, set: setQualityFilter },
          {
            title: "Assignment",
            options: ASSIGNMENT_FILTERS,
            value: assignmentFilter,
            set: setAssignmentFilter,
          },
        ].map((group) => (
          <div key={group.title} className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-ui text-[9px] uppercase tracking-[.18em] text-taupe">
              {group.title}
            </span>
            {group.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => group.set(option.id)}
                aria-pressed={group.value === option.id}
                className={`px-3 py-1.5 font-ui text-[10px] uppercase tracking-[.14em] transition-colors ${
                  group.value === option.id
                    ? "bg-ink text-ivory"
                    : "text-taupe hover:bg-mist/60 hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* 21-product checklist ----------------------------------------- */}
      <div className="mb-6 border border-mist bg-canvas">
        <button
          type="button"
          onClick={() => setShowChecklist((value) => !value)}
          className="flex w-full items-center justify-between px-3 py-2.5 text-left"
        >
          <span className="font-ui text-[10px] uppercase tracking-[.18em] text-taupe">
            21-product checklist · {summary.checklistComplete} of {summary.total} complete
          </span>
          {showChecklist ? (
            <ChevronUp size={13} aria-hidden="true" />
          ) : (
            <ChevronDown size={13} aria-hidden="true" />
          )}
        </button>
        {showChecklist ? (
          <div className="overflow-x-auto border-t border-mist">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-mist font-ui text-[9px] uppercase tracking-[.14em] text-taupe">
                  <th scope="col" className="px-3 py-2">Product</th>
                  <th scope="col" className="px-3 py-2">Media</th>
                  {KIDS_CHECKLIST_ITEMS.map((item) => (
                    <th key={item.id} scope="col" className="px-2 py-2">
                      {item.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.productId} className="border-b border-mist/60 font-ui text-[11px]">
                    <td className="px-3 py-2 font-medium text-ink">{row.productId}</td>
                    <td className="px-3 py-2 text-taupe">{row.mediaFile}</td>
                    {KIDS_CHECKLIST_ITEMS.map((item) => {
                      const entry = row.checklist.items.find((candidate) => candidate.id === item.id);
                      return (
                        <td key={item.id} className="px-2 py-2">
                          <span
                            title={entry?.reason ?? item.label}
                            className={entry?.done ? "text-ink" : "text-taupe/60"}
                          >
                            {entry?.done ? "[x]" : "[ ]"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {/* Product cards ------------------------------------------------ */}
      {!filtered.length ? (
        <p className="py-10 text-center font-ui text-sm text-taupe">
          No Kids products in this view.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((row) => {
            const product = row.product;
            const source = previewSource(row);
            const conflictOwners = [
              ...new Set((row.conflicts ?? []).map((conflict) => conflict.ownerProductId).filter(Boolean)),
            ];
            return (
              <li key={row.productId} className="border border-mist bg-canvas">
                <div className="flex flex-col gap-4 p-3 md:flex-row">
                  {/* Image ------------------------------------------------ */}
                  <div className="w-28 shrink-0">
                    <div className="relative aspect-[4/5] w-full overflow-hidden border border-mist bg-ivory">
                      {source ? (
                        <img src={source} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <span className="flex h-full items-center justify-center px-2 text-center font-ui text-[9px] uppercase tracking-[.1em] text-taupe">
                          No media
                        </span>
                      )}
                      {row.conflicts.length ? (
                        <span className="absolute inset-x-0 bottom-0 bg-accent/90 px-1 py-0.5 text-center font-ui text-[8px] uppercase tracking-[.1em] text-ivory">
                          Already assigned
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-center font-ui text-[9px] text-taupe" title={row.mediaFile}>
                      {row.mediaFile}
                    </p>
                  </div>

                  {/* Identity ---------------------------------------------- */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-ui text-[10px] uppercase tracking-[.2em] text-accent">
                        {row.productId}
                      </span>
                      <StatusBadge
                        label={
                          product
                            ? KIDS_STAGE_LABELS[row.stage] ?? getProductStatusLabel(product.status)
                            : "Missing"
                        }
                        tone={product ? statusTone[product.status] ?? "quiet" : "danger"}
                      />
                      {row.identityConfirmed ? (
                        <StatusBadge label="Separate product · confirmed" tone="ink" />
                      ) : (
                        <StatusBadge label="Identity unconfirmed" tone="alert" />
                      )}
                      {row.ready ? <StatusBadge label="Ready to publish" tone="ink" /> : null}
                      <StatusBadge
                        label={`Checklist ${row.checklist.doneCount}/${row.checklist.total}`}
                        tone={row.checklist.complete ? "ink" : "quiet"}
                      />
                    </div>

                    <p className="truncate font-display text-lg font-light text-ink">
                      {product?.name?.trim() || <span className="text-taupe">[Not yet defined]</span>}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 font-ui text-[11px] text-taupe">
                      <span>{formatINR(product?.price ?? 0)}</span>
                      {product?.compareAtPrice > 0 ? (
                        <span>compare-at {formatINR(product.compareAtPrice)}</span>
                      ) : null}
                      <span>
                        {categoryLabels[product?.category] ?? product?.category ?? "—"}
                        {product?.subcategory ? ` · ${product.subcategory}` : " · subcategory review required"}
                      </span>
                      <span>Inventory: {Number(product?.stock ?? 0)}</span>
                      <span>
                        Hover:{" "}
                        {row.hover?.changesOnHover
                          ? `${row.hover.hoverFile}`
                          : "no change (single image)"}
                      </span>
                    </div>

                    <p className="font-ui text-[11px] text-taupe">
                      Media ownership:{" "}
                      {row.conflicts.length
                        ? `owned by ${conflictOwners.join(", ")} — claimed by ${row.productId}`
                        : row.mediaSet?.primary
                          ? `${row.productId} owns ${row.hover?.primaryFile ?? row.mediaFile}`
                          : "no media"}
                    </p>

                    {row.ownershipIssues.length ? (
                      <ul className="font-ui text-[10px] text-accent">
                        {row.ownershipIssues.map((issue) => (
                          <li key={`${issue.kind}-${issue.file}`}>{issue.message}</li>
                        ))}
                      </ul>
                    ) : null}

                    {row.reviewFlags?.length ? (
                      <p className="font-ui text-[10px] text-accent">
                        Flags: {row.reviewFlags.map((flag) => reviewFlagLabel(flag)).join(" · ")}
                      </p>
                    ) : null}

                    {/* Assignment ---------------------------------------- */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <label
                        htmlFor={`assign-${row.productId}`}
                        className="font-ui text-[9px] uppercase tracking-[.16em] text-taupe"
                      >
                        Assigned employee
                      </label>
                      <select
                        id={`assign-${row.productId}`}
                        value={row.assignedEmployeeId ?? ""}
                        onChange={(event) => assign(row, event.target.value)}
                        disabled={!product}
                        className="border border-mist bg-canvas px-2 py-1 font-ui text-[11px] outline-none focus:border-accent disabled:opacity-40"
                      >
                        <option value="">— Unassigned —</option>
                        {employees.map((employee) => (
                          <option key={employee.employeeId} value={employee.employeeId}>
                            {employeeFullName(employee)} · {employee.employeeId}
                          </option>
                        ))}
                      </select>
                      {product ? (
                        <Link
                          to={`/admin/products/${row.productId}`}
                          className="font-ui text-[11px] text-accent underline-offset-2 hover:underline"
                        >
                          Open full record →
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  {/* Actions ----------------------------------------------- */}
                  <div className="flex shrink-0 flex-col items-stretch gap-1.5 md:items-end">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expandedId === row.productId ? null : row.productId)}
                      disabled={!product}
                      className="inline-flex items-center justify-center gap-1 border border-ink px-3 py-1.5 font-ui text-[10px] uppercase tracking-[.12em] text-ink transition-colors hover:bg-ink hover:text-ivory disabled:opacity-40"
                    >
                      {expandedId === row.productId ? (
                        <ChevronUp size={11} aria-hidden="true" />
                      ) : (
                        <ChevronDown size={11} aria-hidden="true" />
                      )}
                      Review &amp; edit
                    </button>
                    {row.stage === KIDS_STAGES.SUBMITTED ? (
                      <button
                        type="button"
                        onClick={() => approve(row)}
                        className="inline-flex items-center justify-center gap-1 border border-ink px-3 py-1.5 font-ui text-[10px] uppercase tracking-[.12em] text-ink transition-colors hover:bg-ink hover:text-ivory"
                      >
                        <CheckCircle2 size={11} aria-hidden="true" /> Approve
                      </button>
                    ) : null}
                    {row.stage === KIDS_STAGES.APPROVED ? (
                      <button
                        type="button"
                        onClick={() => publish(row)}
                        className="inline-flex items-center justify-center gap-1 border border-accent px-3 py-1.5 font-ui text-[10px] uppercase tracking-[.12em] text-accent transition-colors hover:bg-accent hover:text-ivory"
                      >
                        <PackageCheck size={11} aria-hidden="true" /> Publish
                      </button>
                    ) : null}
                    {[KIDS_STAGES.SUBMITTED, KIDS_STAGES.APPROVED].includes(row.stage) ? (
                      <button
                        type="button"
                        onClick={() => sendBack(row)}
                        className="border border-mist px-3 py-1.5 font-ui text-[10px] uppercase tracking-[.12em] text-taupe transition-colors hover:border-accent hover:text-accent"
                      >
                        {confirm === `${row.productId}:return` ? "Confirm?" : "Return to draft"}
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Publish blockers -------------------------------------- */}
                {product && !row.ready && row.stage !== KIDS_STAGES.PUBLISHED && row.blockers.length ? (
                  <div className="border-t border-mist bg-ivory/40 px-3 py-2">
                    <p className="font-ui text-[10px] uppercase tracking-[.16em] text-accent">
                      Publishing blocked — {row.blockers.length} reason
                      {row.blockers.length === 1 ? "" : "s"}
                    </p>
                    <ul className="mt-1 list-disc pl-4 font-ui text-[11px] text-ink/80">
                      {row.blockers.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* Ownership decisions ----------------------------------- */}
                {row.conflicts.length ? (
                  <div className="border-t border-mist bg-ivory/60 px-3 py-2.5">
                    <p className="mb-1 font-ui text-[10px] uppercase tracking-[.16em] text-accent">
                      Media already assigned — current media owner:{" "}
                      {conflictOwners.join(", ") || "unknown"}
                    </p>
                    <p className="mb-2 font-ui text-[10px] text-taupe">
                      Nothing is transferred, deleted or replaced silently. Choose explicitly — the
                      decision is logged in the activity diary.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {CONFLICT_BUTTONS.map((button) => {
                        const key = `${row.productId}:${button.action}`;
                        const armed = confirm === key;
                        const label =
                          button.action === KIDS_CONFLICT_ACTIONS.TRANSFER
                            ? `Transfer to ${row.productId}`
                            : button.label;
                        return (
                          <button
                            key={button.action}
                            type="button"
                            onClick={() => runConflictAction(row, button.action)}
                            className={`border px-2.5 py-1.5 font-ui text-[10px] uppercase tracking-[.1em] transition-colors ${
                              armed
                                ? "border-accent bg-accent text-ivory"
                                : "border-mist text-taupe hover:border-ink hover:text-ink"
                            }`}
                          >
                            {armed ? "Confirm? " : ""}
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Full editing desk ------------------------------------- */}
                {expandedId === row.productId && product ? (
                  <div className="border-t border-mist p-3">
                    <ProductDraftReviewPanel product={product} actor={actor} onNotice={onNotice} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 font-ui text-[10px] leading-relaxed text-taupe">
        <CheckCircle2 size={11} className="mr-1 inline" aria-hidden="true" />
        No Kids product is published automatically. A product reaches /category/kids only after the
        employee submits it, an admin approves it and an admin publishes it — and only when every
        publish condition is satisfied.
      </p>
    </div>
  );
}
