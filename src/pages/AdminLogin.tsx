import React, { useState } from "react";
import PeachLogo from "../components/PeachLogo";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Mail } from "lucide-react";

interface Props { onLogin: (user: any) => void; }

export default function AdminLogin({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) { onLogin(data.user); navigate("/super/dashboard"); }
      else { setError(data.error || "Invalid credentials"); }
    } catch { setError("Connection error. Try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><PeachLogo size={64} /></div>
          <h1 className="text-xl font-bold text-white">Peach Stack Admin</h1>
          <p className="text-slate-500 text-sm mt-1">Internal access only</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  placeholder="admin@peachstack.dev" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  placeholder="••••••••" />
              </div>
            </div>
            {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-slate-700 mt-6">This page is not publicly linked.</p>
      </div>
    </div>
  );
}
