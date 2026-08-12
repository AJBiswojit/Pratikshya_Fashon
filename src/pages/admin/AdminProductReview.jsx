/**
 * /admin/products/review
 *
 * The approval desk. Products employees have submitted gather here with
 * everything a reviewer needs: identity, price, media completeness and
 * who submitted when. Approving publishes; rejecting returns the piece
 * to draft with a reason its author will see.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Eye, X } from "lucide-react";
import AdminPage from "../../components/admin/AdminPage";
import AdminPanel from "../../components/admin/AdminPanel";
import StatusBadge from "../../components/employee/StatusBadge";
import { AtelierButton } from "../../design-system";
import catalogRepository, { getPublishIssues } from "../../services/catalogRepository";
import { useProducts } from "../../hooks/useProducts";
import { useProductMediaSummaries } from "../../hooks/useMedia";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { formatINR } from "../../utils/shopping";
import { categoryLabels } from "../../data/products/taxonomy";
import { PRODUCT_STATUSES } from "../../config/productCatalogConfig";
import { formatEmployeeDateTime } from "../../utils/employee";

export default function AdminProductReview() {
  const { admin } = useAdminAuth();
  const actor = admin ? { adminId: admin.adminId, name: admin.name || "Administrator" } : null;

  const items = useProducts();
  const mediaSummaries = useProductMediaSummaries(items);
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState(null);

  const queue = items
    .filter((product) => product.status === PRODUCT_STATUSES.PENDING_REVIEW)
    .sort((a, b) => (a.review.submittedAt < b.review.submittedAt ? 1 : -1));

  const recentlyReviewed = items
    .filter((product) => ["APPROVED", "REJECTED"].includes(product.review.state))
    .sort((a, b) => (a.review.reviewedAt < b.review.reviewedAt ? 1 : -1))
    .slice(0, 6);

  const approve = (product) => {
    const result = catalogRepository.approveProduct(product.id, actor);
    if (result.ok) setNotice(`Approved and published “${product.name}”.`);
    else setNotice(`Could not approve “${product.name}”: ${(result.errors ?? []).join(" ")}`);
  };

  const reject = (product) => {
    const result = catalogRepository.rejectProduct(
      product.id,
      reason.trim() || "Missing product details.",
      actor
    );
    if (result.ok) setNotice(`Rejected “${product.name}” — returned to draft.`);
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
      description="Approve submitted products to publish them, or reject with a reason so the author can refine and resubmit."
      actions={
        <AtelierButton as={Link} to="/admin/products" size="chip" variant="outline">
          Back to catalog
        </AtelierButton>
      }
    >
      {notice ? (
        <p aria-live="polite" className="mb-6 border border-mist/80 bg-canvas px-4 py-3 font-ui text-sm text-ink">
          {notice}
        </p>
      ) : null}

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
                        {product.subcategory ? <span className="block text-[11px] text-taupe">{product.subcategory}</span> : null}
                      </td>
                      <td className="px-3 py-4">{formatINR(product.price)}</td>
                      <td className="px-3 py-4">
                        {hasCover ? (
                          <StatusBadge label={`✓ Cover · ${summary?.images ?? 0} img · ${summary?.videos ?? 0} vid`} tone="ink" />
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
