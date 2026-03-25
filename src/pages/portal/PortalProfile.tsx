import { useState, useEffect } from "react";
import { User, Lock, CheckCircle2, AlertCircle } from "lucide-react";

export default function PortalProfile({ user, onUpdate }: { user: any; onUpdate: (u:any)=>void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState("");
  const [profileMsg, setProfileMsg] = useState<{type:'success'|'error';text:string}|null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [currentPw, setCurrentPw] = useState(""); const [newPw, setNewPw] = useState(""); const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{type:'success'|'error';text:string}|null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    fetch("/api/portal/me").then(r=>r.json()).then(d => {
      setData(d); setName(d.client?.name||""); setEmail(d.client?.email||""); setPhone(d.client?.phone||"");
    }).finally(()=>setLoading(false));
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault(); setProfileSaving(true); setProfileMsg(null);
    try {
      const res = await fetch("/api/portal/profile",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,email,phone})});
      if (res.ok) { setProfileMsg({type:'success',text:'Profile updated successfully.'}); }
      else { const d=await res.json(); setProfileMsg({type:'error',text:d.error||'Failed.'}); }
    } catch { setProfileMsg({type:'error',text:'Something went wrong.'}); }
    finally { setProfileSaving(false); }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw!==confirmPw) { setPwMsg({type:'error',text:'Passwords do not match.'}); return; }
    if (newPw.length<6) { setPwMsg({type:'error',text:'Min. 6 characters.'}); return; }
    setPwSaving(true); setPwMsg(null);
    try {
      const res = await fetch("/api/auth/password",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({current_password:currentPw,new_password:newPw})});
      if (res.ok) { setPwMsg({type:'success',text:'Password changed.'}); setCurrentPw(""); setNewPw(""); setConfirmPw(""); onUpdate({...user,must_change_password:0}); }
      else { const d=await res.json(); setPwMsg({type:'error',text:d.error||'Failed.'}); }
    } catch { setPwMsg({type:'error',text:'Something went wrong.'}); }
    finally { setPwSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  const inp = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm transition-all";

  return (
    <div className="p-8 min-h-screen bg-slate-50 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">My Profile</h1><p className="text-slate-500 text-sm mt-1">Manage your contact info and password.</p></div>
      {user?.must_change_password===1&&(
        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
          <p className="text-sm text-orange-800 font-medium">Please change your temporary password below.</p>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500/10 rounded-xl flex items-center justify-center"><User className="w-4 h-4 text-orange-400" /></div>
            <h3 className="text-base font-bold text-slate-900">Contact Information</h3>
          </div>
          <form onSubmit={handleProfileSave} className="p-6 space-y-4">
            <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label><input required value={name} onChange={e=>setName(e.target.value)} className={inp} /></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className={inp} /></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label><input value={phone} onChange={e=>setPhone(e.target.value)} className={inp} /></div>
            {profileMsg&&<div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${profileMsg.type==='success'?'bg-emerald-50 text-emerald-700 border border-emerald-100':'bg-red-50 text-red-600 border border-red-100'}`}>{profileMsg.type==='success'?<CheckCircle2 className="w-4 h-4 shrink-0"/>:<AlertCircle className="w-4 h-4 shrink-0"/>}{profileMsg.text}</div>}
            <button type="submit" disabled={profileSaving} className="w-full py-3 bg-[#0f172a] text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50">{profileSaving?"Saving...":"Save Changes"}</button>
          </form>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500/10 rounded-xl flex items-center justify-center"><Lock className="w-4 h-4 text-orange-400" /></div>
            <h3 className="text-base font-bold text-slate-900">Change Password</h3>
          </div>
          <form onSubmit={handlePasswordSave} className="p-6 space-y-4">
            <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Password</label><input required type="password" value={currentPw} onChange={e=>setCurrentPw(e.target.value)} className={inp} placeholder="••••••••" /></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label><input required type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} className={inp} placeholder="Min. 6 characters" /></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm New Password</label><input required type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} className={inp} placeholder="••••••••" /></div>
            {pwMsg&&<div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${pwMsg.type==='success'?'bg-emerald-50 text-emerald-700 border border-emerald-100':'bg-red-50 text-red-600 border border-red-100'}`}>{pwMsg.type==='success'?<CheckCircle2 className="w-4 h-4 shrink-0"/>:<AlertCircle className="w-4 h-4 shrink-0"/>}{pwMsg.text}</div>}
            <button type="submit" disabled={pwSaving} className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-400 transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20">{pwSaving?"Changing...":"Change Password"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
