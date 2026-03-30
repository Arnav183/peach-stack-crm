import { useState, useEffect } from 'react';
import { User, Lock, Save, CheckCircle } from 'lucide-react';

const tok = () => localStorage.getItem('token');
const api = (path: string, opts?: RequestInit) =>
  fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok() },
    ...opts,
  }).then(r => r.json());

export default function Accounts() {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [profileSaved, setProfileSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [profileErr, setProfileErr] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/auth/me').then(u => {
      setProfile({ name: u.name || '', email: u.email || '' });
    }).finally(() => setLoading(false));
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileErr('');
    try {
      await api('/auth/update-profile', {
        method: 'PUT',
        body: JSON.stringify({ name: profile.name, email: profile.email }),
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: any) {
      setProfileErr(err.message || 'Failed to update profile');
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr('');
    if (pwForm.next !== pwForm.confirm) { setPwErr('Passwords do not match'); return; }
    if (pwForm.next.length < 8) { setPwErr('Password must be at least 8 characters'); return; }
    try {
      await api('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      setPwSaved(true);
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err: any) {
      setPwErr(err.message || 'Failed to change password');
    }
  }

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your login credentials</p>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <User size={16} className="text-orange-500" />
          </div>
          <h2 className="font-semibold text-gray-900">Profile</h2>
        </div>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                value={profile.email}
                onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
          </div>
          {profileErr && <p className="text-red-500 text-xs">{profileErr}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              <Save size={14} /> Save Profile
            </button>
            {profileSaved && (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle size={14} /> Saved!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <Lock size={16} className="text-orange-500" />
          </div>
          <h2 className="font-semibold text-gray-900">Change Password</h2>
        </div>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current Password</label>
            <input
              type="password"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              value={pwForm.current}
              onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
              required placeholder="••••••••"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                value={pwForm.next}
                onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
                required placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm Password</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                value={pwForm.confirm}
                onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                required placeholder="••••••••"
              />
            </div>
          </div>
          {pwErr && <p className="text-red-500 text-xs">{pwErr}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              <Lock size={14} /> Update Password
            </button>
            {pwSaved && (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle size={14} /> Password updated!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
