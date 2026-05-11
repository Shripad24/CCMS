import { NavLink } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import {
  X,
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  Building2,
  Clock,
  AlertTriangle,
  BarChart3,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const studentLinks = [
  { to: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard", dot: "#a8c5a0" },
  { to: "/student/complaints/new", icon: PlusCircle, label: "Submit Complaint", dot: "#e8b4b8" },
  { to: "/student/complaints", icon: FileText, label: "My Complaints", dot: "#c4b8e8" },
];

const staffLinks = [
  { to: "/staff/dashboard", icon: LayoutDashboard, label: "Dashboard", dot: "#c4b8e8" },
  { to: "/staff/complaints", icon: FileText, label: "Assigned Complaints", dot: "#a8c5a0" },
];

const adminLinks = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", dot: "#a8c5a0" },
  { to: "/admin/complaints", icon: FileText, label: "All Complaints", dot: "#c4b8e8" },
  { to: "/admin/escalated", icon: AlertTriangle, label: "Escalated", dot: "#e8b4b8" },
  { to: "/admin/users", icon: Users, label: "Users", dot: "#f2c4a0" },
  { to: "/admin/departments", icon: Building2, label: "Departments", dot: "#f0d080" },
  { to: "/admin/sla", icon: Clock, label: "SLA Policies", dot: "#a8c5a0" },
  { to: "/admin/reports", icon: BarChart3, label: "Reports", dot: "#c4b8e8" },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const role = user?.role;
  const links =
    role === "ADMIN" ? adminLinks : role === "STAFF" ? staffLinks : studentLinks;

  const roleBadgeColors: Record<string, { bg: string; text: string }> = {
    ADMIN: { bg: "rgba(232,180,184,0.2)", text: "#c96068" },
    STAFF: { bg: "rgba(196,184,232,0.2)", text: "#8e72c8" },
    STUDENT: { bg: "rgba(168,197,160,0.2)", text: "#5f7d58" },
  };

  const badgeStyle = roleBadgeColors[role || "STUDENT"];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(26,26,46,0.25)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-[260px]
          flex flex-col
          transform transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        `}
        style={{
          background: "rgba(255, 255, 255, 0.10)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderRight: "1px solid rgba(255, 255, 255, 0.25)",
          borderRadius: "0 24px 24px 0",
        }}
      >
        {/* Mobile close */}
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="font-playfair font-bold text-sm" style={{ color: "var(--text-heading)" }}>CCMS</span>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* User card */}
        <div className="hidden lg:block px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold text-white shadow-md"
              style={{
                background: "linear-gradient(135deg, var(--accent-rose), var(--accent-lavender))",
              }}
            >
              {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-dm font-semibold truncate" style={{ color: "var(--text-heading)" }}>
                {user?.full_name}
              </p>
              <span
                className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest"
                style={{
                  background: badgeStyle.bg,
                  color: badgeStyle.text,
                }}
              >
                {role}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 mb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.20)" }} />

        {/* Nav links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-dm font-medium transition-all duration-200 relative ${
                  isActive
                    ? ""
                    : "hover:bg-white/8"
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? "rgba(255,255,255,0.22)" : undefined,
                border: isActive ? "1px solid rgba(255,255,255,0.30)" : "1px solid transparent",
                color: isActive ? "var(--text-heading)" : "var(--text-muted)",
                boxShadow: isActive ? "0 2px 12px rgba(100,120,100,0.08)" : undefined,
              })}
            >
              {({ isActive }) => (
                <>
                  {/* Active left accent bar */}
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full"
                      style={{
                        background: link.dot,
                        boxShadow: `0 0 8px ${link.dot}50`,
                      }}
                    />
                  )}

                  {/* Colored dot */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: link.dot,
                      opacity: isActive ? 1 : 0.5,
                    }}
                  />

                  <link.icon
                    className="w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200"
                    style={{
                      color: isActive ? "var(--text-heading)" : "var(--text-muted)",
                    }}
                  />
                  <span className="relative z-10">{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom — Logout + version */}
        <div className="px-4 py-4 mt-auto">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-dm font-medium transition-all duration-200 hover:bg-rose-100/30"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#c96068"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Logout</span>
          </button>
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
            <p className="text-[10px] text-center tracking-wider font-mono" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              CCMS v2.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
