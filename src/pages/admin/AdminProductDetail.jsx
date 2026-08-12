import { Link, useParams } from "react-router-dom";
import AdminPage from "../../components/admin/AdminPage";
import AdminPanel from "../../components/admin/AdminPanel";
import { AtelierButton } from "../../design-system";
import StatusBadge from "../../components/employee/StatusBadge";
import repo from "../../services/catalogRepository";
import { useProductMedia } from "../../hooks/useMedia";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function AdminProductDetail() {
  const { productId } = useParams();
  const product = repo.find(productId);
  /* Media counts come from the central register, never from the product row. */
  const { summary } = useProductMedia(productId);

  if (!product) {
    return (
      <AdminPage title="Product unavailable">
        <p className="font-ui text-sm text-taupe">That product could not be found.</p>
      </AdminPage>
    );
  }

  const setStatus = (status) => repo.updateStatus(product.id, status);

  return (
    <AdminPage
      eyebrow="Product catalog"
      title={product.name}
      description={`${product.sku} · ${product.category} / ${product.subcategory || "—"}`}
      actions={
        <>
          <AtelierButton
            as={Link}
            to={`/admin/products/${product.id}/media`}
            size="chip"
            variant="outline"
          >
            Manage media
          </AtelierButton>
          <AtelierButton as={Link} to={`/admin/products/${product.id}/edit`} size="chip">
            Edit product
          </AtelierButton>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <img src={product.image} alt={product.name} className="h-96 w-full object-cover" />

          <div className="border border-mist/80 bg-surface/30 p-4">
            <p className="font-ui text-[10px] uppercase tracking-[.18em] text-taupe">Media</p>
            <p className="mt-2 font-ui text-sm text-ink">
              {summary.total} item{summary.total === 1 ? "" : "s"} · {summary.images} image
              {summary.images === 1 ? "" : "s"} · {summary.videos} video
              {summary.videos === 1 ? "" : "s"}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {summary.needsCover ? (
                <StatusBadge label="Needs cover" tone="danger" />
              ) : summary.hasCover ? (
                <StatusBadge label="Cover set" tone="ink" />
              ) : (
                <StatusBadge label="Catalogue plates" tone="quiet" />
              )}
              {summary.videos ? <StatusBadge label="Has video" tone="quiet" /> : null}
            </div>
            <AtelierButton
              as={Link}
              to={`/admin/products/${product.id}/media`}
              size="chip"
              variant="outline"
              className="mt-4"
            >
              Manage media
            </AtelierButton>
          </div>
        </div>

        <AdminPanel eyebrow="Product record" title="Catalog details">
          <dl className="grid gap-4 font-ui text-sm sm:grid-cols-2">
            {[
              ["Price", money(product.price)],
              ["Original price", money(product.originalPrice)],
              ["Status", product.status],
              ["Stock", product.stock || 0],
              ["Fabric", product.fabric || "—"],
              ["Material", product.material || "—"],
              ["Occasion", (product.occasion || []).join(", ") || "—"],
              ["Collection", product.collection || "—"],
              ["Featured", product.isFeatured ? "Yes" : "No"],
              ["Bestseller", product.isBestseller ? "Yes" : "No"],
              ["New arrival", product.isNew ? "Yes" : "No"],
              ["Updated", product.updatedAt || "—"],
            ].map(([term, value]) => (
              <div key={term}>
                <dt className="text-taupe">{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            {product.status === "PUBLISHED" ? (
              <AtelierButton variant="outline" onClick={() => setStatus("DRAFT")}>
                Unpublish
              </AtelierButton>
            ) : (
              <AtelierButton onClick={() => setStatus("PUBLISHED")}>Publish</AtelierButton>
            )}
            {product.status === "ARCHIVED" ? (
              <AtelierButton variant="outline" onClick={() => setStatus("DRAFT")}>
                Restore
              </AtelierButton>
            ) : (
              <AtelierButton variant="outline" onClick={() => setStatus("ARCHIVED")}>
                Archive
              </AtelierButton>
            )}
          </div>
        </AdminPanel>
      </div>
    </AdminPage>
  );
}
