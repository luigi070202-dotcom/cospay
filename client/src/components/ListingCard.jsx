import { Link } from "react-router-dom";
import { ShieldCheck, Tag } from "lucide-react";

export default function ListingCard({ listing }) {
  const coverPhoto =
    listing.images?.[0] ||
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800";

  return (
    <Link
      to={`/listings/${listing._id}`}
      className="bg-brand-card rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-200 group flex flex-col cursor-pointer"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
        <img
          src={coverPhoto}
          alt={listing.characterName || listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />

        {/* Size Badge */}
        <span className="absolute top-3 left-3 bg-brand-text/80 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-lg">
          Size {listing.size || "Free"}
        </span>

        {/* Listing Type Tag */}
        <span className="absolute top-3 right-3 bg-brand-primary/90 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
          {listing.listingType || "Full Set"}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary">
            <Tag className="w-3.5 h-3.5" />
            <span>{listing.seriesTitle}</span>
          </div>

          <h3 className="font-extrabold text-base text-brand-text mt-1 line-clamp-1 group-hover:text-brand-primary transition">
            {listing.characterName || listing.title}
          </h3>

          {/* Lender Info & Verification */}
          <div className="flex items-center gap-1 mt-1 text-xs text-brand-muted">
            <span>By {listing.lender?.name || "Lender"}</span>
            {listing.lender?.verification?.status === "verified" && (
              <ShieldCheck className="w-3.5 h-3.5 text-brand-peso" title="Verified Lender" />
            )}
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
          <div>
            <span className="text-xs text-brand-muted">Rental from</span>
            <div className="text-lg font-black text-brand-text leading-tight">
              ₱{listing.rentalFee?.toLocaleString()}
              <span className="text-xs font-medium text-brand-muted"> / 3 days</span>
            </div>
          </div>

          {listing.securityDeposit > 0 && (
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              ₱{listing.securityDeposit} dep
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}