import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Appointments from './pages/Appointments';
import Invoices from './pages/Invoices';
import Expenses from './pages/Expenses';
import Revenue from './pages/Revenue';
import Settings from './pages/Settings';
import Accounts from './pages/Accounts';
import Sidebar from './components/Sidebar';
import SuperSidebar from './components/SuperSidebar';
import SuperDashboard from './pages/super/SuperDashboard';
import SuperBusinesses from './pages/super/SuperBusinesses';
import SuperBusinessDetail from './pages/super/SuperBusinessDetail';
import SuperQuote from './pages/super/SuperQuote';
import AppErrorBoundary from './components/AppErrorBoundary';

function BizLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

function SupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <SuperSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

function OwnerRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  if (role === 'superadmin') return <Navigate to="/super" replace />;
  return <>{children}</>;
}

function SuperRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/admin" replace />;
  if (role !== 'superadmin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminLogin />} />

          {/* Business owner — the CRM */}
          <Route path="/" element={<OwnerRoute><BizLayout><Dashboard /></BizLayout></OwnerRoute>} />
          <Route path="/clients" element={<OwnerRoute><BizLayout><Clients /></BizLayout></OwnerRoute>} />
          <Route path="/clients/:id" element={<OwnerRoute><BizLayout><ClientDetail /></BizLayout></OwnerRoute>} />
          <Route path="/appointments" element={<OwnerRoute><BizLayout><Appointments /></BizLayout></OwnerRoute>} />
          <Route path="/invoices" element={<OwnerRoute><BizLayout><Invoices /></BizLayout></OwnerRoute>} />
          <Route path="/expenses" element={<OwnerRoute><BizLayout><Expenses /></BizLayout></OwnerRoute>} />
          <Route path="/revenue" element={<OwnerRoute><BizLayout><Revenue /></BizLayout></OwnerRoute>} />
          <Route path="/settings" element={<OwnerRoute><BizLayout><Settings /></BizLayout></OwnerRoute>} />
          <Route path="/accounts" element={<OwnerRoute><BizLayout><Accounts /></BizLayout></OwnerRoute>} />

          {/* Peach Stack superadmin */}
          <Route path="/super" element={<SuperRoute><SupLayout><SuperDashboard /></SupLayout></SuperRoute>} />
          <Route path="/super/businesses" element={<SuperRoute><SupLayout><SuperBusinesses /></SupLayout></SuperRoute>} />
          <Route path="/super/businesses/:id" element={<SuperRoute><SupLayout><SuperBusinessDetail /></SupLayout></SuperRoute>} />
          <Route path="/super/quote" element={<SuperRoute><SupLayout><SuperQuote /></SupLayout></SuperRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
