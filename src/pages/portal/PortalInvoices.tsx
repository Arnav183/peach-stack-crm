import { useState, useEffect } from "react";
import { FileText, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
const fmt = (n:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);

export default function PortalInvoices() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/portal/me").then(r=>r.json()).then(setData).finally(()=>setLoading(false)); }, []);
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
  const invoices: any[] = data?.invoices || [];
  const totalOwed = invoices.filter(i=>i.status==='Unpaid').reduce((s:number,i:any)=>s+i.amount,0);
  const totalPaid = invoices.filter(i=>i.status==='Paid').reduce((s:number,i:any)=>s+i.amount,0);
  const getStatus = (inv:any) => {
    if (inv.status==='Paid') return {cls:'bg-emerald-50 text-emerald-700 border-emerald-100',icon:CheckCircle2,label:'Paid'};
    if (inv.due_date&&isPast(parseISO(inv.due_date))) return {cls:'bg-red-50 text-red-600 border-red-100',icon:AlertTriangle,label:'Overdue'};
    return {cls:'bg-orange-50 text-orange-600 border-orange-100',icon:Clock,label:'Unpaid'};
  };
  return (
    <div className="p-8 min-h-screen bg-slate-50 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">My Invoices</h1><p className="text-slate-500 text-sm mt-1">Your billing history and outstanding balances.</p></div>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center mb-4"><Clock className="w-5 h-5 text-red-400" /></div>
          <p className="text-3xl font-bold text-slate-900">{fmt(totalOwed)}</p><p className="text-sm text-slate-400 mt-1">Amount Due</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4"><CheckCircle2 className="w-5 h-5 text-emerald-400" /></div>
          <p className="text-3xl font-bold text-slate-900">{fmt(totalPaid)}</p><p className="text-sm text-slate-400 mt-1">Total Paid</p>
        </div>
      </div>
      <div className="space-y-3">
        {invoices.length===0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center"><FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-slate-400 font-medium">No invoices yet</p></div>
        ) : invoices.map((inv:any) => {
          const {cls,icon:Icon,label} = getStatus(inv);
          const items = (() => { try { return JSON.parse(inv.items||'[]'); } catch { return []; } })();
          return (
            <div key={inv.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0"><FileText className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Invoice #{inv.id}</p>
                    <p className="text-xs text-slate-400">Issued {format(parseISO(inv.created_at),"MMM d, yyyy")}{inv.due_date&&` · Due ${format(parseISO(inv.due_date),"MMM d, yyyy")}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${cls}`}><Icon className="w-3 h-3" />{label}</span>
                  <p className="text-base font-bold text-slate-900">{fmt(inv.amount)}</p>
                </div>
              </div>
              {items.length>0&&(
                <div className="px-6 pb-4 border-t border-slate-50 pt-3 space-y-1">
                  {items.map((item:any,i:number)=>(
                    <div key={i} className="flex justify-between text-xs text-slate-500"><span>{item.description||item.name}</span><span className="font-medium">{fmt(item.amount||item.price||0)}</span></div>
                  ))}
                </div>
              )}
              {inv.status!=='Paid'&&(
                <div className="px-6 py-4 bg-orange-50 border-t border-orange-100 flex items-center justify-between">
                  <p className="text-xs text-orange-700 font-medium">{inv.due_date&&isPast(parseISO(inv.due_date))?'This invoice is overdue.':'Payment is due — please contact us to arrange payment.'}</p>
                  <a href="mailto:?subject=Invoice%20Payment" className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20 shrink-0 ml-4">Pay Now</a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
