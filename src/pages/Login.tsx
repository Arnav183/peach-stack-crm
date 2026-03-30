import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import PeachLogo from '../components/PeachLogo';
import { CheckCircle2 } from 'lucide-react';

const FEATURES = [
  'Client management & appointment tracking',
  'Revenue analytics & P&L reporting',
  'Invoice creation & payment tracking',
  'Business insights at a glance',
];

type LoginUser = { role: string; [key: string]: unknown };
interface LoginProps { onLogin: (user: LoginUser) => void; }

export default function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (token && role === 'superadmin') return <Navigate to="/super" replace />;
  if (token) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('businessId', String(data.user.businessId || ''));
      onLogin(data.user);
      if (data.user.role === 'superadmin') navigate('/super');
      else navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — dark branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <PeachLogo size={36} />
          <div>
            <div className="text-white font-bold text-lg leading-tight">Peach Stack</div>
            <div className="text-gray-400 text-xs">CRM PLATFORM</div>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Run your business<br />
            <span className="text-orange-400">from one place.</span>
          </h1>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Everything a small business needs — clients, appointments,<br />
            invoices, and revenue — all in one clean dashboard.
          </p>
          <div className="space-y-3">
            {FEATURES.map(f => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-orange-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-gray-600 text-xs">
          Peach Stack · Atlanta, GA · ship real.
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <PeachLogo size={32} />
          <span className="font-bold text-gray-900 text-lg">Peach Stack</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required autoFocus
                placeholder="you@yourbusiness.com"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition shadow-sm"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-sm shadow-orange-200"
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            Need access? Contact{' '}
            <a href="mailto:hello@peachstack.dev" className="text-orange-500 hover:underline">
              hello@peachstack.dev
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
