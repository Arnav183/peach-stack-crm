import { useState, useEffect } from "react";
import { Calendar, DollarSign, Star, Clock, ArrowRight, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";

export default function PortalHome({ user }: { user: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/portal/me").then(r=>r.json()).then(setData).finally(()=>setLoading(false)); }, []);
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
  const { client, stats, nextAppt, outstandingAmount } = data;
  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-50">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {client.name.split(' ')[0]} 👋</h1>
        <p className="text-slate-500 text-sm mt-1">Here's a summary of your account.</p>
      </div>
      {user?.must_change_password === 1 && (
        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
          <p className="text-sm text-orange-800 font-medium">Please <Link to="/portal/profile" className="underline font-bold">change your temporary password</Link> to secure your account.</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4"><Star className="w-5 h-5 text-orange-400" /></div>
          <p className="text-3xl font-bold text-slate-900">{stats.total_visits}</p>
          <p className="text-sm text-slate-400 mt-1">Total Visits</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4"><DollarSign className="w-5 h-5 text-emerald-400" /></div>
          <p className="text-3xl font-bold text-slate-900">{new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(stats.total_spent)}</p>
          <p className="text-sm text-slate-400 mt-1">Total Spent</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4"><Clock className="w-5 h-5 text-blue-400" /></div>
          <p className="text-3xl font-bold text-slate-900">{stats.last_visit ? format(parseISO(stats.last_visit),"MMM d") : "—"}</p>
          <p className="text-sm text-slate-400 mt-1">Last Visit</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Next Appointment</h3>
            <Link to="/portal/appointments" className="text-xs font-bold text-orange-500 hover:text-orange-600">View all →</Link>
          </div>
          <div className="p-6">
            {nextAppt ? (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center shrink-0"><Calendar className="w-5 h-5 text-orange-400" /></div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-base">{nextAppt.service}</p>
                  {nextAppt.staff && <p className="text-sm text-slate-500 mt-0.5">with {nextAppt.staff}</p>}
                  <p className="text-sm font-semibold text-orange-500 mt-2">{format(parseISO(nextAppt.date),"EEEE, MMMM d 'at' h:mm a")}</p>
                  <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">{nextAppt.status}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">No upcoming appointments</p>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Balance Due</h3>
            <Link to="/portal/invoices" className="text-xs font-bold text-orange-500 hover:text-orange-600">View invoices →</Link>
          </div>
          <div className="p-6">
            {outstandingAmount > 0 ? (
              <div>
                <p className="text-4xl font-bold text-slate-900">{new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(outstandingAmount)}</p>
                <p className="text-sm text-red-500 font-medium mt-1">Outstanding balance</p>
                <Link to="/portal/invoices" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20">
                  View & Pay <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><DollarSign className="w-6 h-6 text-emerald-500" /></div>
                <p className="text-sm font-bold text-emerald-600">You're all caught up!</p>
                <p className="text-xs text-slate-400 mt-1">No outstanding balance</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
