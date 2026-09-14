import { useEffect, useState } from "react";
import API from "../services/api";
import ListingCard from "../components/ListingCard";
import { Sparkles, Loader2 } from "lucide-react";

export default function Home() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const { data } = await API.get("/listings");
        setListings(data);
      } catch (err) {
        console.error("Failed to load listings:", err);
        setError("Could not retrieve listings. Ensure your backend server is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-brand-primary to-indigo-700 rounded-3xl p-8 sm:p-12 text-white shadow-lg shadow-indigo-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Philippine Cosplay Marketplace
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Rent Verified Cosplays with Safe Escrow
          </h1>
          <p className="text-indigo-100 text-sm sm:text-base">
            Rent full sets, styled wigs, and crafted props from local cosplayers with transparent flaw disclosures and secure deposits.
          </p>
        </div>
      </section>

      {/* Catalog Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-text">Available Outfits</h2>
          <span className="text-sm font-semibold text-brand-muted">
            {listings.length} items listed
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-brand-muted">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-2" />
            <p className="text-sm">Loading cosplay catalog...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm text-center">
            {error}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <p className="text-brand-muted text-sm">No costumes posted yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.map((item) => (
              <ListingCard key={item._id} listing={item} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}