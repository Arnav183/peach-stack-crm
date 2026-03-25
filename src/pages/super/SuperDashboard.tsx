import { useState, useEffect } from "react";
import { Building2, DollarSign, TrendingUp, Users, ArrowUpRight, Clock, CheckCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { PieChart, Pie, Cell } from "recharts";

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

const INDUSTRY_COLORS: Record<string,string> = {
  beauty:"#f97316", auto:"#3b82f6", restaurant:"#10b981", medical:"#8b5cf6",
  retail:"#f59e0b", fitness:"#ef4444", agency:"#06b6d4", general:"#64748b",
};

const PLAN_BADGE: Record<string,string> = {
  starter:"bg-slate-100 text-slate-600",
  pro:"bg-blue-50 text-blue-700",
  growth:"bg-emerald-50 text-emerald-700",
  enterprise:"bg-purple-50 text-purple-700",
};

const STATUS_DOT: Record<string,string> = {
  active:"bg-emerald-500", inactive:"bg-zinc-400", suspended:"bg-red-500",
};

export default function SuperDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/super/stats").then(r => r.json()),
      fetch("/api/super/businesses").then(r => r.json()),
    ]).then(([s, b]) => { setStats(s); setBusinesses(b); }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const mrrTrend = (stats?.mrrByMonth || []).map((m: any) => ({ name: m.month?.slice(5), mrr: m.mrr || 0, clients: m.new_clients })).reverse();
  const industryData = (stats?.byIndustry || []).map((i: any) => ({ name: i.industry, value: i.count, color: INDUSTRY_COLORS[i.industry] || "#64748b" }));
  const activeBiz = businesses.filter(b => b.status === 'active');

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-slate-500 text-sm mt-0.5">{format(new Date(), "EEEE, MMMM d")} — Peach Stack platform metrics</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Active Clients", value: stats?.totalBiz || 0, icon: Building2, color: "text-orange-500", bg: "bg-orange-50", trend: "+" + (stats?.newThisMonth || 0) + " this month" },
          { label: "Monthly MRR", value: fmt(stats?.totalMrr || 0), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50", trend: "Recurring revenue" },
          { label: "New This Month", value: stats?.newThisMonth || 0, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50", trend: "New businesses" },
          { label: "Annual Run Rate", value: fmt((stats?.totalMrr || 0) * 12), icon: ArrowUpRight, color: "text-purple-600", bg: "bg-purple-50", trend: "Projected ARR" },
        ].map(card => (
          <div key={card.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className={"w-10 h-10 " + card.bg + " rounded-xl flex items-center justify-center mb-4"}>
              <card.icon className={"w-5 h-5 " + card.color} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-sm font-medium text-slate-500 mt-0.5">{card.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.trend}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">MRR Growth</h3>
          <p className="text-xs text-slate-400 mb-5">Monthly recurring revenue trend</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrTrend}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => "$" + v} width={45} />
                <Tooltip formatter={(v: number) => [fmt(v), 'MRR']} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#f97316' }} />
                <Area type="monotone" dataKey="mrr" stroke="#f97316" strokeWidth={2.5} fill="url(#mrrGrad)" dot={false} activeDot={{ r: 5, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">By Industry</h3>
          <p className="text-xs text-slate-400 mb-4">Client distribution</p>
          {industryData.length > 0 ? (
            <>
              <div className="h-[140px] flex items-center justify-center">
                <PieChart width={140} height={140}>
                  <Pie data={industryData} cx={70} cy={70} innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={3}>
                    {industryData.map((d: any, i: number) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </div>
              <div className="space-y-2 mt-2">
                {industryData.map((d: any) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-slate-600 flex-1 capitalize">{d.name}</span>
                    <span className="text-xs font-bold text-slate-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-sm text-slate-400 text-center py-8">No data yet</p>}
        </div>
      </div>

      {/* Active clients + recent logins */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Client Businesses</h3>
            <Link to="/super/businesses" className="text-xs font-bold text-orange-500 hover:text-orange-600">Manage all →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {activeBiz.slice(0, 6).map(biz => (
              <div key={biz.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: INDUSTRY_COLORS[biz.industry] || "#64748b" }}>
                  {biz.name.substring(0,2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{biz.name}</p>
                  <p className="text-xs text-slate-400 truncate capitalize">{biz.industry} · {biz.client_count} clients</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-800">{fmt(biz.mrr)}<span className="text-xs text-slate-400 font-normal">/mo</span></p>
                  <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full " + (PLAN_BADGE[biz.plan] || PLAN_BADGE.starter)}>{biz.plan}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
            <p className="text-xs text-slate-400 mt-0.5">Last client logins</p>
          </div>
          {(stats?.recentLogins || []).length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">No logins yet</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {(stats?.recentLogins || []).map((l: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50/50 transition-colors">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: INDUSTRY_COLORS[l.industry] || "#64748b" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{l.name}</p>
                    <p className="text-xs text-slate-400 truncate">{l.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-slate-500">{l.last_login ? format(parseISO(l.last_login), "MMM d") : "Never"}</p>
                    <p className="text-[10px] text-slate-400">{l.last_login ? format(parseISO(l.last_login), "h:mm a") : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
