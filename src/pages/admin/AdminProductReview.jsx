/**
 * /admin/products/review
 *
 * Phase 22 — the media-to-product review desk.
 *
 *   · MEDIA INBOX — every media asset that is UNASSIGNED / DRAFT / REVIEW /
 *     NEEDS_REVIEW, with preview, ownership, Product ID, status, category
 *     and the assigned employee.
 *   · PRODUCT DRAFTS — the DRAFT records with their complete group preview
 *     and the workflow actions (save, submit, approve & publish).
 *   · REVIEW QUEUE — submitted products awaiting approval.
 *   · GROUP REVIEW — potential same-product groups; a human decides
 *     SAME PRODUCT vs SEPARATE PRODUCTS. Similarity never decides alone.
 *
 * Reuses the existing Admin shell, the shared product register and the
 * shared activity diary — no second media or auth system.
 */

import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Eye, X } from "lucide-react";
import AdminPage from "../../components/admin/AdminPage";
import AdminPanel from "../../components/admin/AdminPanel";
import StatusBadge from "../../components/employee/StatusBadge";
import MediaInboxCard from "../../components/admin/MediaInboxCard";
import ProductDraftReviewPanel from "../../components/admin/ProductDraftReviewPanel";
import ProductGroupReviewPanel from "../../components/admin/ProductGroupReviewPanel";
import AdminKidsReviewPanel from "../../components/admin/AdminKidsReviewPanel";
import AdminKidsFinalizationPanel from "../../components/admin/AdminKidsFinalizationPanel";
import { AtelierButton } from "../../design-system";
import catalogRepository, { getPublishIssues } from "../../services/catalogRepository";
import inventoryRepository from "../../services/inventory/inventoryRepository";
import { getMediaInbox } from "../../services/productWorkflow";
import { useProducts } from "../../hooks/useProducts";
import { useProductMediaSummaries } from "../../hooks/useMedia";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { formatINR } from "../../utils/shopping";
import { categoryLabels } from "../../data/products/taxonomy";
import { PRODUCT_STATUSES } from "../../config/productCatalogConfig";
import { formatEmployeeDateTime } from "../../utils/employee";

const INBOX_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "UNASSIGNED", label: "Unassigned" },
  { id: "DRAFT", label: "Draft" },
  { id: "REVIEW", label: "Review" },
  { id: "NEEDS_REVIEW", label: "Needs review" },
  { id: "CLAIMED_BY_DRAFT", label: "Claimed by draft" },
];

export default function AdminProductReview() {
  const { admin } = useAdminAuth();
  const actor = admin ? { adminId: admin.adminId, name: admin.name || "Administrator" } : null;

  const items = useProducts();
  const mediaSummaries = useProductMediaSummaries(items);
  const [searchParams, setSearchParams] = useSearchParams();
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState(null);
  const [inboxFilter, setInboxFilter] = useState("ALL");

  const inbox = useMemo(() => getMediaInbox(), [items]);
  const filteredInbox = useMemo(
    () => (inboxFilter === "ALL" ? inbox : inbox.filter((row) => row.tags.includes(inboxFilter))),
    [inbox, inboxFilter]
  );

  const queue = items
    .filter((product) => product.status === PRODUCT_STATUSES.PENDING_REVIEW)
    .sort((a, b) => (a.review.submittedAt < b.review.submittedAt ? 1 : -1));

  const drafts = items
    .filter((product) => product.status === PRODUCT_STATUSES.DRAFT)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  /* Phase 22.1 — Kids reconciliation gets its own desk; other categories
     keep the generic draft desk. */
  const kidsDrafts = drafts.filter((product) => /^KID-\d{3}$/.test(String(product.id)));
  const otherDrafts = drafts.filter((product) => !/^KID-\d{3}$/.test(String(product.id)));

  const focusedDraftId = searchParams.get("draft");
  const focusedDraft =
    otherDrafts.find((product) => product.id === focusedDraftId) ?? otherDrafts[0] ?? null;

  const recentlyReviewed = items
    .filter((product) => ["APPROVED", "REJECTED"].includes(product.review.state))
    .sort((a, b) => (a.review.reviewedAt < b.review.reviewedAt ? 1 : -1))
    .slice(0, 6);

  const approve = (product) => {
    const result = catalogRepository.approveProduct(product.id, actor);
    if (result.ok) {
      inventoryRepository.ensureOpeningStock(result.product, actor);
      setNotice({ tone: "ok", text: `Approved and published “${product.name}”.` });
    } else {
      setNotice({ tone: "warn", text: `Could not approve “${product.name}”: ${(result.errors ?? []).join(" ")}` });
    }
  };

  const reject = (product) => {
    const result = catalogRepository.rejectProduct(
      product.id,
      reason.trim() || "Missing product details.",
      actor
    );
    if (result.ok) setNotice({ tone: "ok", text: `Rejected “${product.name}” — returned to draft.` });
    setRejectingId(null);
    setReason("");
  };

  return (
    <AdminPage
      eyebrow="Business / Products"
      title={
        <>
          Product <span className="italic text-accent">review.</span>
        </>
      }
      description="Media becomes a product only through human review: the inbox shows every unassigned or open asset, drafts carry their complete group preview, and nothing reaches the storefront until it is approved and published."
      actions={
        <AtelierButton as={Link} to="/admin/products" size="chip" variant="outline">
          Back to catalog
        </AtelierButton>
      }
    >
      {notice ? (
        <p
          aria-live="polite"
          className={`mb-6 border px-4 py-3 font-ui text-sm ${
            notice.tone === "warn"
              ? "border-accent/60 bg-accent/5 text-accent"
              : "border-mist/80 bg-canvas text-ink"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      {/* ------------------------------------------------------------ */}
      {/* MEDIA INBOX                                                   */}
      {/* ------------------------------------------------------------ */}
      <AdminPanel eyebrow={`Media inbox · ${filteredInbox.length} of ${inbox.length}`} title="Media inbox">
        <div className="mb-4 flex flex-wrap gap-1.5 border-b border-mist pb-4">
          {INBOX_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setInboxFilter(filter.id)}
              className={`px-3 py-1.5 font-ui text-[10px] uppercase tracking-[.14em] transition-colors ${
                inboxFilter === filter.id
                  ? "bg-ink text-ivory"
                  : "text-taupe hover:bg-mist/60 hover:text-ink"
              }`}
              aria-pressed={inboxFilter === filter.id}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {!filteredInbox.length ? (
          <p className="py-10 text-center font-ui text-sm text-taupe">
            Nothing in this inbox view. The atelier is in order.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredInbox.map((row) => (
              <MediaInboxCard key={row.media.id} row={row} actor={actor} onNotice={setNotice} />
            ))}
          </div>
        )}
      </AdminPanel>

      {/* ------------------------------------------------------------ */}
      {/* KIDS FINALIZATION (Phase 22.2) — the 21 confirmed products    */}
      {/* ------------------------------------------------------------ */}
      <div className="mt-8">
        <AdminPanel
          eyebrow="Kids finalization · 21 confirmed products"
          title="Kids products"
        >
          <AdminKidsFinalizationPanel
            actor={actor}
            onNotice={setNotice}
            focusId={focusedDraftId && /^KID-\d{3}$/.test(focusedDraftId) ? focusedDraftId : null}
          />
        </AdminPanel>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* KIDS RECONCILIATION (Phase 22.1) — ownership decisions desk   */}
      {/* ------------------------------------------------------------ */}
      {kidsDrafts.length ? (
        <div className="mt-8">
          <AdminPanel
            eyebrow={`Kids reconciliation · ${kidsDrafts.length} open drafts`}
            title="Ownership reconciliation"
          >
            <AdminKidsReviewPanel
              actor={actor}
              onNotice={setNotice}
              focusId={focusedDraftId && /^KID-\d{3}$/.test(focusedDraftId) ? focusedDraftId : null}
            />
          </AdminPanel>
        </div>
      ) : null}

      {/* ------------------------------------------------------------ */}
      {/* OTHER PRODUCT DRAFTS                                          */}
      {/* ------------------------------------------------------------ */}
      {otherDrafts.length ? (
        <div className="mt-8">
          <AdminPanel eyebrow={`Draft products · ${otherDrafts.length}`} title="Other product drafts">
            <div className="mb-4 flex flex-wrap gap-1.5 border-b border-mist pb-4">
              {otherDrafts.map((draft) => (
                <button
                  key={draft.id}
                  type="button"
                  onClick={() => setSearchParams({ draft: draft.id })}
                  className={`px-3 py-1.5 font-ui text-[10px] uppercase tracking-[.14em] transition-colors ${
                    focusedDraft?.id === draft.id
                      ? "bg-ink text-ivory"
                      : "text-taupe hover:bg-mist/60 hover:text-ink"
                  }`}
                  aria-pressed={focusedDraft?.id === draft.id}
                >
                  {draft.id}
                </button>
              ))}
            </div>
            {focusedDraft ? (
              <ProductDraftReviewPanel
                product={focusedDraft}
                actor={actor}
                onNotice={setNotice}
              />
            ) : null}
          </AdminPanel>
        </div>
      ) : null}

      {/* ------------------------------------------------------------ */}
      {/* REVIEW QUEUE (kept from Phase 13)                             */}
      {/* ------------------------------------------------------------ */}
      <div className="mt-8">
        <AdminPanel eyebrow={`Awaiting review · ${queue.length}`} title="Review queue">
          {!queue.length ? (
            <p className="py-10 text-center font-ui text-sm text-taupe">
              Nothing is waiting for review. The atelier is in order.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-mist font-ui text-[10px] uppercase tracking-widest text-taupe">
                    {["Product", "SKU", "Category", "Price", "Media", "Submitted", "Actions"].map((heading) => (
                      <th key={heading} className="px-3 py-3" scope="col">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queue.map((product) => {
                    const summary = mediaSummaries[product.id];
                    const hasCover = summary?.hasCover || Boolean(product.image);
                    const issues = getPublishIssues(product);
                    return (
                      <tr key={product.id} className="border-b border-mist/60 align-top font-ui text-sm">
                        <td className="px-3 py-4">
                          <Link
                            to={`/admin/products/${product.id}`}
                            className="underline-offset-4 hover:text-accent hover:underline"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-1 text-[11px] text-taupe">
                            {product.review.submittedBy ? `by ${product.review.submittedBy}` : ""}
                            {product.createdBy ? ` · created ${product.createdBy}` : ""}
                          </p>
                          {issues.length ? (
                            <p className="mt-1 text-[11px] text-accent">
                              {issues.length} publishing blocker{issues.length === 1 ? "" : "s"}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-4 text-taupe">{product.sku}</td>
                        <td className="px-3 py-4">
                          {categoryLabels[product.category] ?? product.category}
                          {product.subcategory ? (
                            <span className="block text-[11px] text-taupe">{product.subcategory}</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-4">{formatINR(product.price)}</td>
                        <td className="px-3 py-4">
                          {hasCover ? (
                            <StatusBadge
                              label={`✓ Cover · ${summary?.images ?? 0} img · ${summary?.videos ?? 0} vid`}
                              tone="ink"
                            />
                          ) : (
                            <StatusBadge label="Needs cover" tone="danger" />
                          )}
                        </td>
                        <td className="px-3 py-4 text-[11px] text-taupe">
                          {product.review.submittedAt ? formatEmployeeDateTime(product.review.submittedAt) : "—"}
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              to={`/admin/products/${product.id}`}
                              aria-label={`Open ${product.name}`}
                              title="Open record"
                            >
                              <Eye size={15} aria-hidden="true" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => approve(product)}
                              className="inline-flex items-center gap-1 border border-ink px-3 py-1.5 font-ui text-[10px] uppercase tracking-[.14em] text-ink transition-colors hover:bg-ink hover:text-ivory"
                            >
                              <Check size={11} aria-hidden="true" /> Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingId(rejectingId === product.id ? null : product.id);
                                setReason("");
                              }}
                              className="inline-flex items-center gap-1 border border-mist px-3 py-1.5 font-ui text-[10px] uppercase tracking-[.14em] text-taupe transition-colors hover:border-accent hover:text-accent"
                            >
                              <X size={11} aria-hidden="true" /> Reject
                            </button>
                          </div>
                          {rejectingId === product.id ? (
                            <form
                              className="mt-3 space-y-2"
                              onSubmit={(event) => {
                                event.preventDefault();
                                reject(product);
                              }}
                            >
                              <label htmlFor={`reject-${product.id}`} className="sr-only">
                                Rejection reason for {product.name}
                              </label>
                              <textarea
                                id={`reject-${product.id}`}
                                rows={2}
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                placeholder="Missing product details. Incorrect price. Poor product image…"
                                className="w-full border border-mist bg-canvas px-3 py-2 font-ui text-sm outline-none focus:border-accent"
                              />
                              <AtelierButton type="submit" size="chip">
                                Confirm rejection
                              </AtelierButton>
                            </form>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AdminPanel>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* GROUP REVIEW                                                  */}
      {/* ------------------------------------------------------------ */}
      <div className="mt-8">
        <AdminPanel eyebrow="Grouping decisions" title="Same product, or different products?">
          <ProductGroupReviewPanel actor={actor} onNotice={setNotice} />
        </AdminPanel>
      </div>

      {recentlyReviewed.length ? (
        <div className="mt-8">
          <AdminPanel eyebrow="Decisions" title="Recently reviewed">
            <ul className="divide-y divide-mist/70">
              {recentlyReviewed.map((product) => (
                <li key={product.id} className="flex flex-wrap items-center justify-between gap-3 px-1 py-3">
                  <div>
                    <Link
                      to={`/admin/products/${product.id}`}
                      className="font-ui text-sm text-ink underline-offset-4 hover:text-accent hover:underline"
                    >
                      {product.name}
                    </Link>
                    <p className="font-ui text-[11px] text-taupe">
                      {product.review.reviewedBy ?? "—"} ·{" "}
                      {product.review.reviewedAt ? formatEmployeeDateTime(product.review.reviewedAt) : ""}
                      {product.review.state === "REJECTED" && product.review.rejectionReason
                        ? ` — ${product.review.rejectionReason}`
                        : ""}
                    </p>
                  </div>
                  <StatusBadge
                    label={product.review.state === "APPROVED" ? "Approved" : "Rejected"}
                    tone={product.review.state === "APPROVED" ? "ink" : "danger"}
                  />
                </li>
              ))}
            </ul>
          </AdminPanel>
        </div>
      ) : null}
    </AdminPage>
  );
}
