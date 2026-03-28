import { useState } from 'react';
import { Check, FileText, Globe, LayoutDashboard, Calendar, Bell, MessageSquare, BarChart2, Shield, Star, Mail, Image, RotateCcw, Send, Table } from 'lucide-react';
import * as XLSX from 'xlsx';

type Service = {
  id: string;
  category: string;
  name: string;
  description: string;
  oneTime: number | null;
  monthly: number | null;
  required?: boolean;
  icon: React.ReactNode;
};

export const SERVICES: Service[] = [
  { id: 'crm',              category: 'Core',       name: 'CRM Dashboard',              description: 'Client management, appointments, revenue, invoices & client portal. Your all-in-one business hub.', oneTime: null, monthly: 25,  required: true, icon: <LayoutDashboard size={15} /> },
  { id: 'onboarding',       category: 'Core',       name: 'Onboarding & Data Setup',    description: 'We import your client list, set up your industry settings, and walk you through the platform.',    oneTime: 49,   monthly: null, icon: <Shield size={15} /> },
  { id: 'website-basic',    category: 'Website',    name: 'Basic Website (5 pages)',     description: 'Home, About, Services, Gallery, Contact. Mobile-ready. Domain + hosting included.',               oneTime: 249,  monthly: 15,  icon: <Globe size={15} /> },
  { id: 'website-custom',   category: 'Website',    name: 'Custom Website',              description: 'Fully custom design, booking integration, photo gallery, SEO-ready. Perfect for restaurants & salons.', oneTime: 599, monthly: 25, icon: <Globe size={15} /> },
  { id: 'seo',              category: 'Website',    name: 'Local SEO Setup',             description: 'Google Business Profile, keyword setup, local citations. Get found on Google Maps.',               oneTime: 79,   monthly: 15,  icon: <BarChart2 size={15} /> },
  { id: 'booking',          category: 'Bookings',   name: 'Online Booking Calendar',     description: 'Clients book 24/7 from your site or a booking link. Auto-syncs with your CRM.',                   oneTime: 49,   monthly: 10,  icon: <Calendar size={15} /> },
  { id: 'reminders',        category: 'Bookings',   name: 'Appointment Reminders',       description: 'Automated SMS + email reminders before appointments. Cuts no-shows by ~40%.',                      oneTime: 29,   monthly: 10,  icon: <Bell size={15} /> },
  { id: 'ai-phone',         category: 'AI',         name: 'AI Phone Agent',              description: 'Answers calls 24/7, books appointments, handles FAQs. Never misses a lead.',                       oneTime: 99,   monthly: 35,  icon: <MessageSquare size={15} /> },
  { id: 'ai-chat',          category: 'AI',         name: 'AI Website Chat Widget',      description: 'Instant answers on your site, captures leads and books appointments automatically.',               oneTime: 49,   monthly: 15,  icon: <MessageSquare size={15} /> },
  { id: 'ai-followup',      category: 'AI',         name: 'Auto Follow-up Sequences',    description: 'Automatic texts + emails after visits to get reviews, rebook clients, or run promos.',            oneTime: 49,   monthly: 15,  icon: <Bell size={15} /> },
  { id: 'reviews',          category: 'Marketing',  name: 'Review Management',           description: 'Auto-request Google reviews after every visit. Monitor and respond in one place.',                 oneTime: 29,   monthly: 12,  icon: <Star size={15} /> },
  { id: 'email-sms',        category: 'Marketing',  name: 'Email & SMS Marketing',       description: 'Monthly newsletters, promotions, and re-engagement blasts to your client list.',                   oneTime: 29,   monthly: 15,  icon: <Mail size={15} /> },
  { id: 'social',           category: 'Marketing',  name: 'Social Media Templates',      description: '20 branded Canva templates for Instagram + Facebook matched to your brand.',                       oneTime: 79,   monthly: null, icon: <Image size={15} /> },
  { id: 'priority-support', category: 'Support',    name: 'Priority Support',            description: 'Same-day response, monthly check-in call, proactive monitoring and updates.',                      oneTime: null, monthly: 20,  icon: <Shield size={15} /> },
];

const BUNDLES = [
  {
    name: 'Starter',
    tagline: 'CRM + basic site + booking',
    color: 'bg-slate-50 border-slate-200',
    accent: 'text-slate-700',
    ids: ['crm', 'onboarding', 'website-basic', 'booking'],
  },
  {
    name: 'Growth',
    tagline: 'Most popular — adds reminders, SEO & reviews',
    color: 'bg-orange-50 border-orange-200',
    accent: 'text-orange-600',
    ids: ['crm', 'onboarding', 'website-basic', 'booking', 'reminders', 'seo', 'reviews'],
  },
  {
    name: 'Full Stack',
    tagline: 'Everything — AI, marketing & priority support',
    color: 'bg-amber-50 border-amber-300',
    accent: 'text-amber-700',
    ids: ['crm', 'onboarding', 'website-custom', 'booking', 'reminders', 'seo', 'ai-phone', 'ai-chat', 'ai-followup', 'reviews', 'email-sms', 'social', 'priority-support'],
  },
];

const CATEGORIES = [...new Set(SERVICES.map(s => s.category))];
const DEFAULT_SELECTION = new Set(['crm']);

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US');
}

function priceLine(svc: Service) {
  const parts: string[] = [];
  if (svc.oneTime) parts.push(fmt(svc.oneTime) + ' setup');
  if (svc.monthly) parts.push(fmt(svc.monthly) + '/mo');
  return parts.join(' + ');
}

export default function SuperQuote() {
  const [selected, setSelected] = useState<Set<string>>(new Set(DEFAULT_SELECTION));
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const toggle = (id: string, required?: boolean) => {
    if (required) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const applyBundle = (ids: string[]) => setSelected(new Set(ids));

  const handleReset = () => {
    setSelected(new Set(DEFAULT_SELECTION));
    setClientName('');
    setClientEmail('');
    setNotes('');
    setSaveStatus('idle');
  };

  const selectedServices = SERVICES.filter(s => selected.has(s.id));
  const totalOneTime = selectedServices.reduce((sum, s) => sum + (s.oneTime ?? 0), 0);
  const totalMonthly = selectedServices.reduce((sum, s) => sum + (s.monthly ?? 0), 0);

  const handleCopy = () => {
    const lines = [
      clientName ? 'Quote for: ' + clientName : 'Peach Stack — Project Quote',
      '='.repeat(50),
      '',
      'SERVICES INCLUDED',
      ...selectedServices.map(s => {
        const price = priceLine(s);
        return '  - ' + s.name + (price ? ' — ' + price : '');
      }),
      '',
      '-'.repeat(50),
      'TOTAL SETUP:    ' + fmt(totalOneTime),
      'TOTAL MONTHLY:  ' + fmt(totalMonthly) + '/mo',
      '',
      notes ? 'Notes: ' + notes : '',
      '',
      'Built by Peach Stack',
    ].filter(Boolean);
    navigator.clipboard.writeText(lines.join('\n'));
    alert('Quote copied to clipboard!');
  };

  const handleExportExcel = () => {
    if (!selectedServices.length) return;
    const rows = selectedServices.map((s, idx) => ({
      "#": idx + 1,
      Category: s.category,
      Service: s.name,
      Description: s.description,
      "Setup Fee (USD)": s.oneTime ?? 0,
      "Monthly Fee (USD)": s.monthly ?? 0,
    }));
    rows.push({
      "#": "",
      Category: "",
      Service: "TOTAL",
      Description: notes || "",
      "Setup Fee (USD)": totalOneTime,
      "Monthly Fee (USD)": totalMonthly,
    } as any);
    const ws = XLSX.utils.json_to_sheet(rows, { header: ["#", "Category", "Service", "Description", "Setup Fee (USD)", "Monthly Fee (USD)"] });
    ws['!cols'] = [{ wch: 4 }, { wch: 14 }, { wch: 34 }, { wch: 56 }, { wch: 16 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Quote");
    const safeName = (clientName || "client").replace(/[^a-z0-9_-]/gi, "_").slice(0, 40);
    XLSX.writeFile(wb, `peach-stack-quote-${safeName}.xlsx`);
  };

  const handleSendToClient = async () => {
    const subject = encodeURIComponent(`Peach Stack Quote${clientName ? ` for ${clientName}` : ""}`);
    const body = encodeURIComponent([
      clientName ? `Hi ${clientName},` : "Hi,",
      "",
      "Here is your Peach Stack quote:",
      ...selectedServices.map(s => `• ${s.name} (${priceLine(s)})`),
      "",
      `Total setup: ${fmt(totalOneTime)}`,
      `Total monthly: ${fmt(totalMonthly)}/mo`,
      notes ? `Notes: ${notes}` : "",
      "",
      "Reply to this email with any questions."
    ].filter(Boolean).join("\n"));
    if (clientEmail) {
      window.location.href = `mailto:${clientEmail}?subject=${subject}&body=${body}`;
    } else {
      await navigator.clipboard.writeText(decodeURIComponent(body));
      alert("Quote text copied. Add client email first, or paste into your email app.");
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quote Builder</h1>
            <p className="text-slate-500 text-sm mt-1">Check services to build a client proposal. The CRM is always included.</p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 font-medium border border-slate-200 hover:border-red-200 bg-white px-4 py-2 rounded-xl transition-colors"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        {/* Client Name */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Client Name (optional)</label>
          <input
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            placeholder="e.g. Luxe Threading Studio"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">Client Email (for send)</label>
          <input
            value={clientEmail}
            onChange={e => setClientEmail(e.target.value)}
            placeholder="client@email.com"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {/* Preset Bundles */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Bundles</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BUNDLES.map(b => {
              const svcs = SERVICES.filter(s => b.ids.includes(s.id));
              const ot = svcs.reduce((sum, s) => sum + (s.oneTime ?? 0), 0);
              const mo = svcs.reduce((sum, s) => sum + (s.monthly ?? 0), 0);
              return (
                <button
                  key={b.name}
                  onClick={() => applyBundle(b.ids)}
                  className={"text-left p-5 rounded-2xl border-2 transition-all hover:scale-[1.01] active:scale-100 " + b.color}
                >
                  <div className={"font-bold text-base " + b.accent}>{b.name}</div>
                  <div className="text-xs text-slate-500 mt-1 mb-3">{b.tagline}</div>
                  <div className="text-sm font-bold text-slate-800">{fmt(ot)} setup</div>
                  <div className="text-xs text-slate-500">{fmt(mo)}/mo</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Service Checklist */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-7">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider -mb-2">Or build manually</p>
          {CATEGORIES.map(cat => (
            <div key={cat}>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">{cat}</h3>
              <div className="space-y-2">
                {SERVICES.filter(s => s.category === cat).map(svc => {
                  const on = selected.has(svc.id);
                  return (
                    <label
                      key={svc.id}
                      className={"flex items-start gap-3 p-3 rounded-xl transition-colors " + (svc.required ? 'bg-orange-50 border border-orange-200 cursor-default' : 'cursor-pointer ' + (on ? 'bg-orange-50 border border-orange-200' : 'hover:bg-slate-50 border border-transparent'))}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(svc.id, svc.required)}
                        disabled={svc.required}
                        className="mt-0.5 accent-orange-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-orange-400">{svc.icon}</span>
                          <span className="font-semibold text-sm text-slate-800">{svc.name}</span>
                          {svc.required && <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Required</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{svc.description}</p>
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        {svc.oneTime != null && <div className="text-sm font-bold text-slate-800">{fmt(svc.oneTime)} setup</div>}
                        {svc.monthly != null && <div className="text-xs text-slate-500">{fmt(svc.monthly)}/mo</div>}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes / Custom Items</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Rush fee, custom integrations, extra pages..."
            rows={3}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
          />
        </div>

        {/* Quote Summary sticky footer */}
        <div className="bg-white rounded-2xl border-2 border-orange-200 p-6 shadow-xl shadow-orange-100/60 sticky bottom-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {clientName ? clientName + ' — Quote' : 'Quote Summary'}
              </p>
              {selectedServices.length === 0 ? (
                <p className="text-slate-400 text-sm">No services selected</p>
              ) : (
                <div className="space-y-1">
                  {selectedServices.map(s => (
                    <div key={s.id} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check size={12} className="text-orange-500 shrink-0" />
                      <span className="truncate">{s.name}</span>
                      <span className="text-slate-400 shrink-0 text-xs">— {priceLine(s)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total</div>
              {totalOneTime > 0 && (
                <div className="text-2xl font-black text-slate-900">{fmt(totalOneTime)} <span className="text-sm font-normal text-slate-400">setup</span></div>
              )}
              {totalMonthly > 0 && (
                <div className="text-xl font-bold text-orange-600">{fmt(totalMonthly)}<span className="text-sm font-normal text-slate-400">/mo</span></div>
              )}
              <div className="flex items-center gap-2 mt-4 justify-end">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-500 font-medium border border-slate-200 hover:border-red-200 px-4 py-2.5 rounded-xl transition-colors"
                >
                  <RotateCcw size={13} /> Reset
                </button>
                <button
                  onClick={handleCopy}
                  disabled={selectedServices.length === 0}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
                >
                  <FileText size={14} /> Copy Quote
                </button>
                <button
                  onClick={handleExportExcel}
                  disabled={selectedServices.length === 0}
                  className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
                >
                  <Table size={14} /> Export Excel
                </button>
                <button
                  onClick={handleSendToClient}
                  disabled={selectedServices.length === 0}
                  className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 text-emerald-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
                >
                  <Send size={14} /> Send to Client
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
