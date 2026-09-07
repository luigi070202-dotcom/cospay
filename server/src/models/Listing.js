import mongoose from "mongoose";

// Modular Add-ons (weapons, styled wigs, specialized props)
const addOnSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Add-on item name is required"],
    trim: true,
  },
  type: {
    type: String,
    enum: ["Weapon/Prop", "Wig", "Shoes", "Armor Piece", "Other"],
    default: "Weapon/Prop",
  },
  description: {
    type: String,
    default: "",
    trim: true,
  },
  extraRentalFee: {
    type: Number,
    required: true,
    min: [0, "Extra rental fee cannot be negative"],
    default: 0,
  },
  extraDeposit: {
    type: Number,
    min: [0, "Extra deposit cannot be negative"],
    default: 0,
  },
});

const listingSchema = new mongoose.Schema(
  {
    lender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Primary title / headline
    title: {
      type: String,
      required: [true, "Listing title is required"],
      trim: true,
    },
    characterName: {
      type: String,
      default: "None / Original Concept",
      trim: true,
    },
    seriesTitle: {
      type: String,
      default: "Generic / Daily Wear",
      trim: true,
    },
    isGenericOrOriginal: {
      type: Boolean,
      default: false,
    },
    brand: {
      type: String,
      default: "Not Specified / Taobao",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "Anime",
        "Game",
        "Movie/Series",
        "VTuber",
        "Comic/Cartoon",
        "Subculture/Fashion",
        "Daily/Wigs",
        "Original/Other",
      ],
      default: "Anime",
    },
    listingType: {
      type: String,
      enum: [
        "Full Set",
        "Outfit Only",
        "Wig Only",
        "Prop Only",
        "Accessories Only",
      ],
      required: [true, "Listing type is required"],
      default: "Full Set",
    },
    size: {
      type: String,
      enum: ["XS", "S", "M", "L", "XL", "2XL", "Free Size", "Not Applicable"],
      default: "Free Size",
    },
    measurements: {
      bustCm: { type: Number, default: null },
      waistCm: { type: Number, default: null },
      hipsCm: { type: Number, default: null },
      maxHeightCm: { type: Number, default: null },
      shoeSizeEu: { type: Number, default: null },
    },
    images: {
      type: [String],
      validate: {
        validator: (array) => array.length > 0,
        message: "A listing must have at least one photo",
      },
    },
    inclusions: {
      type: [String],
      default: [],
    },
    addOns: [addOnSchema],
    flaws: {
      type: String,
      default: "None declared by lender.",
      trim: true,
    },

    // Community Rental Duration Pricing (PHP ₱)
    rentalRates: {
      oneDay: {
        type: Number,
        default: null,
        min: [0, "1-day fee cannot be negative"],
      },
      threeDays: {
        type: Number,
        required: [true, "Standard 3-day rental fee is required"],
        min: [0, "3-day fee cannot be negative"],
      },
      sevenDays: {
        type: Number,
        default: null,
        min: [0, "7-day fee cannot be negative"],
      },
    },

    // Refundable Security Deposit
    securityDeposit: {
      type: Number,
      default: 0,
      min: [0, "Security deposit cannot be negative"],
    },

    // Fulfillment & Logistics
    location: {
      city: { type: String, required: [true, "City is required"], trim: true },
      province: {
        type: String,
        required: [true, "Province is required"],
        trim: true,
      },
    },
    shippingMethods: {
      type: [String],
      default: [
        "Same-Day Courier (Lalamove/Grab)",
        "Standard Courier (J&T Express)",
      ],
    },
    cleaningPolicy: {
      type: String,
      default: "Do NOT wash or iron. Lender handles all cleaning upon return.",
      trim: true,
    },

    // Lender Digital Wallet Payment Details
    paymentDetails: {
      gcashName: { type: String, required: [true, "GCash name is required"] },
      gcashNumber: {
        type: String,
        required: [true, "GCash number is required"],
      },
      mayaNumber: { type: String, default: "" },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Listing = mongoose.model("Listing", listingSchema);

export default Listing;