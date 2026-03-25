import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, BarChart3, Settings, LogOut, User, Plus, Search, Receipt, TrendingDown, FileText } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React, { useState } from "react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  user: any;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    onLogout();
    navigate("/login");
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard/clients?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const navSections = [
    {
      label: "Main",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        { icon: Users,           label: "Clients",   href: "/dashboard/clients" },
        { icon: Calendar,        label: "Appointments", href: "/dashboard/appointments" },
      ]
    },
    {
      label: "Finance",
      items: [
        { icon: BarChart3,    label: "Revenue & P&L", href: "/dashboard/revenue" },
        { icon: TrendingDown, label: "Expenses",       href: "/dashboard/expenses" },
        { icon: FileText,     label: "Invoices",       href: "/dashboard/invoices" },
      ]
    },
    {
      label: "Account",
      items: [
        { icon: Settings, label: "Settings", href: "/dashboard/settings" },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-5 flex flex-col h-full">

        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xs tracking-tight shadow">
            PS
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-zinc-900">Peach Stack</span>
            <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest -mt-0.5">CRM</p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleQuickSearch} className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search clients..."
            className="w-full pl-8 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Add Client */}
        <button
          onClick={() => navigate("/dashboard/clients?add=true")}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all mb-5 shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Client
        </button>

        {/* Nav sections */}
        <nav className="flex-1 space-y-5 overflow-y-auto">
          {navSections.map(section => (
            <div key={section.label}>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 px-2">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === "/dashboard"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                        isActive
                          ? "bg-zinc-900 text-white shadow"
                          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                      )
                    }
                  >
                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="pt-4 border-t border-zinc-100 mt-4">
          <div className="flex items-center gap-2.5 mb-3 px-1">
            <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 border border-zinc-200 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-900 truncate">{user?.owner_name}</p>
              <p className="text-[10px] text-zinc-400 truncate">{user?.business_name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>

      </div>
    </aside>
  );
}
