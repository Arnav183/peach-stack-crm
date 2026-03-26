import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format, parseISO, startOfWeek, startOfMonth, subMonths, startOfYear, endOfDay, formatISO } from "date-fns";
import { CalendarIcon, ChevronDown, Plus, Upload, Download, Trash2, Pencil, X, AlertCircle, Check } from "lucide-react";
import * as XLSX from "xlsx";

const PERIODS = [
  { id: "all", label: "All Time" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "3months", label: "Last 3 Months" },
  { id: "year", label: "This Year" },
];

const REVENUE_SOURCES = [
  "Service - Cash", "Service - Card", "Service - Online",
  "Product Sale", "Gift Card Sold", "Gift Card Redeemed",
  "Tip (cash)", "Tip (card)", "Membership / Package",
  "Consultation Fee", "Deposit", "Other"
];

const INDUSTRY_TEMPLATES: Record<string, any[]> = {
  beauty: [
    { date: "2026-03-01", source: "Service - Card", amount: 42, note: "Brow threading + tint" },
    { date: "2026-03-02", source: "Tip (cash)", amount: 8, note: "Cash tip from client" },
    { date: "2026-03-05", source: "Product Sale", amount: 28, note: "Brow gel retail sale" },
    { date: "2026-03-08", source: "Gift Card Sold", amount: 50, note: "Gift card sold" },
    { date: "2026-03-10", source: "Service - Cash", amount: 65, note: "Full face threading (walk-in, cash)" },
    { date: "2026-03-15", source: "Membership / Package", amount: 120, note: "Monthly threading package" },
    { date: "2026-03-18", source: "Service - Online", amount: 95, note: "Lash lift - booked online" },
    { date: "2026-03-20", source: "Gift Card Redeemed", amount: 50, note: "Gift card redeemed" },
  ],
  auto: [
    { date: "2026-03-01", source: "Service - Card", amount: 89, note: "Oil change + filter" },
    { date: "2026-03-03", source: "Service - Card", amount: 220, note: "Brake pad replacement" },
    { date: "2026-03-05", source: "Service - Cash", amount: 65, note: "Tire rotation (cash)" },
    { date: "2026-03-08", source: "Product Sale", amount: 45, note: "Wiper blades + air freshener" },
    { date: "2026-03-12", source: "Deposit", amount: 100, note: "Deposit on transmission rebuild" },
    { date: "2026-03-15", source: "Service - Card", amount: 310, note: "Full service + exterior detail" },
    { date: "2026-03-18", source: "Service - Online", amount: 145, note: "AC diagnostic + recharge (online pay)" },
    { date: "2026-03-22", source: "Tip (cash)", amount: 20, note: "Cash tip left by customer" },
  ],
  restaurant: [
    { date: "2026-03-01", source: "Service - Card", amount: 145, note: "Dinner reservation (2 pax)" },
    { date: "2026-03-01", source: "Tip (card)", amount: 30, note: "Card tip - table 12" },
    { date: "2026-03-05", source: "Service - Cash", amount: 42, note: "Brunch walk-in (cash)" },
    { date: "2026-03-08", source: "Gift Card Sold", amount: 75, note: "Gift card sale" },
    { date: "2026-03-12", source: "Deposit", amount: 300, note: "Private event deposit" },
    { date: "2026-03-15", source: "Service - Online", amount: 320, note: "Corporate lunch booking (online)" },
    { date: "2026-03-18", source: "Product Sale", amount: 24, note: "Retail wine bottle" },
    { date: "2026-03-20", source: "Tip (cash)", amount: 45, note: "Cash tips - weekend" },
  ],
  medical: [
    { date: "2026-03-01", source: "Service - Card", amount: 150, note: "Routine checkup" },
    { date: "2026-03-03", source: "Service - Card", amount: 280, note: "Consultation + procedure" },
    { date: "2026-03-05", source: "Service - Cash", amount: 80, note: "Follow-up visit (cash)" },
    { date: "2026-03-10", source: "Consultation Fee", amount: 100, note: "New patient consultation" },
    { date: "2026-03-12", source: "Product Sale", amount: 35, note: "Aftercare products sold" },
    { date: "2026-03-15", source: "Deposit", amount: 200, note: "Pre-payment for upcoming procedure" },
    { date: "2026-03-18", source: "Service - Online", amount: 120, note: "Telehealth consultation" },
  ],
  retail: [
    { date: "2026-03-01", source: "Service - Card", amount: 85, note: "In-store sales (card)" },
    { date: "2026-03-02", source: "Service - Cash", amount: 42, note: "In-store sales (cash)" },
    { date: "2026-03-05", source: "Service - Online", amount: 120, note: "Online order - shipped" },
    { date: "2026-03-08", source: "Gift Card Sold", amount: 50, note: "Gift card sale" },
    { date: "2026-03-10", source: "Gift Card Redeemed", amount: 50, note: "Gift card redeemed in store" },
    { date: "2026-03-15", source: "Product Sale", amount: 195, note: "Bulk/wholesale order" },
  ],
  fitness: [
    { date: "2026-03-01", source: "Membership / Package", amount: 120, note: "Monthly membership - new member" },
    { date: "2026-03-03", source: "Membership / Package", amount: 350, note: "Quarterly membership" },
    { date: "2026-03-05", source: "Service - Card", amount: 75, note: "Personal training session" },
    { date: "2026-03-08", source: "Product Sale", amount: 45, note: "Supplements retail" },
    { date: "2026-03-10", source: "Gift Card Sold", amount: 60, note: "1-month gift membership" },
    { date: "2026-03-15", source: "Consultation Fee", amount: 50, note: "Initial fitness assessment" },
    { date: "2026-03-18", source: "Service - Online", amount: 99, note: "Online class subscription" },
  ],
  agency: [
    { date: "2026-03-01", source: "Service - Online", amount: 1500, note: "Website build - milestone 1 of 3" },
    { date: "2026-03-05", source: "Service - Online", amount: 800, note: "SEO retainer - March" },
    { date: "2026-03-10", source: "Consultation Fee", amount: 250, note: "Strategy session" },
    { date: "2026-03-12", source: "Service - Online", amount: 400, note: "Social media management" },
    { date: "2026-03-15", source: "Deposit", amount: 750, note: "50% deposit - new branding project" },
    { date: "2026-03-20", source: "Service - Card", amount: 300, note: "Logo + brand guide" },
  ],
  general: [
    { date: "2026-03-01", source: "Service - Card", amount: 150, note: "Job completed - card payment" },
    { date: "2026-03-03", source: "Service - Cash", amount: 80, note: "Cash payment for job" },
    { date: "2026-03-05", source: "Tip (cash)", amount: 20, note: "Cash tip from customer" },
    { date: "2026-03-08", source: "Product Sale", amount: 45, note: "Parts / materials sold" },
    { date: "2026-03-10", source: "Deposit", amount: 100, note: "Deposit on upcoming job" },
    { date: "2026-03-15", source: "Service - Online", amount: 200, note: "Online invoice paid" },
  ],
};

const MANUAL_TEMPLATE = INDUSTRY_TEMPLATES["general"];

export default function Revenue({ user }: { user?: any }) { user }: { user?: any }) {
  const [stats, setStats] = useState<any>(null);
  const [manualRevenue, setManualRevenue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [showManual, setShowManual] = useState(false);
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
      case "week": startDate = startOfWeek(now); break;
      case "month": startDate = startOfMonth(now); break;
      case "3months": startDate = subMonths(now, 3); break;
      case "year": startDate = startOfYear(now); break;
      default: startDate = now;
    }
    return { startDate: formatISO(startDate), endDate: formatISO(endDate) };
  };

  const fetchData = () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange();
    const qs = startDate ? `?startDate=${startDate}&endDate=${endDate}` : "";
    Promise.all([
      fetch(`/api/stats${qs}`).then(r => r.json()),
      fetch("/api/revenue/manual").then(r => r.json()),
    ]).then(([s, m]) => { setStats(s); setManualRevenue(m); }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [period]);

  const openAddManual = () => {
    setEditingManual(null);
    setManualForm({ date: new Date().toISOString().split("T")[0], source: "Cash Sale", amount: "", note: "" });
    setShowManual(true);
  };
  const openEditManual = (r: any) => {
    setEditingManual(r);
    setManualForm({ date: r.date, source: r.source, amount: String(r.amount), note: r.note || "" });
    setShowManual(true);
  };
  const saveManual = async () => {
    const method = editingManual ? "PUT" : "POST";
    const url = editingManual ? `/api/revenue/manual/${editingManual.id}` : "/api/revenue/manual";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...manualForm, amount: parseFloat(manualForm.amount) }) });
    setShowManual(false);
    fetchData();
  };
  const deleteManual = async (id: number) => {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/revenue/manual/${id}`, { method: "DELETE" });
    fetchData();
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
      fetchData();
    } catch {
      setImportResult({ error: "Import failed. Download the template to see the correct format." });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const downloadTemplate = () => {
    const industry = user?.industry || "general";
    const rows = INDUSTRY_TEMPLATES[industry] || INDUSTRY_TEMPLATES["general"];
    const ws = XLSX.utils.json_to_sheet(rows);
    // Style the header row
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    ws["!cols"] = [{ wch: 14 }, { wch: 24 }, { wch: 10 }, { wch: 40 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Revenue Import");
    // Add an info sheet
    const infoRows = [
      { column: "date", format: "YYYY-MM-DD", example: "2026-03-15", required: "Yes" },
      { column: "source", format: "Pick from dropdown list in main sheet", example: "Service - Card", required: "Yes" },
      { column: "amount", format: "Number (no $ sign)", example: "42.50", required: "Yes" },
      { column: "note", format: "Free text", example: "Brow threading - walk-in", required: "No" },
    ];
    const ws2 = XLSX.utils.json_to_sheet(infoRows);
    ws2["!cols"] = [{ wch: 12 }, { wch: 35 }, { wch: 20 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Column Guide");
    XLSX.writeFile(wb, "revenue_import_template.xlsx");
  };

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

  const revenueChartData = stats?.revenueByMonth?.map((item: any) => ({
    name: format(parseISO(item.month + "-01"), "MMM"),
    revenue: item.total || 0,
    expenses: (stats?.expensesByMonth?.find((e: any) => e.month === item.month)?.total) || 0,
  })).reverse() || [];

  const serviceData = stats?.revenueByService || [];
  const expenseCatData = stats?.expensesByCategory || [];
  const COLORS = ["#f97316","#6366f1","#10b981","#f59e0b","#f43f5e","#8b5cf6","#ec4899","#14b8a6"];

  if (loading && !stats) return <div className="flex items-center justify-center h-64 text-zinc-400">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Revenue & P&L</h1>
          <p className="text-zinc-500 text-sm">Revenue, expenses, and net profit at a glance.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-4 py-2 shadow-sm">
            <CalendarIcon className="w-4 h-4 text-zinc-400" />
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="bg-transparent text-sm font-medium text-zinc-700 focus:outline-none appearance-none pr-6 cursor-pointer">
              {PERIODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* P&L Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Gross Revenue</p>
          <p className="text-2xl font-bold text-zinc-900">{fmt(stats?.totalRevenue)}</p>
          <p className="text-xs text-zinc-400 mt-1">appts + manual</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-500">{fmt(stats?.totalExpenses)}</p>
          <p className="text-xs text-zinc-400 mt-1">all categories</p>
        </div>
        <div className={`col-span-2 md:col-span-1 border rounded-2xl p-5 shadow-sm ${(stats?.netProfit || 0) >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Net Profit</p>
          <p className={`text-2xl font-bold ${(stats?.netProfit || 0) >= 0 ? "text-green-700" : "text-red-700"}`}>{fmt(stats?.netProfit)}</p>
          <p className="text-xs text-zinc-400 mt-1">revenue - expenses</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Unpaid Invoices</p>
          <p className="text-2xl font-bold text-orange-500">{fmt(stats?.unpaidInvoicesTotal)}</p>
          <p className="text-xs text-zinc-400 mt-1">{stats?.unpaidInvoices || 0} outstanding</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-base font-bold text-zinc-900 mb-1">Revenue vs Expenses</h3>
          <p className="text-xs text-zinc-400 mb-5">Monthly comparison</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: number, n: string) => [fmt(v), n === "revenue" ? "Revenue" : "Expenses"]} contentStyle={{ borderRadius: "12px", border: "1px solid #e4e4e7" }} />
                <Legend iconType="circle" />
                <Bar dataKey="revenue" fill="#f97316" radius={[4,4,0,0]} name="Revenue" />
                <Bar dataKey="expenses" fill="#f43f5e" radius={[4,4,0,0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid grid-rows-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
            <h3 className="text-base font-bold text-zinc-900 mb-4">Revenue by Service</h3>
            {serviceData.length > 0 ? (
              <div className="space-y-2">
                {serviceData.slice(0, 4).map((s: any, i: number) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-zinc-700 flex-1 truncate">{s.name}</span>
                    <span className="text-sm font-bold text-zinc-900">{fmt(s.value)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-zinc-400">No data for this period.</p>}
          </div>
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
            <h3 className="text-base font-bold text-zinc-900 mb-4">Expenses by Category</h3>
            {expenseCatData.length > 0 ? (
              <div className="space-y-2">
                {expenseCatData.slice(0, 4).map((e: any, i: number) => (
                  <div key={e.name} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-zinc-700 flex-1 truncate">{e.name}</span>
                    <span className="text-sm font-bold text-red-500">{fmt(e.value)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-zinc-400">No expenses logged yet.</p>}
          </div>
        </div>
      </div>

      {/* Manual Revenue */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Manual Revenue Entries</h3>
            <p className="text-xs text-zinc-400">Cash sales, tips, product sales — anything not from bookings</p>
          </div>
          <div className="flex gap-2">
            <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 font-medium text-zinc-600"><Download className="w-3.5 h-3.5" /> Template</button>
            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 font-medium text-zinc-600 cursor-pointer"><Upload className="w-3.5 h-3.5" /> Import<input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} /></label>
            <button onClick={openAddManual} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 font-medium"><Plus className="w-3.5 h-3.5" /> Add</button>
          </div>
        </div>

        {importResult && (
          <div className={`mx-6 mt-4 flex items-center gap-3 p-3 rounded-xl border text-sm font-medium ${importResult.success ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {importResult.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {importResult.success || importResult.error}
            <button onClick={() => setImportResult(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="bg-orange-50 border-b border-orange-100 px-6 py-3 text-xs text-orange-800">
          <strong>Importing?</strong> Download the template — columns needed: <code className="bg-orange-100 px-1 rounded">date</code>, <code className="bg-orange-100 px-1 rounded">source</code>, <code className="bg-orange-100 px-1 rounded">amount</code>, <code className="bg-orange-100 px-1 rounded">note</code>. Date format: YYYY-MM-DD.
        </div>

        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>{["Date","Source","Amount","Note",""].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {manualRevenue.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-zinc-400 text-sm">No manual entries yet. Add cash sales, tips, or product revenue here.</td></tr>
            ) : manualRevenue.map(r => (
              <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-5 py-3 text-zinc-700 font-medium">{r.date}</td>
                <td className="px-5 py-3"><span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold">{r.source}</span></td>
                <td className="px-5 py-3 font-bold text-green-600">{fmt(r.amount)}</td>
                <td className="px-5 py-3 text-zinc-500 max-w-xs truncate">{r.note || "—"}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEditManual(r)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteManual(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Manual Revenue Modal */}
      {showManual && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-zinc-900">{editingManual ? "Edit Entry" : "Add Revenue"}</h2>
              <button onClick={() => setShowManual(false)} className="p-2 hover:bg-zinc-100 rounded-xl"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Date</label><input type="date" value={manualForm.date} onChange={e => setManualForm(f => ({...f, date: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
              <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Source</label><select value={manualForm.source} onChange={e => setManualForm(f => ({...f, source: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">{REVENUE_SOURCES.map(s => <option key={s}>{s}</option>)}</select></div>
              <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Amount ($)</label><input type="number" step="0.01" min="0" placeholder="0.00" value={manualForm.amount} onChange={e => setManualForm(f => ({...f, amount: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
              <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Note (optional)</label><input type="text" placeholder="e.g. Walk-in cash threading" value={manualForm.note} onChange={e => setManualForm(f => ({...f, note: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowManual(false)} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50">Cancel</button>
              <button onClick={saveManual} disabled={!manualForm.date || !manualForm.amount} className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-40">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
