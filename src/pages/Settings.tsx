import { useState } from "react";
import { User, Building, Mail, Shield } from "lucide-react";

interface SettingsProps {
  user: any;
}

export default function Settings({ user }: SettingsProps) {
  const [formData, setFormData] = useState({
    owner_name: user.owner_name,
    business_name: user.business_name,
    email: user.email,
  });

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
        <p className="text-zinc-500">Manage your business profile and account preferences.</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200">
          <h3 className="text-lg font-bold text-zinc-900">Business Profile</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Owner Name
              </label>
              <input 
                type="text"
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
                <Building className="w-4 h-4" />
                Business Name
              </label>
              <input 
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <input 
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 cursor-not-allowed"
              />
              <p className="text-xs text-zinc-400 mt-1">Email cannot be changed in the demo.</p>
            </div>
          </div>
          <div className="pt-4">
            <button className="bg-zinc-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-zinc-800 transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200">
          <h3 className="text-lg font-bold text-zinc-900">Security</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">Password</p>
                <p className="text-xs text-zinc-500">Last changed 3 months ago</p>
              </div>
            </div>
            <button className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
