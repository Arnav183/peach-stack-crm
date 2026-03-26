import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, BarChart3, TrendingDown, FileText, KeyRound, Settings, LogOut, Plus, Search, Menu, X, User, Scissors, Car, UtensilsCrossed, Stethoscope, ShoppingBag, Dumbbell, Briefcase, Wrench } from "lucide-react";
import React, { useState, useEffect } from "react";

interface Props { user: any; onLogout: () => void; }

// Industry-specific label overrides
const INDUSTRY_CONFIG: Record<string, { clientLabel: string; apptLabel: string; icon: any }> = {
  beauty:     { clientLabel: "Clients",     apptLabel: "Appointments", icon: Scissors },
  auto:       { clientLabel: "Customers",   apptLabel: "Work Orders",  icon: Car },
  restaurant: { clientLabel: "Guests",      apptLabel: "Reservations", icon: UtensilsCrossed },
  medical:    { clientLabel: "Patients",    apptLabel: "Appointments", icon: Stethoscope },
  retail:     { clientLabel: "Customers",   apptLabel: "Orders",       icon: ShoppingBag },
  fitness:    { clientLabel: "Members",     apptLabel: "Sessions",     icon: Dumbbell },
  agency:     { clientLabel: "Clients",     apptLabel: "Projects",     icon: Briefcase },
  general:    { clientLabel: "Customers",   apptLabel: "Jobs",         icon: Wrench },
};

function SidebarContent({ user, onLogout, onNav }: { user: any; onLogout: () => void; onNav?: () => void }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const industry = user?.industry || "general";
  const cfg = INDUSTRY_CONFIG[industry] || INDUSTRY_CONFIG.general;
  const IndustryIcon = cfg.icon;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    onLogout(); navigate("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) { navigate("/dashboard/clients?search=" + encodeURIComponent(search)); setSearch(""); onNav?.(); }
  };

  const navSections = [
    { label: "Main", items: [
      { icon: LayoutDashboard, label: "Dashboard",        href: "/dashboard" },
      { icon: Users,           label: cfg.clientLabel,    href: "/dashboard/clients" },
      { icon: Calendar,        label: cfg.apptLabel,      href: "/dashboard/appointments" },
    ]},
    { label: "Finance", items: [
      { icon: BarChart3,   label: "Revenue & P&L", href: "/dashboard/revenue" },
      { icon: TrendingDown, label: "Expenses",     href: "/dashboard/expenses" },
      { icon: FileText,    label: "Invoices",      href: "/dashboard/invoices" },
    ]},
    { label: "Account", items: [
      { icon: KeyRound, label: "Portal Accounts", href: "/dashboard/accounts" },
      { icon: Settings, label: "Settings",        href: "/dashboard/settings" },
    ]},
  ];

  return (
    <div className="p-5 flex flex-col h-full">
      {/* Logo + industry badge */}
      <div className="flex items-center gap-3 mb-6 px-1">
        <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30 shrink-0">
          <IndustryIcon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-white tracking-tight truncate">{user?.business_name || "My Business"}</p>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-0.5 capitalize">{industry}</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input type="text" placeholder={"Search " + cfg.clientLabel.toLowerCase() + "..."} value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all" />
      </form>

      {/* Quick add */}
      <button onClick={() => { navigate("/dashboard/clients?add=true"); onNav?.(); }}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-400 transition-all mb-6 shadow-lg shadow-orange-500/20">
        <Plus className="w-3.5 h-3.5" />Add {cfg.clientLabel.slice(0,-1)}
      </button>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto">
        {navSections.map(section => (
          <div key={section.label}>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-2">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map(item => (
                <NavLink key={item.href} to={item.href} end={item.href === "/dashboard"} onClick={() => onNav?.()}
                  className={({ isActive }) =>
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all " +
                    (isActive ? "bg-orange-500/15 text-orange-400 border border-orange-500/20" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")
                  }>
                  <item.icon className="w-4 h-4 shrink-0" />{item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="pt-4 border-t border-white/10 mt-4">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-slate-400 shrink-0"><User className="w-4 h-4" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.name || user?.business_name}</p>
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

export default function BusinessSidebar({ user, onLogout }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const h = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener("resize", h); return () => window.removeEventListener("resize", h);
  }, []);
  useEffect(() => { document.body.style.overflow = mobileOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [mobileOpen]);

  return (
    <>
      <aside className="hidden lg:flex w-64 bg-[#0f172a] flex-col h-screen sticky top-0 shrink-0">
        <SidebarContent user={user} onLogout={onLogout} />
      </aside>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0f172a] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 flex items-center justify-center shrink-0"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
              <line x1="50" y1="18" x2="46" y2="10" stroke="#2a6a2a" strokeWidth="4" strokeLinecap="round"/>
              <ellipse cx="55" cy="8" rx="8" ry="5" fill="#3a8a3a" transform="rotate(-25 55 8)"/>
              <path d="M50 88 C30 72 12 58 12 40 C12 28 22 20 34 20 C41 20 47 24 50 28 C53 24 59 20 66 20 C78 20 88 28 88 40 C88 58 70 72 50 88Z" fill="none" stroke="#e8795a" strokeWidth="5" strokeLinejoin="round"/>
              <rect x="33" y="37" width="34" height="9" rx="4" fill="#f5e6d3"/>
              <rect x="30" y="50" width="40" height="9" rx="4" fill="#e8795a"/>
              <rect x="33" y="63" width="34" height="9" rx="4" fill="#c4522a"/>
            </svg></div>
          <span className="font-bold text-sm text-white tracking-tight truncate max-w-[180px]">{user?.business_name}</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all"><Menu className="w-5 h-5" /></button>
      </div>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-[#0f172a] h-full flex flex-col shadow-2xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:bg-white/10 z-10"><X className="w-4 h-4" /></button>
            <SidebarContent user={user} onLogout={onLogout} onNav={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
