import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PlusCircle, ShieldCheck, LogOut, Sparkles } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 bg-brand-card/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Lockup */}
        <Link to="/" className="flex items-center gap-2.5 select-none group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-peso flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-black text-lg group-hover:scale-105 transition-transform">
            C₱
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight text-brand-text leading-none">
              Cos<span className="text-brand-peso">Pay</span>
            </span>
            <span className="text-[9px] font-bold tracking-widest text-brand-muted uppercase">
              Cosplay
            </span>
          </div>
        </Link>

        {/* Navigation & Action Links */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-sm font-medium text-brand-muted hover:text-brand-text transition"
          >
            Explore
          </Link>

          {user ? (
            <>
              <Link
                to="/create-listing"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-brand-primary hover:bg-brand-hover text-white shadow-sm transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post Cosplay</span>
              </Link>

              <Link
                to="/my-bookings"
                className="text-sm font-medium text-brand-muted hover:text-brand-text transition"
              >
                Bookings
              </Link>

              <div className="h-5 w-px bg-slate-200" />

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-brand-text flex items-center gap-1">
                  {user.name}
                  {user.verificationStatus === "verified" && (
                    <ShieldCheck className="w-4 h-4 text-brand-peso" title="Verified Cosplayer" />
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-brand-muted hover:text-brand-accent transition rounded-lg hover:bg-slate-100"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-brand-text hover:text-brand-primary transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-brand-primary hover:bg-brand-hover text-white shadow-sm transition"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Sign Up</span>
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}