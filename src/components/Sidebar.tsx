import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, BarChart3, Settings, LogOut, User, Plus, Search } from "lucide-react";
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

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Clients", href: "/dashboard/clients" },
    { icon: Calendar, label: "Appointments", href: "/dashboard/appointments" },
    { icon: BarChart3, label: "Revenue", href: "/dashboard/revenue" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex flex-col h-full">

        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xs tracking-tight shadow-lg">
            PS
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-zinc-900">Peach Stack</span>
            <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest -mt-0.5">CRM</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-5">
          <form onSubmit={handleQuickSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Quick search..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Add Client */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/dashboard/clients?add=true")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>

        {/* Nav */}
        <nav className="space-y-1 flex-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 px-3">Menu</p>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/dashboard"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="mt-auto pt-6 border-t border-zinc-200">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 border border-zinc-200 shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-zinc-900 truncate">{user.owner_name}</p>
              <p className="text-[10px] font-medium text-zinc-500 truncate uppercase tracking-wider">
                {user.business_name}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

      </div>
    </aside>
  );
}
