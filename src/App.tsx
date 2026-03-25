import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Appointments from "./pages/Appointments";
import Revenue from "./pages/Revenue";
import Expenses from "./pages/Expenses";
import Invoices from "./pages/Invoices";
import Settings from "./pages/Settings";
import Accounts from "./pages/Accounts";
import Sidebar from "./components/Sidebar";
import PortalLayout from "./components/PortalSidebar";
import PortalHome from "./pages/portal/PortalHome";
import PortalAppointments from "./pages/portal/PortalAppointments";
import PortalInvoices from "./pages/portal/PortalInvoices";
import PortalProfile from "./pages/portal/PortalProfile";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/30">PS</div>
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={user.role === 'client' ? '/portal' : '/dashboard'} /> : <Login onLogin={setUser} />} />

        <Route path="/dashboard/*" element={
          user && user.role === 'admin' ? (
            <div className="flex min-h-screen bg-slate-50">
              <Sidebar user={user} onLogout={() => setUser(null)} />
              <main className="flex-1 overflow-y-auto min-w-0">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/clients/:id" element={<ClientDetail />} />
                  <Route path="/appointments" element={<Appointments />} />
                  <Route path="/revenue" element={<Revenue />} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/settings" element={<Settings user={user} />} />
                </Routes>
              </main>
            </div>
          ) : user && user.role === 'client' ? <Navigate to="/portal" /> : <Navigate to="/login" />
        } />

        <Route path="/portal/*" element={
          user && user.role === 'client' ? (
            <PortalLayout user={user} onLogout={() => setUser(null)}>
              <Routes>
                <Route path="/" element={<PortalHome user={user} />} />
                <Route path="/appointments" element={<PortalAppointments />} />
                <Route path="/invoices" element={<PortalInvoices />} />
                <Route path="/profile" element={<PortalProfile user={user} onUpdate={setUser} />} />
              </Routes>
            </PortalLayout>
          ) : user && user.role === 'admin' ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
        } />

        <Route path="/" element={<Navigate to={user ? (user.role === 'client' ? '/portal' : '/dashboard') : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}
