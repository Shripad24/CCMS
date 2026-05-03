import { NavLink } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { X, LayoutDashboard, FileText, PlusCircle, Users, Building2, Clock, AlertTriangle, BarChart3 } from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const studentLinks = [
  { to: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/student/complaints/new", icon: PlusCircle, label: "Submit Complaint" },
  { to: "/student/complaints", icon: FileText, label: "My Complaints" },
];

const staffLinks = [
  { to: "/staff/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/staff/complaints", icon: FileText, label: "Assigned Complaints" },
];

const adminLinks = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/complaints", icon: FileText, label: "All Complaints" },
  { to: "/admin/escalated", icon: AlertTriangle, label: "Escalated" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/departments", icon: Building2, label: "Departments" },
  { to: "/admin/sla", icon: Clock, label: "SLA Policies" },
  { to: "/admin/reports", icon: BarChart3, label: "Reports" },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const links = role === "ADMIN" ? adminLinks : role === "STAFF" ? staffLinks : studentLinks;

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-slate-700/50 transform transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="font-outfit font-semibold text-lg gradient-text">CCMS</span>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-700"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="hidden lg:block p-6 border-b border-slate-700/50">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{role} Panel</p>
        </div>
        <nav className="p-3 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary-500/10 text-primary-400 border border-primary-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-dark-700"
                }`
              }
            >
              <link.icon className="w-5 h-5 flex-shrink-0" />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
