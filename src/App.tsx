import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

// Auth pages
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";

// Superadmin pages
import SuperSidebar from "./components/SuperSidebar";
import SuperDashboard from "./pages/super/SuperDashboard";
import SuperBusinesses from "./pages/super/SuperBusinesses";
import SuperQuote from "./pages/super/SuperQuote";

// Business pages
import BusinessSidebar from "./components/BusinessSidebar";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Appointments from "./pages/Appointments";
import Revenue from "./pages/Revenue";
import Expenses from "./pages/Expenses";
import Invoices from "./pages/Invoices";
import Accounts from "./pages/Accounts";
import Settings from "./pages/Settings";

// Customer portal pages
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/30">PS</div>
        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  const isSuperAdmin = user?.role === "superadmin";
  const isBusinessAdmin = user?.role === "business_admin" || user?.role === "business_staff";
  const isCustomer = user?.role === "customer";

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Superadmin login (hidden URL) ── */}
        <Route path="/admin" element={
          isSuperAdmin ? <Navigate to="/super/dashboard" /> : <AdminLogin onLogin={setUser} />
        } />

        {/* ── Business/customer login ── */}
        <Route path="/login" element={
          isSuperAdmin ? <Navigate to="/super/dashboard" /> :
          isBusinessAdmin ? <Navigate to="/dashboard" /> :
          isCustomer ? <Navigate to="/portal" /> :
          <Login onLogin={setUser} />
        } />

        {/* ── Superadmin area ── */}
        <Route path="/super/*" element={
          isSuperAdmin ? (
            <div className="flex min-h-screen bg-slate-50">
              <SuperSidebar user={user} onLogout={() => setUser(null)} />
              <main className="flex-1 overflow-y-auto min-w-0 pt-14 lg:pt-0">
                <Routes>
                  <Route path="/dashboard" element={<SuperDashboard />} />
                  <Route path="/businesses" element={<SuperBusinesses />} />
                  <Route path="*" element={<Navigate to="/super/dashboard" />} />
                </Routes>
              </main>
            </div>
          ) : <Navigate to="/admin" />
        } />

        {/* ── Business admin area ── */}
        <Route path="/dashboard/*" element={
          isBusinessAdmin ? (
            <div className="flex min-h-screen bg-slate-50">
              <BusinessSidebar user={user} onLogout={() => setUser(null)} />
              <main className="flex-1 overflow-y-auto min-w-0 pt-14 lg:pt-0">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/clients/:id" element={<ClientDetail />} />
                  <Route path="/appointments" element={<Appointments />} />
                  <Route path="/revenue" element={<Revenue user={user} />} />
                  <Route path="/expenses" element={<Expenses user={user} />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/settings" element={<Settings user={user} />} />
                </Routes>
              </main>
            </div>
          ) : isSuperAdmin ? <Navigate to="/super/dashboard" /> : <Navigate to="/login" />
        } />

        {/* ── Customer portal ── */}
        <Route path="/portal/*" element={
          isCustomer ? (
            <PortalLayout user={user} onLogout={() => setUser(null)}>
              <Routes>
                <Route path="/" element={<PortalHome user={user} />} />
                <Route path="/appointments" element={<PortalAppointments />} />
                <Route path="/invoices" element={<PortalInvoices />} />
                <Route path="/profile" element={<PortalProfile user={user} onUpdate={setUser} />} />
              </Routes>
            </PortalLayout>
          ) : isBusinessAdmin ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
        } />

        {/* ── Root redirect ── */}
        <Route path="/" element={
          isSuperAdmin ? <Navigate to="/super/dashboard" /> :
          isBusinessAdmin ? <Navigate to="/dashboard" /> :
          isCustomer ? <Navigate to="/portal" /> :
          <Navigate to="/login" />
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
