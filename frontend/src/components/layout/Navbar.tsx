import { Menu, LogOut, User, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Link, useLocation } from "react-router-dom";

interface NavbarProps {
  onMenuClick: () => void;
}

const navTabs = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Complaints", path: "/complaints" },
];

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const rolePrefix = user?.role === "ADMIN" ? "/admin" : user?.role === "STAFF" ? "/staff" : "/student";

  const isTabActive = (path: string) => {
    return location.pathname.includes(path);
  };

  return (
    <header
      className="h-[72px] flex items-center justify-between px-5 lg:px-8 sticky top-0 z-30 transition-all duration-300"
      style={{
        background: "rgba(255, 255, 255, 0.12)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.25)",
        boxShadow: "0 4px 24px rgba(100, 120, 100, 0.08)",
      }}
    >
      {/* Left — Menu + Branding */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-2xl transition-colors hover:bg-white/10"
          id="menu-toggle"
        >
          <Menu className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
        </button>

        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <img
              src="/logo.png"
              alt="CCMS"
              className="h-10 w-auto rounded-2xl object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="font-playfair font-bold text-lg tracking-tight" style={{ color: "var(--text-heading)" }}>
              CCMS
            </span>
            <span className="font-dm text-[10px] tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
              Campus Complaints
            </span>
          </div>
          <span className="font-playfair font-bold text-base md:hidden gradient-text">
            CCMS
          </span>
        </Link>

        {/* Nav Tabs — pill style */}
        <div className="hidden md:flex items-center gap-1 ml-6">
          {navTabs.map((tab) => (
            <Link
              key={tab.path}
              to={`${rolePrefix}${tab.path === "/dashboard" ? "/dashboard" : tab.path === "/complaints" ? "/complaints" : tab.path}`}
              className="relative px-5 py-2 rounded-full text-sm font-dm font-medium transition-all duration-200"
              style={{
                background: isTabActive(tab.path) ? "rgba(255,255,255,0.25)" : "transparent",
                color: isTabActive(tab.path) ? "var(--text-heading)" : "var(--text-muted)",
                border: isTabActive(tab.path) ? "1px solid rgba(255,255,255,0.35)" : "1px solid transparent",
                boxShadow: isTabActive(tab.path) ? "0 2px 12px rgba(100,120,100,0.1)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isTabActive(tab.path)) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                  e.currentTarget.style.color = "var(--text-body)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isTabActive(tab.path)) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-muted)";
                }
              }}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Right — Notifications + Profile */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationBell />

        <div className="w-px h-7 mx-1 hidden sm:block" style={{ background: "rgba(26,26,46,0.08)" }} />

        <Link
          to="/profile"
          className="flex items-center gap-2.5 px-3 py-2 rounded-2xl transition-all duration-200 hover:bg-white/10 group"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ring-2 ring-white/30 group-hover:ring-white/50 transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, var(--accent-rose), var(--accent-lavender))",
            }}
          >
            {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-dm font-medium leading-tight" style={{ color: "var(--text-heading)" }}>
              {user?.full_name}
            </p>
            <p
              className="text-[10px] font-mono uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              {user?.role}
            </p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 hidden sm:block group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--text-muted)" }} />
        </Link>

        <button
          onClick={logout}
          className="p-2.5 rounded-2xl transition-all duration-200 hover:bg-rose-100/50"
          style={{ color: "var(--text-muted)" }}
          title="Logout"
          id="logout-btn"
          onMouseEnter={(e) => { e.currentTarget.style.color = "#c96068"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
