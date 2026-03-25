import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, X, Check, Clock, AlertCircle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Paid:      "bg-green-100 text-green-700",
  Unpaid:    "bg-yellow-100 text-yellow-700",
  Overdue:   "bg-red-100 text-red-700",
};

const EMPTY_FORM = { client_id: "", client_name: "", client_email: "", due_date: "", notes: "", status: "Unpaid", items: [{ description: "", amount: "" }] };

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);

  const fetchAll = () => {
    Promise.all([
      fetch("/api/invoices").then(r => r.json()),
      fetch("/api/clients").then(r => r.json()),
    ]).then(([inv, cli]) => { setInvoices(inv); setClients(cli); }).finally(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, due_date: new Date(Date.now() + 14*86400000).toISOString().split("T")[0] });
    setShowForm(true);
  };
  const openEdit = (inv: any) => {
    setEditing(inv);
    setForm({ ...inv, items: JSON.parse(inv.items || "[]").length ? JSON.parse(inv.items) : [{ description: "", amount: "" }] });
    setShowForm(true);
  };

  const setItem = (i: number, field: string, val: string) => {
    setForm((f: any) => { const items = [...f.items]; items[i] = { ...items[i], [field]: val }; return { ...f, items }; });
  };
  const addItem = () => setForm((f: any) => ({ ...f, items: [...f.items, { description: "", amount: "" }] }));
  const removeItem = (i: number) => setForm((f: any) => ({ ...f, items: f.items.filter((_: any, idx: number) => idx !== i) }));

  const total = form.items.reduce((s: number, it: any) => s + (parseFloat(it.amount) || 0), 0);

  const handleClientSelect = (id: string) => {
    const c = clients.find((c: any) => String(c.id) === id);
    setForm((f: any) => ({ ...f, client_id: id, client_name: c?.name || "", client_email: c?.email || "" }));
  };

  const handleSave = async () => {
    if (!form.client_name || total <= 0) return;
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/invoices/${editing.id}` : "/api/invoices";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: total }) });
    setShowForm(false);
    fetchAll();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this invoice?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const markPaid = async (inv: any) => {
    await fetch(`/api/invoices/${inv.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...inv, status: "Paid", items: inv.items }) });
    fetchAll();
  };

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const totalUnpaid = invoices.filter(i => i.status === "Unpaid" || i.status === "Overdue").reduce((s, i) => s + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Invoices</h1>
          <p className="text-zinc-500 text-sm">Create and track client invoices.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-medium text-sm transition-all">
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Total Invoiced</p>
          <p className="text-2xl font-bold text-zinc-900">{fmt(invoices.reduce((s, i) => s + i.amount, 0))}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Collected</p>
          <p className="text-2xl font-bold text-green-600">{fmt(totalPaid)}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-yellow-600">{fmt(totalUnpaid)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                {["Client", "Amount", "Due Date", "Status", "Notes", ""].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-zinc-400">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-zinc-400">No invoices yet. Create your first one.</td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-zinc-900">{inv.client_name}</p>
                    {inv.client_email && <p className="text-xs text-zinc-400">{inv.client_email}</p>}
                  </td>
                  <td className="px-5 py-3 font-bold text-zinc-900">{fmt(inv.amount)}</td>
                  <td className="px-5 py-3 text-zinc-500">{inv.due_date || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${STATUS_COLORS[inv.status] || "bg-zinc-100 text-zinc-600"}`}>{inv.status}</span>
                  </td>
                  <td className="px-5 py-3 text-zinc-400 max-w-xs truncate">{inv.notes || "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2 justify-end">
                      {inv.status !== "Paid" && (
                        <button onClick={() => markPaid(inv)} title="Mark Paid" className="p-1.5 rounded-lg hover:bg-green-50 text-zinc-400 hover:text-green-600 transition-all"><Check className="w-3.5 h-3.5" /></button>
                      )}
                      <button onClick={() => openEdit(inv)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(inv.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-zinc-900">{editing ? "Edit Invoice" : "New Invoice"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-zinc-100 rounded-xl"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              {/* Client */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Client</label>
                <select value={form.client_id} onChange={e => handleClientSelect(e.target.value)} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white mb-2">
                  <option value="">— Select existing client —</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input placeholder="Or type client name manually" value={form.client_name} onChange={e => setForm((f: any) => ({...f, client_name: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-2" />
                <input placeholder="Client email (optional)" value={form.client_email} onChange={e => setForm((f: any) => ({...f, client_email: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>

              {/* Line items */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Line Items</label>
                <div className="space-y-2">
                  {form.items.map((item: any, i: number) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input placeholder="Description" value={item.description} onChange={e => setItem(i, "description", e.target.value)} className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      <input type="number" placeholder="$0" min="0" step="0.01" value={item.amount} onChange={e => setItem(i, "amount", e.target.value)} className="w-24 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      {form.items.length > 1 && <button onClick={() => removeItem(i)} className="p-1.5 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>}
                    </div>
                  ))}
                </div>
                <button onClick={addItem} className="mt-2 text-xs text-orange-500 font-semibold hover:underline">+ Add line item</button>
              </div>

              <div className="flex items-center justify-between bg-zinc-50 rounded-xl px-4 py-3">
                <span className="text-sm font-bold text-zinc-700">Total</span>
                <span className="text-lg font-bold text-zinc-900">{fmt(total)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm((f: any) => ({...f, due_date: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm((f: any) => ({...f, status: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                    {["Unpaid", "Paid", "Overdue"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Notes (optional)</label>
                <textarea rows={2} placeholder="Payment terms, project details..." value={form.notes} onChange={e => setForm((f: any) => ({...f, notes: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50">Cancel</button>
              <button onClick={handleSave} disabled={!form.client_name || total <= 0} className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-40">Save Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
