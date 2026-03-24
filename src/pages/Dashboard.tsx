import { useState, useEffect } from "react";
import { 
  Users, 
  DollarSign, 
  Calendar, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  const statCards = [
    { label: "Total Clients", value: stats.totalClients, icon: Users, trend: "+12%", up: true },
    { label: "Total Revenue", value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalRevenue), icon: DollarSign, trend: "+8%", up: true },
    { label: "Upcoming Appts", value: stats.upcomingAppointments, icon: Calendar, trend: "-2%", up: false },
    { label: "New This Month", value: "5", icon: TrendingUp, trend: "+15%", up: true },
  ];

  const chartData = stats.revenueByMonth.map((item: any) => ({
    name: format(parseISO(item.month + "-01"), "MMM"),
    revenue: item.total
  })).reverse();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-zinc-50 rounded-lg flex items-center justify-center text-zinc-600">
                <card.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${card.up ? 'text-emerald-600' : 'text-red-600'}`}>
                {card.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {card.trend}
              </div>
            </div>
            <p className="text-sm font-medium text-zinc-500">{card.label}</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 mb-6">Revenue Overview</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  tickFormatter={(value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumSignificantDigits: 3 }).format(value)}
                />
                <Tooltip 
                  formatter={(value: number) => [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value), 'Revenue']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#18181b', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 mb-6">Upcoming</h3>
          <div className="space-y-6">
            {stats.nextAppointments.map((appt: any) => (
              <div key={appt.id} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                  <span className="text-xs font-bold">{appt.client_name.split(' ').map((n: any) => n[0]).join('')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 truncate">{appt.client_name}</p>
                  <p className="text-xs text-zinc-500">{appt.service} • {format(parseISO(appt.date), "h:mm a")}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-zinc-400">{format(parseISO(appt.date), "MMM d")}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/dashboard/appointments" className="block text-center mt-8 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
            View all appointments
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-900">Recent Clients</h3>
          <Link to="/dashboard/clients" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Phone</th>
                <th className="px-6 py-4 font-semibold">Added</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {stats.recentClients.map((client: any) => (
                <tr key={client.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 text-xs font-bold">
                        {client.name.split(' ').map((n: any) => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium text-zinc-900">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{client.email}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{client.phone}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{format(parseISO(client.created_at), "MMM d, yyyy")}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/dashboard/clients/${client.id}`} className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
