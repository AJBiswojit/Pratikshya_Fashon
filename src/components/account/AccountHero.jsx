import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAccount } from "../../context/AccountContext";
import { cn } from "../../utils/cn";
import { transition } from "../../design-system";

export default function AccountHero() {
  const { signOut } = useAuth();
  const { profile } = useAccount();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate("/", { replace: true });
  };

  const firstName = profile?.firstName || "Customer";
  const lastName = profile?.lastName || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const initials = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || "P";
  const memberSince = profile?.memberSince || "2025";

  return (
    <div className="border border-mist/80 bg-surface/60 p-6 sm:p-8 md:p-10 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        {/* Left: Avatar & Identity */}
        <div className="flex items-center gap-4 sm:gap-5">
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt={fullName}
              className="h-16 w-16 sm:h-20 sm:w-20 object-cover border border-mist"
            />
          ) : (
            <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 flex items-center justify-center bg-ink text-ivory font-display text-xl sm:text-2xl font-light border border-ink/20">
              {initials}
            </div>
          )}

          <div>
            <p className="font-ui text-[10px] uppercase tracking-[.25em] text-accent font-medium">
              My PRATIKSHYA FASHON
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-ink">
              Welcome back, <span className="italic text-accent">{firstName}</span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-taupe font-ui text-xs">
              <span>{profile?.email}</span>
              <span aria-hidden="true" className="text-mist">•</span>
              <span className="text-[11px] uppercase tracking-wider text-brass">
                Member since {memberSince}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-3 self-start sm:self-center border-t sm:border-t-0 pt-4 sm:pt-0 border-mist/60 w-full sm:w-auto justify-between sm:justify-end">
          <button
            type="button"
            onClick={handleSignOut}
            className={cn(
              "inline-flex items-center gap-2 border border-pearl bg-canvas px-4 py-2.5 font-ui text-[11px] uppercase tracking-[.14em] text-taupe hover:text-accent hover:border-accent",
              transition.colors
            )}
          >
            <LogOut size={13} strokeWidth={1.5} aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
