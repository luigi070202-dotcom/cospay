import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    rentee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Rental Tier selected by rentee based on lender's rates
    rentalTier: {
      type: String,
      enum: ["1_day", "3_days", "7_days"],
      default: "3_days",
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, "Rental start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "Rental end date is required"],
    },

    // Modular add-ons selected for this booking
    selectedAddOns: [
      {
        name: { type: String, required: true },
        extraRentalFee: { type: Number, default: 0 },
        extraDeposit: { type: Number, default: 0 },
      },
    ],

    // Itemized financial record in PHP (₱)
    pricingBreakdown: {
      baseRentalFee: { type: Number, required: true },
      addOnsRentalFee: { type: Number, default: 0 },
      baseDeposit: { type: Number, default: 0 },
      addOnsDeposit: { type: Number, default: 0 },
      totalRentalFee: { type: Number, required: true },
      totalDeposit: { type: Number, required: true },
      grandTotal: { type: Number, required: true },
    },

    // 8-Stage Rental Lifecycle State Machine
    status: {
      type: String,
      enum: [
        "requested",                 // Rentee submits request
        "approved_pending_payment",  // Lender inspects rentee & reveals GCash
        "payment_submitted",         // Rentee uploads GCash reference & receipt
        "booked",                    // Lender confirms payment in wallet
        "in_transit",                // Lender ships out parcel & inputs tracking
        "active_rental",             // Rentee receives costume
        "returned_in_transit",       // Rentee ships back & provides return waybill
        "completed",                 // Lender inspects condition & refunds deposit
        "cancelled",
        "disputed",
      ],
      default: "requested",
    },

    // Payment proof uploaded by rentee
    paymentProof: {
      receiptImageUrl: { type: String, default: "" },
      referenceNumber: { type: String, default: "" },
      submittedAt: { type: Date, default: null },
    },

    // Shipping & Waybill Tracking
    shipping: {
      courier: { type: String, default: "" },
      outboundTrackingNumber: { type: String, default: "" },
      returnCourier: { type: String, default: "" },
      returnTrackingNumber: { type: String, default: "" },
    },

    // Deposit refund record upon inspection
    depositRefund: {
      amountRefunded: { type: Number, default: 0 },
      deductedAmount: { type: Number, default: 0 },
      deductionReason: { type: String, default: "" },
      refundProofUrl: { type: String, default: "" },
      refundReferenceNumber: { type: String, default: "" },
      refundedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;