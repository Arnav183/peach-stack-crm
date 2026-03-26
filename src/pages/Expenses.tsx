import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Pencil, Upload, Download, X, Check, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";

const CATEGORIES = [
  "Supplies", "Inventory / Stock", "Rent", "Utilities",
  "Software / Subscriptions", "Payroll / Wages", "Contractor / Freelancer",
  "Marketing / Advertising", "Equipment", "Insurance",
  "Professional Services", "Repairs & Maintenance", "Travel",
  "Meals & Entertainment", "Training / Education", "Other"
];

const INDUSTRY_EXPENSE_TEMPLATES: Record<string, any[]> = {
  beauty: [
    { date: "2026-03-01", category: "Supplies", amount: 145, note: "Threading thread, cotton, brow tints" },
    { date: "2026-03-01", category: "Supplies", amount: 95, note: "Lash lift kits x3" },
    { date: "2026-03-05", category: "Software / Subscriptions", amount: 149, note: "Peach Stack platform fee" },
    { date: "2026-03-10", category: "Rent", amount: 1200, note: "Studio rent - March" },
    { date: "2026-03-12", category: "Marketing / Advertising", amount: 75, note: "Instagram ads" },
    { date: "2026-03-15", category: "Equipment", amount: 340, note: "New LED mirror" },
    { date: "2026-03-20", category: "Insurance", amount: 85, note: "Monthly liability insurance" },
    { date: "2026-03-25", category: "Utilities", amount: 120, note: "Electric + water" },
  ],
  auto: [
    { date: "2026-03-01", category: "Inventory / Stock", amount: 890, note: "Brake pads, rotors, oil filters" },
    { date: "2026-03-01", category: "Supplies", amount: 220, note: "Shop rags, gloves, cleaning" },
    { date: "2026-03-05", category: "Software / Subscriptions", amount: 199, note: "Peach Stack platform fee" },
    { date: "2026-03-10", category: "Rent", amount: 2200, note: "Shop rent - March" },
    { date: "2026-03-12", category: "Utilities", amount: 380, note: "Electric + water + air" },
    { date: "2026-03-15", category: "Equipment", amount: 1200, note: "Tire mounting machine" },
    { date: "2026-03-18", category: "Insurance", amount: 250, note: "Business + liability" },
    { date: "2026-03-22", category: "Contractor / Freelancer", amount: 400, note: "Part-time mechanic" },
  ],
  restaurant: [
    { date: "2026-03-01", category: "Inventory / Stock", amount: 2800, note: "Monthly produce, protein, dry goods" },
    { date: "2026-03-01", category: "Supplies", amount: 180, note: "Napkins, packaging, cleaning" },
    { date: "2026-03-05", category: "Software / Subscriptions", amount: 299, note: "Peach Stack platform fee" },
    { date: "2026-03-10", category: "Rent", amount: 4500, note: "Restaurant space rent - March" },
    { date: "2026-03-12", category: "Utilities", amount: 620, note: "Electric + gas + water" },
    { date: "2026-03-15", category: "Payroll / Wages", amount: 6800, note: "Staff wages - March" },
    { date: "2026-03-18", category: "Insurance", amount: 320, note: "Restaurant liability + property" },
    { date: "2026-03-22", category: "Repairs & Maintenance", amount: 250, note: "Dishwasher repair" },
  ],
  medical: [
    { date: "2026-03-01", category: "Supplies", amount: 380, note: "Medical consumables + PPE" },
    { date: "2026-03-05", category: "Software / Subscriptions", amount: 199, note: "Peach Stack + EHR software" },
    { date: "2026-03-10", category: "Rent", amount: 3500, note: "Office rent - March" },
    { date: "2026-03-15", category: "Payroll / Wages", amount: 5500, note: "Staff + admin wages" },
    { date: "2026-03-18", category: "Insurance", amount: 450, note: "Malpractice + liability" },
    { date: "2026-03-22", category: "Professional Services", amount: 200, note: "Accounting - monthly" },
    { date: "2026-03-25", category: "Training / Education", amount: 120, note: "CPD certification" },
  ],
  retail: [
    { date: "2026-03-01", category: "Inventory / Stock", amount: 2200, note: "Monthly product restock" },
    { date: "2026-03-05", category: "Software / Subscriptions", amount: 99, note: "Peach Stack + POS" },
    { date: "2026-03-10", category: "Rent", amount: 2800, note: "Store rent - March" },
    { date: "2026-03-15", category: "Payroll / Wages", amount: 3200, note: "Staff wages" },
    { date: "2026-03-18", category: "Marketing / Advertising", amount: 180, note: "Instagram + Google Shopping" },
    { date: "2026-03-22", category: "Supplies", amount: 95, note: "Bags, tissue, packaging" },
    { date: "2026-03-25", category: "Insurance", amount: 120, note: "Business insurance" },
  ],
  fitness: [
    { date: "2026-03-01", category: "Equipment", amount: 650, note: "Bands, mats, weights" },
    { date: "2026-03-05", category: "Software / Subscriptions", amount: 149, note: "Peach Stack + booking app" },
    { date: "2026-03-10", category: "Rent", amount: 2200, note: "Studio rent - March" },
    { date: "2026-03-12", category: "Utilities", amount: 280, note: "Electric + internet + music license" },
    { date: "2026-03-15", category: "Contractor / Freelancer", amount: 800, note: "Part-time instructor" },
    { date: "2026-03-18", category: "Insurance", amount: 150, note: "Studio liability" },
    { date: "2026-03-25", category: "Repairs & Maintenance", amount: 180, note: "Treadmill service" },
  ],
  agency: [
    { date: "2026-03-01", category: "Software / Subscriptions", amount: 350, note: "Figma, Adobe CC, hosting" },
    { date: "2026-03-05", category: "Software / Subscriptions", amount: 199, note: "Peach Stack platform fee" },
    { date: "2026-03-08", category: "Contractor / Freelancer", amount: 1200, note: "Subcontractor - dev work" },
    { date: "2026-03-10", category: "Marketing / Advertising", amount: 200, note: "LinkedIn ads" },
    { date: "2026-03-12", category: "Professional Services", amount: 300, note: "Accountant quarterly" },
    { date: "2026-03-15", category: "Travel", amount: 85, note: "Client meeting - fuel + parking" },
    { date: "2026-03-18", category: "Meals & Entertainment", amount: 120, note: "Client lunch" },
    { date: "2026-03-22", category: "Training / Education", amount: 199, note: "Online course" },
  ],
  general: [
    { date: "2026-03-01", category: "Supplies", amount: 180, note: "Monthly supplies" },
    { date: "2026-03-05", category: "Software / Subscriptions", amount: 149, note: "Peach Stack platform fee" },
    { date: "2026-03-10", category: "Rent", amount: 1500, note: "Business space rent - March" },
    { date: "2026-03-12", category: "Utilities", amount: 220, note: "Electric + internet" },
    { date: "2026-03-15", category: "Payroll / Wages", amount: 2800, note: "Staff wages" },
    { date: "2026-03-18", category: "Marketing / Advertising", amount: 100, note: "Online advertising" },
    { date: "2026-03-22", category: "Insurance", amount: 130, note: "Business insurance" },
    { date: "2026-03-25", category: "Equipment", amount: 250, note: "Tools / equipment purchase" },
  ],
};

const TEMPLATE_ROWS = INDUSTRY_EXPENSE_TEMPLATES["general"];

export default function Expensesexport default function Expenses({ user }: { user?: any }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ date: "", category: "Supplies", amount: "", note: "" });
  const [importResult, setImportResult] = useState<{ success?: string; error?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchExpenses = () => {
    fetch("/api/expenses").then(r => r.json()).then(setExpenses).finally(() => setLoading(false));
  };
  useEffect(() => { fetchExpenses(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ date: new Date().toISOString().split("T")[0], category: "Supplies", amount: "", note: "" });
    setShowForm(true);
  };
  const openEdit = (e: any) => {
    setEditing(e);
    setForm({ date: e.date, category: e.category, amount: String(e.amount), note: e.note || "" });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.date || !form.amount) return;
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/expenses/${editing.id}` : "/api/expenses";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }) });
    setShowForm(false);
    fetchExpenses();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    fetchExpenses();
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
        category: r.category || r.Category || r.CATEGORY || "Other",
        amount: parseFloat(r.amount || r.Amount || r.AMOUNT || 0),
        note: r.note || r.Note || r.NOTE || "",
      }));
      const res = await fetch("/api/expenses/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: mapped }) });
      const result = await res.json();
      setImportResult({ success: `Successfully imported ${result.imported} expenses.` });
      fetchExpenses();
    } catch {
      setImportResult({ error: "Import failed. Make sure your file matches the template." });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const downloadTemplate = () => {
    const industry = user?.industry || "general";
    const rows = INDUSTRY_EXPENSE_TEMPLATES[industry] || INDUSTRY_EXPENSE_TEMPLATES["general"];
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 14 }, { wch: 28 }, { wch: 10 }, { wch: 40 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses Import");
    // Column guide sheet
    const guide = [
      { column: "date", format: "YYYY-MM-DD", example: "2026-03-15", required: "Yes" },
      { column: "category", format: "Must match a category exactly", example: "Rent", required: "Yes" },
      { column: "amount", format: "Number (no $ sign)", example: "1200", required: "Yes" },
      { column: "note", format: "Free text description", example: "Studio rent March", required: "No" },
    ];
    const ws2 = XLSX.utils.json_to_sheet(guide);
    ws2["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Column Guide");
    // Categories reference sheet
    const catRef = CATEGORIES.map(c => ({ category: c }));
    const ws3 = XLSX.utils.json_to_sheet(catRef);
    ws3["!cols"] = [{ wch: 28 }];
    XLSX.utils.book_append_sheet(wb, ws3, "Valid Categories");
    XLSX.writeFile(wb, "expenses_import_template.xlsx");
  };

  const totalByCategory = CATEGORIES.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)
  })).filter(c => c.total > 0);
  const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  return (
    <div className="space-y-6 p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Expenses</h1>
          <p className="text-zinc-500 text-sm">Track what you spend to see your real profit.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 text-sm border border-zinc-200 rounded-xl bg-white hover:bg-zinc-50 font-medium text-zinc-700 transition-all">
            <Download className="w-4 h-4" /> Download Template
          </button>
          <label className="flex items-center gap-2 px-4 py-2 text-sm border border-zinc-200 rounded-xl bg-white hover:bg-zinc-50 font-medium text-zinc-700 transition-all cursor-pointer">
            <Upload className="w-4 h-4" /> Import Excel/CSV
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-500 text-white rounded-xl hover:bg-orange-400 font-bold transition-all shadow-lg shadow-orange-500/20">
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Import feedback */}
      {importResult && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium ${importResult.success ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {importResult.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {importResult.success || importResult.error}
          <button onClick={() => setImportResult(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Template tip */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-sm text-orange-800">
        <strong>Importing from Excel?</strong> Download the template above — it shows exactly what columns are needed: <code className="bg-orange-100 px-1 rounded">date</code>, <code className="bg-orange-100 px-1 rounded">category</code>, <code className="bg-orange-100 px-1 rounded">amount</code>, <code className="bg-orange-100 px-1 rounded">note</code>. Date format: YYYY-MM-DD.
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm col-span-2 md:col-span-1">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">{fmt(grandTotal)}</p>
        </div>
        {totalByCategory.slice(0, 3).map(c => (
          <div key={c.cat} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">{c.cat}</p>
            <p className="text-2xl font-bold text-zinc-900">{fmt(c.total)}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                {["Date", "Category", "Amount", "Note", ""].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-zinc-400">Loading...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-zinc-400">No expenses yet. Add one or import from Excel.</td></tr>
              ) : expenses.map(e => (
                <tr key={e.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-zinc-700">{e.date}</td>
                  <td className="px-5 py-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-100 text-zinc-600">{e.category}</span>
                  </td>
                  <td className="px-5 py-3 font-bold text-red-600">{fmt(e.amount)}</td>
                  <td className="px-5 py-3 text-zinc-500 max-w-xs truncate">{e.note || "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-zinc-900">{editing ? "Edit Expense" : "Add Expense"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Amount ($)</label>
                <input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Note (optional)</label>
                <input type="text" placeholder="e.g. Monthly thread supply order" value={form.note} onChange={e => setForm(f => ({...f, note: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={!form.date || !form.amount} className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-400 transition-all disabled:opacity-40 shadow-lg shadow-orange-500/20">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
