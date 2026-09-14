import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { X, Calendar, AlertCircle, Loader2 } from "lucide-react";

export default function BookingModal({ listing, selectedAddOns, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rentalTier, setRentalTier] = useState("3_days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Helper: Returns duration in days for each package tier
  const getTierDays = (tier) => {
    switch (tier) {
      case "1_day":
        return 1;
      case "7_days":
        return 7;
      case "3_days":
      default:
        return 3;
    }
  };

  // Helper: Adds N days to an ISO/date string and returns YYYY-MM-DD
  const calculateReturnDate = (startStr, tier) => {
    if (!startStr) return "";
    const date = new Date(startStr);
    date.setDate(date.getDate() + getTierDays(tier));
    return date.toISOString().split("T")[0];
  };

  // Auto-update End Date when Start Date changes
  const handleStartDateChange = (e) => {
    const newStart = e.target.value;
    setStartDate(newStart);
    if (newStart) {
      setEndDate(calculateReturnDate(newStart, rentalTier));
    } else {
      setEndDate("");
    }
  };

  // Auto-update End Date when Package Tier changes
  const handleTierChange = (newTier) => {
    setRentalTier(newTier);
    if (startDate) {
      setEndDate(calculateReturnDate(startDate, newTier));
    }
  };

  // When End Date is manually changed, auto-detect the matching tier
  const handleEndDateChange = (e) => {
    const newEnd = e.target.value;
    setEndDate(newEnd);

    if (startDate && newEnd) {
      const start = new Date(startDate);
      const end = new Date(newEnd);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        setRentalTier("1_day");
      } else if (diffDays <= 4) {
        setRentalTier("3_days");
      } else {
        setRentalTier("7_days");
      }
    }
  };

  // Base rental calculation based on active tier
  const getBaseFee = () => {
    if (rentalTier === "1_day") {
      return listing.rentalRates?.oneDay || listing.rentalFee || 0;
    }
    if (rentalTier === "7_days") {
      return (
        listing.rentalRates?.sevenDays ||
        Math.round((listing.rentalRates?.threeDays || listing.rentalFee || 0) * 1.6)
      );
    }
    return listing.rentalRates?.threeDays || listing.rentalFee || 0;
  };

  const addOnsFee = selectedAddOns.reduce((acc, curr) => acc + (Number(curr.extraRentalFee) || 0), 0);
  const addOnsDep = selectedAddOns.reduce((acc, curr) => acc + (Number(curr.extraDeposit) || 0), 0);
  const totalRentalFee = getBaseFee() + addOnsFee;
  const totalDeposit = (Number(listing.securityDeposit) || 0) + addOnsDep;
  const grandTotal = totalRentalFee + totalDeposit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }

    if (!startDate || !endDate) {
      setError("Please select both start and return dates.");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError("Return date must be after the start date.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        listingId: listing._id,
        rentalTier,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        selectedAddOns: selectedAddOns.map((item) => ({
          name: item.name,
          extraRentalFee: Number(item.extraRentalFee) || 0,
          extraDeposit: Number(item.extraDeposit) || 0,
        })),
      };

      await API.post("/bookings", payload);
      onClose();
      navigate("/my-bookings");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit booking request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-brand-text">Request Rental Booking</h3>
            <p className="text-xs text-brand-muted">{listing.characterName || listing.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-brand-muted hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Package Duration Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-xs text-brand-muted uppercase">
              Choose Rental Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTierChange("1_day")}
                className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition ${
                  rentalTier === "1_day"
                    ? "border-brand-primary bg-indigo-50/50 text-brand-primary shadow-sm"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                1 Day Express
              </button>

              <button
                type="button"
                onClick={() => handleTierChange("3_days")}
                className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition ${
                  rentalTier === "3_days"
                    ? "border-brand-primary bg-indigo-50/50 text-brand-primary shadow-sm"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                3 Days (Std Con)
              </button>

              <button
                type="button"
                onClick={() => handleTierChange("7_days")}
                className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition ${
                  rentalTier === "7_days"
                    ? "border-brand-primary bg-indigo-50/50 text-brand-primary shadow-sm"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                7 Days Week
              </button>
            </div>
          </div>

          {/* Date Picker Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-xs text-brand-muted uppercase">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={handleStartDateChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-bold text-xs text-brand-muted uppercase">Return Date</label>
                <span className="text-[10px] text-brand-primary font-semibold">Auto-calculated</span>
              </div>
              <input
                type="date"
                required
                value={endDate}
                onChange={handleEndDateChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Pricing Ledger */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Rental Rate ({rentalTier.replace("_", " ")})</span>
              <span>₱{getBaseFee().toLocaleString()}</span>
            </div>
            {addOnsFee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Modular Add-Ons ({selectedAddOns.length})</span>
                <span>+₱{addOnsFee.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Refundable Security Deposit</span>
              <span>₱{totalDeposit.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-brand-text">
              <span>Grand Total (GCash Escrow)</span>
              <span className="text-brand-peso">₱{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Submit Request */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-primary hover:bg-brand-hover disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-md shadow-indigo-500/15 flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                <span>Send Booking Request</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}