import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Calendar, FileText, User, LogOut } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...i: ClassValue[]) { return twMerge(clsx(i)); }

interface PortalLayoutProps { user: any; onLogout: () => void; children: React.ReactNode; }

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/portal" },
  { icon: Calendar, label: "My Appointments", href: "/portal/appointments" },
  { icon: FileText, label: "My Invoices", href: "/portal/invoices" },
  { icon: User, label: "My Profile", href: "/portal/profile" },
];

export default function PortalLayout({ user, onLogout, children }: PortalLayoutProps) {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    onLogout(); navigate("/login");
  };
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-60 bg-[#0f172a] flex flex-col h-screen sticky top-0 shrink-0">
        <div className="p-5 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-8 px-1">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/30">PS</div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white">Peach Stack</span>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest -mt-0.5">Client Portal</p>
            </div>
          </div>
          <nav className="flex-1 space-y-0.5">
            {navItems.map(item => (
              <NavLink key={item.href} to={item.href} end={item.href === "/portal"}
                className={({ isActive }) => cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all",
                  isActive ? "bg-orange-500/15 text-orange-400 border border-orange-500/20" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}>
                <item.icon className="w-4 h-4 shrink-0" />{item.label}
              </NavLink>
            ))}
          </nav>
          <div className="pt-4 border-t border-white/10 mt-4">
            <div className="flex items-center gap-2.5 mb-3 px-1">
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 text-xs font-bold">
                {user?.owner_name?.split(' ').map((n: string) => n[0]).join('').slice(0,2) || 'C'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.owner_name || 'Client'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut className="w-3.5 h-3.5" />Sign Out
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto min-w-0">{children}</main>
    </div>
  );
}
