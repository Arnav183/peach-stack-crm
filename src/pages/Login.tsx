import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.user);
        navigate("/dashboard");
      } else {
        setError(data.error || "Invalid email or password");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2.5 mb-5">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white font-bold text-xs tracking-tight shadow-lg">
              404
            </div>
            <div className="text-left">
              <p className="font-bold text-zinc-900 text-lg leading-none tracking-tight">404 Labs</p>
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">CRM Platform</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Welcome back</h1>
          <p className="text-zinc-500 mt-1 text-sm">Sign in to manage your business</p>
        </div>

        {/* Form card */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white py-2.5 rounded-lg font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        {/* Demo credentials box */}
        <div className="mt-5 p-4 bg-white rounded-xl border border-zinc-200 shadow-sm">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Demo credentials</p>
          <p className="text-sm text-zinc-600 font-mono">admin@example.com</p>
          <p className="text-sm text-zinc-600 font-mono">admin123</p>
        </div>

        <p className="text-center mt-5 text-xs text-zinc-400">
          Built by <span className="font-semibold text-zinc-600">404 Labs</span>
        </p>
      </div>
    </div>
  );
}
