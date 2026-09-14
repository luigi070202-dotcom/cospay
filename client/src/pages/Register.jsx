import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, Phone, Globe, AlertCircle, Loader2, Sparkles } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    facebook: "",
    instagram: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      // Format payload to match server/src/models/User.js structure
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        socialLinks: {
          facebook: formData.facebook,
          instagram: formData.instagram,
        },
      };

      const { data } = await API.post("/auth/register", payload);
      login(data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="bg-brand-card w-full max-w-lg p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-peso flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl">
            C₱
          </div>
          <h1 className="text-2xl font-black text-brand-text">Join CosPay</h1>
          <p className="text-xs text-brand-muted">
            Rent, lend, and verify costumes across the Philippines
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-slate-700 uppercase tracking-wider">Full Name / Cosplay Alias</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Amber Glider"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-normal text-slate-800 text-sm focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-slate-700 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="amber@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-normal text-slate-800 text-sm focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition"
              />
            </div>
          </div>

          {/* Password & Phone Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 chars"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-normal text-slate-800 text-sm focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 uppercase tracking-wider">GCash Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="09171234567"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-normal text-slate-800 text-sm focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition"
                />
              </div>
            </div>
          </div>

          {/* Cosplay Credibility Socials */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-brand-primary flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Cosplay Social Links (For Lender Trust)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                name="facebook"
                value={formData.facebook}
                onChange={handleChange}
                placeholder="Facebook profile or page URL"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal text-slate-800 text-xs focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition"
              />
              <input
                type="text"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="Instagram handle (e.g. @amber.cos)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal text-slate-800 text-xs focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3.5 bg-brand-primary hover:bg-brand-hover text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-500/15 flex items-center justify-center gap-2 transition disabled:bg-slate-300"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Create CosPay Account</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-brand-muted pt-2 border-t border-slate-100">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-brand-primary hover:underline">
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
}