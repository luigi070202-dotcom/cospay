import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import {
  Tag,
  Shirt,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  Loader2,
  DollarSign,
  MapPin,
  CheckCircle2,
  UploadCloud,
  Ruler,
} from "lucide-react";

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "Free Size"];

export default function CreateListing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    characterName: "",
    seriesTitle: "",
    brand: "",
    category: "Anime",
    listingType: "Full Set",
    rentalRates: {
      threeDays: "",
      oneDay: "",
      sevenDays: "",
    },
    securityDeposit: "",
    flaws: "None declared.",
    description: "",
    cleaningPolicy: "Do NOT wash or iron. Lender handles all garment care upon return.",
    location: {
      city: "Quezon City",
      province: "Metro Manila",
    },
    paymentDetails: {
      gcashName: "",
      gcashNumber: "",
    },
  });

  // Size Variants: Each has its own size tag and specific measurements
  const [sizeVariants, setSizeVariants] = useState([
    {
      size: "M",
      bustCm: "",
      waistCm: "",
      hipsCm: "",
      maxHeightCm: "",
      shoeSizeEu: "",
    },
  ]);

  const [inclusionsInput, setInclusionsInput] = useState("");
  const [inclusions, setInclusions] = useState([]);

  // Stored locally for deferred Cloudinary upload
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [addOns, setAddOns] = useState([]);
  const [newAddOn, setNewAddOn] = useState({
    name: "",
    type: "Weapon/Prop",
    extraRentalFee: "",
    extraDeposit: "",
    description: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Add another size variant entry
  const handleAddSizeVariant = () => {
    const unusedSize =
      STANDARD_SIZES.find((s) => !sizeVariants.some((v) => v.size === s)) ||
      "Free Size";
    setSizeVariants((prev) => [
      ...prev,
      {
        size: unusedSize,
        bustCm: "",
        waistCm: "",
        hipsCm: "",
        maxHeightCm: "",
        shoeSizeEu: "",
      },
    ]);
  };

  const handleRemoveSizeVariant = (index) => {
    if (sizeVariants.length === 1) return;
    setSizeVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleVariantChange = (index, field, value) => {
    setSizeVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    const hasOversized = files.some((file) => file.size > 5 * 1024 * 1024);
    if (hasOversized) {
      setError("One or more images exceed the 5MB size limit.");
      return;
    }

    const newItems = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setSelectedFiles((prev) => [...prev, ...newItems].slice(0, 5));
    e.target.value = "";
  };

  const handleRemoveFile = (indexToRemove) => {
    URL.revokeObjectURL(selectedFiles[indexToRemove].previewUrl);
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddInclusion = () => {
    if (inclusionsInput.trim()) {
      setInclusions([...inclusions, inclusionsInput.trim()]);
      setInclusionsInput("");
    }
  };

  const handleRemoveInclusion = (index) => {
    setInclusions(inclusions.filter((_, idx) => idx !== index));
  };

  const handleAddModularAddon = () => {
    if (newAddOn.name && newAddOn.extraRentalFee) {
      setAddOns([
        ...addOns,
        {
          ...newAddOn,
          extraRentalFee: Number(newAddOn.extraRentalFee),
          extraDeposit: Number(newAddOn.extraDeposit) || 0,
        },
      ]);
      setNewAddOn({
        name: "",
        type: "Weapon/Prop",
        extraRentalFee: "",
        extraDeposit: "",
        description: "",
      });
    }
  };

  const handleRemoveModularAddon = (index) => {
    setAddOns(addOns.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError("Please select at least one costume photo.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // 1. Upload staged files to Cloudinary on final submit
      const uploadData = new FormData();
      selectedFiles.forEach((item) => uploadData.append("images", item.file));

      const uploadRes = await API.post("/upload", uploadData);
      const uploadedUrls = uploadRes.data.images.map((img) => img.url);

      // 2. Parse numeric dimensions for each size variant
      const parsedVariants = sizeVariants.map((v) => ({
        size: v.size,
        bustCm: v.bustCm ? Number(v.bustCm) : null,
        waistCm: v.waistCm ? Number(v.waistCm) : null,
        hipsCm: v.hipsCm ? Number(v.hipsCm) : null,
        maxHeightCm: v.maxHeightCm ? Number(v.maxHeightCm) : null,
        shoeSizeEu: v.shoeSizeEu ? Number(v.shoeSizeEu) : null,
      }));

      const payload = {
        ...formData,
        sizeVariants: parsedVariants,
        rentalRates: {
          threeDays: Number(formData.rentalRates.threeDays),
          oneDay: formData.rentalRates.oneDay
            ? Number(formData.rentalRates.oneDay)
            : undefined,
          sevenDays: formData.rentalRates.sevenDays
            ? Number(formData.rentalRates.sevenDays)
            : undefined,
        },
        securityDeposit: Number(formData.securityDeposit) || 0,
        inclusions,
        images: uploadedUrls,
        addOns,
      };

      const { data } = await API.post("/listings", payload);
      navigate(`/listings/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-brand-card p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-black text-brand-text">List a Cosplay for Rent</h1>
          <p className="text-xs text-brand-muted">
            Configure multiple available sizes with their corresponding garment measurements
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs font-semibold">
          {/* Section 1: Overview */}
          <div className="space-y-3 border-b border-slate-100 pb-5">
            <h2 className="text-xs uppercase tracking-wider text-brand-primary">
              1. Overview
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 block mb-1">Listing Headline</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Raiden Shogun Archon Cosplay Full Set"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal text-xs outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1">Character Name</label>
                <input
                  type="text"
                  name="characterName"
                  required
                  placeholder="e.g. Raiden Shogun"
                  value={formData.characterName}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal text-xs outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1">Series / Source</label>
                <input
                  type="text"
                  name="seriesTitle"
                  required
                  placeholder="e.g. Genshin Impact"
                  value={formData.seriesTitle}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal text-xs outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1">Brand / Maker</label>
                <input
                  type="text"
                  name="brand"
                  placeholder="e.g. DokiDoki SSR, Uwowo, Taobao"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal text-xs outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-slate-700 block mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal text-xs outline-none focus:border-brand-primary"
                >
                  <option>Anime</option>
                  <option>Game</option>
                  <option>Movie/Series</option>
                  <option>VTuber</option>
                  <option>Comic/Cartoon</option>
                  <option>Subculture/Fashion</option>
                  <option>Daily/Wigs</option>
                  <option>Original/Other</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1">Listing Type</label>
                <select
                  name="listingType"
                  value={formData.listingType}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal text-xs outline-none focus:border-brand-primary"
                >
                  <option>Full Set</option>
                  <option>Outfit Only</option>
                  <option>Wig Only</option>
                  <option>Prop Only</option>
                  <option>Accessories Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Size Variants with Individual Measurements */}
          {formData.listingType !== "Wig Only" && formData.listingType !== "Prop Only" && (
            <div className="space-y-4 border-b border-slate-100 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs uppercase tracking-wider text-brand-primary flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5" />
                    <span>2. Sizing & Dimensions per Size</span>
                  </h2>
                  <p className="text-[11px] text-brand-muted font-normal mt-0.5">
                    Add each available size variant and its matching garment dimensions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSizeVariant}
                  className="inline-flex items-center gap-1 text-xs text-brand-primary font-bold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Another Size
                </button>
              </div>

              <div className="space-y-3">
                {sizeVariants.map((variant, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-700">Size:</span>
                        <select
                          value={variant.size}
                          onChange={(e) =>
                            handleVariantChange(idx, "size", e.target.value)
                          }
                          className="px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-xs bg-white text-brand-text outline-none focus:border-brand-primary"
                        >
                          {STANDARD_SIZES.map((sz) => (
                            <option key={sz} value={sz}>
                              {sz}
                            </option>
                          ))}
                        </select>
                      </div>

                      {sizeVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSizeVariant(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block">
                          Bust (cm)
                        </span>
                        <input
                          type="number"
                          placeholder="e.g. 88"
                          value={variant.bustCm}
                          onChange={(e) =>
                            handleVariantChange(idx, "bustCm", e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-normal text-xs outline-none focus:border-brand-primary"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block">
                          Waist (cm)
                        </span>
                        <input
                          type="number"
                          placeholder="e.g. 70"
                          value={variant.waistCm}
                          onChange={(e) =>
                            handleVariantChange(idx, "waistCm", e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-normal text-xs outline-none focus:border-brand-primary"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block">
                          Hips (cm)
                        </span>
                        <input
                          type="number"
                          placeholder="e.g. 94"
                          value={variant.hipsCm}
                          onChange={(e) =>
                            handleVariantChange(idx, "hipsCm", e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-normal text-xs outline-none focus:border-brand-primary"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block">
                          Max Height (cm)
                        </span>
                        <input
                          type="number"
                          placeholder="e.g. 165"
                          value={variant.maxHeightCm}
                          onChange={(e) =>
                            handleVariantChange(idx, "maxHeightCm", e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-normal text-xs outline-none focus:border-brand-primary"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block">
                          Shoe (EU)
                        </span>
                        <input
                          type="number"
                          placeholder="e.g. 38"
                          value={variant.shoeSizeEu}
                          onChange={(e) =>
                            handleVariantChange(idx, "shoeSizeEu", e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-normal text-xs outline-none focus:border-brand-primary"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Photos */}
          <div className="space-y-3 border-b border-slate-100 pb-5">
            <h2 className="text-xs uppercase tracking-wider text-brand-primary font-bold">
              3. Photos
            </h2>
            <label className="border-2 border-dashed border-slate-200 hover:border-brand-primary rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition">
              <UploadCloud className="w-7 h-7 text-brand-primary mb-2" />
              <span className="text-xs font-bold text-slate-700">
                Click to browse or drop photos
              </span>
              <span className="text-[11px] text-brand-muted mt-0.5">
                PNG, JPG, or WEBP up to 5MB
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-3">
                {selectedFiles.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100"
                  >
                    <img
                      src={item.previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover block"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute top-2 right-2 bg-rose-600/90 text-white p-1.5 rounded-xl shadow"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Inclusions & Disclosures */}
          <div className="space-y-3 border-b border-slate-100 pb-5">
            <h2 className="text-xs uppercase tracking-wider text-brand-primary">
              4. Inclusions & Flaws
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Kimono Top, Obi Belt"
                value={inclusionsInput}
                onChange={(e) => setInclusionsInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal text-xs outline-none focus:border-brand-primary"
              />
              <button
                type="button"
                onClick={handleAddInclusion}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition"
              >
                Add Piece
              </button>
            </div>
            {inclusions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {inclusions.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInclusion(idx)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="space-y-1 pt-2">
              <label className="text-slate-700">Pre-Declared Condition & Flaws</label>
              <input
                type="text"
                name="flaws"
                placeholder="Declare minor wear to avoid return disputes"
                value={formData.flaws}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal text-xs outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Section 5: Rates & Payment */}
          <div className="space-y-3 border-b border-slate-100 pb-5">
            <h2 className="text-xs uppercase tracking-wider text-brand-primary">
              5. Rental Rates (₱) & Wallet
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-700 block mb-1">
                  3-Day Rate (Standard) ₱
                </label>
                <input
                  type="number"
                  name="rentalRates.threeDays"
                  required
                  placeholder="850"
                  value={formData.rentalRates.threeDays}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal text-xs outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1">
                  1-Day Rate ₱ (Optional)
                </label>
                <input
                  type="number"
                  name="rentalRates.oneDay"
                  placeholder="500"
                  value={formData.rentalRates.oneDay}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal text-xs outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1">Refundable Deposit ₱</label>
                <input
                  type="number"
                  name="securityDeposit"
                  required
                  placeholder="500"
                  value={formData.securityDeposit}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal text-xs outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-slate-700 block mb-1">Lender GCash Name</label>
                <input
                  type="text"
                  name="paymentDetails.gcashName"
                  required
                  placeholder="e.g. Amber Glider"
                  value={formData.paymentDetails.gcashName}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal text-xs outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1">
                  Lender GCash Number
                </label>
                <input
                  type="text"
                  name="paymentDetails.gcashNumber"
                  required
                  placeholder="09171234567"
                  value={formData.paymentDetails.gcashNumber}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal text-xs outline-none focus:border-brand-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Modular Add-Ons */}
          <div className="space-y-3 border-b border-slate-100 pb-5">
            <h2 className="text-xs uppercase tracking-wider text-brand-primary">
              6. Modular Add-Ons
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Prop name (e.g. Polearm)"
                value={newAddOn.name}
                onChange={(e) =>
                  setNewAddOn({ ...newAddOn, name: e.target.value })
                }
                className="px-3.5 py-2 rounded-xl border border-slate-200 font-normal text-xs"
              />
              <input
                type="number"
                placeholder="Extra Fee ₱"
                value={newAddOn.extraRentalFee}
                onChange={(e) =>
                  setNewAddOn({ ...newAddOn, extraRentalFee: e.target.value })
                }
                className="px-3.5 py-2 rounded-xl border border-slate-200 font-normal text-xs"
              />
              <button
                type="button"
                onClick={handleAddModularAddon}
                className="px-3 py-2 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-hover transition"
              >
                + Add Option
              </button>
            </div>
            {addOns.length > 0 && (
              <div className="space-y-1.5 pt-2">
                {addOns.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{item.name}</span>
                      <span className="text-slate-500 ml-2 font-normal">
                        (+₱{item.extraRentalFee})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveModularAddon(idx)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-2xl shadow-md shadow-indigo-500/15 flex items-center justify-center gap-2 transition text-sm disabled:bg-slate-300"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading & Publishing...</span>
              </>
            ) : (
              <span>Publish Costume Listing</span>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}