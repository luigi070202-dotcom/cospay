import Listing from "../models/Listing.js";

// @desc    Create a new listing
// @route   POST /api/listings
// @access  Private (Authenticated lender only)
export const createListing = async (req, res) => {
  try {
    const {
      title,
      characterName,
      seriesTitle,
      isGenericOrOriginal,
      brand,
      description,
      category,
      listingType,
      sizeVariants,
      availableSizes,
      size,
      measurements,
      images,
      inclusions,
      addOns,
      flaws,
      rentalRates,
      securityDeposit,
      location,
      shippingMethods,
      cleaningPolicy,
      paymentDetails,
    } = req.body;

    if (!rentalRates || !rentalRates.threeDays) {
      return res
        .status(400)
        .json({ message: "Standard 3-day rental fee (threeDays) is required" });
    }

    // 1. Resolve size variants with measurements & default isAvailable: true
    let finalVariants = [];

    if (listingType === "Wig Only" || listingType === "Prop Only") {
      finalVariants = [{ size: "Not Applicable", isAvailable: true }];
    } else if (Array.isArray(sizeVariants) && sizeVariants.length > 0) {
      finalVariants = sizeVariants.map((v) => ({
        ...v,
        isAvailable: v.isAvailable !== undefined ? v.isAvailable : true,
      }));
    } else if (Array.isArray(availableSizes) && availableSizes.length > 0) {
      finalVariants = availableSizes.map((sz) => ({
        size: sz,
        ...(measurements || {}),
        isAvailable: true,
      }));
    } else if (size) {
      finalVariants = [{ size, ...(measurements || {}), isAvailable: true }];
    } else {
      finalVariants = [{ size: "Free Size", ...(measurements || {}), isAvailable: true }];
    }

    const listing = await Listing.create({
      lender: req.user._id,
      title,
      characterName: characterName || "None / Original Concept",
      seriesTitle: seriesTitle || "Generic / Daily Wear",
      isGenericOrOriginal: Boolean(isGenericOrOriginal),
      brand,
      description,
      category,
      listingType,
      sizeVariants: finalVariants,
      images,
      inclusions,
      addOns: addOns || [],
      flaws,
      rentalRates,
      securityDeposit: securityDeposit || 0,
      location,
      shippingMethods,
      cleaningPolicy,
      paymentDetails,
      isAvailable: finalVariants.some((v) => v.isAvailable),
    });

    res.status(201).json(listing);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all active listings with multi-filter search
// @route   GET /api/listings
// @access  Public
export const getListings = async (req, res) => {
  try {
    const { search, category, listingType, size, city } = req.query;

    let query = { isAvailable: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { characterName: { $regex: search, $options: "i" } },
        { seriesTitle: { $regex: search, $options: "i" } },
      ];
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (listingType && listingType !== "All") {
      query.listingType = listingType;
    }

    // Match only if the specific size variant exists AND is currently available
    if (size && size !== "All") {
      query.sizeVariants = {
        $elemMatch: { size: size, isAvailable: true },
      };
    }

    if (city) {
      query["location.city"] = { $regex: city, $options: "i" };
    }

    const listings = await Listing.find(query)
      .select("-paymentDetails")
      .populate("lender", "name socialLinks verification.status")
      .sort({ createdAt: -1 });

    res.status(200).json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single listing details by ID
// @route   GET /api/listings/:id
// @access  Public
export const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .select("-paymentDetails")
      .populate("lender", "name socialLinks verification.status");

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.status(200).json(listing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a listing
// @route   PUT /api/listings/:id
// @access  Private (Lender/Owner only)
export const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.lender.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this listing" });
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedListing);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a listing
// @route   DELETE /api/listings/:id
// @access  Private (Lender/Owner only)
export const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.lender.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this listing" });
    }

    await listing.deleteOne();

    res.status(200).json({ message: "Listing deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle costume availability for a SPECIFIC size variant (e.g., Size M in private use)
// @route   PATCH /api/listings/:id/toggle-size-availability
// @access  Private (Listing owner only)
export const toggleSizeAvailability = async (req, res) => {
  try {
    const { variantId, size } = req.body;
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.lender.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to modify this listing" });
    }

    // Locate the exact size variant subdocument
    const targetVariant = listing.sizeVariants.find(
      (v) =>
        (variantId && v._id.toString() === variantId.toString()) ||
        (size && v.size === size)
    );

    if (!targetVariant) {
      return res
        .status(404)
        .json({ message: "Size variant not found on this listing" });
    }

    targetVariant.isAvailable = !targetVariant.isAvailable;

    // Overall listing stays in the catalog if at least one size variant remains rentable
    listing.isAvailable = listing.sizeVariants.some((v) => v.isAvailable);

    await listing.save();

    res.status(200).json({
      message: `Size ${targetVariant.size} marked as ${
        targetVariant.isAvailable ? "Available" : "Unavailable (Private Use)"
      }`,
      sizeVariants: listing.sizeVariants,
      isAvailable: listing.isAvailable,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};