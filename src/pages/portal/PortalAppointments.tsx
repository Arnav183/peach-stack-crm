import { useState, useEffect } from "react";
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format, parseISO, isFuture } from "date-fns";

const STATUS_STYLES: Record<string,string> = {
  Completed:"bg-emerald-50 text-emerald-700 border-emerald-100",
  Confirmed:"bg-blue-50 text-blue-700 border-blue-100",
  Cancelled:"bg-red-50 text-red-500 border-red-100",
  "No Show":"bg-zinc-100 text-zinc-500 border-zinc-200",
};
const STATUS_ICONS: Record<string,any> = { Completed:CheckCircle2, Confirmed:Clock, Cancelled:XCircle, "No Show":AlertCircle };

export default function PortalAppointments() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all"|"upcoming"|"past">("all");
  useEffect(() => { fetch("/api/portal/me").then(r=>r.json()).then(setData).finally(()=>setLoading(false)); }, []);
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
  const appointments: any[] = data?.appointments || [];
  const filtered = appointments.filter(a => {
    if (filter==="upcoming") return isFuture(parseISO(a.date));
    if (filter==="past") return !isFuture(parseISO(a.date));
    return true;
  });
  return (
    <div className="p-8 min-h-screen bg-slate-50 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
        <p className="text-slate-500 text-sm mt-1">Your full appointment history.</p>
      </div>
      <div className="flex gap-2">
        {(["all","upcoming","past"] as const).map(f => (
          <button key={f} onClick={()=>setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${filter===f?"bg-[#0f172a] text-white shadow":"bg-white text-slate-500 border border-slate-200 hover:border-slate-400"}`}>{f}</button>
        ))}
        <span className="ml-auto text-xs text-slate-400 self-center">{filtered.length} appointment{filtered.length!==1?'s':''}</span>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length===0 ? (
          <div className="text-center py-16"><Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-slate-400 font-medium">No appointments found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4 font-semibold">Service</th>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Staff</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((a:any) => {
                  const Icon = STATUS_ICONS[a.status] || Clock;
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4"><p className="text-sm font-semibold text-slate-900">{a.service}</p>{a.duration&&<p className="text-xs text-slate-400">{a.duration} min</p>}</td>
                      <td className="px-6 py-4"><p className="text-sm font-medium text-slate-800">{format(parseISO(a.date),"MMM d, yyyy")}</p><p className="text-xs text-slate-400">{format(parseISO(a.date),"h:mm a")}</p></td>
                      <td className="px-6 py-4 text-sm text-slate-500">{a.staff||"—"}</td>
                      <td className="px-6 py-4"><p className="text-sm font-semibold text-slate-800">{new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(a.price||0)}</p>{a.tip>0&&<p className="text-xs text-slate-400">+{new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(a.tip)} tip</p>}</td>
                      <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${STATUS_STYLES[a.status]||"bg-zinc-100 text-zinc-500 border-zinc-200"}`}><Icon className="w-3 h-3" />{a.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
