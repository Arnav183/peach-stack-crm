import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, BarChart3, FileText, KeyRound, Shield } from "lucide-react";

interface LoginProps { onLogin: (user: any) => void; }

const FEATURES = [
  { icon: LayoutDashboard, title: "Smart Dashboard", desc: "Revenue trends, top clients, and upcoming appointments at a glance." },
  { icon: Users, title: "Client Management", desc: "Full profiles, history, notes and status tracking." },
  { icon: BarChart3, title: "Revenue & P&L", desc: "Real-time profit tracking with expense breakdowns and charts." },
  { icon: FileText, title: "Invoices", desc: "Create, send and track invoices with line items and due dates." },
  { icon: KeyRound, title: "Client Portal", desc: "Give customers their own login to view appointments and invoices." },
  { icon: Shield, title: "Secure & Private", desc: "Your data is fully isolated and protected." },
];

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.user);
        navigate(data.user.role === 'customer' ? '/portal' : '/dashboard');
      } else { setError(data.error || "Invalid email or password"); }
    } catch { setError("Something went wrong. Try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#0f172a] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/30">PS</div>
          <div>
            <p className="font-bold text-white text-base leading-none tracking-tight">Peach Stack</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">Business Platform</p>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">Run your business.<br /><span className="text-orange-400">Not your spreadsheets.</span></h2>
            <p className="text-slate-400 mt-4 text-base leading-relaxed max-w-sm">Everything you need to manage clients, track revenue, and grow — in one place.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 max-w-sm">
            {FEATURES.map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <f.icon className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{f.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-600 relative z-10">Built by <span className="text-slate-400 font-semibold">Peach Stack</span> · Atlanta, GA</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8">
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-orange-500/30">PS</div>
          <p className="font-bold text-slate-900 text-base tracking-tight">Peach Stack</p>
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to your business account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
              <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all text-sm shadow-sm"
                placeholder="you@yourbusiness.com" autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <input type="password" required value={password} onChange={e=>setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all text-sm shadow-sm"
                placeholder="••••••••" autoComplete="current-password" />
            </div>
            {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 text-sm mt-2">
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>
          <p className="text-center text-xs text-slate-400 mt-8">
            Need access? Contact <span className="text-slate-600 font-semibold">Peach Stack</span> to get set up.
          </p>
        </div>
      </div>
    </div>
  );
}
