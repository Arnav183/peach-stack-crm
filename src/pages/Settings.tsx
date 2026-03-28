import { useState, useEffect } from "react";
import { Building2, User, Phone, MapPin, Lock, Check, AlertCircle, Link as LinkIcon, Copy } from "lucide-react";

interface SettingsProps { user: any; }

const inp = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white";

const INDUSTRY_LABELS: Record<string,string> = {
  beauty:"Hair / Beauty", auto:"Auto Shop", restaurant:"Restaurant / Cafe",
  medical:"Dental / Medical", retail:"Retail", fitness:"Fitness / Gym",
  agency:"Freelancer / Agency", general:"General Service",
};

export default function Settings({ user }: SettingsProps) {
  const [biz, setBiz] = useState<any>(null);
  const [profile, setProfile] = useState({ name:"", owner_name:"", phone:"", address:"" });
  const [profileMsg, setProfileMsg] = useState<{type:'success'|'error';text:string}|null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwForm, setPwForm] = useState({ current_password:"", new_password:"", confirm_password:"" });
  const [pwMsg, setPwMsg] = useState<{type:'success'|'error';text:string}|null>(null);
  const [savingPw, setSavingPw] = useState(false);
  const [importConfig, setImportConfig] = useState<{ bookingWebhookUrl: string; websiteImportUrl: string; bookingWebhookKey: string } | null>(null);
  const [copyMsg, setCopyMsg] = useState<string>("");
  const [planServices, setPlanServices] = useState<string[]>([]);
  const [entitlements, setEntitlements] = useState<any[]>([]);
  const [testingService, setTestingService] = useState<string>("");
  const [serviceTestResult, setServiceTestResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const hasBooking = planServices.includes("booking");

  useEffect(() => {
    Promise.all([
      fetch("/api/business/profile").then(async (r) => {
        let data: any = null;
        try { data = await r.json(); } catch { data = null; }
        return { ok: r.ok, data };
      }),
      fetch("/api/business/import-config").then(async (r) => {
        let data: any = null;
        try { data = await r.json(); } catch { data = null; }
        return { ok: r.ok, data };
      }).catch(() => ({ ok: false, data: null })),
      fetch("/api/business/entitlements").then(async (r) => {
        let data: any = null;
        try { data = await r.json(); } catch { data = null; }
        return { ok: r.ok, data };
      }).catch(() => ({ ok: false, data: null })),
    ]).then(([profileRes, configRes, entitlementRes]) => {
      const d = profileRes.data || {};
      setBiz(d);
      setProfile({ name: d.name||"", owner_name: d.owner_name||"", phone: d.phone||"", address: d.address||"" });
      try {
        const parsed = JSON.parse(d.plan_services || "[]");
        setPlanServices(Array.isArray(parsed) ? parsed : []);
      } catch {
        setPlanServices([]);
      }
      if (configRes.ok && configRes.data && !configRes.data.error) setImportConfig(configRes.data);
      if (entitlementRes.ok && Array.isArray(entitlementRes.data?.entitlements)) setEntitlements(entitlementRes.data.entitlements);
    });
  }, []);

  const runServiceTest = async (serviceId: string) => {
    setServiceTestResult(null);
    setTestingService(serviceId);
    try {
      const res = await fetch(`/api/business/service-tests/${serviceId}`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Service test failed");
      setServiceTestResult({ type: "success", text: d.message || `${serviceId} test completed.` });
    } catch (error: any) {
      setServiceTestResult({ type: "error", text: error?.message || "Service test failed" });
    } finally {
      setTestingService("");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingProfile(true); setProfileMsg(null);
    const res = await fetch("/api/business/profile", { method:"PUT", headers:{"Content-Type":"application/json"}, body: JSON.stringify(profile) });
    if (res.ok) { setProfileMsg({type:'success',text:'Profile saved successfully.'}); }
    else { setProfileMsg({type:'error',text:'Failed to save.'}); }
    setSavingProfile(false);
    setTimeout(()=>setProfileMsg(null), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPwMsg(null);
    if (pwForm.new_password !== pwForm.confirm_password) { setPwMsg({type:'error',text:'Passwords do not match.'}); return; }
    if (pwForm.new_password.length < 8) { setPwMsg({type:'error',text:'Password must be at least 8 characters.'}); return; }
    setSavingPw(true);
    const res = await fetch("/api/auth/password", { method:"PUT", headers:{"Content-Type":"application/json"}, body: JSON.stringify(pwForm) });
    if (res.ok) { setPwMsg({type:'success',text:'Password changed successfully.'}); setPwForm({current_password:"",new_password:"",confirm_password:""}); }
    else { const d=await res.json(); setPwMsg({type:'error',text:d.error||'Failed.'}); }
    setSavingPw(false);
    setTimeout(()=>setPwMsg(null), 4000);
  };

  if (!biz) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMsg("Copied");
      setTimeout(() => setCopyMsg(""), 1500);
    } catch {
      setCopyMsg("Copy failed");
      setTimeout(() => setCopyMsg(""), 1500);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your business profile and account security.</p>
        </div>

        {/* Read-only info banner */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-slate-900">{biz.name}</p>
            <p className="text-sm text-slate-500 capitalize">{INDUSTRY_LABELS[biz.industry] || biz.industry} · <span className="capitalize font-medium">{biz.plan}</span> plan</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-400">Need to change plan?</p>
            <p className="text-xs font-semibold text-orange-500">Contact Peach Stack</p>
          </div>
        </div>

        {/* Business Profile */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Business Profile</h3>
            <p className="text-xs text-slate-400 mt-0.5">Visible to your staff and in generated documents.</p>
          </div>
          <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-slate-400"/>Business Name</label>
              <input type="text" value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2"><User className="w-3.5 h-3.5 text-slate-400"/>Owner / Contact Name</label>
              <input type="text" value={profile.owner_name} onChange={e=>setProfile(p=>({...p,owner_name:e.target.value}))} className={inp} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400"/>Phone</label>
                <input type="tel" value={profile.phone} onChange={e=>setProfile(p=>({...p,phone:e.target.value}))} className={inp} placeholder="404-000-0000" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400"/>Address</label>
                <input type="text" value={profile.address} onChange={e=>setProfile(p=>({...p,address:e.target.value}))} className={inp} placeholder="123 Main St, Atlanta" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Login Email</label>
              <input type="email" value={user?.email||""} disabled className={inp + " opacity-50 cursor-not-allowed"} />
              <p className="text-xs text-slate-400 mt-1">To change your email, contact Peach Stack support.</p>
            </div>
            {profileMsg && (
              <div className={"flex items-center gap-2 p-3 rounded-xl text-sm font-medium " + (profileMsg.type==='success'?'bg-emerald-50 text-emerald-700 border border-emerald-100':'bg-red-50 text-red-600 border border-red-100')}>
                {profileMsg.type==='success'?<Check className="w-4 h-4 shrink-0"/>:<AlertCircle className="w-4 h-4 shrink-0"/>}{profileMsg.text}
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
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center"><Lock className="w-4 h-4 text-slate-500"/></div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Change Password</h3>
              <p className="text-xs text-slate-400">Minimum 8 characters.</p>
            </div>
          </div>
          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Password</label>
              <input type="password" required value={pwForm.current_password} onChange={e=>setPwForm(p=>({...p,current_password:e.target.value}))} className={inp} placeholder="Enter current password" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                <input type="password" required value={pwForm.new_password} onChange={e=>setPwForm(p=>({...p,new_password:e.target.value}))} className={inp} placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm New</label>
                <input type="password" required value={pwForm.confirm_password} onChange={e=>setPwForm(p=>({...p,confirm_password:e.target.value}))} className={inp} placeholder="Repeat password" />
              </div>
            </div>
            {pwMsg && (
              <div className={"flex items-center gap-2 p-3 rounded-xl text-sm font-medium " + (pwMsg.type==='success'?'bg-emerald-50 text-emerald-700 border border-emerald-100':'bg-red-50 text-red-600 border border-red-100')}>
                {pwMsg.type==='success'?<Check className="w-4 h-4 shrink-0"/>:<AlertCircle className="w-4 h-4 shrink-0"/>}{pwMsg.text}
              </div>
            )}
            <button type="submit" disabled={savingPw} className="px-6 py-2.5 bg-[#0f172a] text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50">
              {savingPw ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Integrations */}
        {hasBooking ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center"><LinkIcon className="w-4 h-4 text-slate-500"/></div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Import Integrations</h3>
                <p className="text-xs text-slate-400">Use these endpoints for website forms and booking calendars.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 font-bold mb-1">Booking Calendar Import URL</p>
                <p aria-label="Booking calendar import webhook URL" className="text-sm font-mono break-all text-slate-700">{importConfig?.bookingWebhookUrl || "Loading..."}</p>
                {importConfig?.bookingWebhookUrl && (
                  <button onClick={() => copyText(importConfig.bookingWebhookUrl)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-500">
                    <Copy className="w-3.5 h-3.5" /> Copy URL
                  </button>
                )}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 font-bold mb-1">Website Import URL</p>
                <p aria-label="Website import webhook URL" className="text-sm font-mono break-all text-slate-700">{importConfig?.websiteImportUrl || "Loading..."}</p>
                {importConfig?.websiteImportUrl && (
                  <button onClick={() => copyText(importConfig.websiteImportUrl)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-500">
                    <Copy className="w-3.5 h-3.5" /> Copy URL
                  </button>
                )}
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-sm text-orange-800">
                <strong>Payload tip:</strong> send fields like <code className="bg-orange-100 px-1 rounded">client_name</code>, <code className="bg-orange-100 px-1 rounded">client_email</code>, <code className="bg-orange-100 px-1 rounded">service</code>, <code className="bg-orange-100 px-1 rounded">date</code>. New clients/services are created automatically if needed.
              </div>
              {copyMsg && <p className="text-xs font-semibold text-emerald-600">{copyMsg}</p>}
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <strong>Booking integration is locked.</strong> Add <strong>Online Booking Calendar</strong> in Quote Builder to unlock webhook import URLs.
          </div>
        )}

        {/* Quote Builder Service Control */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Quote Builder Services</h3>
            <p className="text-xs text-slate-400 mt-0.5">Every service is controlled by paid plan unlocks. Test actions run in low/no-cost simulation mode.</p>
          </div>
          <div className="p-6 space-y-3">
            {entitlements.length === 0 ? (
              <p className="text-sm text-slate-500">Loading service entitlements...</p>
            ) : (
              entitlements.map((svc) => (
                <div key={svc.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{svc.name}</p>
                      <p className="text-xs text-slate-500">{svc.category} · {svc.unlocked ? "Unlocked" : "Locked"}</p>
                      <p className="text-xs text-slate-400 mt-1">{svc.free_option}</p>
                    </div>
                    {svc.unlocked ? (
                      <button
                        onClick={() => runServiceTest(svc.id)}
                        disabled={testingService === svc.id}
                        className="px-3 py-2 text-xs font-bold rounded-lg border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        {testingService === svc.id ? "Testing..." : "Run Test"}
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-200 text-slate-600">Locked</span>
                    )}
                  </div>
                </div>
              ))
            )}
            {serviceTestResult && (
              <div className={"rounded-xl p-3 text-sm " + (serviceTestResult.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100")}>
                {serviceTestResult.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
