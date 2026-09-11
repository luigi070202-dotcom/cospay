import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";

// Temporary home view to verify routing
function HomeView() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <div className="bg-brand-card border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm text-center max-w-2xl mx-auto space-y-4">
        <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-indigo-50 text-brand-primary border border-indigo-100">
          Philippine Cosplay Marketplace
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-brand-text tracking-tight">
          Rent Verified Cosplays with Safe GCash Escrow
        </h1>
        <p className="text-sm sm:text-base text-brand-muted">
          Browse anime and gaming outfits from verified community lenders with transparent flaw disclosures and secure deposit protection.
        </p>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-brand-canvas text-brand-text">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomeView />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}