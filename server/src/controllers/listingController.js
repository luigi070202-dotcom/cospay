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
      size:
        listingType === "Wig Only" || listingType === "Prop Only"
          ? "Not Applicable"
          : size,
      measurements,
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

    if (size && size !== "All") {
      query.size = size;
    }

    if (city) {
      query["location.city"] = { $regex: city, $options: "i" };
    }

    const listings = await Listing.find(query)
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
    const listing = await Listing.findById(req.params.id).populate(
      "lender",
      "name socialLinks verification.status"
    );

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