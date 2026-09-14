import mongoose from "mongoose";

const addOnSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ["Weapon/Prop", "Wig", "Shoes", "Armor Piece", "Other"],
    default: "Weapon/Prop",
  },
  description: { type: String, default: "" },
  extraRentalFee: { type: Number, required: true, min: 0, default: 0 },
  extraDeposit: { type: Number, min: 0, default: 0 },
});

// Sizing variant with its own specific garment measurements & individual availability
const sizeVariantSchema = new mongoose.Schema({
  size: {
    type: String,
    enum: ["XS", "S", "M", "L", "XL", "2XL", "Free Size", "Not Applicable"],
    required: true,
  },
  bustCm: { type: Number, default: null },
  waistCm: { type: Number, default: null },
  hipsCm: { type: Number, default: null },
  maxHeightCm: { type: Number, default: null },
  shoeSizeEu: { type: Number, default: null },
  // Per-size availability flag for personal/private use toggling
  isAvailable: {
    type: Boolean,
    default: true,
  },
});

const listingSchema = new mongoose.Schema(
  {
    lender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
      enum: ["Full Set", "Outfit Only", "Wig Only", "Prop Only", "Accessories Only"],
      required: [true, "Listing type is required"],
      default: "Full Set",
    },

    // Array of sizes, each with its dedicated measurements and individual availability
    sizeVariants: {
      type: [sizeVariantSchema],
      validate: {
        validator: (arr) => arr && arr.length > 0,
        message: "At least one size variant must be configured",
      },
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
    rentalRates: {
      oneDay: { type: Number, default: null, min: 0 },
      threeDays: { type: Number, required: true, min: 0 },
      sevenDays: { type: Number, default: null, min: 0 },
    },
    securityDeposit: {
      type: Number,
      default: 0,
      min: 0,
    },
    location: {
      city: { type: String, required: true, trim: true },
      province: { type: String, required: true, trim: true },
    },
    shippingMethods: {
      type: [String],
      default: ["Same-Day Courier (Lalamove/Grab)", "Standard Courier (J&T Express)"],
    },
    cleaningPolicy: {
      type: String,
      default: "Do NOT wash or iron. Lender handles all cleaning upon return.",
      trim: true,
    },
    paymentDetails: {
      gcashName: { type: String, required: true },
      gcashNumber: { type: String, required: true },
      mayaNumber: { type: String, default: "" },
    },
    // The listing is active if at least one variant is available
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Virtual helper: flat list of available size strings
listingSchema.virtual("availableSizes").get(function () {
  return this.sizeVariants?.map((v) => v.size) || [];
});

listingSchema.virtual("size").get(function () {
  return this.sizeVariants?.map((v) => v.size).join(", ") || "Free Size";
});

listingSchema.set("toJSON", { virtuals: true });
listingSchema.set("toObject", { virtuals: true });

const Listing = mongoose.model("Listing", listingSchema);
export default Listing;