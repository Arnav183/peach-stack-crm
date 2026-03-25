import { useState } from "react";
import { User, Building, Mail, Shield, Lock, Check, AlertCircle } from "lucide-react";

interface SettingsProps { user: any; }

const inp = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white";

export default function Settings({ user }: SettingsProps) {
  const [profile, setProfile] = useState({ owner_name: user.owner_name || "", business_name: user.business_name || "", email: user.email || "" });
  const [profileMsg, setProfileMsg] = useState<{type:'success'|'error';text:string}|null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [pwMsg, setPwMsg] = useState<{type:'success'|'error';text:string}|null>(null);
  const [savingPw, setSavingPw] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingProfile(true); setProfileMsg(null);
    const res = await fetch("/api/auth/settings", { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify(profile) });
    if (res.ok) { setProfileMsg({type:'success', text:'Profile saved successfully.'}); }
    else { setProfileMsg({type:'error', text:'Failed to save. Try again.'}); }
    setSavingProfile(false);
    setTimeout(() => setProfileMsg(null), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPwMsg(null);
    if (pwForm.new_password !== pwForm.confirm_password) { setPwMsg({type:'error', text:'New passwords do not match.'}); return; }
    if (pwForm.new_password.length < 6) { setPwMsg({type:'error', text:'Password must be at least 6 characters.'}); return; }
    setSavingPw(true);
    const res = await fetch("/api/auth/password", { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify(pwForm) });
    if (res.ok) { setPwMsg({type:'success', text:'Password changed successfully.'}); setPwForm({current_password:"",new_password:"",confirm_password:""}); }
    else { const d = await res.json(); setPwMsg({type:'error', text: d.error || 'Failed to change password.'}); }
    setSavingPw(false);
    setTimeout(() => setPwMsg(null), 4000);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your business profile and account security.</p>
        </div>

        {/* Business Profile */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Business Profile</h3>
          </div>
          <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2"><User className="w-3.5 h-3.5 text-slate-400"/>Owner Name</label>
              <input type="text" value={profile.owner_name} onChange={e=>setProfile({...profile,owner_name:e.target.value})} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2"><Building className="w-3.5 h-3.5 text-slate-400"/>Business Name</label>
              <input type="text" value={profile.business_name} onChange={e=>setProfile({...profile,business_name:e.target.value})} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400"/>Email Address</label>
              <input type="email" value={profile.email} disabled className={inp + " opacity-50 cursor-not-allowed"} />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
            </div>
            {profileMsg && (
              <div className={"flex items-center gap-2 p-3 rounded-xl text-sm font-medium " + (profileMsg.type==='success'?'bg-emerald-50 text-emerald-700 border border-emerald-100':'bg-red-50 text-red-600 border border-red-100')}>
                {profileMsg.type==='success'?<Check className="w-4 h-4 shrink-0"/>:<AlertCircle className="w-4 h-4 shrink-0"/>}
                {profileMsg.text}
              </div>
            )}
            <button type="submit" disabled={savingProfile} className="px-6 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50">
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center"><Shield className="w-4 h-4 text-slate-500"/></div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Change Password</h3>
              <p className="text-xs text-slate-400">Use a strong password to keep your account secure.</p>
            </div>
          </div>
          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-slate-400"/>Current Password</label>
              <input type="password" required value={pwForm.current_password} onChange={e=>setPwForm({...pwForm,current_password:e.target.value})} className={inp} placeholder="Enter current password" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
              <input type="password" required value={pwForm.new_password} onChange={e=>setPwForm({...pwForm,new_password:e.target.value})} className={inp} placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
              <input type="password" required value={pwForm.confirm_password} onChange={e=>setPwForm({...pwForm,confirm_password:e.target.value})} className={inp} placeholder="Repeat new password" />
            </div>
            {pwMsg && (
              <div className={"flex items-center gap-2 p-3 rounded-xl text-sm font-medium " + (pwMsg.type==='success'?'bg-emerald-50 text-emerald-700 border border-emerald-100':'bg-red-50 text-red-600 border border-red-100')}>
                {pwMsg.type==='success'?<Check className="w-4 h-4 shrink-0"/>:<AlertCircle className="w-4 h-4 shrink-0"/>}
                {pwMsg.text}
              </div>
            )}
            <button type="submit" disabled={savingPw} className="px-6 py-2.5 bg-[#0f172a] text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50">
              {savingPw ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
