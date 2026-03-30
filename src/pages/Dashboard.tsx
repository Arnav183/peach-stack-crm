import { useState, useEffect } from "react";
import { Users, DollarSign, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight, CalendarPlus, UserPlus, FileText } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";

const ACCENT = "#f97316";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-white">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const colorMap: Record<string, { bg: string; icon: string }> = {
    orange: { bg: "bg-orange-500/10", icon: "text-orange-400" },
    green:  { bg: "bg-emerald-500/10", icon: "text-emerald-400" },
    blue:   { bg: "bg-blue-500/10", icon: "text-blue-400" },
    purple: { bg: "bg-purple-500/10", icon: "text-purple-400" },
  };

  const statCards = [
    { label: "Total Clients", value: stats.totalClients, icon: Users, trend: "+12%", up: true, sub: "vs last month", color: "orange" },
    { label: "Total Revenue", value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(stats.totalRevenue), icon: DollarSign, trend: "+8.2%", up: true, sub: "vs last month", color: "green" },
    { label: "Upcoming Appts", value: stats.upcomingAppointments, icon: Calendar, trend: "-2%", up: false, sub: "next 7 days", color: "blue" },
    { label: "New This Month", value: stats.newClientsThisMonth ?? 0, icon: TrendingUp, trend: "+15%", up: true, sub: "new clients", color: "purple" },
  ];

  const chartData = (stats.revenueByMonth || [])
    .map((item: any) => ({ name: format(parseISO(item.month + "-01"), "MMM"), revenue: item.total }))
    .reverse();

  const serviceBreakdown = (stats.revenueByService || [])
    .slice(0, 5)
    .map((s: any) => ({
      name: (s.service || s.name || "").length > 14 ? (s.service || s.name || "").slice(0, 14) + "…" : (s.service || s.name || ""),
      revenue: s.total || s.value || 0,
    }));

  const topClients = stats.topClients || stats.recentClients?.slice(0, 6) || [];

  const quickActions = [
    { label: "New Appointment", icon: CalendarPlus, href: "/dashboard/appointments?add=true", color: "text-blue-600", bg: "bg-blue-50 border-blue-100 hover:bg-blue-100" },
    { label: "Add Client", icon: UserPlus, href: "/dashboard/clients?add=true", color: "text-orange-600", bg: "bg-orange-50 border-orange-100 hover:bg-orange-100" },
    { label: "New Invoice", icon: FileText, href: "/dashboard/invoices?add=true", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100 hover:bg-emerald-100" },
  ];

  return (
    <div className="space-y-8 p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">{format(new Date(), "EEEE, MMMM d")} — here's what's happening.</p>
        </div>
        <div className="flex items-center gap-3">
          {quickActions.map(a => (
            <Link key={a.label} to={a.href}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${a.bg} ${a.color}`}>
              <a.icon className="w-3.5 h-3.5" />{a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map(card => {
          const c = colorMap[card.color];
          return (
            <div key={card.label} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${c.icon}`} />
                </div>
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${card.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                  {card.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {card.trend}
                </span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{card.value}</p>
              <p className="text-sm font-medium text-slate-400 mt-1">{card.label}</p>
              <p className="text-xs text-slate-300 mt-0.5">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly revenue over time</p>
            </div>
            <Link to="/dashboard/revenue" className="text-xs font-bold text-orange-500 hover:text-orange-600">View P&L →</Link>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke={ACCENT} strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: ACCENT, stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-900">Upcoming</h3>
            <Link to="/dashboard/appointments" className="text-xs font-bold text-orange-500 hover:text-orange-600">View all →</Link>
          </div>
          {(stats.nextAppointments || []).length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No upcoming appointments</p>
              <Link to="/dashboard/appointments?add=true" className="text-xs font-bold text-orange-500 mt-2 inline-block hover:text-orange-600">+ Schedule one</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {(stats.nextAppointments || []).slice(0, 5).map((appt: any) => (
                <div key={appt.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0 text-xs font-bold border border-orange-100">
                    {(appt.client_name || 'N').split(' ').map((n: any) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{appt.client_name}</p>
                    <p className="text-xs text-slate-400 truncate">{appt.service}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-700">{format(parseISO(appt.date), "MMM d")}</p>
                    <p className="text-xs text-slate-400">{format(parseISO(appt.date), "h:mm a")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="mb-5">
            <h3 className="text-base font-bold text-slate-900">Revenue by Service</h3>
            <p className="text-xs text-slate-400 mt-0.5">Top performing services</p>
          </div>
          {serviceBreakdown.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">No service data yet</p>
              <Link to="/dashboard/appointments?add=true" className="text-xs font-bold text-orange-500 mt-2 inline-block">+ Add an appointment</Link>
            </div>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceBreakdown} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#f97316' }} labelStyle={{ color: '#fff' }} />
                  <Bar dataKey="revenue" fill={ACCENT} radius={[0, 6, 6, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Top Clients</h3>
            <Link to="/dashboard/clients" className="text-xs font-bold text-orange-500 hover:text-orange-600">View all →</Link>
          </div>
          {topClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No clients yet</p>
              <Link to="/dashboard/clients?add=true" className="text-xs font-bold text-orange-500 mt-2 inline-block">+ Add your first client</Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {topClients.slice(0, 6).map((client: any, i: number) => (
                <Link key={client.id} to={`/dashboard/clients/${client.id}`}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors group">
                  <span className="text-xs font-bold text-slate-300 w-4 shrink-0">{i + 1}</span>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(client.name || 'N').split(' ').map((n: any) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-orange-500 transition-colors truncate">{client.name}</p>
                    <p className="text-xs text-slate-400 truncate">{client.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-800">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(client.total_revenue || client.totalRevenue || 0)}
                    </p>
                    <p className="text-xs text-slate-400">lifetime</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
