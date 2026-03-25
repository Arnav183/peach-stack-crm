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
import Sidebar from "./components/Sidebar";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => { if (data.user) setUser(data.user); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">PS</div>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-900"></div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={setUser} />} />
        <Route
          path="/dashboard/*"
          element={
            user ? (
              <div className="flex min-h-screen bg-zinc-50">
                <Sidebar user={user} onLogout={() => setUser(null)} />
                <main className="flex-1 p-8 overflow-y-auto min-w-0">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/clients/:id" element={<ClientDetail />} />
                    <Route path="/appointments" element={<Appointments />} />
                    <Route path="/revenue" element={<Revenue />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/settings" element={<Settings user={user} />} />
                  </Routes>
                </main>
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
