import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Film, Image as ImageIcon, Layers, Search, Star } from "lucide-react";
import AdminPage from "../../../components/admin/AdminPage";
import AdminPanel from "../../../components/admin/AdminPanel";
import AdminMetricCard from "../../../components/admin/AdminMetricCard";
import MediaThumb from "../../../components/media/MediaThumb";
import MediaUploadPanel from "../../../components/media/MediaUploadPanel";
import StatusBadge from "../../../components/employee/StatusBadge";
import { AtelierButton } from "../../../design-system";
import {
  MEDIA_SCOPES,
  MEDIA_STATUS,
  MEDIA_STATUS_OPTIONS,
  MEDIA_TYPES,
  PRODUCT_MEDIA_ROLES,
  getMediaStatusLabel,
  getMediaStatusTone,
  getPlacementLabel,
  getProductRoleLabel,
} from "../../../config/mediaTypes";
import { useMediaLibrary, useMediaMetrics } from "../../../hooks/useMedia";
import useMediaActions from "../../../hooks/useMediaActions";
import { cn } from "../../../utils/cn";

/**
 * PRATIKSHYA FASHON — Media Library.
 *
 * Every piece of media in the house on one page: product plates, marketing
 * artwork and anything still waiting for a job. Tabs narrow the register,
 * search reads across title, alt text, tags, product and placement, and the
 * filters answer the two operational questions — what is live, and what is
 * still a draft.
 */

const TABS = [
  { id: "ALL", label: "All" },
  { id: "IMAGES", label: "Images" },
  { id: "VIDEOS", label: "Videos" },
  { id: "PRODUCT", label: "Product" },
  { id: "MARKETING", label: "Marketing" },
  { id: "UNASSIGNED", label: "Unassigned" },
];

const matchesTab = (media, tab) => {
  switch (tab) {
    case "IMAGES":
      return media.type === MEDIA_TYPES.IMAGE;
    case "VIDEOS":
      return media.type === MEDIA_TYPES.VIDEO;
    case "PRODUCT":
      return media.scope === MEDIA_SCOPES.PRODUCT;
    case "MARKETING":
      return media.scope === MEDIA_SCOPES.MARKETING;
    case "UNASSIGNED":
      return media.scope === MEDIA_SCOPES.UNASSIGNED;
    default:
      return true;
  }
};

/** One line describing where a record is used. */
const assignmentLine = (media) => {
  if (media.scope === MEDIA_SCOPES.PRODUCT) {
    return `${media.productId} · ${getProductRoleLabel(media.role)}`;
  }
  if (media.scope === MEDIA_SCOPES.MARKETING) {
    return getPlacementLabel(media.placement);
  }
  return "Unassigned";
};

export default function AdminMediaLibrary() {
  const media = useMediaLibrary();
  const metrics = useMediaMetrics();
  const actions = useMediaActions();

  const [tab, setTab] = useState("ALL");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selected, setSelected] = useState([]);
  const [uploading, setUploading] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return media.filter((item) => {
      if (!matchesTab(item, tab)) return false;
      if (status !== "ALL" && item.status !== status) return false;
      if (!needle) return true;
      return [
        item.title,
        item.alt,
        item.caption,
        item.productId,
        item.placement,
        item.campaign,
        item.fileName,
        ...(item.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [media, tab, status, query]);

  const toggle = (id) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );

  const clearSelection = () => setSelected([]);

  const bulk = (run) => {
    selected.forEach(run);
    clearSelection();
  };

  const chip = "px-3 py-1.5 font-ui text-[10px] uppercase tracking-[.14em] transition-colors";

  return (
    <AdminPage
      eyebrow="Business / Media"
      title="Media library"
      description="Every image and video used across PRATIKSHYA FASHON — product plates, marketing artwork and unassigned pieces — managed from one register."
      actions={
        <>
          <AtelierButton as={Link} to="/admin/media/marketing" size="chip" variant="outline">
            Marketing media
          </AtelierButton>
          {actions.access.canUpload ? (
            <AtelierButton size="chip" onClick={() => setUploading((open) => !open)}>
              {uploading ? "Close upload" : "Add media"}
            </AtelierButton>
          ) : null}
        </>
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <AdminMetricCard label="Total media" value={metrics.total} icon={Layers} hint="Images and video" />
        <AdminMetricCard label="Images" value={metrics.images} icon={ImageIcon} hint="Still plates" />
        <AdminMetricCard label="Videos" value={metrics.videos} icon={Film} hint="Native HTML5 playback" />
        <AdminMetricCard label="Active" value={metrics.active} icon={Star} hint="Visible to customers" />
        <AdminMetricCard label="Unassigned" value={metrics.unassigned} hint="Waiting for a job" />
        <AdminMetricCard
          label="Needs cover"
          value={metrics.productsNeedingCover}
          tone={metrics.productsNeedingCover ? "alert" : "default"}
          hint="Products with media but no cover"
        />
      </div>

      {uploading && actions.access.canUpload ? (
        <AdminPanel eyebrow="Demo upload" title="Add media to the library" className="mb-6">
          <MediaUploadPanel
            onSubmit={(drafts) => {
              actions.upload(drafts);
              setUploading(false);
            }}
          />
        </AdminPanel>
      ) : null}

      <AdminPanel eyebrow="Register" title="All media">
        {/* Tabs ---------------------------------------------------- */}
        <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Media type">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              id={`media-tab-${entry.id}`}
              aria-selected={tab === entry.id}
              aria-controls="media-register"
              onClick={() => setTab(entry.id)}
              className={cn(
                chip,
                "border",
                tab === entry.id
                  ? "border-ink bg-ink text-ivory"
                  : "border-mist bg-canvas text-cocoa hover:border-ink"
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>

        {/* Search and status --------------------------------------- */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search media</span>
            <Search size={15} className="absolute left-3 top-3 text-taupe" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, alt text, tag, product or placement…"
              className="w-full border border-mist bg-canvas py-2.5 pl-9 pr-3 font-ui text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label>
            <span className="sr-only">Filter by status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-full border border-mist bg-canvas px-3 py-2.5 font-ui text-sm text-ink outline-none focus:border-accent"
            >
              <option value="ALL">All statuses</option>
              {MEDIA_STATUS_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Bulk bar ------------------------------------------------- */}
        {selected.length ? (
          <div className="mb-5 flex flex-wrap items-center gap-2 border border-ink/20 bg-surface/50 px-4 py-3">
            <p className="font-ui text-[11px] uppercase tracking-[.16em] text-taupe">
              {selected.length} selected
            </p>
            {actions.access.canEdit ? (
              <>
                <AtelierButton size="chip" variant="outline" onClick={() => bulk(actions.activate)}>
                  Activate
                </AtelierButton>
                <AtelierButton size="chip" variant="outline" onClick={() => bulk(actions.archive)}>
                  Archive
                </AtelierButton>
              </>
            ) : null}
            {actions.access.canDelete ? (
              <AtelierButton
                size="chip"
                variant="outline"
                onClick={() => {
                  actions.removeMany(selected);
                  clearSelection();
                }}
              >
                Remove
              </AtelierButton>
            ) : null}
            <button
              type="button"
              onClick={clearSelection}
              className="font-ui text-[11px] uppercase tracking-[.14em] text-taupe underline-offset-4 hover:text-accent hover:underline"
            >
              Clear
            </button>
          </div>
        ) : null}

        {/* Grid ----------------------------------------------------- */}
        <div id="media-register" role="tabpanel" aria-labelledby={`media-tab-${tab}`}>
        {filtered.length ? (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <li key={item.id} className="border border-mist/80 bg-canvas">
                <Link to={`/admin/media/${item.id}`} className="block">
                  <MediaThumb media={item} />
                </Link>
                <div className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/admin/media/${item.id}`}
                      className="min-w-0 font-ui text-sm text-ink underline-offset-4 hover:text-accent hover:underline"
                    >
                      <span className="line-clamp-2">{item.title}</span>
                    </Link>
                    <input
                      type="checkbox"
                      checked={selected.includes(item.id)}
                      onChange={() => toggle(item.id)}
                      aria-label={`Select ${item.title}`}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#B45309]"
                    />
                  </div>
                  <p className="font-ui text-[11px] text-taupe">{assignmentLine(item)}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge
                      label={getMediaStatusLabel(item.status)}
                      tone={getMediaStatusTone(item.status)}
                    />
                    {item.role === PRODUCT_MEDIA_ROLES.COVER ? (
                      <StatusBadge label="Cover" tone="accent" />
                    ) : null}
                    {item.demoPlaceholder ? <StatusBadge label="Demo" tone="muted" /> : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="border border-mist/80 bg-surface/30 px-5 py-14 text-center">
            <p className="font-ui text-sm text-taupe">
              {media.length
                ? "No media matches these filters."
                : "The register is empty. Add media to begin."}
            </p>
          </div>
        )}

        </div>

        <p className="mt-5 font-ui text-[11px] text-taupe" aria-live="polite">
          Showing {filtered.length} of {media.length} records · {metrics.draft} draft ·{" "}
          {metrics.archived} archived · only {MEDIA_STATUS.ACTIVE.toLowerCase()} media reaches
          customers.
        </p>
      </AdminPanel>
    </AdminPage>
  );
}
