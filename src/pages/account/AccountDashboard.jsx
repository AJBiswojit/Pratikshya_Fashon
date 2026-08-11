import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Heart,
  MapPin,
  User,
  Sliders,
  Shield,
  ArrowRight,
  Plus,
} from "lucide-react";
import AccountShell from "../../components/account/AccountShell";
import { useAccount } from "../../context/AccountContext";
import { useWishlist } from "../../context/WishlistContext";
import { AtelierButton, EditorialHeading, Rule, transition } from "../../design-system";
import { cn } from "../../utils/cn";

export default function AccountDashboard() {
  const { profile, addresses, defaultAddress, preferences } = useAccount();
  const wishlist = useWishlist();

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "My Account — PRATIKSHYA FASHON";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "Valued Customer";

  return (
    <AccountShell breadcrumbItems={[{ label: "My Account" }]}>
      <div>
        <EditorialHeading
          as="h2"
          size="subsection"
          eyebrow="Account Overview"
          description="Your personal atelier dashboard — manage your orders, saved pieces, delivery addresses and preferences."
          spacing={{ eyebrow: "mb-3", title: "mb-3", description: "mb-0" }}
        >
          Your personal <span className="italic text-accent">atelier.</span>
        </EditorialHeading>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Orders */}
          <div className="border border-mist/80 bg-surface/40 p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-canvas border border-mist/60 text-ink">
                  <ShoppingBag size={18} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <span className="font-ui text-[10px] uppercase tracking-[.2em] text-taupe">
                  0 Orders
                </span>
              </div>
              <h3 className="font-display text-xl font-light text-ink">
                Orders &amp; Purchases
              </h3>
              <Rule width="w-8" tone="accent" className="my-3" />
              <p className="font-ui text-xs text-taupe leading-relaxed">
                Track your active orders, past celebration purchases, and download official invoices.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-mist/60 flex items-center justify-between">
              <Link
                to="/account/orders"
                className={cn(
                  "font-ui text-xs uppercase tracking-[.14em] text-ink hover:text-accent font-medium inline-flex items-center gap-1.5",
                  transition.colors
                )}
              >
                View Orders <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Card 2: Wishlist */}
          <div className="border border-mist/80 bg-surface/40 p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-canvas border border-mist/60 text-accent">
                  <Heart size={18} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <span className="font-ui text-[10px] uppercase tracking-[.2em] text-accent font-medium">
                  {wishlist.count} {wishlist.count === 1 ? "Saved Piece" : "Saved Pieces"}
                </span>
              </div>
              <h3 className="font-display text-xl font-light text-ink">
                Saved Wishlist
              </h3>
              <Rule width="w-8" tone="accent" className="my-3" />
              <p className="font-ui text-xs text-taupe leading-relaxed">
                {wishlist.count > 0
                  ? `You have ${wishlist.count} handcrafted pieces curated in your personal edit.`
                  : "Save sarees, bridal lehengas, and jewellery pieces to return to later."}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-mist/60 flex items-center justify-between">
              <Link
                to="/account/wishlist"
                className={cn(
                  "font-ui text-xs uppercase tracking-[.14em] text-ink hover:text-accent font-medium inline-flex items-center gap-1.5",
                  transition.colors
                )}
              >
                View Wishlist <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Card 3: Saved Addresses */}
          <div className="border border-mist/80 bg-surface/40 p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-canvas border border-mist/60 text-ink">
                  <MapPin size={18} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <span className="font-ui text-[10px] uppercase tracking-[.2em] text-taupe">
                  {addresses.length} {addresses.length === 1 ? "Address" : "Addresses"}
                </span>
              </div>
              <h3 className="font-display text-xl font-light text-ink">
                Saved Addresses
              </h3>
              <Rule width="w-8" tone="accent" className="my-3" />
              <div className="font-ui text-xs text-taupe leading-relaxed">
                {defaultAddress ? (
                  <div>
                    <span className="font-medium text-ink block mb-0.5">
                      {defaultAddress.fullName} ({defaultAddress.type})
                    </span>
                    <p className="truncate">{defaultAddress.addressLine}</p>
                    <p>{defaultAddress.city}, {defaultAddress.pincode}</p>
                  </div>
                ) : (
                  <p>No saved addresses yet. Add your delivery details for seamless checkout.</p>
                )}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-mist/60 flex items-center justify-between">
              <Link
                to="/account/addresses"
                className={cn(
                  "font-ui text-xs uppercase tracking-[.14em] text-ink hover:text-accent font-medium inline-flex items-center gap-1.5",
                  transition.colors
                )}
              >
                Manage Addresses <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Card 4: Personal Profile */}
          <div className="border border-mist/80 bg-surface/40 p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-canvas border border-mist/60 text-ink">
                  <User size={18} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <span className="font-ui text-[10px] uppercase tracking-[.2em] text-taupe">
                  Identity
                </span>
              </div>
              <h3 className="font-display text-xl font-light text-ink">
                Profile Details
              </h3>
              <Rule width="w-8" tone="accent" className="my-3" />
              <div className="font-ui text-xs text-taupe leading-relaxed space-y-1">
                <p className="text-ink font-medium">{fullName}</p>
                <p className="truncate">{profile?.email}</p>
                <p>{profile?.phone || "No phone number added"}</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-mist/60 flex items-center justify-between">
              <Link
                to="/account/profile"
                className={cn(
                  "font-ui text-xs uppercase tracking-[.14em] text-ink hover:text-accent font-medium inline-flex items-center gap-1.5",
                  transition.colors
                )}
              >
                Edit Profile <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Card 5: Preferences */}
          <div className="border border-mist/80 bg-surface/40 p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-canvas border border-mist/60 text-ink">
                  <Sliders size={18} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <span className="font-ui text-[10px] uppercase tracking-[.2em] text-taupe">
                  Preferences
                </span>
              </div>
              <h3 className="font-display text-xl font-light text-ink">
                Communications
              </h3>
              <Rule width="w-8" tone="accent" className="my-3" />
              <div className="font-ui text-xs text-taupe leading-relaxed space-y-1">
                <p>
                  Email Updates:{" "}
                  <span className={preferences.emailNotifications ? "text-cocoa font-medium" : "text-taupe"}>
                    {preferences.emailNotifications ? "Active" : "Paused"}
                  </span>
                </p>
                <p>
                  SMS Alerts:{" "}
                  <span className={preferences.smsNotifications ? "text-cocoa font-medium" : "text-taupe"}>
                    {preferences.smsNotifications ? "Active" : "Paused"}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-mist/60 flex items-center justify-between">
              <Link
                to="/account/settings"
                className={cn(
                  "font-ui text-xs uppercase tracking-[.14em] text-ink hover:text-accent font-medium inline-flex items-center gap-1.5",
                  transition.colors
                )}
              >
                Manage Preferences <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Card 6: Security */}
          <div className="border border-mist/80 bg-surface/40 p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-canvas border border-mist/60 text-ink">
                  <Shield size={18} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <span className="font-ui text-[10px] uppercase tracking-[.2em] text-taupe">
                  Security
                </span>
              </div>
              <h3 className="font-display text-xl font-light text-ink">
                Security &amp; Sessions
              </h3>
              <Rule width="w-8" tone="accent" className="my-3" />
              <p className="font-ui text-xs text-taupe leading-relaxed">
                Manage your password, review active atelier sessions, and secure your account.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-mist/60 flex items-center justify-between">
              <Link
                to="/account/security"
                className={cn(
                  "font-ui text-xs uppercase tracking-[.14em] text-ink hover:text-accent font-medium inline-flex items-center gap-1.5",
                  transition.colors
                )}
              >
                Review Security <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AccountShell>
  );
}
