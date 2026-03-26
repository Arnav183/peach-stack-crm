import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, X, Check, DollarSign, Clock, FileText } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Paid: "bg-green-100 text-green-700",
  Unpaid: "bg-red-100 text-red-700",
  Overdue: "bg-orange-100 text-orange-700",
};

const EMPTY_ITEM = { description: "", quantity: 1, rate: "" };

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({
    client_id: "", client_name: "", client_email: "",
    status: "Unpaid", due_date: "", notes: "", items: [{ ...EMPTY_ITEM }]
  });

  const fetch_ = () => {
    Promise.all([
      fetch("/api/invoices").then(r => r.json()),
      fetch("/api/clients").then(r => r.json()),
    ]).then(([inv, cli]) => { setInvoices(inv); setClients(cli); }).finally(() => setLoading(false));
  };
  useEffect(() => { fetch_(); }, []);

  const calcTotal = (items: any[]) => items.reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseInt(i.quantity) || 0), 0);

  const openAdd = () => {
    setEditing(null);
    const due = new Date(); due.setDate(due.getDate() + 14);
    setForm({ client_id: "", client_name: "", client_email: "", status: "Unpaid", due_date: due.toISOString().split("T")[0], notes: "", items: [{ ...EMPTY_ITEM }] });
    setShowForm(true);
  };
  const openEdit = (inv: any) => {
    setEditing(inv);
    setForm({ ...inv, items: JSON.parse(inv.items || "[]") });
    setShowForm(true);
  };

  const handleClientChange = (clientId: string) => {
    const c = clients.find(c => c.id === parseInt(clientId));
    setForm((f: any) => ({ ...f, client_id: clientId, client_name: c?.name || "", client_email: c?.email || "" }));
  };

  const handleSave = async () => {
    const total = calcTotal(form.items);
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/invoices/${editing.id}` : "/api/invoices";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: total }) });
    setShowForm(false);
    fetch_();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this invoice?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    fetch_();
  };

  const markPaid = async (inv: any) => {
    await fetch(`/api/invoices/${inv.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...inv, items: JSON.parse(inv.items || "[]"), status: "Paid" }) });
    fetch_();
  };

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
  const totalUnpaid = invoices.filter(i => i.status === "Unpaid" || i.status === "Overdue").reduce((s, i) => s + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Invoices</h1>
          <p className="text-zinc-500 text-sm">Create, send, and track client invoices.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 text-sm bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-medium transition-all self-start">
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2"><div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><Check className="w-4 h-4 text-green-600" /></div><p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Collected</p></div>
          <p className="text-2xl font-bold text-green-600">{fmt(totalPaid)}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2"><div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"><Clock className="w-4 h-4 text-red-600" /></div><p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Outstanding</p></div>
          <p className="text-2xl font-bold text-red-600">{fmt(totalUnpaid)}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2"><div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4 text-zinc-600" /></div><p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Invoices</p></div>
          <p className="text-2xl font-bold text-zinc-900">{invoices.length}</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>{["Client","Amount","Status","Due Date",""].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? <tr><td colSpan={5} className="px-5 py-12 text-center text-zinc-400">Loading...</td></tr>
              : invoices.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center text-zinc-400">No invoices yet. Create your first one.</td></tr>
              : invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3"><p className="font-semibold text-zinc-900">{inv.client_name || "—"}</p><p className="text-xs text-zinc-400">{inv.client_email || ""}</p></td>
                  <td className="px-5 py-3 font-bold text-zinc-900">{fmt(inv.amount)}</td>
                  <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${STATUS_COLORS[inv.status] || "bg-zinc-100 text-zinc-600"}`}>{inv.status}</span></td>
                  <td className="px-5 py-3 text-zinc-500">{inv.due_date || "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2 justify-end">
                      {inv.status !== "Paid" && <button onClick={() => markPaid(inv)} className="p-1.5 rounded-lg hover:bg-green-50 text-zinc-400 hover:text-green-600 transition-all" title="Mark Paid"><DollarSign className="w-3.5 h-3.5" /></button>}
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

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-zinc-900">{editing ? "Edit Invoice" : "New Invoice"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-zinc-100 rounded-xl"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Client</label>
                <select value={form.client_id} onChange={e => handleClientChange(e.target.value)} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                  <option value="">Select a client or enter manually below</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Name</label><input type="text" value={form.client_name} onChange={e => setForm((f: any) => ({...f, client_name: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
                <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Email</label><input type="email" value={form.client_email} onChange={e => setForm((f: any) => ({...f, client_email: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Status</label><select value={form.status} onChange={e => setForm((f: any) => ({...f, status: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">{["Unpaid","Paid","Overdue"].map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Due Date</label><input type="date" value={form.due_date} onChange={e => setForm((f: any) => ({...f, due_date: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Line Items</label>
                <div className="space-y-2">
                  {form.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <input type="text" placeholder="Description (e.g. Website Build)" value={item.description} onChange={e => { const items = [...form.items]; items[idx].description = e.target.value; setForm((f: any) => ({...f, items})); }} className="flex-1 px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      <input type="number" placeholder="Qty" min="1" value={item.quantity} onChange={e => { const items = [...form.items]; items[idx].quantity = e.target.value; setForm((f: any) => ({...f, items})); }} className="w-16 px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      <input type="number" placeholder="$ Rate" min="0" step="0.01" value={item.rate} onChange={e => { const items = [...form.items]; items[idx].rate = e.target.value; setForm((f: any) => ({...f, items})); }} className="w-24 px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      {form.items.length > 1 && <button onClick={() => setForm((f: any) => ({...f, items: f.items.filter((_: any, i: number) => i !== idx)}))} className="p-2 text-zinc-400 hover:text-red-500"><X className="w-4 h-4" /></button>}
                    </div>
                  ))}
                </div>
                <button onClick={() => setForm((f: any) => ({...f, items: [...f.items, { ...EMPTY_ITEM }]}))} className="mt-2 text-xs text-orange-600 font-semibold hover:text-orange-700">+ Add line item</button>
              </div>
              <div className="bg-zinc-50 rounded-xl p-3 text-right">
                <span className="text-sm text-zinc-500 mr-2">Total:</span>
                <span className="text-lg font-bold text-zinc-900">{fmt(calcTotal(form.items))}</span>
              </div>
              <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm((f: any) => ({...f, notes: e.target.value}))} className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800">Save Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
