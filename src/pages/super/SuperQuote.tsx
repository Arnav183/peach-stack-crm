import { useState } from "react";
import { Check, Copy, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Globe, Phone, Calendar, Star, Mail, Server, LayoutDashboard, RefreshCw } from "lucide-react";

// ─── SERVICE CATALOG ────────────────────────────────────────────────────────
// one-time = setup / build fee   monthly = hosting + support retainer
const CATEGORIES = [
  {
    id: "core",
    label: "Core Platform",
    icon: LayoutDashboard,
    color: "orange",
    services: [
      { id: "crm", name: "CRM Dashboard", desc: "Client management, appointments, revenue & expense tracking, invoices, client portal. Fully set up and branded for their business.", one_time: 0, monthly: 30, required: true },
      { id: "onboarding", name: "Onboarding & Data Setup", desc: "We import their existing client list, configure their industry settings, and train them on the platform.", one_time: 150, monthly: 0 },
    ],
  },
  {
    id: "web",
    label: "Website",
    icon: Globe,
    color: "blue",
    services: [
      { id: "web_basic", name: "Basic Website (5 pages)", desc: "Home, About, Services, Gallery, Contact. Mobile-friendly. Includes hosting & domain setup.", one_time: 350, monthly: 20 },
      { id: "web_custom", name: "Custom Website", desc: "Full custom design with animations, booking integration, photo gallery, SEO optimized. Best for restaurants, medical, fitness.", one_time: 800, monthly: 35 },
      { id: "seo", name: "Local SEO Setup", desc: "Google Business Profile optimization, keyword setup, local citations. Gets them found on Google Maps.", one_time: 150, monthly: 25 },
    ],
  },
  {
    id: "bookings",
    label: "Bookings & Scheduling",
    icon: Calendar,
    color: "emerald",
    services: [
      { id: "calendar", name: "Online Booking Calendar", desc: "Clients book appointments 24/7 from your website or a booking link. Syncs with CRM automatically.", one_time: 100, monthly: 15 },
      { id: "reminders", name: "Appointment Reminders (SMS/Email)", desc: "Automated reminders sent to clients before appointments. Reduces no-shows by ~40%.", one_time: 75, monthly: 15 },
    ],
  },
  {
    id: "ai",
    label: "AI & Automation",
    icon: Phone,
    color: "purple",
    services: [
      { id: "ai_phone", name: "AI Phone Agent", desc: "Answers calls 24/7, books appointments, answers FAQs. Sounds natural. Never misses a lead when you're busy.", one_time: 200, monthly: 50 },
      { id: "ai_chat", name: "AI Website Chat Widget", desc: "Answers questions on their website automatically. Captures leads and books appointments.", one_time: 100, monthly: 20 },
      { id: "auto_followup", name: "Auto Follow-up Sequences", desc: "Automatic texts/emails after appointments to request reviews, offer rebooking, or send promotions.", one_time: 100, monthly: 20 },
    ],
  },
  {
    id: "reputation",
    label: "Reputation & Marketing",
    icon: Star,
    color: "amber",
    services: [
      { id: "reviews", name: "Review Management", desc: "Auto-request Google reviews after every appointment. Monitor and respond to reviews from one dashboard.", one_time: 75, monthly: 20 },
      { id: "email_mkt", name: "Email & SMS Marketing", desc: "Monthly newsletters, promotions, and re-engagement campaigns to their client list.", one_time: 75, monthly: 25 },
      { id: "social", name: "Social Media Templates", desc: "Branded Canva templates for Instagram & Facebook posts. 20 templates designed to match their brand.", one_time: 150, monthly: 0 },
    ],
  },
  {
    id: "support",
    label: "Ongoing Support",
    icon: RefreshCw,
    color: "slate",
    services: [
      { id: "support_basic", name: "Basic Support", desc: "Email support, bug fixes, minor content updates. Response within 48 hours.", one_time: 0, monthly: 0, included: true },
      { id: "support_priority", name: "Priority Support", desc: "Same-day response, monthly check-in call, platform updates, proactive monitoring.", one_time: 0, monthly: 30 },
    ],
  },
];

const ALL_SERVICES = CATEGORIES.flatMap(c => c.services);
const COLOR_MAP: Record<string, string> = {
  orange: "bg-orange-50 border-orange-200 text-orange-700",
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  purple: "bg-purple-50 border-purple-200 text-purple-700",
  amber: "bg-amber-50 border-amber-200 text-amber-700",
  slate: "bg-slate-50 border-slate-200 text-slate-600",
};
const ICON_COLOR: Record<string, string> = {
  orange: "text-orange-500 bg-orange-50",
  blue: "text-blue-500 bg-blue-50",
  emerald: "text-emerald-500 bg-emerald-50",
  purple: "text-purple-500 bg-purple-50",
  amber: "text-amber-500 bg-amber-50",
  slate: "text-slate-500 bg-slate-100",
};

const fmt = (n: number) => n === 0 ? "Free" : "$" + n.toLocaleString();

export default function SuperQuote() {
  const [selected, setSelected] = useState<Set<string>>(new Set(["crm"]));
  const [clientName, setClientName] = useState("");
  const [clientBusiness, setClientBusiness] = useState("");
  const [clientIndustry, setClientIndustry] = useState("general");
  const [note, setNote] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [discount, setDiscount] = useState(0);

  const toggle = (id: string, required?: boolean, included?: boolean) => {
    if (required || included) return;
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectedServices = ALL_SERVICES.filter(s => selected.has(s.id) || s.required || s.included);
  const oneTimeTotal = selectedServices.reduce((s, sv) => s + sv.one_time, 0);
  const monthlyTotal = selectedServices.reduce((s, sv) => s + sv.monthly, 0);
  const oneTimeAfterDiscount = Math.round(oneTimeTotal * (1 - discount / 100));

  const generateQuote = () => {
    const lines = [
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "   PEACH STACK — SERVICE QUOTE",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      clientBusiness ? "Client: " + clientBusiness + (clientName ? " (" + clientName + ")" : "") : "",
      "Date: " + new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      "",
      "INCLUDED SERVICES",
      "─────────────────────────────────",
      ...selectedServices.map(s => {
        const parts = [];
        parts.push("✓ " + s.name);
        if (s.one_time > 0) parts.push("  Setup: $" + s.one_time);
        if (s.monthly > 0) parts.push("  Monthly: $" + s.monthly + "/mo");
        if (s.one_time === 0 && s.monthly === 0) parts.push("  Included");
        return parts.join("
");
      }),
      "",
      "─────────────────────────────────",
      "ONE-TIME BUILD FEE:  $" + oneTimeTotal + (discount > 0 ? "  →  $" + oneTimeAfterDiscount + " (" + discount + "% off)" : ""),
      "MONTHLY RETAINER:    $" + monthlyTotal + "/mo",
      "",
      note ? "Note: " + note : "",
      "",
      "Questions? peachstack.dev",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    ].filter(l => l !== undefined).join("
");
    return lines;
  };

  const copyQuote = async () => {
    await navigator.clipboard.writeText(generateQuote());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-500" />
              Quote Builder
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Mix and match services to build a custom quote for any client.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — service picker */}
          <div className="lg:col-span-2 space-y-4">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isCollapsed = collapsed.has(cat.id);
              const catSelected = cat.services.filter(s => selected.has(s.id) || s.required || s.included).length;
              return (
                <div key={cat.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setCollapsed(c => { const n = new Set(c); n.has(cat.id) ? n.delete(cat.id) : n.add(cat.id); return n; })}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={"w-8 h-8 rounded-lg flex items-center justify-center " + ICON_COLOR[cat.color]}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-800">{cat.label}</span>
                      {catSelected > 0 && (
                        <span className={"text-xs font-bold px-2 py-0.5 rounded-full border " + COLOR_MAP[cat.color]}>
                          {catSelected} selected
                        </span>
                      )}
                    </div>
                    {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                  </button>
                  {!isCollapsed && (
                    <div className="divide-y divide-slate-50">
                      {cat.services.map(svc => {
                        const isSelected = selected.has(svc.id) || svc.required || svc.included;
                        const locked = svc.required || svc.included;
                        return (
                          <div
                            key={svc.id}
                            onClick={() => toggle(svc.id, svc.required, svc.included)}
                            className={"flex items-start gap-4 px-5 py-4 transition-colors " + (locked ? "opacity-70" : "cursor-pointer hover:bg-slate-50") + (isSelected && !locked ? " bg-orange-50/50" : "")}>
                            <div className={"w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border-2 transition-all " + (isSelected ? "bg-orange-500 border-orange-500" : "border-slate-300")}>
                              {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-slate-800">{svc.name}</p>
                                {svc.required && <span className="text-xs bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded">Required</span>}
                                {svc.included && <span className="text-xs bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">Included free</span>}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{svc.desc}</p>
                            </div>
                            <div className="text-right shrink-0">
                              {svc.one_time > 0 && <p className="text-xs font-bold text-slate-700">{"$"}{svc.one_time} <span className="font-normal text-slate-400">setup</span></p>}
                              {svc.monthly > 0 && <p className="text-xs font-bold text-slate-700">{"$"}{svc.monthly}<span className="font-normal text-slate-400">/mo</span></p>}
                              {svc.one_time === 0 && svc.monthly === 0 && <p className="text-xs text-slate-400">Free</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right — live quote summary */}
          <div className="space-y-4">
            {/* Client info */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Client Info</h3>
              <input type="text" placeholder="Business name" value={clientBusiness} onChange={e => setClientBusiness(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <input type="text" placeholder="Contact name" value={clientName} onChange={e => setClientName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <select value={clientIndustry} onChange={e => setClientIndustry(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                {["beauty","auto","restaurant","medical","retail","fitness","agency","general"].map(i => (
                  <option key={i} value={i} className="capitalize">{i.charAt(0).toUpperCase()+i.slice(1)}</option>
                ))}
              </select>
              <textarea placeholder="Add a note for the client..." value={note} onChange={e => setNote(e.target.value)} rows={2}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
            </div>

            {/* Pricing summary */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Quote Summary</h3>
              <div className="space-y-1.5">
                {selectedServices.map(s => (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 truncate pr-2">{s.name}</span>
                    <span className="text-slate-500 shrink-0">
                      {s.one_time > 0 && <span className="font-medium">{"$"}{s.one_time}</span>}
                      {s.one_time > 0 && s.monthly > 0 && <span className="text-slate-300 mx-1">+</span>}
                      {s.monthly > 0 && <span>{"$"}{s.monthly}/mo</span>}
                      {s.one_time === 0 && s.monthly === 0 && <span className="text-slate-400">Free</span>}
                    </span>
                  </div>
                ))}
              </div>
              {selectedServices.length > 0 && <div className="h-px bg-slate-100" />}

              {/* Discount */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Startup Discount</label>
                <div className="flex gap-2 flex-wrap">
                  {[0, 10, 15, 20, 25].map(d => (
                    <button key={d} onClick={() => setDiscount(d)}
                      className={"px-3 py-1 rounded-lg text-xs font-bold border transition-all " + (discount === d ? "bg-orange-500 text-white border-orange-500" : "border-slate-200 text-slate-500 hover:border-slate-400")}>
                      {d === 0 ? "None" : d + "% off"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">One-time fee</span>
                  <div className="text-right">
                    {discount > 0 && <p className="text-xs text-slate-400 line-through">{"$"}{oneTimeTotal}</p>}
                    <p className="text-base font-bold text-slate-900">{"$"}{oneTimeAfterDiscount}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Monthly retainer</span>
                  <p className="text-base font-bold text-orange-500">{"$"}{monthlyTotal}<span className="text-xs font-normal text-slate-400">/mo</span></p>
                </div>
                <div className="h-px bg-slate-200 my-1" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  Year 1 total: <span className="font-semibold text-slate-600">{"$"}{(oneTimeAfterDiscount + monthlyTotal * 12).toLocaleString()}</span>
                </p>
              </div>

              <button onClick={copyQuote}
                className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20">
                {copied ? <><CheckCircle2 className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy Quote</>}
              </button>
              <p className="text-xs text-slate-400 text-center">Copies a formatted quote you can paste into any message.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
