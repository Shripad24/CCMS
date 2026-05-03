import { Menu, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/shared/NotificationBell";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-dark-800/80 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-dark-700 transition-colors" id="menu-toggle">
          <Menu className="w-5 h-5 text-slate-300" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-outfit font-bold text-sm">C</span>
          </div>
          <h1 className="font-outfit font-semibold text-lg hidden sm:block gradient-text">CCMS</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-dark-700 rounded-full flex items-center justify-center border border-slate-600">
            <User className="w-4 h-4 text-slate-300" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-200">{user?.full_name}</p>
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
