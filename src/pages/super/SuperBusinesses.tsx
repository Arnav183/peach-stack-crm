import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreHorizontal, RefreshCw, Trash2, X, Eye, EyeOff, Copy, CheckCircle2, AlertCircle, Building2, Lock } from "lucide-react";
import { format, parseISO } from "date-fns";

const INDUSTRIES = ["beauty","auto","restaurant","medical","retail","fitness","agency","general"];
const SERVICE_TAGS = [
  { id:"crm",      label:"CRM Dashboard",   mrr:25 },
  { id:"website-basic",  label:"Website",          mrr:15 },
  { id:"booking",  label:"Bookings",         mrr:10 },
  { id:"ai-phone", label:"AI Phone Agent",   mrr:35 },
  { id:"reviews",  label:"Review Mgmt",      mrr:12 },
  { id:"seo",      label:"Local SEO",        mrr:15 },
  { id:"email-sms",    label:"Email/SMS Mkt",    mrr:15 },
  { id:"ai-chat",  label:"AI Chat Widget",   mrr:15 },
  { id:"priority-support",  label:"Priority Support", mrr:20 },
];

const INDUSTRY_COLORS: Record<string,string> = {
  beauty:"bg-orange-100 text-orange-700", auto:"bg-blue-100 text-blue-700",
  restaurant:"bg-emerald-100 text-emerald-700", medical:"bg-purple-100 text-purple-700",
  retail:"bg-amber-100 text-amber-700", fitness:"bg-red-100 text-red-700",
  agency:"bg-cyan-100 text-cyan-700", general:"bg-slate-100 text-slate-600",
};
const STATUS_COLORS: Record<string,string> = {
  active:"bg-emerald-50 text-emerald-700 border-emerald-100",
  inactive:"bg-zinc-100 text-zinc-500 border-zinc-200",
  suspended:"bg-red-50 text-red-600 border-red-100",
};

const fmt = (n: number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0);
const inp = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white";
function genPw() { const c="abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#"; return Array.from({length:14},()=>c[Math.floor(Math.random()*c.length)]).join(""); }

export default function SuperBusinesses() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [activeMenu, setActiveMenu] = useState<number|null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showReset, setShowReset] = useState<any>(null);
  const [createMsg, setCreateMsg] = useState<{type:'success'|'error';text:string;creds?:any}|null>(null);
  const [resetMsg, setResetMsg] = useState<{type:'success'|'error';text:string;pw?:string}|null>(null);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [copiedPw, setCopiedPw] = useState(false);
  const [copiedReset, setCopiedReset] = useState(false);
  const [showPwVault, setShowPwVault] = useState(false);
  const [pwVault, setPwVault] = useState<any[]>([]);

  const emptyForm = { name:"", industry:"beauty", owner_name:"", owner_email:"", phone:"", mrr:"" };
  const [form, setForm] = useState(emptyForm);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  const load = () => fetch("/api/super/businesses").then(r=>r.json()).then(setBusinesses).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("super_temp_password_vault");
      if (saved) setPwVault(JSON.parse(saved));
    } catch {}
  }, []);

  const saveTempCredential = (entry: any) => {
    setPwVault(prev => {
      const next = [entry, ...prev].slice(0, 50);
      localStorage.setItem("super_temp_password_vault", JSON.stringify(next));
      return next;
    });
  };

  const toggleTag = (tag: typeof SERVICE_TAGS[0]) => {
    const next = new Set(activeTags);
    if (next.has(tag.id)) next.delete(tag.id); else next.add(tag.id);
    setActiveTags(next);
    const total = SERVICE_TAGS.filter(t => next.has(t.id)).reduce((s,t) => s + t.mrr, 0);
    setForm(f => ({ ...f, mrr: total > 0 ? String(total) : "" }));
  };

  const filtered = businesses.filter(b => {
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.owner_email?.toLowerCase().includes(search.toLowerCase());
    const matchIndustry = industryFilter === "all" || b.industry === industryFilter;
    return matchSearch && matchIndustry;
  });

  const totalMrr = filtered.reduce((s,b) => s + (b.mrr||0), 0);
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setCreateMsg(null);
    const planServices = Array.from(new Set(["crm", ...Array.from(activeTags)]));
    const res = await fetch("/api/super/businesses", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ ...form, plan:"custom", mrr: parseFloat(form.mrr)||0, plan_services: planServices })
    });
    const d = await res.json();
    if (res.ok) {
      setCreateMsg({ type:'success', text:'Business created! Share these credentials with the client.', creds: { email: form.owner_email, password: d.tempPassword } });
      saveTempCredential({
        businessId: d.id,
        businessName: form.name,
        email: form.owner_email,
        tempPassword: d.tempPassword,
        source: "create",
        createdAt: new Date().toISOString(),
      });
      load();
    } else { setCreateMsg({ type:'error', text: d.error || 'Failed to create.' }); }
    setSaving(false);
  };

  const handleResetPw = async (biz: any) => {
    setShowReset(biz); setResetMsg(null);
  };

  const confirmReset = async () => {
    setSaving(true); setResetMsg(null);
    const res = await fetch("/api/super/businesses/" + showReset.id + "/reset-password", { method:"POST" });
    const d = await res.json();
    if (res.ok) {
      setResetMsg({ type:'success', text:'Password reset. Share with client.', pw: d.tempPassword });
      saveTempCredential({
        businessId: showReset.id,
        businessName: showReset.name,
        email: showReset.admin_email || showReset.owner_email || "",
        tempPassword: d.tempPassword,
        source: "reset",
        createdAt: new Date().toISOString(),
      });
    }
    else { setResetMsg({ type:'error', text: d.error || 'Failed.' }); }
    setSaving(false);
  };

  const handleDelete = async (biz: any) => {
    if (!window.confirm("Permanently delete " + biz.name + " and ALL their data? This cannot be undone.")) return;
    await fetch("/api/super/businesses/" + biz.id, { method:"DELETE" });
    load(); setActiveMenu(null);
  };

  const handleStatusToggle = async (biz: any) => {
    const newStatus = biz.status === 'active' ? 'inactive' : 'active';
    await fetch("/api/super/businesses/" + biz.id, { method:"PUT", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ ...biz, status: newStatus }) });
    load(); setActiveMenu(null);
  };

  const copy = async (text: string, set: (v:boolean)=>void) => {
    await navigator.clipboard.writeText(text); set(true); setTimeout(()=>set(false), 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Client Businesses</h1>
          <p className="text-slate-500 text-sm mt-0.5">{businesses.filter(b=>b.status==='active').length} active · {fmt(totalMrr)}/mo filtered MRR</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPwVault(true)} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50">
            <Lock className="w-4 h-4" /> Temp Passwords
          </button>
          <button onClick={()=>{setShowCreate(true);setCreateMsg(null);setForm(emptyForm);setActiveTags(new Set());}}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-400 shadow-lg shadow-orange-500/20">
            <Plus className="w-4 h-4" />Add Business
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search businesses..." value={search} onChange={e=>setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={()=>setIndustryFilter("all")}
            className={"px-3 py-2 rounded-xl text-xs font-bold transition-all " + (industryFilter==="all"?"bg-[#0f172a] text-white":"bg-white text-slate-500 border border-slate-200 hover:border-slate-400")}>
            All
          </button>
          {INDUSTRIES.map(ind => (
            <button key={ind} onClick={()=>setIndustryFilter(ind)}
              className={"px-3 py-2 rounded-xl text-xs font-bold transition-all capitalize " + (industryFilter===ind?"bg-[#0f172a] text-white":"bg-white text-slate-500 border border-slate-200 hover:border-slate-400")}>
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No businesses found</p>
            <button onClick={()=>setShowCreate(true)} className="text-xs font-bold text-orange-500 mt-2 inline-block">+ Add your first client business</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4 font-semibold">Business</th>
                <th className="px-6 py-4 font-semibold">Industry</th>
                <th className="px-6 py-4 font-semibold">Monthly Retainer</th>
                <th className="px-6 py-4 font-semibold">Metrics</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Last Login</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(biz => (
                  <tr key={biz.id} onClick={() => navigate('/super/businesses/' + biz.id)} className="hover:bg-slate-50/60 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">{biz.name}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[180px]">{biz.admin_email || biz.owner_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={"inline-flex px-2.5 py-1 rounded-lg text-xs font-bold capitalize " + (INDUSTRY_COLORS[biz.industry]||"bg-slate-100 text-slate-600")}>{biz.industry}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-base font-bold text-slate-900">{fmt(biz.mrr)}<span className="text-xs text-slate-400 font-normal">/mo</span></p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600"><span className="font-bold">{biz.client_count||0}</span> clients</p>
                      <p className="text-xs text-slate-600"><span className="font-bold">{biz.upcoming_appts||0}</span> upcoming</p>
                      <p className="text-xs text-slate-400">{fmt(biz.total_revenue||0)} revenue</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border " + (STATUS_COLORS[biz.status]||STATUS_COLORS.inactive)}>
                        <span className={"w-1.5 h-1.5 rounded-full " + (biz.status==='active'?'bg-emerald-500':'bg-zinc-400')} />
                        {biz.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {biz.last_login ? format(parseISO(biz.last_login), "MMM d, h:mm a") : <span className="text-slate-300">Never</span>}
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button onClick={(e)=>{e.stopPropagation();setActiveMenu(activeMenu===biz.id?null:biz.id);}}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {activeMenu===biz.id && (
                        <div className="absolute right-6 top-12 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20" onClick={e=>e.stopPropagation()}>
                          <button onClick={(e)=>{e.stopPropagation();handleResetPw(biz);}} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                            <RefreshCw className="w-3.5 h-3.5" />Reset Password
                          </button>
                          <button onClick={(e)=>{e.stopPropagation();handleStatusToggle(biz);}} className={"w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 " + (biz.status==='active'?"text-amber-600":"text-emerald-600")}>
                            {biz.status==='active'?"⏸ Suspend":"▶ Activate"}
                          </button>
                          <div className="h-px bg-slate-100 my-1" />
                          <button onClick={(e)=>{e.stopPropagation();handleDelete(biz);}} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />Delete Business
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Create Business Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add Client Business</h3>
              <button onClick={()=>setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            {createMsg ? (
              <div className="p-6">
                {createMsg.type === 'success' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <p className="text-sm font-semibold text-emerald-800">{createMsg.text}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Login Credentials</p>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Email</p>
                        <p className="text-sm font-mono font-semibold text-slate-800">{createMsg.creds?.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Temporary Password</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono font-bold text-slate-800 flex-1">{showPw ? createMsg.creds?.password : "•".repeat(14)}</p>
                          <button onClick={()=>setShowPw(!showPw)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500">{showPw?<EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}</button>
                          <button onClick={()=>copy(createMsg.creds?.password, setCopiedPw)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500">{copiedPw?<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/>:<Copy className="w-3.5 h-3.5"/>}</button>
                        </div>
                      </div>
                      <p className="text-xs text-orange-600 font-medium">⚠ Client must change password on first login.</p>
                    </div>
                    <button onClick={()=>{setShowCreate(false);setCreateMsg(null);setShowPw(false);}} className="w-full py-2.5 bg-[#0f172a] text-white rounded-xl text-sm font-bold hover:bg-slate-800">Done</button>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 shrink-0" />{createMsg.text}
                    </div>
                    <button onClick={()=>setCreateMsg(null)} className="mt-4 w-full py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600">Try Again</button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business Name</label>
                    <input required type="text" placeholder="e.g. Luxe Threading Studio" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className={inp} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Industry</label>
                    <select value={form.industry} onChange={e=>setForm(f=>({...f,industry:e.target.value}))} className={inp}>
                      {INDUSTRIES.map(i=><option key={i} value={i} className="capitalize">{i.charAt(0).toUpperCase()+i.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Services <span className="text-slate-400 font-normal text-xs">(click to add to MRR)</span></label>
                    <div className="flex flex-wrap gap-2">
                      {SERVICE_TAGS.map(tag => (
                        <button key={tag.id} type="button" onClick={()=>toggleTag(tag)}
                          className={"px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all " + (activeTags.has(tag.id) ? "bg-orange-500 text-white border-orange-500" : "border-slate-200 text-slate-600 hover:border-orange-300")}>
                          {tag.label} <span className="opacity-70">+{"$"}{tag.mrr}/mo</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Owner Name</label>
                    <input type="text" placeholder="Full name" value={form.owner_name} onChange={e=>setForm(f=>({...f,owner_name:e.target.value}))} className={inp} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Owner Email <span className="text-red-400">*</span></label>
                    <input required type="email" placeholder="owner@business.com" value={form.owner_email} onChange={e=>setForm(f=>({...f,owner_email:e.target.value}))} className={inp} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label>
                    <input type="tel" placeholder="404-000-0000" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className={inp} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Monthly Retainer ($)</label>
                    <input type="number" step="1" min="0" placeholder="0" value={form.mrr} onChange={e=>setForm(f=>({...f,mrr:e.target.value}))} className={inp} />
                    <p className="text-xs text-slate-400 mt-1">Auto-calculated from services above, or enter manually.</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={()=>setShowCreate(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-400 disabled:opacity-50 shadow-lg shadow-orange-500/20">{saving?"Creating...":"Create Business"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showReset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Reset Password — {showReset.name}</h3>
              <button onClick={()=>{setShowReset(null);setResetMsg(null);}} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {resetMsg ? (
                <div className="space-y-4">
                  <div className={"flex items-start gap-2 p-3 rounded-xl text-sm font-medium " + (resetMsg.type==='success'?'bg-emerald-50 text-emerald-700 border border-emerald-100':'bg-red-50 text-red-600 border border-red-100')}>
                    {resetMsg.type==='success'?<CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0"/>:<AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/>}
                    {resetMsg.text}
                  </div>
                  {resetMsg.pw && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-xs text-slate-400 mb-2">New Temporary Password</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-bold text-slate-800 flex-1">{resetMsg.pw}</p>
                        <button onClick={()=>copy(resetMsg.pw!, setCopiedReset)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500">{copiedReset?<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/>:<Copy className="w-3.5 h-3.5"/>}</button>
                      </div>
                    </div>
                  )}
                  <button onClick={()=>{setShowReset(null);setResetMsg(null);}} className="w-full py-2.5 bg-[#0f172a] text-white rounded-xl text-sm font-bold hover:bg-slate-800">Done</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">This will generate a new temporary password for <strong>{showReset.name}</strong>. The client will be required to change it on next login.</p>
                  <div className="flex gap-3">
                    <button onClick={()=>setShowReset(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                    <button onClick={confirmReset} disabled={saving} className="flex-1 py-2.5 bg-[#0f172a] text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50">{saving?"Resetting...":"Reset Password"}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showPwVault && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Temporary Password Vault</h3>
              <button onClick={()=>setShowPwVault(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {pwVault.length === 0 ? (
                <p className="text-sm text-slate-500">No temporary passwords saved yet.</p>
              ) : (
                <div className="space-y-3">
                  {pwVault.map((entry, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{entry.businessName || "Business"}</p>
                          <p className="text-xs text-slate-500">{entry.email}</p>
                          <p className="text-[11px] text-slate-400 mt-1">{entry.source === "reset" ? "Password Reset" : "Business Created"} · {new Date(entry.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2 min-w-[220px]">
                          <p className="font-mono text-sm font-bold text-slate-800 flex-1">{entry.tempPassword}</p>
                          <button onClick={()=>copy(entry.tempPassword, setCopiedReset)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500">
                            <Copy className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
