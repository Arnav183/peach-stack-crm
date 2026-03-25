import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Mail, Phone, Edit2, Save, KeyRound, ShieldOff, RefreshCw, Eye, EyeOff, Copy, CheckCircle2, AlertCircle, X } from "lucide-react";
import { format, parseISO } from "date-fns";

const STATUS_COLORS: any = { Active:"bg-emerald-100 text-emerald-800", Inactive:"bg-zinc-100 text-zinc-600", VIP:"bg-purple-100 text-purple-800", New:"bg-blue-100 text-blue-800", "At Risk":"bg-red-100 text-red-700" };
const APPT_STATUS: any = { Completed:"bg-emerald-50 text-emerald-700", Confirmed:"bg-blue-50 text-blue-700", Cancelled:"bg-red-50 text-red-500", Pending:"bg-amber-50 text-amber-700" };
const fmt = (n: number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0);
const inp = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white";
function genPw() { const c="abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#"; return Array.from({length:12},()=>c[Math.floor(Math.random()*c.length)]).join(""); }

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<any>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [portalEmail, setPortalEmail] = useState("");
  const [portalPw, setPortalPw] = useState(genPw());
  const [showPw, setShowPw] = useState(false);
  const [portalSaving, setPortalSaving] = useState(false);
  const [portalMsg, setPortalMsg] = useState<{type:'success'|'error';text:string}|null>(null);
  const [copied, setCopied] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);
  const [resetPw, setResetPw] = useState(genPw());
  const [showResetPwVis, setShowResetPwVis] = useState(false);
  const [copiedReset, setCopiedReset] = useState(false);
  const [resetSaving, setResetSaving] = useState(false);
  const load = () => {
    fetch(`/api/clients/${id}`).then(r=>r.json()).then(d=>{setClient(d);setEditedClient(d);setNotes(d.notes||"");setPortalEmail(d.email||"");}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[id]);

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/clients/${id}`, {method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(editedClient)});
    if (res.ok) { setClient({...client,...editedClient}); setIsEditing(false); }
  };
  const handleSaveNotes = async () => {
    const updated={...client,notes};
    await fetch(`/api/clients/${id}`, {method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(updated)});
    setClient(updated); setEditedClient(updated); setIsEditingNotes(false);
  };
  const handleGiveAccess = async (e: React.FormEvent) => {
    e.preventDefault(); setPortalSaving(true); setPortalMsg(null);
    const res = await fetch("/api/accounts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({client_id:parseInt(id!),email:portalEmail,password:portalPw})});
    const d = await res.json();
    if (res.ok) { setPortalMsg({type:'success',text:'Portal access created! Share these credentials with the client.'}); load(); }
    else { setPortalMsg({type:'error',text:d.error||'Failed.'}); }
    setPortalSaving(false);
  };
  const handleRevoke = async () => {
    if (!window.confirm(`Revoke portal access for ${client.name}?`)) return;
    await fetch(`/api/accounts/${client.portal_user.id}`, {method:"DELETE"});
    load();
  };
  const handleResetPw = async (e: React.FormEvent) => {
    e.preventDefault(); setResetSaving(true);
    const res = await fetch(`/api/accounts/${client.portal_user.id}`, {method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:resetPw})});
    if (res.ok) { setPortalMsg({type:'success',text:'Password reset successfully.'}); setShowResetPw(false); setResetPw(genPw()); load(); }
    setResetSaving(false);
  };
  const copyPw = async (pw: string, set: (v:boolean)=>void) => { await navigator.clipboard.writeText(pw); set(true); setTimeout(()=>set(false),2000); };
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!client) return <div className="flex items-center justify-center h-64 text-slate-400">Client not found</div>;
  const completedAppts = client.appointments.filter((a:any)=>a.status==='Completed');
  const totalSpent = completedAppts.reduce((s:number,a:any)=>s+(a.price||0)+(a.tip||0),0);
  const avgSpend = completedAppts.length>0?totalSpent/completedAppts.length:0;

  return (
    <div className="space-y-8 p-8 min-h-screen bg-slate-50">
      <div className="flex items-center justify-between">
        <Link to="/dashboard/clients" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Clients
        </Link>
        <span className={"inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider " + (STATUS_COLORS[client.status]||'bg-zinc-100 text-zinc-600')}>
          {client.status}
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            {!isEditing ? (
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-orange-500/20">
                    {client.name.split(' ').map((n:any)=>n[0]).join('')}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Client since {format(parseISO(client.created_at),"MMMM d, yyyy")}</p>
                    <div className="flex flex-wrap items-center gap-5 mt-3">
                      <a href={"mailto:"+client.email} className="flex items-center gap-2 text-sm text-slate-600 hover:text-orange-500 transition-colors"><Mail className="w-3.5 h-3.5 text-slate-400"/>{client.email}</a>
                      <a href={"tel:"+client.phone} className="flex items-center gap-2 text-sm text-slate-600 hover:text-orange-500 transition-colors"><Phone className="w-3.5 h-3.5 text-slate-400"/>{client.phone}</a>
                    </div>
                  </div>
                </div>
                <button onClick={()=>setIsEditing(true)} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-400"><Edit2 className="w-4 h-4"/></button>
              </div>
            ) : (
              <form onSubmit={handleUpdateClient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label><input type="text" className={inp} value={editedClient.name} onChange={e=>setEditedClient({...editedClient,name:e.target.value})}/></div>
                  <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email</label><input type="email" className={inp} value={editedClient.email} onChange={e=>setEditedClient({...editedClient,email:e.target.value})}/></div>
                  <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone</label><input type="tel" className={inp} value={editedClient.phone} onChange={e=>setEditedClient({...editedClient,phone:e.target.value})}/></div>
                  <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                    <select className={inp} value={editedClient.status} onChange={e=>setEditedClient({...editedClient,status:e.target.value})}>
                      {["New","Active","VIP","At Risk","Inactive"].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={()=>setIsEditing(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-[#0f172a] text-white text-sm font-bold hover:bg-slate-800">Save Changes</button>
                </div>
              </form>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-base font-bold text-slate-900">Appointment History</h3><p className="text-xs text-slate-400 mt-0.5">{client.appointments.length} total</p></div>
            {client.appointments.length===0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">No appointments yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                    <th className="px-6 py-3 font-semibold">Date</th><th className="px-6 py-3 font-semibold">Service</th><th className="px-6 py-3 font-semibold">Staff</th><th className="px-6 py-3 font-semibold">Price</th><th className="px-6 py-3 font-semibold">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {client.appointments.map((a:any)=>(
                      <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3 text-sm font-medium text-slate-800">{format(parseISO(a.date),"MMM d, yyyy")}</td>
                        <td className="px-6 py-3 text-sm text-slate-600">{a.service}</td>
                        <td className="px-6 py-3 text-sm text-slate-500">{a.staff||"—"}</td>
                        <td className="px-6 py-3"><p className="text-sm font-semibold text-slate-800">{fmt(a.price)}</p>{a.tip>0&&<p className="text-xs text-emerald-600">+{fmt(a.tip)} tip</p>}</td>
                        <td className="px-6 py-3"><span className={"text-xs font-bold px-2.5 py-1 rounded-lg "+(APPT_STATUS[a.status]||'bg-zinc-100 text-zinc-500')}>{a.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">Client Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              {[{label:"Total Visits",value:completedAppts.length},{label:"Total Spent",value:fmt(totalSpent)},{label:"Avg per Visit",value:fmt(avgSpend)},{label:"Last Visit",value:completedAppts[0]?format(parseISO(completedAppts[0].date),"MMM d"):"N/A"}].map(s=>(
                <div key={s.label} className="p-4 bg-slate-50 rounded-xl"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</p><p className="text-lg font-bold text-slate-900 mt-1">{s.value}</p></div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Portal Access</h3>
            <p className="text-xs text-slate-400 mb-4">Client login to their personal portal</p>
            {portalMsg&&(<div className={"flex items-start gap-2 p-3 rounded-xl text-sm font-medium mb-4 "+(portalMsg.type==='success'?'bg-emerald-50 text-emerald-700 border border-emerald-100':'bg-red-50 text-red-600 border border-red-100')}>
              {portalMsg.type==='success'?<CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5"/>:<AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/>}
              <span>{portalMsg.text}</span><button onClick={()=>setPortalMsg(null)} className="ml-auto"><X className="w-3.5 h-3.5"/></button>
            </div>)}
            {client.portal_user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"/>
                  <div className="flex-1 min-w-0"><p className="text-xs font-bold text-emerald-700">Portal Active</p><p className="text-xs text-emerald-600 truncate">{client.portal_user.email}</p></div>
                  {client.portal_user.must_change_password===1&&<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 shrink-0">Temp PW</span>}
                </div>
                {!showResetPw ? (
                  <div className="flex gap-2">
                    <button onClick={()=>{setShowResetPw(true);setResetPw(genPw());}} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"><RefreshCw className="w-3 h-3"/>Reset Password</button>
                    <button onClick={handleRevoke} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-100 text-xs font-bold text-red-500 hover:bg-red-50"><ShieldOff className="w-3 h-3"/>Revoke</button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPw} className="space-y-3">
                    <div className="relative">
                      <input required type={showResetPwVis?"text":"password"} value={resetPw} onChange={e=>setResetPw(e.target.value)} className={inp+" pr-20 font-mono"}/>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <button type="button" onClick={()=>setShowResetPwVis(!showResetPwVis)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">{showResetPwVis?<EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}</button>
                        <button type="button" onClick={()=>copyPw(resetPw,setCopiedReset)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">{copiedReset?<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/>:<Copy className="w-3.5 h-3.5"/>}</button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={()=>setShowResetPw(false)} className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                      <button type="submit" disabled={resetSaving} className="flex-1 py-2 bg-[#0f172a] text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-50">{resetSaving?"Saving...":"Reset"}</button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <form onSubmit={handleGiveAccess} className="space-y-3">
                <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Login Email</label><input required type="email" value={portalEmail} onChange={e=>setPortalEmail(e.target.value)} className={inp}/></div>
                <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Temporary Password</label>
                  <div className="relative">
                    <input required type={showPw?"text":"password"} value={portalPw} onChange={e=>setPortalPw(e.target.value)} className={inp+" pr-20 font-mono"}/>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <button type="button" onClick={()=>setShowPw(!showPw)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">{showPw?<EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}</button>
                      <button type="button" onClick={()=>copyPw(portalPw,setCopied)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">{copied?<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/>:<Copy className="w-3.5 h-3.5"/>}</button>
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={portalSaving} className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-400 disabled:opacity-50 shadow-lg shadow-orange-500/20"><KeyRound className="w-3.5 h-3.5"/>{portalSaving?"Creating...":"Give Portal Access"}</button>
              </form>
            )}
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Notes</h3>
              <button onClick={()=>isEditingNotes?handleSaveNotes():setIsEditingNotes(true)} className="text-slate-400 hover:text-slate-700 transition-colors p-1">
                {isEditingNotes?<Save className="w-4 h-4"/>:<Edit2 className="w-4 h-4"/>}
              </button>
            </div>
            {isEditingNotes ? (
              <textarea autoFocus value={notes} onChange={e=>setNotes(e.target.value)} onBlur={handleSaveNotes} className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[120px] text-sm resize-none"/>
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{client.notes||<span className="text-slate-300 italic">No notes yet.</span>}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
