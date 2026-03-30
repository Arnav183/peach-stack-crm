import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, MoreHorizontal, Eye, Edit2, Trash2, X, KeyRound, ShieldOff, Users, Upload, Download, Check, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";

const STATUS_COLORS: any = {
  Active: "bg-emerald-100 text-emerald-800",
  Inactive: "bg-zinc-100 text-zinc-600",
  VIP: "bg-purple-100 text-purple-800",
  New: "bg-blue-100 text-blue-800",
  "At Risk": "bg-red-100 text-red-700",
};

export default function Clients() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get("add") === "true");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", notes: "", status: "New" });
  const [editingClient, setEditingClient] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [importResult, setImportResult] = useState<{ success?: string; error?: string } | null>(null);
  const [planServices, setPlanServices] = useState<string[]>([]);
  const PER_PAGE = 15;
  const menuRef = useRef<HTMLDivElement>(null);
  const hasCRM = planServices.includes("crm");

  const load = () => {
    fetch("/api/clients").then(r => r.json()).then(setClients).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    fetch("/api/business/profile").then(r => r.json()).then((d) => {
      try {
        const parsed = JSON.parse(d.plan_services || "[]");
        setPlanServices(Array.isArray(parsed) ? parsed : []);
      } catch {
        setPlanServices([]);
      }
    }).catch(() => setPlanServices([]));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setActiveMenu(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchVal = searchParams.get("search");
    if (searchVal !== null) setSearch(searchVal);
    if (searchParams.get("add") === "true") {
      setIsModalOpen(true);
      const p = new URLSearchParams(searchParams);
      p.delete("add");
      setSearchParams(p, { replace: true });
    }
  }, [searchParams]);

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newClient) });
    if (res.ok) {
      const d = await res.json();
      setClients([{ ...newClient, id: d.id, created_at: new Date().toISOString(), portal_user: null }, ...clients]);
      setIsModalOpen(false);
      setNewClient({ name: "", email: "", phone: "", notes: "", status: "New" });
    }
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/clients/${editingClient.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingClient) });
    if (res.ok) { setClients(clients.map(c => c.id === editingClient.id ? { ...c, ...editingClient } : c)); setIsEditModalOpen(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this client and all their appointments?")) return;
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) { setClients(clients.filter(c => c.id !== id)); setActiveMenu(null); }
  };

  const handleGiveAccess = (client: any) => {
    navigate(`/dashboard/accounts`);
  };

  const handleRevokeAccess = async (client: any) => {
    if (!window.confirm(`Revoke portal access for ${client.name}?`)) return;
    if (!client?.portal_user?.id) {
      window.alert("No portal access found for this client.");
      return;
    }
    await fetch(`/api/accounts/${client.portal_user.id}`, { method: "DELETE" });
    load();
  };

  const inp = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all text-sm";

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
        name: r.name || r.Name || "",
        email: r.email || r.Email || "",
        phone: r.phone || r.Phone || "",
        notes: r.notes || r.Notes || "",
        status: r.status || r.Status || "New",
      }));
      const res = await fetch("/api/clients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: mapped }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Import failed");
      setImportResult({ success: `Imported ${result.imported} clients.` });
      load();
    } catch (error) {
      console.error("Clients import failed:", error);
      setImportResult({ error: "Import failed. Download the template and keep the same column headers." });
    }
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const templateRows = [
      { name: "Jane Doe", email: "jane@example.com", phone: "404-000-1111", status: "VIP", notes: "Returning client from website" },
      { name: "Alex Rivera", email: "alex@example.com", phone: "404-000-2222", status: "New", notes: "Imported from booking list" },
    ];
    const guide = [
      { column: "name", required: "Yes", notes: "Client full name" },
      { column: "email", required: "No", notes: "Recommended for matching and portal access" },
      { column: "phone", required: "No", notes: "Optional contact number" },
      { column: "status", required: "No", notes: "Defaults to New" },
      { column: "notes", required: "No", notes: "Optional free text" },
    ];
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(templateRows);
    ws1["!cols"] = [{ wch: 20 }, { wch: 28 }, { wch: 16 }, { wch: 12 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Clients Import");
    const ws2 = XLSX.utils.json_to_sheet(guide);
    ws2["!cols"] = [{ wch: 14 }, { wch: 10 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Column Guide");
    XLSX.writeFile(wb, "clients_import_template.xlsx");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statuses = ["All", "VIP", "Active", "New", "At Risk", "Inactive"];

  return (
    <div className="space-y-6 p-8 min-h-screen bg-slate-50">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 text-sm mt-0.5">{clients.length} total clients</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50">
            <Download className="w-4 h-4" /> Template
          </button>
          {hasCRM ? (
            <label className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
              <Upload className="w-4 h-4" /> Import
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
            </label>
          ) : (
            <button disabled className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-slate-100 rounded-xl text-sm font-bold text-slate-400 cursor-not-allowed">
              <Upload className="w-4 h-4" /> Import (CRM plan required)
            </button>
          )}
          <button onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20">
            <Plus className="w-4 h-4" /> Add Client
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
          Client imports are unlocked when <strong>CRM Dashboard</strong> is included in this business plan.
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by name or email..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm" />
        </div>
        <div className="flex gap-1.5">
          {statuses.map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === s ? "bg-[#0f172a] text-white" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-400"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No clients found</p>
            <button onClick={() => setIsModalOpen(true)} className="text-xs font-bold text-orange-500 mt-2 inline-block hover:text-orange-600">+ Add your first client</button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                    <th className="px-6 py-4 font-semibold">Client</th>
                    <th className="px-6 py-4 font-semibold">Contact</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Portal</th>
                    <th className="px-6 py-4 font-semibold">Joined</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map(client => (
                    <tr key={client.id} onClick={() => navigate(`/dashboard/clients/${client.id}`)}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {client.name.split(' ').map((n: any) => n[0]).join('')}
                          </div>
                          <span className="text-sm font-semibold text-slate-900 group-hover:text-orange-500 transition-colors">{client.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700">{client.email}</p>
                        <p className="text-xs text-slate-400">{client.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[client.status] || 'bg-zinc-100 text-zinc-600'}`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {client.portal_user ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            Active
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 font-medium">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {format(parseISO(client.created_at), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 text-right relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setActiveMenu(activeMenu === client.id ? null : client.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {activeMenu === client.id && (
                          <div ref={menuRef} className="absolute right-6 top-12 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20">
                            <Link to={`/dashboard/clients/${client.id}`} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                              <Eye className="w-3.5 h-3.5" /> View Profile
                            </Link>
                            <button onClick={() => { setEditingClient({ ...client }); setIsEditModalOpen(true); setActiveMenu(null); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                              <Edit2 className="w-3.5 h-3.5" /> Edit Client
                            </button>
                            <div className="h-px bg-slate-100 my-1" />
                            {client.portal_user ? (
                              <button onClick={() => handleRevokeAccess(client)}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50">
                                <ShieldOff className="w-3.5 h-3.5" /> Revoke Portal Access
                              </button>
                            ) : (
                              <button onClick={() => handleGiveAccess(client)}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50">
                                <KeyRound className="w-3.5 h-3.5" /> Give Portal Access
                              </button>
                            )}
                            <div className="h-px bg-slate-100 my-1" />
                            <button onClick={() => handleDelete(client.id)}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
              <p className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-800">{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)}</span> of <span className="font-semibold text-slate-800">{filtered.length}</span> clients
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  ← Prev
                </button>
                <span className="text-xs text-slate-400 font-medium">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add New Client</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddClient} className="p-6 space-y-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label><input required type="text" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className={inp} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label><input required type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} className={inp} /></div>
                <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label><input type="tel" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className={inp} /></div>
              </div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                <select value={newClient.status} onChange={e => setNewClient({...newClient, status: e.target.value})} className={inp}>
                  {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label><textarea rows={3} value={newClient.notes} onChange={e => setNewClient({...newClient, notes: e.target.value})} className={inp + " resize-none"} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-400 shadow-lg shadow-orange-500/20">Create Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Edit Client</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditClient} className="p-6 space-y-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label><input required type="text" value={editingClient.name} onChange={e => setEditingClient({...editingClient, name: e.target.value})} className={inp} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label><input required type="email" value={editingClient.email} onChange={e => setEditingClient({...editingClient, email: e.target.value})} className={inp} /></div>
                <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label><input type="tel" value={editingClient.phone} onChange={e => setEditingClient({...editingClient, phone: e.target.value})} className={inp} /></div>
              </div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                <select value={editingClient.status} onChange={e => setEditingClient({...editingClient, status: e.target.value})} className={inp}>
                  {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label><textarea rows={3} value={editingClient.notes || ""} onChange={e => setEditingClient({...editingClient, notes: e.target.value})} className={inp + " resize-none"} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#0f172a] text-white rounded-xl text-sm font-bold hover:bg-slate-800">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
