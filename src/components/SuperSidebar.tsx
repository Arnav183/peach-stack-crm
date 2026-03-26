import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Building2, LogOut, User, Menu, X, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";

interface Props { user: any; onLogout: () => void; }

function SidebarContent({ user, onLogout, onNav }: { user: any; onLogout: () => void; onNav?: () => void }) {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    onLogout(); navigate("/admin");
  };
  const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/super/dashboard" },
    { icon: Building2, label: "Businesses", href: "/super/businesses" },
  ];
  return (
    <div className="p-5 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-10 px-1">
        <div className="w-9 h-9 flex items-center justify-center"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
              <line x1="50" y1="18" x2="46" y2="10" stroke="#2a6a2a" strokeWidth="4" strokeLinecap="round"/>
              <ellipse cx="55" cy="8" rx="8" ry="5" fill="#3a8a3a" transform="rotate(-25 55 8)"/>
              <path d="M50 88 C30 72 12 58 12 40 C12 28 22 20 34 20 C41 20 47 24 50 28 C53 24 59 20 66 20 C78 20 88 28 88 40 C88 58 70 72 50 88Z" fill="none" stroke="#e8795a" strokeWidth="5" strokeLinejoin="round"/>
              <rect x="33" y="37" width="34" height="9" rx="4" fill="#f5e6d3"/>
              <rect x="30" y="50" width="40" height="9" rx="4" fill="#e8795a"/>
              <rect x="33" y="63" width="34" height="9" rx="4" fill="#c4522a"/>
            </svg></div>
        <div>
          <p className="font-bold text-sm text-white tracking-tight">Peach Stack</p>
          <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Super Admin</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map(item => (
          <NavLink key={item.href} to={item.href} onClick={() => onNav?.()}
            className={({ isActive }) =>
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all " +
              (isActive ? "bg-orange-500/15 text-orange-400 border border-orange-500/20" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")
            }>
            <item.icon className="w-4 h-4 shrink-0" />{item.label}
          </NavLink>
        ))}
      </nav>
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.name || "Admin"}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-3.5 h-3.5" />Logout
        </button>
      </div>
    </div>
  );
}

export default function SuperSidebar({ user, onLogout }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const h = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  useEffect(() => { document.body.style.overflow = mobileOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [mobileOpen]);
  return (
    <>
      <aside className="hidden lg:flex w-56 bg-[#0f172a] flex-col h-screen sticky top-0 shrink-0 border-r border-white/5">
        <SidebarContent user={user} onLogout={onLogout} />
      </aside>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0f172a] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">PS</div>
          <span className="font-bold text-sm text-white">Super Admin</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl text-slate-400 hover:bg-white/10"><Menu className="w-5 h-5" /></button>
      </div>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-[#0f172a] h-full flex flex-col shadow-2xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:bg-white/10 z-10"><X className="w-4 h-4" /></button>
            <SidebarContent user={user} onLogout={onLogout} onNav={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
