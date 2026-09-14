import { useEffect, useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  ShieldAlert,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for modal/in-line updates
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courier, setCourier] = useState("Lalamove");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/bookings/my");
      setBookings(data);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      setError("Could not load your bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusTransition = async (bookingId, nextStatus, payload = {}) => {
    try {
      setActionLoading(true);
      await API.patch(`/bookings/${bookingId}/status`, {
        status: nextStatus,
        ...payload,
      });
      setSelectedBooking(null);
      await fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update booking status");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      requested: "bg-amber-50 text-amber-700 border-amber-200",
      approved_pending_payment: "bg-cyan-50 text-brand-peso border-cyan-200",
      payment_submitted: "bg-indigo-50 text-brand-primary border-indigo-200",
      booked: "bg-emerald-50 text-emerald-700 border-emerald-200",
      in_transit: "bg-blue-50 text-blue-700 border-blue-200",
      active_rental: "bg-violet-50 text-violet-700 border-violet-200",
      returned_in_transit: "bg-purple-50 text-purple-700 border-purple-200",
      completed: "bg-slate-100 text-slate-700 border-slate-200",
      cancelled: "bg-rose-50 text-rose-700 border-rose-200",
    };

    return (
      <span
        className={`px-2.5 py-1 text-xs font-bold rounded-lg border capitalize ${
          styles[status] || "bg-slate-100 text-slate-700"
        }`}
      >
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-brand-muted">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-2" />
        <p className="text-sm font-medium">Loading your rental orders...</p>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-brand-text">Booking Dashboard</h1>
          <p className="text-xs text-brand-muted">
            Track approvals, GCash payments, and delivery tracking numbers
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <Clock className="w-10 h-10 text-brand-muted mx-auto mb-3 opacity-40" />
          <h3 className="font-bold text-sm text-brand-text">No Bookings Yet</h3>
          <p className="text-xs text-brand-muted mt-1">
            Browse the catalog to request your first cosplay rental!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bookings.map((booking) => {
            const isLender = booking.lender?._id === user?._id;
            const isRentee = booking.rentee?._id === user?._id;

            return (
              <div
                key={booking._id}
                className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left: Info */}
                <div className="flex items-start gap-4">
                  <div className="w-20 h-24 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100">
                    <img
                      src={
                        booking.listing?.images?.[0] ||
                        "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800"
                      }
                      alt={booking.listing?.characterName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {isLender ? "You are Lender" : "You are Rentee"}
                      </span>
                      {getStatusBadge(booking.status)}
                    </div>

                    <h3 className="font-extrabold text-base text-brand-text">
                      {booking.listing?.characterName || booking.listing?.title}
                    </h3>

                    <div className="text-xs text-brand-muted flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        Dates:{" "}
                        <strong className="text-slate-700">
                          {new Date(booking.startDate).toLocaleDateString()} -{" "}
                          {new Date(booking.endDate).toLocaleDateString()}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Total:{" "}
                        <strong className="text-brand-peso font-black">
                          ₱{booking.pricingBreakdown?.grandTotal?.toLocaleString()}
                        </strong>
                      </span>
                    </div>

                    {/* GCash Details Unlocked Card */}
                    {booking.status === "approved_pending_payment" && isRentee && (
                      <div className="mt-2 p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl text-xs text-cyan-900 space-y-1">
                        <span className="font-bold block">✓ Lender Approved! Send GCash to:</span>
                        <div className="font-mono text-xs font-semibold">
                          Name: {booking.listing?.paymentDetails?.gcashName || "Provided on Approval"}
                          <br />
                          Number: {booking.listing?.paymentDetails?.gcashNumber || "09xxxxxxxxx"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Lifecycle Actions */}
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {/* Lender approves requested booking */}
                  {booking.status === "requested" && isLender && (
                    <button
                      disabled={actionLoading}
                      onClick={() =>
                        handleStatusTransition(booking._id, "approved_pending_payment")
                      }
                      className="px-4 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Approve Request
                    </button>
                  )}

                  {/* Rentee submits GCash reference */}
                  {booking.status === "approved_pending_payment" && isRentee && (
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="px-4 py-2.5 bg-brand-peso hover:opacity-90 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Submit GCash Receipt
                    </button>
                  )}

                  {/* Lender confirms payment */}
                  {booking.status === "payment_submitted" && isLender && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleStatusTransition(booking._id, "booked")}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Confirm Payment Received
                    </button>
                  )}

                  {/* Lender dispatches parcel */}
                  {booking.status === "booked" && isLender && (
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Input Courier Waybill</span>
                    </button>
                  )}

                  {/* Rentee confirms receipt */}
                  {booking.status === "in_transit" && isRentee && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleStatusTransition(booking._id, "active_rental")}
                      className="px-4 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Confirm Item Received
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Dialog Modal (For Payment / Waybill Input) */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-xl">
            <h3 className="font-extrabold text-base text-brand-text">
              {selectedBooking.status === "approved_pending_payment"
                ? "Submit GCash Payment Proof"
                : "Submit Courier Dispatch"}
            </h3>

            {selectedBooking.status === "approved_pending_payment" ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="GCash Reference No. (e.g., 90218471)"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-primary/20 outline-none"
                />
                <button
                  disabled={actionLoading || !paymentRef}
                  onClick={() =>
                    handleStatusTransition(selectedBooking._id, "payment_submitted", {
                      paymentProof: {
                        referenceNumber: paymentRef,
                        receiptImageUrl:
                          "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800",
                      },
                    })
                  }
                  className="w-full py-2.5 bg-brand-primary text-white rounded-xl text-xs font-bold transition hover:bg-brand-hover"
                >
                  Send Payment Details
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Tracking Number (e.g. JT-991204)"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-primary/20 outline-none"
                />
                <button
                  disabled={actionLoading || !trackingNumber}
                  onClick={() =>
                    handleStatusTransition(selectedBooking._id, "in_transit", {
                      courier,
                      trackingNumber,
                    })
                  }
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold transition hover:bg-indigo-700"
                >
                  Confirm Shipment
                </button>
              </div>
            )}

            <button
              onClick={() => setSelectedBooking(null)}
              className="w-full py-2 text-xs font-semibold text-brand-muted hover:text-brand-text"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}