import { useState } from 'react';
import { Check, FileText, Zap, Globe, LayoutDashboard, Calendar, ShoppingCart, MessageSquare, Bell, BarChart2, Shield, Smartphone } from 'lucide-react';

// ─── Service Catalog ─────────────────────────────────────────────────────────
// Each service has a one-time build fee and an optional monthly retainer.
// The admin checks whatever services apply to the client and gets a live quote.

type Service = {
  id: string;
  category: string;
  name: string;
  description: string;
  oneTime: number;
  monthly: number | null;
  icon: React.ReactNode;
};

const SERVICES: Service[] = [
  // Websites
  { id: 'website-basic',    category: 'Website',        name: 'Basic Website (5 pages)',       description: 'Home, About, Services, Contact + 1 custom page',          oneTime: 800,   monthly: 79,  icon: <Globe size={16} /> },
  { id: 'website-full',     category: 'Website',        name: 'Full Website (10+ pages)',       description: 'Custom design, blog, galleries, advanced layout',          oneTime: 1500,  monthly: 99,  icon: <Globe size={16} /> },
  { id: 'website-ecomm',    category: 'Website',        name: 'E-Commerce Store',               description: 'Product listings, cart, checkout, order management',       oneTime: 2200,  monthly: 149, icon: <ShoppingCart size={16} /> },
  // CRM / Dashboard
  { id: 'crm-basic',        category: 'CRM & Dashboard',name: 'Client CRM',                     description: 'Client profiles, notes, status tracking, basic reports',   oneTime: 1200,  monthly: 99,  icon: <LayoutDashboard size={16} /> },
  { id: 'crm-full',         category: 'CRM & Dashboard',name: 'Full Business Dashboard',        description: 'CRM + revenue, invoices, expenses, analytics',             oneTime: 2000,  monthly: 149, icon: <BarChart2 size={16} /> },
  // Bookings
  { id: 'booking',          category: 'Booking System', name: 'Appointment Booking',            description: 'Online scheduling, reminders, calendar sync',              oneTime: 700,   monthly: 59,  icon: <Calendar size={16} /> },
  { id: 'booking-staff',    category: 'Booking System', name: 'Multi-Staff Booking',            description: 'Staff management, shift scheduling, per-staff calendars',  oneTime: 1100,  monthly: 89,  icon: <Calendar size={16} /> },
  // Add-ons
  { id: 'addon-sms',        category: 'Add-ons',        name: 'SMS / Email Notifications',      description: 'Automated reminders, follow-ups, marketing blasts',        oneTime: 300,   monthly: 39,  icon: <Bell size={16} /> },
  { id: 'addon-chat',       category: 'Add-ons',        name: 'Live Chat Widget',               description: 'Embedded chat with admin notifications',                   oneTime: 250,   monthly: 29,  icon: <MessageSquare size={16} /> },
  { id: 'addon-mobile',     category: 'Add-ons',        name: 'Mobile App (PWA)',               description: 'Installable progressive web app from existing site',       oneTime: 800,   monthly: 49,  icon: <Smartphone size={16} /> },
  { id: 'addon-security',   category: 'Add-ons',        name: 'Security & Compliance Package',  description: 'SSL, backups, uptime monitoring, monthly security report',  oneTime: 200,   monthly: 49,  icon: <Shield size={16} /> },
];

// ─── Preset Bundles ───────────────────────────────────────────────────────────
const BUNDLES = [
  {
    name: 'Starter',
    tagline: 'Perfect for brand-new small businesses',
    color: 'bg-slate-100 border-slate-200',
    accent: 'text-slate-700',
    ids: ['website-basic', 'addon-security'],
  },
  {
    name: 'Business',
    tagline: 'Most popular — website + CRM + booking',
    color: 'bg-orange-50 border-orange-200',
    accent: 'text-orange-600',
    ids: ['website-full', 'crm-basic', 'booking', 'addon-sms'],
  },
  {
    name: 'Full Stack',
    tagline: 'Everything — max automation & analytics',
    color: 'bg-peach-50 border-orange-300',
    accent: 'text-orange-700',
    ids: ['website-full', 'crm-full', 'booking-staff', 'addon-sms', 'addon-chat', 'addon-mobile', 'addon-security'],
  },
];

const categories = [...new Set(SERVICES.map(s => s.category))];

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function SuperQuote() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const applyBundle = (ids: string[]) => setSelected(new Set(ids));

  const selectedServices = SERVICES.filter(s => selected.has(s.id));
  const totalOneTime = selectedServices.reduce((sum, s) => sum + s.oneTime, 0);
  const totalMonthly = selectedServices.reduce((sum, s) => sum + (s.monthly ?? 0), 0);

  const handleCopy = () => {
    const lines = [
      clientName ? 'Quote for: ' + clientName : 'Peach Stack — Project Quote',
      '',
      'ONE-TIME BUILD FEES',
      ...selectedServices.map(s => '  ' + s.name.padEnd(40) + fmt(s.oneTime)),
      '',
      'MONTHLY RETAINER (per service)',
      ...selectedServices.filter(s => s.monthly).map(s => '  ' + s.name.padEnd(40) + fmt(s.monthly!) + '/mo'),
      '',
      'TOTAL ONE-TIME:  ' + fmt(totalOneTime),
      'TOTAL MONTHLY:   ' + fmt(totalMonthly) + '/mo',
      '',
      notes ? 'Notes: ' + notes : '',
    ].filter(l => l !== undefined);
    navigator.clipboard.writeText(lines.join('\n'));
    alert('Quote copied to clipboard!');
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quote Builder</h1>
          <p className="text-slate-500 text-sm mt-1">Select services to build a client proposal. Prices are one-time build + optional monthly retainer per service.</p>
        </div>

        {/* Client Name */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Client Name (optional)</label>
          <input
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            placeholder="e.g. Luxe Threading Studio"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {/* Preset Bundles */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Preset Bundles — click to auto-select</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BUNDLES.map(b => (
              <button
                key={b.name}
                onClick={() => applyBundle(b.ids)}
                className={"text-left p-5 rounded-2xl border-2 transition-all hover:scale-[1.02] " + b.color}
              >
                <div className={"font-bold text-base " + b.accent}>{b.name}</div>
                <div className="text-xs text-slate-500 mt-1">{b.tagline}</div>
                <div className="text-xs text-slate-400 mt-2">{b.ids.length} services included</div>
              </button>
            ))}
          </div>
        </div>

        {/* Service Checklist */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Or build manually — check each service</p>
          {categories.map(cat => (
            <div key={cat}>
              <h3 className="text-sm font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100">{cat}</h3>
              <div className="space-y-2">
                {SERVICES.filter(s => s.category === cat).map(svc => {
                  const on = selected.has(svc.id);
                  return (
                    <label
                      key={svc.id}
                      className={"flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors " + (on ? 'bg-orange-50 border border-orange-200' : 'hover:bg-slate-50 border border-transparent')}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(svc.id)}
                        className="mt-0.5 accent-orange-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-orange-500">{svc.icon}</span>
                          <span className="font-semibold text-sm text-slate-800">{svc.name}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{svc.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-slate-800">{fmt(svc.oneTime)}</div>
                        {svc.monthly && <div className="text-xs text-slate-400">+ {fmt(svc.monthly)}/mo</div>}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes / Custom Items</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Rush delivery +$200, custom integrations, domain not included..."
            rows={3}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
          />
        </div>

        {/* Quote Summary */}
        <div className="bg-white rounded-2xl border-2 border-orange-200 p-6 sticky bottom-6 shadow-xl shadow-orange-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quote Summary</p>
              {selectedServices.length === 0 ? (
                <p className="text-slate-400 text-sm">No services selected yet</p>
              ) : (
                <div className="space-y-0.5">
                  {selectedServices.map(s => (
                    <div key={s.id} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check size={13} className="text-orange-500 shrink-0" />
                      <span>{s.name}</span>
                      <span className="text-slate-400">— {fmt(s.oneTime)}{s.monthly ? ' + ' + fmt(s.monthly) + '/mo' : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-black text-slate-900">{fmt(totalOneTime)}</div>
              <div className="text-sm text-slate-500">one-time build</div>
              {totalMonthly > 0 && (
                <div className="text-lg font-bold text-orange-600 mt-1">+ {fmt(totalMonthly)}/mo retainer</div>
              )}
              <button
                onClick={handleCopy}
                disabled={selectedServices.length === 0}
                className="mt-3 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
              >
                <FileText size={15} /> Copy Quote
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
