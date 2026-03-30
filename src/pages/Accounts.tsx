import { useState, useEffect } from "react";
import { Users, Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle, Copy, Eye, EyeOff, X } from "lucide-react";

const STATUS_COLORS: Record<string,string> = {
  Active:"bg-emerald-50 text-emerald-700 border-emerald-100",
  New:"bg-blue-50 text-blue-700 border-blue-100",
  VIP:"bg-purple-50 text-purple-700 border-purple-100",
  "At Risk":"bg-red-50 text-red-600 border-red-100",
  Inactive:"bg-zinc-100 text-zinc-500 border-zinc-200",
};

function genPw() {
  const c="abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#";
  return Array.from({length:12},()=>c[Math.floor(Math.random()*c.length)]).join("");
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<any>(null);
  const [selClient, setSelClient] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState(genPw());
  const [showPw, setShowPw] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{type:'success'|'error';text:string}|null>(null);
  const [copied, setCopied] = useState(false);
  const [resetPw, setResetPw] = useState(genPw());
  const [showResetPw, setShowResetPw] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<{type:'success'|'error';text:string}|null>(null);
  const [copiedReset, setCopiedReset] = useState(false);

  const load = () => {
    Promise.all([fetch("/api/accounts").then(r=>r.json()), fetch("/api/clients").then(r=>r.json())])
      .then(([a,c])=>{setAccounts(a);setClients(c);}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);
  useEffect(()=>{
    if (selClient) { const cl=clients.find(c=>c.id===parseInt(selClient)); if (cl?.email) setLoginEmail(cl.email); }
  },[selClient,clients]);

  const withoutPortal = clients.filter(c=>!accounts.some(a=>a.client_id===c.id));
  const copyPw = async (pw:string, set:(v:boolean)=>void) => { await navigator.clipboard.writeText(pw); set(true); setTimeout(()=>set(false),2000); };

  const handleCreate = async (e:React.FormEvent) => {
    e.preventDefault(); setCreating(true); setCreateMsg(null);
    const res = await fetch("/api/accounts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({client_id:parseInt(selClient),email:loginEmail,password:loginPw})});
    const d = await res.json();
    if (res.ok) { setCreateMsg({type:'success',text:'Portal access created! Share credentials with client.'}); load(); setTimeout(()=>{setShowModal(false);setCreateMsg(null);setSelClient("");setLoginPw(genPw());},2500); }
    else { setCreateMsg({type:'error',text:d.error||'Failed.'}); }
    setCreating(false);
  };

  const handleRevoke = async (id:number, name:string) => {
    if (!window.confirm(`Revoke portal access for ${name}?`)) return;
    await fetch(`/api/accounts/${id}`,{method:"DELETE"}); load();
  };

  const handleReset = async (e:React.FormEvent) => {
    e.preventDefault(); setResetting(true); setResetMsg(null);
    const res = await fetch(`/api/accounts/${showResetModal.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:resetPw})});
    if (res.ok) { setResetMsg({type:'success',text:'Password reset successfully.'}); setTimeout(()=>{setShowResetModal(null);setResetMsg(null);setResetPw(genPw());},2500); }
    else { const d=await res.json(); setResetMsg({type:'error',text:d.error||'Failed.'}); }
    setResetting(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  const inp = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm";

  return (
    <div className="p-8 min-h-screen bg-slate-50 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Client Portal Accounts</h1>
          <p className="text-slate-500 text-sm mt-1">Optional logins for clients to view appointments, invoices, and update profile details.</p>
        </div>
        <button onClick={()=>{setShowModal(true);setCreateMsg(null);setLoginPw(genPw());}} disabled={withoutPortal.length===0}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-40">
          <Plus className="w-4 h-4"/>Create Portal Login
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {[{v:accounts.length,l:'Active Portals'},{v:clients.length-accounts.length,l:'Without Access'},{v:accounts.filter(a=>a.must_change_password).length,l:'Temp Password'}].map(s=>(
          <div key={s.l} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"><p className="text-2xl font-bold text-slate-900">{s.v}</p><p className="text-sm text-slate-400 mt-0.5">{s.l}</p></div>
        ))}
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800">
        Portal access is optional. Clients without logins can still be managed fully by your team inside the CRM.
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-base font-bold text-slate-900">Active Portals</h3></div>
        {accounts.length===0 ? (
          <div className="text-center py-16"><Users className="w-10 h-10 text-slate-200 mx-auto mb-3"/><p className="text-slate-400 font-medium">No portal accounts yet</p></div>
        ) : (
          <div className="divide-y divide-slate-50">
            {accounts.map(a=>(
              <div key={a.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {a.client_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{a.client_name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[a.client_status]||STATUS_COLORS.Inactive}`}>{a.client_status}</span>
                    {a.must_change_password===1&&<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">Temp Password</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{a.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={()=>{setShowResetModal(a);setResetPw(genPw());setResetMsg(null);}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-100 transition-all">
                    <RefreshCw className="w-3 h-3"/>Reset Password
                  </button>
                  <button onClick={()=>handleRevoke(a.id,a.client_name)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 border border-red-100 hover:bg-red-50 transition-all">
                    <Trash2 className="w-3 h-3"/>Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {withoutPortal.length>0&&(
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-base font-bold text-slate-900">Clients Without Access</h3></div>
          <div className="divide-y divide-slate-50">
            {withoutPortal.slice(0,8).map(cl=>(
              <div key={cl.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition-colors">
                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">{cl.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800">{cl.name}</p><p className="text-xs text-slate-400">{cl.email}</p></div>
                <button onClick={()=>{setSelClient(String(cl.id));setShowModal(true);setCreateMsg(null);setLoginPw(genPw());}} className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">+ Give Access</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal&&(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Create Portal Login</h3>
              <button onClick={()=>setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Client</label>
                <select required value={selClient} onChange={e=>setSelClient(e.target.value)} className={inp}>
                  <option value="">Select a client...</option>
                  {withoutPortal.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Login Email</label><input required type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} className={inp} placeholder="client@email.com"/></div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Temporary Password</label>
                <div className="relative">
                  <input required type={showPw?"text":"password"} value={loginPw} onChange={e=>setLoginPw(e.target.value)} className={`${inp} pr-20 font-mono`}/>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button type="button" onClick={()=>setShowPw(!showPw)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">{showPw?<EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}</button>
                    <button type="button" onClick={()=>copyPw(loginPw,setCopied)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">{copied?<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/>:<Copy className="w-3.5 h-3.5"/>}</button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">Client must change this on first login.</p>
              </div>
              {createMsg&&<div className={`flex items-start gap-2 p-3 rounded-xl text-sm font-medium ${createMsg.type==='success'?'bg-emerald-50 text-emerald-700 border border-emerald-100':'bg-red-50 text-red-600 border border-red-100'}`}>{createMsg.type==='success'?<CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5"/>:<AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/>}{createMsg.text}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-400 disabled:opacity-50 shadow-lg shadow-orange-500/20">{creating?"Creating...":"Create Login"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetModal&&(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Reset Password — {showResetModal.client_name}</h3>
              <button onClick={()=>setShowResetModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleReset} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Temporary Password</label>
                <div className="relative">
                  <input required type={showResetPw?"text":"password"} value={resetPw} onChange={e=>setResetPw(e.target.value)} className={`${inp} pr-20 font-mono`}/>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button type="button" onClick={()=>setShowResetPw(!showResetPw)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">{showResetPw?<EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}</button>
                    <button type="button" onClick={()=>copyPw(resetPw,setCopiedReset)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">{copiedReset?<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/>:<Copy className="w-3.5 h-3.5"/>}</button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">Client will be prompted to change on next login.</p>
              </div>
              {resetMsg&&<div className={`flex items-start gap-2 p-3 rounded-xl text-sm font-medium ${resetMsg.type==='success'?'bg-emerald-50 text-emerald-700 border border-emerald-100':'bg-red-50 text-red-600 border border-red-100'}`}>{resetMsg.type==='success'?<CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5"/>:<AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/>}{resetMsg.text}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowResetModal(null)} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={resetting} className="flex-1 py-3 bg-[#0f172a] text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50">{resetting?"Resetting...":"Reset Password"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
