import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, BarChart3, Settings, LogOut, User, Plus, Search, TrendingDown, FileText, KeyRound } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React, { useState } from "react";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface SidebarProps { user: any; onLogout: () => void; }

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    onLogout(); navigate("/login");
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) { navigate(`/dashboard/clients?search=${encodeURIComponent(searchQuery)}`); setSearchQuery(""); }
  };

  const navSections = [
    { label: "Main", items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
      { icon: Users, label: "Clients", href: "/dashboard/clients" },
      { icon: Calendar, label: "Appointments", href: "/dashboard/appointments" },
    ]},
    { label: "Finance", items: [
      { icon: BarChart3, label: "Revenue & P&L", href: "/dashboard/revenue" },
      { icon: TrendingDown, label: "Expenses", href: "/dashboard/expenses" },
      { icon: FileText, label: "Invoices", href: "/dashboard/invoices" },
    ]},
    { label: "Account", items: [
      { icon: KeyRound, label: "Accounts", href: "/dashboard/accounts" },
      { icon: Settings, label: "Settings", href: "/dashboard/settings" },
    ]},
  ];

  return (
    <aside className="w-64 bg-[#0f172a] flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-8 px-1">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-lg shadow-orange-500/30">PS</div>
          <div>
            <span className="font-bold text-base tracking-tight text-white">Peach Stack</span>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest -mt-0.5">CRM Platform</p>
          </div>
        </div>

        <form onSubmit={handleQuickSearch} className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input type="text" placeholder="Search clients..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all" />
        </form>

        <button onClick={()=>navigate("/dashboard/clients?add=true")}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-400 transition-all mb-6 shadow-lg shadow-orange-500/20">
          <Plus className="w-3.5 h-3.5" />Add Client
        </button>

        <nav className="flex-1 space-y-6 overflow-y-auto">
          {navSections.map(section => (
            <div key={section.label}>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-2">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <NavLink key={item.href} to={item.href} end={item.href==="/dashboard"}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all",
                      isActive ? "bg-orange-500/15 text-orange-400 border border-orange-500/20" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    )}>
                    <item.icon className="w-4 h-4 shrink-0" />{item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="pt-4 border-t border-white/10 mt-4">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-slate-400 shrink-0"><User className="w-4 h-4" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.owner_name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.business_name}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-3.5 h-3.5" />Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
