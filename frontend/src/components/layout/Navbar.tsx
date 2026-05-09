import { Menu, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/shared/NotificationBell";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-lg">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-dark-700 transition-colors" id="menu-toggle">
          <Menu className="w-5 h-5 text-slate-300" />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="CCMS Logo" className="h-8 w-auto rounded object-contain bg-dark-800" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-dark-700 rounded-full flex items-center justify-center border border-slate-600">
            <User className="w-4 h-4 text-slate-300" />
          </div>
          <div className="hidden sm:block cursor-pointer" onClick={() => window.location.href = '/profile'}>
            <p className="text-sm font-medium text-slate-200 hover:text-violet-400 transition-colors">{user?.full_name}</p>
            <p className="text-xs text-slate-400">{user?.role}</p>
          </div>
          <button onClick={logout} className="p-2 rounded-lg hover:bg-dark-700 transition-colors text-slate-400 hover:text-danger" title="Logout" id="logout-btn">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
