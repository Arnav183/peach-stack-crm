import { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreHorizontal } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";

export default function Appointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Upcoming"); // Upcoming, Past, All

  useEffect(() => {
    fetch("/api/appointments")
      .then((res) => res.json())
      .then((data) => setAppointments(data))
      .finally(() => setLoading(false));
  }, []);

  const filteredAppointments = appointments.filter(appt => {
    const isPast = new Date(appt.date) < new Date();
    if (filter === "Upcoming") return !isPast;
    if (filter === "Past") return isPast;
    return true;
  });

  const updateStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/appointments/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a));
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Appointments</h1>
          <p className="text-zinc-500">View and manage your schedule.</p>
        </div>
        <button className="bg-zinc-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-zinc-800 transition-colors">
          <Plus className="w-4 h-4" />
          New Appointment
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex bg-white p-1 rounded-xl border border-zinc-200 shadow-sm">
          {["Upcoming", "Past", "All"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f 
                  ? "bg-zinc-900 text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Client</th>
                <th className="px-6 py-4 font-semibold">Service</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredAppointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-zinc-900">
                      {format(parseISO(appt.date), "MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {format(parseISO(appt.date), "h:mm a")}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/dashboard/clients/${appt.client_id}`} className="text-sm font-medium text-zinc-900 hover:underline">
                      {appt.client_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{appt.service}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-zinc-900">${appt.price}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={appt.status}
                      onChange={(e) => updateStatus(appt.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-lg border-none focus:ring-2 focus:ring-zinc-900 cursor-pointer ${
                        appt.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        appt.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 rounded-lg hover:bg-zinc-200 transition-colors text-zinc-400">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
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
