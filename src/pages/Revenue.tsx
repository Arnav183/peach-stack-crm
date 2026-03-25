import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format, parseISO, startOfWeek, startOfMonth, subMonths, startOfYear, endOfDay, formatISO } from "date-fns";
import { CalendarIcon, ChevronDown, Plus, Upload, X, Check, AlertCircle, Download, Trash2, Pencil } from "lucide-react";
import * as XLSX from "xlsx";

const PERIODS = [
  { id: "all", label: "All Time" },
  { id: "month", label: "This Month" },
  { id: "3months", label: "Last 3 Months" },
  { id: "year", label: "This Year" },
];

const SOURCES = ["Cash Sale", "Product Sale", "Tip", "Gift Card", "Online Payment", "Other"];

const TEMPLATE_ROWS = [
  { date: "2025-03-01", source: "Cash Sale", amount: 55, note: "Walk-in brow threading" },
  { date: "2025-03-03", source: "Product Sale", amount: 28, note: "Sold brow serum" },
  { date: "2025-03-05", source: "Tip", amount: 15, note: "Tip from Sophia Martinez" },
];

export default function Revenue() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [manualRevenue, setManualRevenue] = useState<any[]>([]);
  const [showAddManual, setShowAddManual] = useState(false);
  const [editingManual, setEditingManual] = useState<any>(null);
  const [manualForm, setManualForm] = useState({ date: "", source: "Cash Sale", amount: "", note: "" });
  const [importResult, setImportResult] = useState<{ success?: string; error?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const getDateRange = () => {
    if (period === "all") return {};
    const now = new Date();
    const endDate = endOfDay(now);
    let startDate: Date;
    switch (period) {
      case "month": startDate = startOfMonth(now); break;
      case "3months": startDate = subMonths(now, 3); break;
      case "year": startDate = startOfYear(now); break;
      default: return {};
    }
    return { startDate: formatISO(startDate), endDate: formatISO(endDate) };
  };

  const fetchStats = () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange();
    const url = startDate ? `/api/stats?startDate=${startDate}&endDate=${endDate}` : "/api/stats";
    fetch(url).then(r => r.json()).then(setStats).finally(() => setLoading(false));
  };

  const fetchManual = () => fetch("/api/revenue/manual").then(r => r.json()).then(setManualRevenue);

  useEffect(() => { fetchStats(); fetchManual(); }, [period]);

  const openAddManual = () => {
    setEditingManual(null);
    setManualForm({ date: new Date().toISOString().split("T")[0], source: "Cash Sale", amount: "", note: "" });
    setShowAddManual(true);
  };
  const openEditManual = (item: any) => {
    setEditingManual(item);
    setManualForm({ date: item.date, source: item.source, amount: String(item.amount), note: item.note || "" });
    setShowAddManual(true);
  };

  const handleSaveManual = async () => {
    if (!manualForm.date || !manualForm.amount) return;
    const method = editingManual ? "PUT" : "POST";
    const url = editingManual ? `/api/revenue/manual/${editingManual.id}` : "/api/revenue/manual";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...manualForm, amount: parseFloat(manualForm.amount) }) });
    setShowAddManual(false);
    fetchStats();
    fetchManual();
  };

  const handleDeleteManual = async (id: number) => {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/revenue/manual/${id}`, { method: "DELETE" });
    fetchStats();
    fetchManual();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);
      const mapped = rows.map(r => ({
        date: r.date || r.Date || r.DATE,
        source: r.source || r.Source || r.SOURCE || "Other",
        amount: parseFloat(r.amount || r.Amount || r.AMOUNT || 0),
        note: r.note || r.Note || r.NOTE || "",
      }));
      const res = await fetch("/api/revenue/manual/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: mapped }) });
      const result = await res.json();
      setImportResult({ success: `Imported ${result.imported} revenue entries.` });
      fetchStats();
      fetchManual();
    } catch {
      setImportResult({ error: "Import failed. Check that your file matches the template." });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(TEMPLATE_ROWS);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Revenue");
    XLSX.writeFile(wb, "manual_revenue_template.xlsx");
  };

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
  if (loading && !stats) return <div className="flex items-center justify-center h-64 text-zinc-400">Loading...</div>;

  // Merge monthly revenue + expenses for combo chart
  const months = new Set([
    ...(stats?.revenueByMonth || []).map((r: any) => r.month),
    ...(stats?.expensesByMonth || []).map((e: any) => e.month),
  ]);
  const chartData = [...months].sort().reverse().slice(0, 8).reverse().map(month => ({
    name: format(parseISO(month + "-01"), "MMM"),
    revenue: stats?.revenueByMonth?.find((r: any) => r.month === month)?.total || 0,
    expenses: stats?.expensesByMonth?.find((e: any) => e.month === month)?.total || 0,
  }));

  const serviceData = stats?.revenueByService || [];
  const COLORS = ["#f97316", "#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#ec4899"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Revenue & P&L</h1>
          <p className="text-zinc-500 text-sm">Track revenue, expenses, and real profit.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-4 py-2 shadow-sm">
            <CalendarIcon className="w-4 h-4 text-zinc-400" />
            <select value={period} onChange={e => setPeriod(e.target.value)} className="bg-transparent text-sm font-medium text-zinc-700 focus:outline-none appearance-none pr-6 cursor-pointer">
              {PERIODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* P&L summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Gross Revenue</p>
          <p className="text-2xl font-bold text-zinc-900">{fmt(stats?.totalRevenue)}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-500">{fmt(stats?.totalExpenses)}</p>
        </div>
        <div className={`border rounded-2xl p-5 shadow-sm ${(stats?.netProfit || 0) >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Net Profit</p>
          <p className={`text-2xl font-bold ${(stats?.netProfit || 0) >= 0 ? "text-green-700" : "text-red-700"}`}>{fmt(stats?.netProfit)}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Avg / Client</p>
          <p className="text-2xl font-bold text-zinc-900">{stats?.totalClients ? fmt((stats.totalRevenue || 0) / stats.totalClients) : "$0"}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-base font-bold text-zinc-900 mb-1">Revenue vs Expenses</h3>
          <p className="text-xs text-zinc-400 mb-5">Monthly breakdown</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: number, name: string) => [fmt(v), name === "revenue" ? "Revenue" : "Expenses"]} contentStyle={{ borderRadius: "12px", border: "1px solid #e4e4e7", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                <Bar dataKey="revenue" fill="#f97316" radius={[6,6,0,0]} name="Revenue" />
                <Bar dataKey="expenses" fill="#e4e4e7" radius={[6,6,0,0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-base font-bold text-zinc-900 mb-1">Revenue by Service</h3>
          <p className="text-xs text-zinc-400 mb-5">Completed appointments only</p>
          <div className="h-[280px]">
            {serviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={serviceData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={6} dataKey="value" animationDuration={1200}>
                    {serviceData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [fmt(v), "Revenue"]} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-zinc-400 text-sm">No data for this period</div>}
          </div>
        </div>
      </div>

      {/* Manual Revenue */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Manual Revenue Entries</h3>
            <p className="text-xs text-zinc-400">Cash sales, tips, product sales — anything not from a booking</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-2 text-xs border border-zinc-200 rounded-xl bg-white hover:bg-zinc-50 font-medium text-zinc-700">
              <Download className="w-3.5 h-3.5" /> Template
            </button>
            <label className="flex items-center gap-1.5 px-3 py-2 text-xs border border-zinc-200 rounded-xl bg-white hover:bg-zinc-50 font-medium text-zinc-700 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Import
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
            </label>
            <button onClick={openAddManual} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-medium">
              <Plus className="w-3.5 h-3.5" /> Add Entry
            </button>
          </div>
        </div>

        {importResult && (
          <div className={`mx-6 mt-4 flex items-center gap-3 p-3 rounded-xl border text-xs font-medium ${importResult.success ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {importResult.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {importResult.success || importResult.error}
            <button onClick={() => setImportResult(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        <div className="px-6 py-3 bg-orange-50 border-b border-orange-100 text-xs text-orange-800">
          <strong>Template columns:</strong> <code className="bg-orange-100 px-1 rounded">date</code> (YYYY-MM-DD), <code className="bg-orange-100 px-1 rounded">source</code>, <code className="bg-orange-100 px-1 rounded">amount</code>, <code className="bg-orange-100 px-1 rounded">note</code>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                {["Date","Source","Amount","Note",""].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {manualRevenue.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-zinc-400 text-sm">No manual entries yet.</td></tr>
              ) : manualRevenue.map(item => (
                <tr key={item.id} className="hover:bg-zinc-50">
                  <td className="px-5 py-3 text-zinc-700 font-medium">{item.date}</td>
                  <td className="px-5 py-3"><span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 text-orange-700">{item.source}</span></td>
                  <td className="px-5 py-3 font-bold text-green-600">{fmt(item.amount)}</td>
                  <td className="px-5 py-3 text-zinc-400 max-w-xs truncate">{item.note || "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEditManual(item)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteManual(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Manual Modal */}
      {showAddManual && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-zinc-900">{editingManual ? "Edit Entry" : "Add Revenue Entry"}</h2>
              <button onClick={() => setShowAddManual(false)} className="p-2 hover:bg-zinc-100 rounded-xl"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Date</label>
                <input type="date" value={manualForm.date} onChange={e => setManualForm(f => ({...f, date: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Source</label>
                <select value={manualForm.source} onChange={e => setManualForm(f => ({...f, source: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Amount ($)</label>
                <input type="number" step="0.01" min="0" placeholder="0.00" value={manualForm.amount} onChange={e => setManualForm(f => ({...f, amount: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Note (optional)</label>
                <input type="text" placeholder="e.g. Walk-in threading, cash" value={manualForm.note} onChange={e => setManualForm(f => ({...f, note: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddManual(false)} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50">Cancel</button>
              <button onClick={handleSaveManual} disabled={!manualForm.date || !manualForm.amount} className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-40">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
