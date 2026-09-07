import Booking from "../models/Booking.js";
import Listing from "../models/Listing.js";

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

// @desc    Update booking lifecycle status
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

    if (status === "approved_pending_payment" && isLender) {
      booking.status = "approved_pending_payment";
    } else if (status === "payment_submitted" && isRentee) {
      booking.status = "payment_submitted";
      booking.paymentProof = {
        receiptImageUrl: paymentProof?.receiptImageUrl || "",
        referenceNumber: paymentProof?.referenceNumber || "",
        submittedAt: new Date(),
      };
    } else if (status === "booked" && isLender) {
      booking.status = "booked";
    } else if (status === "in_transit" && isLender) {
      booking.status = "in_transit";
      booking.shipping.courier = courier || "";
      booking.shipping.outboundTrackingNumber = trackingNumber || "";
    } else if (status === "returned_in_transit" && isRentee) {
      booking.status = "returned_in_transit";
      booking.shipping.returnCourier = courier || "";
      booking.shipping.returnTrackingNumber = trackingNumber || "";
    } else if (status === "completed" && isLender) {
      booking.status = "completed";
      if (refundData) {
        booking.depositRefund = {
          ...refundData,
          refundedAt: new Date(),
        };
      }
    } else {
      return res.status(400).json({ message: "Invalid status transition or role unauthorized" });
    }

    const updated = await booking.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};