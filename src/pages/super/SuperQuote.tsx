import { useState } from "react";
import { Check, Copy, CheckCircle2, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

const SERVICES = [
  { id:"crm", cat:"Core", name:"CRM Dashboard", desc:"Client mgmt, appointments, revenue, invoices & portal.", one_time:0, monthly:30, required:true },
  { id:"onboard", cat:"Core", name:"Onboarding & Setup", desc:"Import client list, configure settings, training.", one_time:150, monthly:0 },
  { id:"web_basic", cat:"Website", name:"Basic Website (5 pages)", desc:"Home, About, Services, Gallery, Contact. Mobile-friendly.", one_time:350, monthly:20 },
  { id:"web_custom", cat:"Website", name:"Custom Website", desc:"Full custom design, animations, booking integration, SEO.", one_time:800, monthly:35 },
  { id:"seo", cat:"Website", name:"Local SEO Setup", desc:"Google Business Profile, keywords, local citations.", one_time:150, monthly:25 },
  { id:"calendar", cat:"Bookings", name:"Online Booking Calendar", desc:"Clients book 24/7 from your site. Syncs with CRM.", one_time:100, monthly:15 },
  { id:"reminders", cat:"Bookings", name:"Appointment Reminders", desc:"Automated SMS/email reminders. Reduces no-shows ~40%.", one_time:75, monthly:15 },
  { id:"ai_phone", cat:"AI", name:"AI Phone Agent", desc:"Answers calls 24/7, books appointments, answers FAQs.", one_time:200, monthly:50 },
  { id:"ai_chat", cat:"AI", name:"AI Chat Widget", desc:"Answers questions, captures leads, books appointments.", one_time:100, monthly:20 },
  { id:"followup", cat:"AI", name:"Auto Follow-up Sequences", desc:"Auto texts/emails after appointments for reviews/rebooking.", one_time:100, monthly:20 },
  { id:"reviews", cat:"Marketing", name:"Review Management", desc:"Auto-request Google reviews after every appointment.", one_time:75, monthly:20 },
  { id:"email_mkt", cat:"Marketing", name:"Email & SMS Marketing", desc:"Monthly newsletters, promos, re-engagement campaigns.", one_time:75, monthly:25 },
  { id:"social", cat:"Marketing", name:"Social Media Templates", desc:"20 branded Canva templates for Instagram & Facebook.", one_time:150, monthly:0 },
  { id:"support", cat:"Support", name:"Priority Support", desc:"Same-day response, monthly check-in call, monitoring.", one_time:0, monthly:30 },
];

const CATS = ["Core", "Website", "Bookings", "AI", "Marketing", "Support"];

const BADGE: Record<string, string> = {
  Core: "bg-orange-50 text-orange-700 border-orange-200",
  Website: "bg-blue-50 text-blue-700 border-blue-200",
  Bookings: "bg-emerald-50 text-emerald-700 border-emerald-200",
  AI: "bg-purple-50 text-purple-700 border-purple-200",
  Marketing: "bg-amber-50 text-amber-700 border-amber-200",
  Support: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function SuperQuote() {
  const [sel, setSel] = useState<Set<string>>(new Set(["crm"]));
  const [clientBiz, setClientBiz] = useState("");
  const [clientName, setClientName] = useState("");
  const [note, setNote] = useState("");
  const [discount, setDiscount] = useState(0);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const toggle = (id: string, required?: boolean) => {
    if (required) return;
    setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const chosen = SERVICES.filter(s => sel.has(s.id) || s.required);
  const oneTime = chosen.reduce((a, s) => a + s.one_time, 0);
  const monthly = chosen.reduce((a, s) => a + s.monthly, 0);
  const oneTimeDisc = Math.round(oneTime * (1 - discount / 100));
  const year1 = oneTimeDisc + monthly * 12;

  const copyQuote = async () => {
    const rows: string[] = ["PEACH STACK — SERVICE QUOTE", "================================"];
    if (clientBiz) rows.push("Client: " + clientBiz + (clientName ? " (" + clientName + ")" : ""));
    rows.push("Date: " + new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
    rows.push("", "SERVICES:", "--------------------------------");
    chosen.forEach(s => {
      rows.push("  " + s.name);
      if (s.one_time > 0) rows.push("    Setup: $" + String(s.one_time));
      if (s.monthly > 0) rows.push("    Monthly: $" + String(s.monthly) + "/mo");
      if (s.one_time === 0 && s.monthly === 0) rows.push("    Included free");
    });
    rows.push("", "--------------------------------");
    if (discount > 0) {
      rows.push("One-time: $" + String(oneTime) + "  ->  $" + String(oneTimeDisc) + " (" + String(discount) + "% off)");
    } else {
      rows.push("One-time: $" + String(oneTime));
    }
    rows.push("Monthly: $" + String(monthly) + "/mo");
    rows.push("Year 1 total: $" + year1.toLocaleString());
    if (note) { rows.push("", "Note: " + note); }
    rows.push("", "Questions? peachstack.dev", "================================");
    await navigator.clipboard.writeText(rows.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-orange-500" />
            Quote Builder
          </h1>
          <p className="text-slate-500 text-sm mt-1">Mix and match services to build a custom quote.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {CATS.map(cat => {
              const catSvcs = SERVICES.filter(s => s.cat === cat);
              const isOpen = !collapsed.has(cat);
              const selCount = catSvcs.filter(s => sel.has(s.id) || s.required).length;
              return (
                <div key={cat} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setCollapsed(c => { const n = new Set(c); n.has(cat) ? n.delete(cat) : n.add(cat); return n; })}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800 text-sm">{cat}</span>
                      {selCount > 0 && (
                        <span className={"text-xs font-bold px-2 py-0.5 rounded-full border " + BADGE[cat]}>
                          {selCount} selected
                        </span>
                      )}
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-slate-50">
                      {catSvcs.map(svc => {
                        const isSelected = sel.has(svc.id) || svc.required;
                        return (
                          <div
                            key={svc.id}
                            onClick={() => toggle(svc.id, svc.required)}
                            className={"flex items-start gap-4 px-5 py-3.5 transition-colors " + (svc.required ? "opacity-70" : "cursor-pointer hover:bg-slate-50") + (isSelected && !svc.required ? " bg-orange-50/40" : "")}
                          >
                            <div className={"w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 " + (isSelected ? "bg-orange-500 border-orange-500" : "border-slate-300")}>
                              {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-slate-800">{svc.name}</p>
                                {svc.required && <span className="text-xs bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded">Required</span>}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{svc.desc}</p>
                            </div>
                            <div className="text-right shrink-0 text-xs">
                              {svc.one_time > 0 && <p className="font-bold text-slate-700">{"$"}{svc.one_time} <span className="font-normal text-slate-400">setup</span></p>}
                              {svc.monthly > 0 && <p className="font-bold text-slate-700">{"$"}{svc.monthly}<span className="font-normal text-slate-400">/mo</span></p>}
                              {svc.one_time === 0 && svc.monthly === 0 && <p className="text-slate-400">Free</p>}
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
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Info</h3>
              <input type="text" placeholder="Business name" value={clientBiz} onChange={e => setClientBiz(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <input type="text" placeholder="Contact name" value={clientName} onChange={e => setClientName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <textarea placeholder="Note for client..." value={note} onChange={e => setNote(e.target.value)} rows={2}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Summary</h3>
              <div className="space-y-1.5">
                {chosen.map(s => (
                  <div key={s.id} className="flex justify-between text-xs">
                    <span className="text-slate-600 truncate pr-2">{s.name}</span>
                    <span className="text-slate-500 shrink-0">
                      {s.one_time > 0 && <span className="font-medium">{"$"}{s.one_time}</span>}
                      {s.one_time > 0 && s.monthly > 0 && <span className="text-slate-300 mx-0.5">+</span>}
                      {s.monthly > 0 && <span>{"$"}{s.monthly}/mo</span>}
                      {s.one_time === 0 && s.monthly === 0 && <span className="text-slate-400">Free</span>}
                    </span>
                  </div>
                ))}
              </div>
              {chosen.length > 0 && <div className="h-px bg-slate-100" />}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Startup Discount</p>
                <div className="flex gap-1.5 flex-wrap">
                  {[0, 10, 15, 20, 25].map(d => (
                    <button key={d} onClick={() => setDiscount(d)}
                      className={"px-2.5 py-1 rounded-lg text-xs font-bold border transition-all " + (discount === d ? "bg-orange-500 text-white border-orange-500" : "border-slate-200 text-slate-500 hover:border-slate-400")}>
                      {d === 0 ? "None" : String(d) + "% off"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">One-time fee</span>
                  <div className="text-right">
                    {discount > 0 && <p className="text-xs text-slate-400 line-through">{"$"}{oneTime}</p>}
                    <p className="text-base font-bold text-slate-900">{"$"}{oneTimeDisc}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Monthly retainer</span>
                  <p className="text-base font-bold text-orange-500">{"$"}{monthly}<span className="text-xs font-normal text-slate-400">/mo</span></p>
                </div>
                <div className="h-px bg-slate-200" />
                <p className="text-xs text-slate-400">Year 1: <span className="font-semibold text-slate-600">{"$"}{year1.toLocaleString()}</span></p>
              </div>
              <button onClick={copyQuote}
                className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20">
                {copied ? <><CheckCircle2 className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy Quote</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
