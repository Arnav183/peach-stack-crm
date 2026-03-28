import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, LayoutDashboard, Globe, Calendar, Bell, MessageSquare,
  BarChart2, Shield, Star, Mail, Image, Check, AlertCircle,
  Clock, CheckCircle2, Pencil, Save
} from 'lucide-react';

// ── Service catalog (matches SuperQuote.tsx exactly) ─────────────────────────
const SERVICES = [
  { id: 'crm',              category: 'Core',       name: 'CRM Dashboard',              description: 'Client management, appointments, revenue, invoices & client portal.', oneTime: null, monthly: 25,  required: true  },
  { id: 'onboarding',       category: 'Core',       name: 'Onboarding & Data Setup',    description: 'We import your client list, set up your industry settings.',          oneTime: 49,   monthly: null                   },
  { id: 'website-basic',    category: 'Website',    name: 'Basic Website (5 pages)',     description: 'Home, About, Services, Gallery, Contact. Mobile-ready.',              oneTime: 249,  monthly: 15                     },
  { id: 'website-custom',   category: 'Website',    name: 'Custom Website',              description: 'Fully custom design, booking integration, SEO-ready.',               oneTime: 599,  monthly: 25                     },
  { id: 'seo',              category: 'Website',    name: 'Local SEO Setup',             description: 'Google Business Profile, keyword setup, local citations.',           oneTime: 79,   monthly: 15                     },
  { id: 'booking',          category: 'Bookings',   name: 'Online Booking Calendar',     description: 'Clients book 24/7 from your site. Auto-syncs with your CRM.',        oneTime: 49,   monthly: 10                     },
  { id: 'reminders',        category: 'Bookings',   name: 'Appointment Reminders',       description: 'Automated SMS + email reminders. Cuts no-shows by ~40%.',            oneTime: 29,   monthly: 10                     },
  { id: 'ai-phone',         category: 'AI',         name: 'AI Phone Agent',              description: 'Answers calls 24/7, books appointments, handles FAQs.',              oneTime: 99,   monthly: 35                     },
  { id: 'ai-chat',          category: 'AI',         name: 'AI Website Chat Widget',      description: 'Instant answers on your site, captures leads automatically.',        oneTime: 49,   monthly: 15                     },
  { id: 'ai-followup',      category: 'AI',         name: 'Auto Follow-up Sequences',    description: 'Automatic texts + emails after visits to get reviews.',              oneTime: 49,   monthly: 15                     },
  { id: 'reviews',          category: 'Marketing',  name: 'Review Management',           description: 'Auto-request Google reviews after every visit.',                     oneTime: 29,   monthly: 12                     },
  { id: 'email-sms',        category: 'Marketing',  name: 'Email & SMS Marketing',       description: 'Monthly newsletters, promotions, re-engagement blasts.',             oneTime: 29,   monthly: 15                     },
  { id: 'social',           category: 'Marketing',  name: 'Social Media Templates',      description: '20 branded Canva templates for Instagram + Facebook.',               oneTime: 79,   monthly: null                   },
  { id: 'priority-support', category: 'Support',    name: 'Priority Support',            description: 'Same-day response, monthly check-in call, proactive monitoring.',    oneTime: null, monthly: 20                     },
];

const CATEGORIES = [...new Set(SERVICES.map(s => s.category))];
const PLAN_PRESETS = [
  { name: "Starter", ids: ["crm", "onboarding", "website-basic", "booking"] },
  { name: "Growth", ids: ["crm", "onboarding", "website-basic", "booking", "reminders", "seo", "reviews"] },
  { name: "Full Stack", ids: ["crm", "onboarding", "website-custom", "booking", "reminders", "seo", "ai-phone", "ai-chat", "ai-followup", "reviews", "email-sms", "priority-support"] },
];

const INDUSTRY_LABELS = {
  beauty: 'Beauty & Wellness', restaurant: 'Restaurant', auto: 'Auto Shop',
  retail: 'Retail', fitness: 'Fitness', medical: 'Medical', legal: 'Legal',
  general: 'General Business',
};

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US');
}

function priceBadge(svc) {
  const parts = [];
  if (svc.oneTime != null) parts.push(fmt(svc.oneTime) + ' setup');
  if (svc.monthly != null) parts.push(fmt(svc.monthly) + '/mo');
  return parts.join(' + ');
}

export default function SuperBusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [biz, setBiz] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  const [editing, setEditing] = useState(false);
  const [draftServices, setDraftServices] = useState(new Set(['crm']));
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/super/businesses/' + id).then(r => r.json()),
      fetch('/api/super/businesses/' + id + '/invoices').then(r => r.json()).catch(() => null),
    ]).then(([found, invData]) => {
      if (found && !found.error) {
        setBiz(found);
        try {
          const parsed = JSON.parse(found.plan_services || '[]');
          const services = Array.isArray(parsed) && parsed.length ? parsed : ['crm'];
          setDraftServices(new Set(services));
        } catch(e) {
          setDraftServices(new Set(['crm']));
        }
      } else {
        setBiz(null);
      }
      setInvoiceData(invData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const toggleService = (svcId, required) => {
    if (required) return;
    setDraftServices(prev => {
      const next = new Set(prev);
      next.has(svcId) ? next.delete(svcId) : next.add(svcId);
      return next;
    });
  };

  const savePlan = async () => {
    setSaving(true);
    setSaveMsg('');
    const services = [...draftServices];
    try {
      const res = await fetch('/api/super/businesses/' + id + '/plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_services: services }),
      });
      const data = await res.json();
      if (data.success) {
        setBiz(prev => prev ? { ...prev, mrr: data.mrr, plan_services: JSON.stringify(services) } : prev);
        setSaveMsg('Plan saved!');
        setEditing(false);
        fetch('/api/super/businesses/' + id + '/invoices').then(r => r.json()).then(setInvoiceData).catch(() => {});
      } else {
        setSaveMsg(data.error || 'Error saving. Try again.');
      }
    } catch(e) {
      setSaveMsg('Error saving. Try again.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!biz) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen">
        <button onClick={() => navigate('/super/businesses')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-4">
          <ArrowLeft size={16} /> Back to Businesses
        </button>
        <p className="text-slate-500">Business not found.</p>
      </div>
    );
  }

  let currentServices = ['crm'];
  try { currentServices = JSON.parse(biz.plan_services || '["crm"]'); } catch(e) {}

  const activeServices = SERVICES.filter(s => currentServices.includes(s.id));
  const draftServiceList = SERVICES.filter(s => draftServices.has(s.id));
  const draftMrr = draftServiceList.reduce((sum, s) => sum + (s.monthly || 0), 0);
  const draftSetup = draftServiceList.reduce((sum, s) => sum + (s.oneTime || 0), 0);

  const STATUS_STYLES = {
    paid:     'bg-emerald-50 text-emerald-700 border border-emerald-200',
    due:      'bg-orange-50 text-orange-700 border border-orange-200',
    upcoming: 'bg-slate-50 text-slate-500 border border-slate-200',
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Back + Header */}
        <div>
          <button onClick={() => navigate('/super/businesses')} className="flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm mb-4 transition-colors">
            <ArrowLeft size={15} /> All Businesses
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{biz.name}</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {INDUSTRY_LABELS[biz.industry] || biz.industry} &middot; {biz.owner_name} &middot; {biz.owner_email}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-black text-orange-600">{fmt(biz.mrr || 0)}<span className="text-sm font-normal text-slate-400">/mo</span></div>
              <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + (biz.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                {biz.status}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 w-fit">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'plan',     label: 'Plan & Billing' },
            { key: 'invoices', label: 'Invoices' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={"px-4 py-2 rounded-xl text-sm font-semibold transition-all " + (tab === t.key ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800')}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Info</h2>
              {[
                { label: 'Owner',        value: biz.owner_name },
                { label: 'Email',        value: biz.owner_email },
                { label: 'Phone',        value: biz.phone || '—' },
                { label: 'Industry',     value: INDUSTRY_LABELS[biz.industry] || biz.industry },
                { label: 'Member Since', value: new Date(biz.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <span className="text-slate-400 font-medium">{row.label}</span>
                  <span className="text-slate-800 font-semibold">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Plan</h2>
                <button onClick={() => { setTab('plan'); setEditing(true); }} className="text-xs text-orange-500 hover:text-orange-700 font-bold flex items-center gap-1">
                  <Pencil size={11} /> Edit
                </button>
              </div>
              <div className="space-y-2">
                {activeServices.length === 0 ? (
                  <p className="text-slate-400 text-sm">No services configured</p>
                ) : (
                  activeServices.map(s => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Check size={12} className="text-orange-500 shrink-0" />
                        {s.name}
                      </div>
                      <span className="text-slate-400 text-xs">{s.monthly ? fmt(s.monthly) + '/mo' : 'one-time'}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">Monthly Total</span>
                <span className="text-lg font-black text-orange-600">{fmt(biz.mrr || 0)}/mo</span>
              </div>
            </div>
          </div>
        )}

        {/* PLAN & BILLING TAB */}
        {tab === 'plan' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Services</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Check or uncheck services to update this client's plan.</p>
                </div>
                <div className="flex items-center gap-2">
                  {saveMsg && <span className={"text-xs font-bold " + (saveMsg.includes('Error') ? 'text-red-500' : 'text-emerald-600')}>{saveMsg}</span>}
                  {editing ? (
                    <>
                      <button onClick={() => { setEditing(false); try { setDraftServices(new Set(currentServices)); } catch(e) {} setSaveMsg(''); }} className="text-xs text-slate-400 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg">
                        Cancel
                      </button>
                      <button onClick={savePlan} disabled={saving} className="flex items-center gap-1.5 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg disabled:opacity-50">
                        <Save size={12} /> {saving ? 'Saving...' : 'Save Plan'}
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:text-orange-700 border border-orange-200 px-4 py-1.5 rounded-lg">
                      <Pencil size={12} /> Edit Plan
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {editing && (
                  <div className="flex flex-wrap gap-2">
                    {PLAN_PRESETS.map(p => (
                      <button
                        key={p.name}
                        onClick={() => setDraftServices(new Set(p.ids))}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
                {CATEGORIES.map(cat => (
                  <div key={cat}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 pb-2 border-b border-slate-100">{cat}</h3>
                    <div className="space-y-1.5">
                      {SERVICES.filter(s => s.category === cat).map(svc => {
                        const on = editing ? draftServices.has(svc.id) : currentServices.includes(svc.id);
                        return (
                          <label key={svc.id} className={"flex items-center gap-3 p-2.5 rounded-xl transition-colors " + (svc.required ? 'cursor-default' : editing ? 'cursor-pointer' : 'cursor-default') + ' ' + (on ? 'bg-orange-50 border border-orange-200' : 'border border-transparent ' + (editing ? 'hover:bg-slate-50' : ''))}>
                            <input type="checkbox" checked={on} onChange={() => editing && toggleService(svc.id, svc.required)} disabled={!editing || svc.required} className="accent-orange-500" />
                            <span className="flex-1 text-sm font-medium text-slate-700">{svc.name}</span>
                            {svc.required && <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Required</span>}
                            <div className="text-right text-xs text-slate-400 shrink-0">
                              {svc.oneTime != null && <div>{fmt(svc.oneTime)} setup</div>}
                              {svc.monthly != null && <div>{fmt(svc.monthly)}/mo</div>}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {editing && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-1">Updated Plan Total</p>
                  <p className="text-xs text-slate-500">{draftServiceList.length} services selected</p>
                </div>
                <div className="text-right">
                  {draftSetup > 0 && <div className="text-sm text-slate-600 font-semibold">{fmt(draftSetup)} setup</div>}
                  <div className="text-2xl font-black text-orange-600">{fmt(draftMrr)}<span className="text-sm font-normal text-slate-400">/mo</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* INVOICES TAB */}
        {tab === 'invoices' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Invoices</h2>
                <p className="text-xs text-slate-400 mt-0.5">Monthly billing history and upcoming charges</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-orange-600">{fmt(biz.mrr || 0)}<span className="text-sm font-normal text-slate-400">/mo</span></div>
                <p className="text-xs text-slate-400">recurring charge</p>
              </div>
            </div>

            {!invoiceData || !invoiceData.invoices || invoiceData.invoices.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">No invoice data available</div>
            ) : (
              <>
                <div className="divide-y divide-slate-100">
                  {invoiceData.invoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        {inv.status === 'paid'     && <CheckCircle2 size={14} className="text-emerald-600" />}
                        {inv.status === 'due'      && <AlertCircle  size={14} className="text-orange-500" />}
                        {inv.status === 'upcoming' && <Clock        size={14} className="text-slate-400" />}
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{inv.period}</p>
                          <p className="text-xs text-slate-400">Due {new Date(inv.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-slate-800">{fmt(inv.amount)}</span>
                        <span className={"text-xs font-bold px-2.5 py-1 rounded-full capitalize " + (STATUS_STYLES[inv.status] || '')}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paid to date</span>
                  <span className="text-base font-black text-slate-900">
                    {fmt(invoiceData.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0))}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
