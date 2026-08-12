/**
 * /admin/products
 *
 * The merchandising desk: repository-derived metrics, search, status
 * filtering, category filtering, bulk merchandising and the full product table.
 * Every row reads the shared catalogue repository; media summaries come from
 * the Phase 12 register. Covers only — the table never loads video.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Archive,
  Check,
  ClipboardCheck,
  Copy,
  Eye,
  Images,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  UploadCloud,
} from "lucide-react";
import AdminPage from "../../components/admin/AdminPage";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminMetricCard from "../../components/admin/AdminMetricCard";
import StatusBadge from "../../components/employee/StatusBadge";
import { AtelierButton } from "../../design-system";
import catalogRepository, { catalogMetrics } from "../../services/catalogRepository";
import inventoryRepository from "../../services/inventory/inventoryRepository";
import { useProducts } from "../../hooks/useProducts";
import { useProductMediaSummaries } from "../../hooks/useMedia";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { resolveProductCover } from "../../services/media/productMediaSource";
import { describeDiscount } from "../../utils/pricing";
import { formatINR } from "../../utils/shopping";
import { CATEGORY_OPTIONS, getProductStatusLabel } from "../../config/productCatalogConfig";
import { categoryLabels } from "../../data/products/taxonomy";

/**
 * The discount column: an authored markdown (MRP above the selling price)
 * reads as a percentage even when no explicit discount is configured.
 */
const discountLabel = (product) => {
  const fromPricing = describeDiscount(product.pricing);
  if (fromPricing !== "—") return fromPricing;
  if (product.originalPrice > product.price) {
    return `${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off`;
  }
  return "—";
};

const STATUS_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "PUBLISHED", label: "Published" },
  { id: "PENDING_REVIEW", label: "Pending review" },
  { id: "DRAFT", label: "Draft" },
  { id: "ARCHIVED", label: "Archived" },
];

const statusTone = {
  PUBLISHED: "ink",
  PENDING_REVIEW: "alert",
  DRAFT: "quiet",
  ARCHIVED: "muted",
};

export default function AdminProducts() {
  const { admin } = useAdminAuth();
  const actor = admin ? { adminId: admin.adminId, name: admin.name || "Administrator" } : null;

  const items = useProducts();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [selected, setSelected] = useState([]);
  const [notice, setNotice] = useState(null);

  const mediaSummaries = useProductMediaSummaries(items);

  /* Cover plates resolve through the media register, falling back to the
     authored catalogue image. The table never loads video. */
  const covers = useMemo(
    () => Object.fromEntries(items.map((product) => [product.id, resolveProductCover(product)])),
    [items]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((product) => {
      if (status !== "ALL" && product.status !== status) return false;
      if (category !== "ALL" && product.category !== category) return false;
      if (!term) return true;
      return [
        product.name,
        product.sku,
        product.category,
        categoryLabels[product.category] ?? "",
        product.subcategory,
        product.brand,
        product.fabric,
        product.collection,
        ...(product.tags ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [items, query, status, category]);

  const metrics = useMemo(() => catalogMetrics(items), [items]);

  const toggleSelect = (id) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );

  const allVisibleSelected = filtered.length > 0 && filtered.every((p) => selected.includes(p.id));

  const toggleSelectAll = () =>
    setSelected(allVisibleSelected ? [] : filtered.map((p) => p.id));

  const runBulk = (patch, label) => {
    if (!selected.length) return;
    const result = catalogRepository.bulkUpdate(selected, patch, actor, label);
    setNotice(
      `${label}: applied to ${result.applied} product${result.applied === 1 ? "" : "s"}${
        result.skipped ? `, ${result.skipped} skipped (publish requirements unmet)` : ""
      }.`
    );
    if (patch.status === "PUBLISHED") {
      selected.forEach((id) => {
        const published = catalogRepository.find(id);
        if (published?.status === "PUBLISHED") inventoryRepository.ensureOpeningStock(published, actor);
      });
    }
    setSelected([]);
  };

  const publishQuick = (product) => {
    const result = catalogRepository.publishProduct(product.id, actor);
    if (result.ok) {
      inventoryRepository.ensureOpeningStock(result.product, actor);
      setNotice(`Published “${product.name}” — now visible to customers.`);
    } else {
      setNotice(`Could not publish “${product.name}”: ${(result.errors ?? [result.error]).join(" ")}`);
    }
  };

  const clearNotice = () => setNotice(null);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(clearNotice, 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  return (
    <AdminPage
      eyebrow="Business / Products"
      title={
        <>
          Product <span className="italic text-accent">catalog.</span>
        </>
      }
      description="One catalogue serves the storefront, the portals and every future surface. Manage identity, pricing, variants, media and publishing from this desk."
      actions={
        <>
          <AtelierButton as={Link} to="/admin/products/review" size="chip" variant="outline">
            <ClipboardCheck size={13} aria-hidden="true" /> Review queue
            {metrics.pendingReview ? ` (${metrics.pendingReview})` : ""}
          </AtelierButton>
          <AtelierButton as={Link} to="/admin/products/new" size="chip">
            <Plus size={13} aria-hidden="true" /> Create product
          </AtelierButton>
        </>
      }
    >
      {/* 10 Metrics — always computed directly from the repository */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <AdminMetricCard label="Total" value={metrics.total} hint="Every product record" />
        <AdminMetricCard label="Published" value={metrics.published} hint="Visible to customers" />
        <AdminMetricCard label="Draft" value={metrics.drafts} hint="In progress" />
        <AdminMetricCard
          label="Pending Review"
          value={metrics.pendingReview}
          hint="Awaiting approval"
          tone={metrics.pendingReview ? "alert" : "default"}
        />
        <AdminMetricCard label="Archived" value={metrics.archived} hint="Retired, order-safe" />
        <AdminMetricCard label="Featured" value={metrics.featured} hint="House selection" />
        <AdminMetricCard label="Bestseller" value={metrics.bestsellers} hint="Proven favourites" />
        <AdminMetricCard label="New Arrivals" value={metrics.newArrivals} hint="Just-in edit" />
        <AdminMetricCard
          label="Needs Media"
          value={metrics.needsMedia}
          hint="Missing a cover"
          tone={metrics.needsMedia ? "alert" : "default"}
        />
        <AdminMetricCard
          label="Needs Pricing Review"
          value={metrics.needsPricingReview}
          hint="Incomplete or invalid"
          tone={metrics.needsPricingReview ? "alert" : "default"}
        />
      </div>

      {notice ? (
        <p aria-live="polite" className="mb-5 border border-mist/80 bg-canvas px-4 py-3 font-ui text-sm text-ink">
          {notice}
        </p>
      ) : null}

      <AdminPanel eyebrow="Catalog" title="Products">
        {/* Search, Status & Category Filters */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search products</span>
            <Search className="absolute left-3 top-3 text-taupe" size={15} aria-hidden="true" />
            <input
              aria-label="Search products"
              className="w-full border border-mist py-2.5 pl-9 pr-3 font-ui text-sm outline-none focus:border-accent"
              placeholder="Search name, SKU, category, fabric, tags…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="admin-category-filter" className="sr-only">
              Filter by category
            </label>
            <select
              id="admin-category-filter"
              aria-label="Filter by category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="border border-mist bg-canvas px-3 py-2.5 font-ui text-xs text-ink outline-none focus:border-accent"
            >
              <option value="ALL">All categories</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Status filter">
            {STATUS_FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={status === option.id}
                onClick={() => setStatus(option.id)}
                className={
                  status === option.id
                    ? "border border-ink bg-ink px-3 py-2 font-ui text-[10px] uppercase tracking-[.14em] text-ivory"
                    : "border border-mist px-3 py-2 font-ui text-[10px] uppercase tracking-[.14em] text-taupe transition-colors hover:border-ink hover:text-ink"
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk action bar */}
        {selected.length ? (
          <div className="mb-5 flex flex-wrap items-center gap-2 border border-mist/80 bg-canvas p-3">
            <p className="mr-2 font-ui text-[11px] uppercase tracking-[.16em] text-ink font-medium">
              {selected.length} selected
            </p>
            <button type="button" onClick={() => runBulk({ status: "PUBLISHED" }, "Publish")} className="border border-mist px-3 py-1.5 font-ui text-[10px] uppercase tracking-[.14em] text-taupe transition-colors hover:border-ink hover:text-ink">
              <UploadCloud size={11} className="mr-1 inline" aria-hidden="true" /> Publish
            </button>
            <button type="button" onClick={() => runBulk({ status: "ARCHIVED" }, "Archive")} className="border border-mist px-3 py-1.5 font-ui text-[10px] uppercase tracking-[.14em] text-taupe transition-colors hover:border-ink hover:text-ink">
              <Archive size={11} className="mr-1 inline" aria-hidden="true" /> Archive
            </button>
            <button type="button" onClick={() => runBulk({ isFeatured: true }, "Mark featured")} className="border border-mist px-3 py-1.5 font-ui text-[10px] uppercase tracking-[.14em] text-taupe transition-colors hover:border-ink hover:text-ink">
              Mark featured
            </button>
            <button type="button" onClick={() => runBulk({ isBestseller: true }, "Mark bestseller")} className="border border-mist px-3 py-1.5 font-ui text-[10px] uppercase tracking-[.14em] text-taupe transition-colors hover:border-ink hover:text-ink">
              Mark bestseller
            </button>
            <button type="button" onClick={() => runBulk({ isNew: true }, "Mark new arrival")} className="border border-mist px-3 py-1.5 font-ui text-[10px] uppercase tracking-[.14em] text-taupe transition-colors hover:border-ink hover:text-ink">
              Mark new arrival
            </button>
            <button type="button" onClick={() => setSelected([])} className="ml-auto font-ui text-[10px] uppercase tracking-[.14em] text-taupe underline-offset-4 hover:text-accent hover:underline">
              Clear
            </button>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-mist font-ui text-[10px] uppercase tracking-widest text-taupe">
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all visible products"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                {["Product", "SKU", "Category", "Price", "Discount", "Variants", "Media", "Status", "Updated", "Actions"].map((heading) => (
                  <th className="px-3 py-3" key={heading} scope="col">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const summary = mediaSummaries[product.id];
                const cover = covers[product.id];
                const canQuickPublish = product.status === "DRAFT" || product.status === "PENDING_REVIEW";
                return (
                  <tr className="border-b border-mist/60 font-ui text-sm" key={product.id}>
                    <td className="px-3 py-4 align-top">
                      <input
                        type="checkbox"
                        aria-label={`Select ${product.name}`}
                        checked={selected.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                      />
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        {cover?.src ? (
                          <img src={cover.src} alt="" loading="lazy" className="h-12 w-10 shrink-0 object-cover border border-mist/60" />
                        ) : (
                          <span className="h-12 w-10 shrink-0 bg-mist/60 flex items-center justify-center font-ui text-[9px] text-taupe">No img</span>
                        )}
                        <div className="min-w-0">
                          <Link
                            to={`/admin/products/${product.id}`}
                            className="block max-w-56 truncate font-medium text-ink underline-offset-4 hover:text-accent hover:underline"
                          >
                            {product.name}
                          </Link>
                          <p className="text-[11px] text-taupe">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 align-top text-taupe font-mono text-xs">{product.sku}</td>
                    <td className="px-3 py-4 align-top">
                      <span className="font-medium text-ink">{categoryLabels[product.category] ?? product.category}</span>
                      {product.subcategory ? <span className="block text-[11px] text-taupe">{product.subcategory}</span> : null}
                    </td>
                    <td className="px-3 py-4 align-top">
                      <span className="font-medium text-ink">{formatINR(product.price)}</span>
                      {product.originalPrice > product.price ? (
                        <span className="block text-[11px] text-taupe line-through">
                          {formatINR(product.originalPrice)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-4 align-top text-taupe">{discountLabel(product)}</td>
                    <td className="px-3 py-4 align-top">{product.variants?.length || "—"}</td>
                    <td className="px-3 py-4 align-top">
                      {!summary || summary.isEmpty ? (
                        <Link
                          to={`/admin/products/${product.id}/media`}
                          className="font-ui text-[11px] uppercase tracking-widest text-taupe underline-offset-4 hover:text-accent hover:underline"
                        >
                          Add media
                        </Link>
                      ) : (
                        <Link
                          to={`/admin/products/${product.id}/media`}
                          className="flex flex-col gap-0.5 underline-offset-4 hover:text-accent hover:underline"
                        >
                          <span className="font-ui text-[11px] text-ink">
                            {summary.images} img · {summary.videos} vid
                          </span>
                          {summary.needsCover && !product.image ? (
                            <span className="font-ui text-[10px] uppercase tracking-widest text-accent font-semibold">Needs cover</span>
                          ) : null}
                        </Link>
                      )}
                    </td>
                    <td className="px-3 py-4 align-top">
                      <StatusBadge label={getProductStatusLabel(product.status)} tone={statusTone[product.status] ?? "quiet"} />
                    </td>
                    <td className="px-3 py-4 align-top text-[11px] text-taupe">
                      {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString("en-IN") : "—"}
                      {product.updatedBy ? <span className="block text-[10px]">{product.updatedBy}</span> : null}
                    </td>
                    <td className="px-3 py-4 align-top">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Link to={`/admin/products/${product.id}`} aria-label={`View ${product.name}`} title="View record" className="text-taupe hover:text-ink">
                          <Eye size={15} aria-hidden="true" />
                        </Link>
                        <Link to={`/admin/products/${product.id}/edit`} aria-label={`Edit ${product.name}`} title="Edit product" className="text-taupe hover:text-ink">
                          <Pencil size={15} aria-hidden="true" />
                        </Link>
                        <Link to={`/admin/products/${product.id}/media`} aria-label={`Manage media for ${product.name}`} title="Manage Media" className="text-taupe hover:text-ink">
                          <Images size={15} aria-hidden="true" />
                        </Link>
                        {canQuickPublish ? (
                          <button
                            type="button"
                            aria-label={`Publish ${product.name}`}
                            title="Publish product"
                            onClick={() => publishQuick(product)}
                            className="text-taupe hover:text-accent"
                          >
                            <Check size={15} aria-hidden="true" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          aria-label={`Duplicate ${product.name}`}
                          title="Duplicate"
                          onClick={() => {
                            const result = catalogRepository.duplicateProduct(product.id, actor);
                            if (result.ok) setNotice(`Duplicated as “${result.product.name}” — review its SKU and slug.`);
                          }}
                          className="text-taupe hover:text-ink"
                        >
                          <Copy size={15} aria-hidden="true" />
                        </button>
                        {product.status === "ARCHIVED" ? (
                          <button
                            type="button"
                            aria-label={`Restore ${product.name}`}
                            title="Restore"
                            onClick={() => catalogRepository.restoreProduct(product.id, actor)}
                            className="text-taupe hover:text-ink"
                          >
                            <RotateCcw size={15} aria-hidden="true" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            aria-label={`Archive ${product.name}`}
                            title="Archive"
                            onClick={() => catalogRepository.archiveProduct(product.id, actor)}
                            className="text-taupe hover:text-accent"
                          >
                            <Archive size={15} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!filtered.length ? (
          <p className="py-12 text-center font-ui text-sm text-taupe">No products match your current filters.</p>
        ) : null}
      </AdminPanel>
    </AdminPage>
  );
}
