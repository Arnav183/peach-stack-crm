import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ChevronLeft, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  DollarSign,
  Edit2,
  Save
} from "lucide-react";
import { format, parseISO } from "date-fns";

const STATUS_COLORS: any = {
  'Active': 'bg-emerald-100 text-emerald-800',
  'Inactive': 'bg-zinc-100 text-zinc-800',
  'VIP': 'bg-purple-100 text-purple-800',
  'New': 'bg-blue-100 text-blue-800',
  'At Risk': 'bg-red-100 text-red-800',
};

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setClient(data);
        setEditedClient(data);
        setNotes(data.notes || "");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editedClient),
    });
    if (res.ok) {
      setClient(editedClient);
      setIsEditing(false);
    }
  };

  const handleSaveNotes = async () => {
    const updated = { ...client, notes };
    await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setClient(updated);
    setEditedClient(updated);
    setIsEditingNotes(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;
  if (!client) return <div className="flex items-center justify-center h-64">Client not found</div>;

  const totalSpent = client.appointments.reduce((sum: number, a: any) => sum + a.price, 0);
  const avgSpend = totalSpent / (client.appointments.length || 1);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/dashboard/clients" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to Clients
        </Link>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_COLORS[client.status] || 'bg-zinc-100 text-zinc-800'}`}>
          {client.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
            {!isEditing ? (
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-zinc-900 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {client.name.split(' ').map((n: any) => n[0]).join('')}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-zinc-900">{client.name}</h1>
                    <p className="text-zinc-500 mt-1">Client since {format(parseISO(client.created_at), "MMMM d, yyyy")}</p>
                    <div className="flex flex-wrap items-center gap-6 mt-4">
                      <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                        <Mail className="w-4 h-4 text-zinc-400" />
                        {client.email}
                      </a>
                      <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                        <Phone className="w-4 h-4 text-zinc-400" />
                        {client.phone}
                      </a>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors shadow-sm"
                >
                  <Edit2 className="w-4 h-4 text-zinc-600" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdateClient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      value={editedClient.name}
                      onChange={(e) => setEditedClient({ ...editedClient, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      value={editedClient.email}
                      onChange={(e) => setEditedClient({ ...editedClient, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Phone</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      value={editedClient.phone}
                      onChange={(e) => setEditedClient({ ...editedClient, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Status</label>
                    <select
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      value={editedClient.status}
                      onChange={(e) => setEditedClient({ ...editedClient, status: e.target.value })}
                    >
                      <option value="New">New</option>
                      <option value="Active">Active</option>
                      <option value="VIP">VIP</option>
                      <option value="At Risk">At Risk</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 font-medium hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-200">
              <h3 className="text-lg font-bold text-zinc-900">Appointment History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Service</th>
                    <th className="px-6 py-4 font-semibold">Duration</th>
                    <th className="px-6 py-4 font-semibold">Price</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {client.appointments.map((appt: any) => (
                    <tr key={appt.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-zinc-900">
                        {format(parseISO(appt.date), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600">{appt.service}</td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{appt.duration} min</td>
                      <td className="px-6 py-4 text-sm font-semibold text-zinc-900">${appt.price}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          appt.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          appt.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-zinc-900">Notes</h3>
              <button 
                onClick={() => isEditingNotes ? handleSaveNotes() : setIsEditingNotes(true)}
                className="text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                {isEditingNotes ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              </button>
            </div>
            {isEditingNotes ? (
              <textarea 
                autoFocus
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleSaveNotes}
                className="w-full p-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 min-h-[150px] text-sm"
              />
            ) : (
              <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
                {client.notes || "No notes added for this client."}
              </p>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-zinc-900">Client Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 rounded-xl">
                <p className="text-xs font-medium text-zinc-500 uppercase">Visits</p>
                <p className="text-xl font-bold text-zinc-900 mt-1">{client.appointments.length}</p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-xl">
                <p className="text-xs font-medium text-zinc-500 uppercase">Total Spent</p>
                <p className="text-xl font-bold text-zinc-900 mt-1">${totalSpent}</p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-xl">
                <p className="text-xs font-medium text-zinc-500 uppercase">Avg Visit</p>
                <p className="text-xl font-bold text-zinc-900 mt-1">${avgSpend.toFixed(0)}</p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-xl">
                <p className="text-xs font-medium text-zinc-500 uppercase">Last Visit</p>
                <p className="text-sm font-bold text-zinc-900 mt-1">
                  {client.appointments[0] ? format(parseISO(client.appointments[0].date), "MMM d") : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
