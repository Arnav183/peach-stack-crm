import { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  format, 
  parseISO, 
  startOfWeek, 
  startOfMonth, 
  subMonths, 
  startOfYear, 
  endOfDay,
  formatISO 
} from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";

const PERIODS = [
  { id: "all", label: "All Time" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "3months", label: "Last 3 Months" },
  { id: "year", label: "This Year" },
];

export default function Revenue() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    setLoading(true);
    let url = "/api/stats";
    
    if (period !== "all") {
      const now = new Date();
      let startDate: Date;
      const endDate = endOfDay(now);

      switch (period) {
        case "week":
          startDate = startOfWeek(now);
          break;
        case "month":
          startDate = startOfMonth(now);
          break;
        case "3months":
          startDate = subMonths(now, 3);
          break;
        case "year":
          startDate = startOfYear(now);
          break;
        default:
          startDate = now;
      }

      url += `?startDate=${formatISO(startDate)}&endDate=${formatISO(endDate)}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, [period]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  if (loading && !stats) return <div className="flex items-center justify-center h-64">Loading...</div>;

  const chartData = stats?.revenueByMonth?.map((item: any) => ({
    name: format(parseISO(item.month + "-01"), "MMM"),
    revenue: item.total
  })).reverse() || [];

  const serviceData = stats?.revenueByService || [];
  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#ec4899"];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Revenue & Analytics</h1>
          <p className="text-zinc-500">Track your business growth and performance.</p>
        </div>

        <div className="relative inline-block text-left">
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-4 py-2 shadow-sm">
            <CalendarIcon className="w-4 h-4 text-zinc-400" />
            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent text-sm font-medium text-zinc-700 focus:outline-none appearance-none pr-6 cursor-pointer"
            >
              {PERIODS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-4 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Total Revenue</p>
          <p className="text-3xl font-bold text-zinc-900 mt-1">{formatCurrency(stats?.totalRevenue || 0)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Avg. per Client</p>
          <p className="text-3xl font-bold text-zinc-900 mt-1">
            {stats?.totalClients ? formatCurrency(stats.totalRevenue / stats.totalClients) : "$0.00"}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Completed Appts</p>
          <p className="text-3xl font-bold text-zinc-900 mt-1">
            {stats?.revenueByService?.reduce((acc: number, curr: any) => acc + (curr.count || 0), 0) || stats?.totalClients || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 mb-6">Monthly Revenue</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  cursor={{ fill: '#f4f4f5' }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 mb-6">Revenue by Service</h3>
          <div className="h-[300px]">
            {serviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {serviceData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                No data available for this period
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
