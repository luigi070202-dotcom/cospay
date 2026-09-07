import Booking from "../models/Booking.js";
import Listing from "../models/Listing.js";

// Valid lifecycle progressions map
const VALID_TRANSITIONS = {
  requested: ["approved_pending_payment", "cancelled"],
  approved_pending_payment: ["payment_submitted", "cancelled"],
  payment_submitted: ["booked", "cancelled"],
  booked: ["in_transit"],
  in_transit: ["active_rental"],
  active_rental: ["returned_in_transit"],
  returned_in_transit: ["completed", "disputed"],
};

// @desc    Request a rental booking
// @route   POST /api/bookings
// @access  Private (Rentee)
export const createBookingRequest = async (req, res) => {
  try {
    const { listingId, startDate, endDate, rentalTier, selectedAddOns } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.lender.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot rent your own listing" });
    }

    // Check for date overlaps on active bookings
    const overlap = await Booking.findOne({
      listing: listingId,
      status: { $in: ["booked", "in_transit", "active_rental"] },
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) },
        },
      ],
    });

    if (overlap) {
      return res.status(400).json({
        message: "Costume is already booked for the selected date range",
      });
    }

    // Determine base fee from lender's tiered pricing
    const tier = rentalTier || "3_days";
    let baseFee;

    if (tier === "3_days") {
      baseFee = listing.rentalRates.threeDays;
    } else if (tier === "7_days") {
      if (!listing.rentalRates.sevenDays) {
        return res.status(400).json({ message: "7-day rental rate is not offered for this item" });
      }
      baseFee = listing.rentalRates.sevenDays;
    } else if (tier === "1_day") {
      if (!listing.rentalRates.oneDay) {
        return res.status(400).json({ message: "1-day rental rate is not offered for this item" });
      }
      baseFee = listing.rentalRates.oneDay;
    } else {
      return res.status(400).json({ message: "Invalid rental duration tier" });
    }

    // Tally modular add-ons
    let addOnFeeTotal = 0;
    let addOnDepTotal = 0;

    if (selectedAddOns && selectedAddOns.length > 0) {
      selectedAddOns.forEach((addon) => {
        addOnFeeTotal += Number(addon.extraRentalFee) || 0;
        addOnDepTotal += Number(addon.extraDeposit) || 0;
      });
    }

    const baseDeposit = Number(listing.securityDeposit) || 0;
    const totalRentalFee = baseFee + addOnFeeTotal;
    const totalDeposit = baseDeposit + addOnDepTotal;
    const grandTotal = totalRentalFee + totalDeposit;

    const booking = await Booking.create({
      listing: listingId,
      rentee: req.user._id,
      lender: listing.lender,
      rentalTier: tier,
      startDate,
      endDate,
      selectedAddOns: selectedAddOns || [],
      pricingBreakdown: {
        baseRentalFee: baseFee,
        addOnsRentalFee: addOnFeeTotal,
        baseDeposit,
        addOnsDeposit: addOnDepTotal,
        totalRentalFee,
        totalDeposit,
        grandTotal,
      },
      status: "requested",
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user bookings (both as rentee or lender)
// @route   GET /api/bookings/my
// @access  Private
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [{ rentee: req.user._id }, { lender: req.user._id }],
    })
      .populate("listing", "title characterName seriesTitle images rentalRates paymentDetails location")
      .populate("rentee", "name email phone socialLinks verification.status")
      .populate("lender", "name email phone socialLinks")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single booking details (conditionally reveals GCash info)
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("listing")
      .populate("rentee", "name email phone socialLinks verification.status")
      .populate("lender", "name email phone socialLinks");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const isLender = booking.lender._id.toString() === req.user._id.toString();
    const isRentee = booking.rentee._id.toString() === req.user._id.toString();

    if (!isLender && !isRentee) {
      return res.status(403).json({ message: "Not authorized to view this booking" });
    }

    const bookingObj = booking.toObject();

    // Stages where payment details are allowed to be seen
    const paymentUnlockedStages = [
      "approved_pending_payment",
      "payment_submitted",
      "booked",
      "in_transit",
      "active_rental",
      "returned_in_transit",
      "completed",
    ];

    // If the request is still pending approval or cancelled, redact GCash info
    if (!paymentUnlockedStages.includes(booking.status)) {
      if (bookingObj.listing?.paymentDetails) {
        delete bookingObj.listing.paymentDetails;
      }
    }

    res.status(200).json(bookingObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking lifecycle status with transition validation
// @route   PATCH /api/bookings/:id/status
// @access  Private
export const updateBookingStatus = async (req, res) => {
  try {
    const { status, trackingNumber, courier, paymentProof, refundData } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const isLender = booking.lender.toString() === req.user._id.toString();
    const isRentee = booking.rentee.toString() === req.user._id.toString();

    if (!isLender && !isRentee) {
      return res.status(403).json({ message: "Not authorized for this booking" });
    }

    // 1. Enforce valid state progression
    const allowed = VALID_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Illegal state transition from '${booking.status}' to '${status}'.`,
      });
    }

    // 2. Enforce role-based authority per status step
    if (status === "approved_pending_payment") {
      if (!isLender) return res.status(403).json({ message: "Only the lender can approve this request" });
      booking.status = "approved_pending_payment";
    } else if (status === "payment_submitted") {
      if (!isRentee) return res.status(403).json({ message: "Only the rentee can submit payment proof" });
      booking.status = "payment_submitted";
      booking.paymentProof = {
        receiptImageUrl: paymentProof?.receiptImageUrl || "",
        referenceNumber: paymentProof?.referenceNumber || "",
        submittedAt: new Date(),
      };
    } else if (status === "booked") {
      if (!isLender) return res.status(403).json({ message: "Only the lender can confirm incoming payment" });
      booking.status = "booked";
    } else if (status === "in_transit") {
      if (!isLender) return res.status(403).json({ message: "Only the lender can dispatch outbound parcel" });
      booking.status = "in_transit";
      booking.shipping.courier = courier || "";
      booking.shipping.outboundTrackingNumber = trackingNumber || "";
    } else if (status === "active_rental") {
      if (!isRentee) return res.status(403).json({ message: "Only the rentee can confirm receipt of the costume" });
      booking.status = "active_rental";
    } else if (status === "returned_in_transit") {
      if (!isRentee) return res.status(403).json({ message: "Only the rentee can log return shipment" });
      booking.status = "returned_in_transit";
      booking.shipping.returnCourier = courier || "";
      booking.shipping.returnTrackingNumber = trackingNumber || "";
    } else if (status === "completed") {
      if (!isLender) return res.status(403).json({ message: "Only the lender can finalize and refund deposit" });
      booking.status = "completed";
      if (refundData) {
        booking.depositRefund = {
          ...refundData,
          refundedAt: new Date(),
        };
      }
    } else if (status === "cancelled") {
      booking.status = "cancelled";
    }

    const updated = await booking.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};