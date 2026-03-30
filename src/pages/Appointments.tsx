import { useState, useEffect } from "react";
import { Plus, Search, Calendar, X, Upload, Download, Check, AlertCircle } from "lucide-react";
import { format, parseISO, isFuture } from "date-fns";
import { Link, useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";

const STATUS_STYLES: Record<string, string> = {
  Confirmed: "bg-blue-50 text-blue-700 border-blue-100",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Cancelled: "bg-red-50 text-red-500 border-red-100",
  Pending: "bg-amber-50 text-amber-700 border-amber-100",
  "No Show": "bg-zinc-100 text-zinc-500 border-zinc-200",
};

const STAFF = ["Arnav","Priya","Amelia","Jordan"];

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const inp = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white";

export default function Appointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Upcoming");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState({ client_id: "", service: "Brow Threading", staff: "Arnav", date: "", duration: "60", price: "", tip: "0", status: "Confirmed", notes: "", is_walkin: false });
  const [saving, setSaving] = useState(false);
  const [importResult, setImportResult] = useState<{ success?: string; error?: string } | null>(null);
  const [planServices, setPlanServices] = useState<string[]>([]);

  const hasCRM = planServices.includes("crm");
  const loadPlan = () => {
    fetch("/api/business/profile").then(r => r.json()).then((d) => {
      try {
        const parsed = JSON.parse(d.plan_services || "[]");
        setPlanServices(Array.isArray(parsed) ? parsed : []);
      } catch {
        setPlanServices([]);
      }
    }).catch(() => setPlanServices([]));
  };
  const loadData = () => {
    Promise.all([
      fetch("/api/appointments").then(r=>r.json()),
      fetch("/api/clients").then(r=>r.json()),
      fetch("/api/services").then(r=>r.json()),
    ]).then(([a,c,s]) => {
      setAppointments(a);
      setClients(c);
      setServices(Array.isArray(s) ? s : []);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { loadPlan(); loadData(); }, []);
  useEffect(() => {
    if (!services.length) return;
    setForm((prev) => {
      if (services.some((s: any) => s.name === prev.service)) return prev;
      return { ...prev, service: services[0].name, duration: String(services[0].duration || 60), price: String(services[0].price || "") };
    });
  }, [services]);
  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setShowModal(true);
      const p = new URLSearchParams(searchParams);
      p.delete("add");
      setSearchParams(p, { replace: true });
    }
  }, [searchParams]);

  const filtered = appointments.filter(a => {
    const past = !isFuture(parseISO(a.date));
    const matchFilter = filter === "All" ? true : filter === "Upcoming" ? !past : filter === "Past" ? past : a.status === filter;
    const matchSearch = !search || a.client_name?.toLowerCase().includes(search.toLowerCase()) || a.service?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    Upcoming: appointments.filter(a => isFuture(parseISO(a.date))).length,
    Past: appointments.filter(a => !isFuture(parseISO(a.date))).length,
    Cancelled: appointments.filter(a => a.status === "Cancelled").length,
  };

  const updateStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/appointments/${id}/status`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({status}) });
    if (res.ok) setAppointments(appointments.map(a => a.id === id ? {...a, status} : a));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const body = { ...form, client_id: form.is_walkin ? null : parseInt(form.client_id) || null, duration: parseInt(form.duration), price: parseFloat(form.price), tip: parseFloat(form.tip) || 0, is_walkin: form.is_walkin ? 1 : 0 };
    const res = await fetch("/api/appointments", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) });
    if (res.ok) { setShowModal(false); loadData(); setForm({ client_id:"", service:"Brow Threading", staff:"Arnav", date:"", duration:"60", price:"", tip:"0", status:"Confirmed", notes:"", is_walkin:false }); }
    setSaving(false);
  };

  const handleServiceChange = (value: string) => {
    const service = services.find((s: any) => s.name === value);
    setForm({
      ...form,
      service: value,
      duration: service ? String(service.duration || 60) : form.duration,
      price: service ? String(service.price || "") : form.price,
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      if (!wb.SheetNames?.length) throw new Error("Invalid file format or empty spreadsheet");
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);
      const mapped = rows.map((r) => ({
        client_name: r.client_name || r.ClientName || r.client || r.Client || "",
        client_email: r.client_email || r.ClientEmail || r.email || r.Email || "",
        client_phone: r.client_phone || r.ClientPhone || r.phone || r.Phone || "",
        service: r.service || r.Service || "",
        staff: r.staff || r.Staff || "",
        date: r.date || r.Date || r.start_time || r.StartTime || "",
        duration: parseInt(r.duration || r.Duration || 60, 10) || 60,
        price: parseFloat(r.price || r.Price || 0),
        tip: parseFloat(r.tip || r.Tip || 0),
        status: r.status || r.Status || "Confirmed",
        notes: r.notes || r.Notes || "",
      }));
      const res = await fetch("/api/appointments/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: mapped }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Import failed");
      setImportResult({ success: `Imported ${result.imported} appointments.` });
      loadData();
    } catch (error) {
      console.error("Appointments import failed:", error);
      setImportResult({ error: "Import failed. Use the template format and valid date/time values." });
    }
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const templateRows = [
      { client_name: "Jane Doe", client_email: "jane@example.com", client_phone: "404-000-1111", service: "Brow Threading", staff: "Priya", date: "2026-03-30T14:30:00Z", duration: 30, price: 25, tip: 5, status: "Confirmed", notes: "Imported from template" },
      { client_name: "Walk-in", client_email: "", client_phone: "", service: "Lash Lift", staff: "Arnav", date: "2026-03-31T16:00:00Z", duration: 60, price: 80, tip: 0, status: "Pending", notes: "No client email = matches by name or walk-in" },
    ];
    const guide = [
      { column: "client_name", required: "No", notes: "Used to match existing client by name if email not provided" },
      { column: "client_email", required: "No", notes: "Best match key. If new, client is created automatically" },
      { column: "service", required: "Yes", notes: "Service name; added to your service list automatically if new" },
      { column: "date", required: "Yes", notes: "ISO date/time preferred (example: 2026-03-30T14:30:00Z)" },
      { column: "duration", required: "No", notes: "Minutes; defaults to 60" },
      { column: "price", required: "No", notes: "Defaults to 0" },
      { column: "tip", required: "No", notes: "Defaults to 0" },
      { column: "status", required: "No", notes: "Defaults to Confirmed" },
    ];
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(templateRows);
    ws1["!cols"] = [{ wch: 18 }, { wch: 24 }, { wch: 16 }, { wch: 22 }, { wch: 12 }, { wch: 24 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Appointments Import");
    const ws2 = XLSX.utils.json_to_sheet(guide);
    ws2["!cols"] = [{ wch: 18 }, { wch: 10 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Column Guide");
    XLSX.writeFile(wb, "appointments_import_template.xlsx");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 p-8 min-h-screen bg-slate-50">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-500 text-sm mt-0.5">{appointments.length} total · {counts.Upcoming} upcoming</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50">
            <Download className="w-4 h-4" /> Template
          </button>
          {hasCRM ? (
            <label className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 cursor-pointer">
              <Upload className="w-4 h-4" /> Import
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
            </label>
          ) : (
            <button disabled className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-slate-100 text-slate-400 rounded-xl text-sm font-bold cursor-not-allowed">
              <Upload className="w-4 h-4" /> Import (CRM plan required)
            </button>
          )}
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-400 shadow-lg shadow-orange-500/20">
            <Plus className="w-4 h-4" /> New Appointment
          </button>
        </div>
      </div>
      {importResult && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium ${importResult.success ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {importResult.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {importResult.success || importResult.error}
          <button onClick={() => setImportResult(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {!hasCRM && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
          Import and service controls are unlocked when <strong>CRM Dashboard</strong> is included in this business plan.
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {["Upcoming","Past","Cancelled","All"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filter===f?"bg-[#0f172a] text-white":"bg-white text-slate-500 border border-slate-200 hover:border-slate-400"}`}>
              {f} {f !== "All" && <span className="ml-1 opacity-60">{counts[f as keyof typeof counts] ?? ""}</span>}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search client or service..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-64" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No {filter.toLowerCase()} appointments</p>
            <button onClick={() => setShowModal(true)} className="text-xs font-bold text-orange-500 mt-2 inline-block hover:text-orange-600">+ Schedule one</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4 font-semibold">Date & Time</th>
                  <th className="px-6 py-4 font-semibold">Client</th>
                  <th className="px-6 py-4 font-semibold">Service</th>
                  <th className="px-6 py-4 font-semibold">Staff</th>
                  <th className="px-6 py-4 font-semibold">Revenue</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(appt => (
                  <tr key={appt.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">{format(parseISO(appt.date), "MMM d, yyyy")}</p>
                      <p className="text-xs text-slate-400">{format(parseISO(appt.date), "h:mm a")}</p>
                    </td>
                    <td className="px-6 py-4">
                      {appt.client_id ? (
                        <Link to={`/dashboard/clients/${appt.client_id}`} className="text-sm font-semibold text-slate-900 hover:text-orange-500 transition-colors">{appt.client_name}</Link>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Walk-in</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{appt.service}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{appt.staff || "—"}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">{fmt(appt.price || 0)}</p>
                      {appt.tip > 0 && <p className="text-xs text-emerald-600">+{fmt(appt.tip)} tip</p>}
                    </td>
                    <td className="px-6 py-4">
                      <select value={appt.status} onChange={e => updateStatus(appt.id, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400 ${STATUS_STYLES[appt.status] || "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                        {["Confirmed","Pending","Completed","Cancelled","No Show"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">New Appointment</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <input type="checkbox" id="walkin" checked={form.is_walkin} onChange={e => setForm({...form, is_walkin: e.target.checked})} className="rounded" />
                <label htmlFor="walkin" className="text-sm font-semibold text-slate-700 cursor-pointer">Walk-in (no client record)</label>
              </div>
              {!form.is_walkin && (
                <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Client</label>
                  <select required={!form.is_walkin} value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} className={inp}>
                    <option value="">Select client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Service</label>
                  <select value={form.service} onChange={e => handleServiceChange(e.target.value)} className={inp}>
                    {services.length ? services.map((s: any) => <option key={s.id}>{s.name}</option>) : <option>Brow Threading</option>}
                  </select>
                </div>
                <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Staff</label>
                  <select value={form.staff} onChange={e => setForm({...form, staff: e.target.value})} className={inp}>
                    {STAFF.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Date & Time</label>
                <input required type="datetime-local" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className={inp} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Duration (min)</label>
                  <input type="number" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} className={inp} />
                </div>
                <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Price ($)</label>
                  <input required type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className={inp} />
                </div>
                <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Tip ($)</label>
                  <input type="number" step="0.01" value={form.tip} onChange={e => setForm({...form, tip: e.target.value})} className={inp} />
                </div>
              </div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={inp}>
                  {["Confirmed","Pending","Completed","Cancelled"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={inp + " resize-none"} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-400 disabled:opacity-50 shadow-lg shadow-orange-500/20">{saving ? "Saving..." : "Create Appointment"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
