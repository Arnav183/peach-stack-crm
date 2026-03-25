import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, BarChart3, FileText, KeyRound, Shield } from "lucide-react";

interface LoginProps { onLogin: (user: any) => void; }

const FEATURES = [
  { icon: LayoutDashboard, title: "Smart Dashboard", desc: "Revenue trends, top clients, upcoming appointments at a glance." },
  { icon: Users, title: "Client Management", desc: "Full profiles, appointment history, notes and status tracking." },
  { icon: BarChart3, title: "Revenue & P&L", desc: "Real-time profit tracking with expense breakdowns and charts." },
  { icon: FileText, title: "Invoices", desc: "Create, send and track invoices with line items and due dates." },
  { icon: KeyRound, title: "Client Portal", desc: "Give clients their own login to view appointments and invoices." },
  { icon: Shield, title: "Secure & Private", desc: "Role-based access keeps your business data protected." },
];

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({email,password}) });
      const data = await res.json();
      if (res.ok) { onLogin(data.user); navigate(data.user.role === 'client' ? '/portal' : '/dashboard'); }
      else { setError(data.error || "Invalid email or password"); }
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — dark navy */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#0f172a] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/30">PS</div>
          <div>
            <p className="font-bold text-white text-base leading-none tracking-tight">Peach Stack</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">CRM Platform</p>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">Run your studio.<br /><span className="text-orange-400">Not your spreadsheets.</span></h2>
            <p className="text-slate-400 mt-4 text-base leading-relaxed max-w-sm">Everything you need to manage clients, track revenue, and grow your threading studio — in one place.</p>
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

        {/* Footer */}
        <p className="text-xs text-slate-600 relative z-10">Built by <span className="text-slate-400 font-semibold">Peach Stack</span> · Atlanta, GA</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-orange-500/30">PS</div>
          <p className="font-bold text-slate-900 text-base tracking-tight">Peach Stack CRM</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
              <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all text-sm shadow-sm"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <input type="password" required value={password} onChange={e=>setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all text-sm shadow-sm"
                placeholder="••••••••" />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">{error}</div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 text-sm mt-2">
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Demo credentials</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Admin login</span>
                <span className="text-xs font-mono font-semibold text-slate-700">admin@example.com / admin123</span>
              </div>
              <div className="h-px bg-slate-100" />
              <p className="text-[10px] text-slate-400 leading-relaxed">Client logins are created via the Accounts page once you're in.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
