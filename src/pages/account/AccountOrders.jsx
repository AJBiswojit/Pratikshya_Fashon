import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag } from "lucide-react";
import AccountShell from "../../components/account/AccountShell";
import {
  AtelierButton,
  EmptyState,
} from "../../design-system";

export default function AccountOrders() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Orders — PRATIKSHYA FASHON";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <AccountShell
      breadcrumbItems={[
        { label: "Account", to: "/account" },
        { label: "Orders" },
      ]}
    >
      <div className="border border-mist/80 bg-surface/30 p-8 sm:p-14 text-center">
        <EmptyState
          eyebrow="Order History"
          title="YOUR JOURNEY STARTS HERE"
          description="Your orders will appear here once you've made your first purchase. Explore our curated collections of bridal sarees, ceremonial lehengas, and celebratory groom edits."
          actions={
            <div className="flex flex-wrap items-center justify-center gap-4">
              <AtelierButton
                as={Link}
                to="/shop"
                variant="primary"
                size="md"
              >
                Explore Collection <ArrowRight size={14} aria-hidden="true" />
              </AtelierButton>
              <AtelierButton
                as={Link}
                to="/collections/new-arrivals"
                variant="outline"
                size="md"
              >
                New Arrivals
              </AtelierButton>
            </div>
          }
        />
      </div>
    </AccountShell>
  );
}
