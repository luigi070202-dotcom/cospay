import { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import BookingModal from "../components/BookingModal";
import {
  ShieldCheck,
  Tag,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ArrowLeft,
  Loader2,
  MapPin,
  Sparkle,
  Shirt,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Power,
  Lock,
} from "lucide-react";

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Active size variant tab tracker
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // Full-screen image lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Modular add-on selection tracker
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/listings/${id}`);
        setListing(data);
      } catch (err) {
        console.error("Failed to load listing details:", err);
        setError("Costume listing not found or server error.");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const toggleAddOn = (addon) => {
    if (selectedAddOns.some((item) => item.name === addon.name)) {
      setSelectedAddOns(selectedAddOns.filter((item) => item.name !== addon.name));
    } else {
      setSelectedAddOns([...selectedAddOns, addon]);
    }
  };

  const isOwner =
    user && listing?.lender && (user._id === listing.lender._id || user._id === listing.lender);

  const sizeVariants =
    listing?.sizeVariants && listing.sizeVariants.length > 0
      ? listing.sizeVariants
      : [{ size: listing?.size || "Free Size", isAvailable: listing?.isAvailable ?? true }];

  const activeVariant = sizeVariants[selectedVariantIndex] || sizeVariants[0];

  // Toggle availability ONLY for the currently selected size variant
  const handleToggleCurrentSizeAvailability = async () => {
    try {
      setToggleLoading(true);
      const { data } = await API.patch(`/listings/${id}/toggle-size-availability`, {
        variantId: activeVariant._id,
        size: activeVariant.size,
      });

      setListing((prev) => ({
        ...prev,
        sizeVariants: data.sizeVariants,
        isAvailable: data.isAvailable,
      }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle size availability");
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center text-brand-muted">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-2" />
        <p className="text-sm font-medium">Loading costume details...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
        <h2 className="text-lg font-bold">Listing Unavailable</h2>
        <p className="text-sm">{error || "Could not retrieve costume."}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white font-semibold rounded-xl text-xs hover:bg-rose-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog
        </Link>
      </div>
    );
  }

  const baseRate = listing.rentalRates?.threeDays || listing.rentalFee || 0;
  const baseDeposit = Number(listing.securityDeposit) || 0;

  const addOnsFee = selectedAddOns.reduce((acc, curr) => acc + (Number(curr.extraRentalFee) || 0), 0);
  const addOnsDep = selectedAddOns.reduce((acc, curr) => acc + (Number(curr.extraDeposit) || 0), 0);

  const totalRentalFee = baseRate + addOnsFee;
  const totalDeposit = baseDeposit + addOnsDep;
  const grandTotal = totalRentalFee + totalDeposit;

  const images = listing.images?.length > 0
    ? listing.images
    : ["https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800"];
  const currentPhoto = images[0];

  const hasMeasurements =
    activeVariant &&
    (activeVariant.bustCm ||
      activeVariant.waistCm ||
      activeVariant.hipsCm ||
      activeVariant.maxHeightCm ||
      activeVariant.shoeSizeEu);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-muted hover:text-brand-text transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Gallery & Garment Measurements */}
        <div className="lg:col-span-6 space-y-4">
          <div
            onClick={() => setLightboxIndex(0)}
            className="aspect-[4/5] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative group cursor-zoom-in"
          >
            <img
              src={currentPhoto}
              alt={listing.title || listing.characterName}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-300"
            />
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-1.5 font-bold text-xs backdrop-blur-[2px]">
              <Maximize2 className="w-4 h-4" /> View Fullscreen
            </div>

            <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 max-w-[85%] pointer-events-none">
              <span className="bg-brand-text/85 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">
                Size {activeVariant.size}
              </span>
              <span className="bg-brand-primary/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">
                {listing.listingType || "Full Set"}
              </span>
              {!activeVariant.isAvailable && (
                <span className="bg-rose-600/95 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Size {activeVariant.size} in Private Use
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2.5">
              {images.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className="aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer hover:border-brand-primary transition"
                >
                  <img src={img} alt="Cosplay Angle" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Sizing Tabs & Measurements Sheet */}
          <div className="bg-brand-card border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-muted">
                <Shirt className="w-4 h-4 text-brand-primary" />
                <span>Available Sizes & Dimensions</span>
              </div>
              <span className="text-[11px] text-brand-muted">Click a size to view fit</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {sizeVariants.map((v, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedVariantIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition ${
                    selectedVariantIndex === idx
                      ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span>Size {v.size}</span>
                  {!v.isAvailable && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500 text-white font-normal">
                      Unavailable
                    </span>
                  )}
                </button>
              ))}
            </div>

            {hasMeasurements ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center text-xs pt-1">
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  <span className="text-brand-muted block text-[10px] uppercase font-bold">Bust</span>
                  <span className="font-extrabold text-brand-text">
                    {activeVariant.bustCm ? `${activeVariant.bustCm} cm` : "N/A"}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  <span className="text-brand-muted block text-[10px] uppercase font-bold">Waist</span>
                  <span className="font-extrabold text-brand-text">
                    {activeVariant.waistCm ? `${activeVariant.waistCm} cm` : "N/A"}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  <span className="text-brand-muted block text-[10px] uppercase font-bold">Hips</span>
                  <span className="font-extrabold text-brand-text">
                    {activeVariant.hipsCm ? `${activeVariant.hipsCm} cm` : "N/A"}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  <span className="text-brand-muted block text-[10px] uppercase font-bold">Height</span>
                  <span className="font-extrabold text-brand-text">
                    {activeVariant.maxHeightCm ? `≤${activeVariant.maxHeightCm} cm` : "Free"}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  <span className="text-brand-muted block text-[10px] uppercase font-bold">Shoes</span>
                  <span className="font-extrabold text-brand-text">
                    {activeVariant.shoeSizeEu ? `EU ${activeVariant.shoeSizeEu}` : "N/A"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-brand-muted italic pt-1">
                No specific cm measurements entered for size {activeVariant.size}.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Information, Add-Ons, & Action Card */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2.5 border-b border-slate-200 pb-5">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-primary">
              <Tag className="w-3.5 h-3.5" />
              <span>{listing.seriesTitle}</span>
              <span className="text-slate-300">•</span>
              <span className="text-brand-muted">{listing.brand || "Not Specified / Custom"}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-brand-text tracking-tight">
              {listing.title || listing.characterName}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-brand-muted pt-1">
              <span className="flex items-center gap-1.5 font-medium">
                Lent by <strong className="text-brand-text">{listing.lender?.name || "Lender"}</strong>
                {listing.lender?.verification?.status === "verified" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-peso bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </span>

              {listing.location && (
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {listing.location.city}, {listing.location.province}
                </span>
              )}
            </div>
          </div>

          {/* Description & Transparency Box */}
          <div className="space-y-3.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-muted">
              Costume Overview & Rules
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {listing.description || "No specific care notes disclosed."}
            </p>

            {listing.inclusions?.length > 0 && (
              <div className="pt-1">
                <h3 className="text-xs font-bold text-brand-text mb-2">Package Inclusions:</h3>
                <div className="flex flex-wrap gap-1.5">
                  {listing.inclusions.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200/60"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" /> {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl flex gap-3 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5">Pre-Declared Condition & Flaws:</strong>
                <span className="leading-normal">{listing.flaws || "None declared by lender."}</span>
              </div>
            </div>

            {listing.cleaningPolicy && (
              <div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-2xl flex gap-2.5 text-xs text-indigo-900">
                <Sparkle className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold mb-0.5">Cleaning & Care Policy:</strong>
                  <span>{listing.cleaningPolicy}</span>
                </div>
              </div>
            )}
          </div>

          {/* Modular Add-Ons Section */}
          {listing.addOns?.length > 0 && (
            <div className="space-y-2.5 border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                  Modular Add-Ons (Weapons / Styled Wigs)
                </h2>
                <span className="text-[11px] text-brand-primary font-semibold">Selectable</span>
              </div>

              <div className="space-y-2">
                {listing.addOns.map((addon, idx) => {
                  const isChecked = selectedAddOns.some((i) => i.name === addon.name);
                  return (
                    <div
                      key={idx}
                      onClick={() => !isOwner && toggleAddOn(addon)}
                      className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                        isOwner ? "cursor-default opacity-85" : "cursor-pointer"
                      } ${
                        isChecked
                          ? "bg-indigo-50/60 border-brand-primary shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="space-y-0.5 pr-4">
                        <div className="flex items-center gap-2">
                          {!isOwner && (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                            />
                          )}
                          <span className="text-sm font-bold text-brand-text">{addon.name}</span>
                        </div>
                        {addon.description && (
                          <p className="text-xs text-brand-muted pl-5">{addon.description}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-black text-brand-primary block">
                          +₱{addon.extraRentalFee}
                        </span>
                        <span className="text-[10px] font-semibold text-brand-muted block">
                          +₱{addon.extraDeposit} dep
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ACTION CARD */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs text-brand-muted">Standard 3-Day Rate</span>
                <div className="text-2xl font-black text-brand-text">
                  ₱{totalRentalFee.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-brand-muted">Refundable Deposit</span>
                <div className="text-sm font-bold text-slate-700">
                  ₱{totalDeposit.toLocaleString()}
                </div>
              </div>
            </div>

            {/* OWNER MANAGEMENT PANEL */}
            {isOwner ? (
              <div className="space-y-3 pt-1">
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold text-brand-primary">
                      Selected Size: {activeVariant.size}
                    </span>
                    <span className="text-[11px] text-brand-muted">
                      Status: {activeVariant.isAvailable ? "Open for Rent" : "Unavailable (In Private Use)"}
                    </span>
                  </div>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      activeVariant.isAvailable ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={handleToggleCurrentSizeAvailability}
                    disabled={toggleLoading}
                    className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition border ${
                      activeVariant.isAvailable
                        ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                        : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    {toggleLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Power className="w-4 h-4" />
                        <span>
                          {activeVariant.isAvailable
                            ? `Set Size ${activeVariant.size} to Private Use`
                            : `Make Size ${activeVariant.size} Available`}
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => navigate(`/edit-listing/${listing._id}`)}
                    className="py-3 px-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Listing</span>
                  </button>
                </div>
              </div>
            ) : (
              /* RENTEE CHECKOUT / BOOKING PANEL */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-brand-muted">
                  <span>Estimated GCash Transfer Total</span>
                  <span className="font-black text-sm text-brand-peso">
                    ₱{grandTotal.toLocaleString()}
                  </span>
                </div>

                {activeVariant.isAvailable ? (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-3.5 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-2xl shadow-md shadow-indigo-500/15 flex items-center justify-center gap-2 transition active:scale-[0.99]"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Request Rental for Size {activeVariant.size}</span>
                  </button>
                ) : (
                  <div className="w-full py-3.5 bg-slate-100 text-slate-500 border border-slate-200 font-bold rounded-2xl flex items-center justify-center gap-2 text-xs cursor-not-allowed">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Size {activeVariant.size} is Temporarily Unavailable (In Personal Use)</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-screen Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <X className="w-6 h-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div
            className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex]}
              alt="Enlarged costume detail"
              className="w-full h-full max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {isModalOpen && (
        <BookingModal
          listing={listing}
          selectedAddOns={selectedAddOns}
          selectedSize={activeVariant.size}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </main>
  );
}