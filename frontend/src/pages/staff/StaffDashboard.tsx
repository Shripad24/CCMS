import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { complaintsApi } from "@/api/complaints";
import { StatusBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { SLACountdown } from "@/components/shared/SLACountdown";
import { FileText, CheckCircle2, Clock, Star, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function StaffDashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["staff-complaints"], queryFn: () => complaintsApi.getAll({ page: 1, page_size: 100 }) });

  const complaints = data?.data?.items || [];
  const assigned = complaints.length;
  const inProgress = complaints.filter((c: any) => c.status === "IN_PROGRESS").length;
  const resolvedThisMonth = complaints.filter((c: any) => {
    if (!c.resolved_at) return false;
    const now = new Date();
    const resolved = new Date(c.resolved_at);
    return resolved.getMonth() === now.getMonth() && resolved.getFullYear() === now.getFullYear();
  }).length;

  const urgentComplaints = complaints.filter((c: any) => {
    if (["RESOLVED", "CLOSED", "REJECTED"].includes(c.status)) return false;
    if (!c.sla_deadline) return false;
    const remaining = new Date(c.sla_deadline).getTime() - Date.now();
    const total = new Date(c.sla_deadline).getTime() - new Date(c.created_at).getTime();
    return remaining / total < 0.2;
  });

  const ratedComplaints = complaints.filter((c: any) => c.rating);
  const avgRating = ratedComplaints.length > 0
    ? (ratedComplaints.reduce((acc: number, c: any) => acc + c.rating.score, 0) / ratedComplaints.length).toFixed(1)
    : "\u2014";

  const metrics = [
    { label: "Assigned", value: assigned, icon: FileText, accent: "var(--accent-lavender)", bg: "rgba(196,184,232,0.15)" },
    { label: "In Progress", value: inProgress, icon: Clock, accent: "var(--accent-gold)", bg: "rgba(240,208,128,0.15)" },
    { label: "Resolved (Month)", value: resolvedThisMonth, icon: CheckCircle2, accent: "var(--accent-primary)", bg: "rgba(168,197,160,0.15)" },
    { label: "Avg Rating", value: avgRating, icon: Star, accent: "var(--accent-peach)", bg: "rgba(242,196,160,0.15)" },
  ];

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent-lavender)" }} /></div>;

  return (
    <div className="space-y-8">
      {/* Hero Card */}
      <div className="glass-card p-8 lg:p-10 relative overflow-hidden slide-up">
        <div className="flex items-center justify-between">
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest mb-4" style={{ background: "rgba(196,184,232,0.2)", color: "#7856b5", border: "1px solid rgba(196,184,232,0.3)" }}>Staff</span>
            <h1 className="font-playfair text-3xl lg:text-4xl font-bold mb-2" style={{ color: "var(--text-heading)" }}>Welcome, <span className="gradient-text">{user?.full_name?.split(" ")[0]}</span></h1>
            <p className="font-dm text-sm" style={{ color: "var(--text-muted)" }}>Manage assigned complaints and track performance</p>
          </div>
          <div className="hidden lg:block relative w-48 h-32">
            <div className="absolute w-20 h-20 rounded-2xl rotate-12 right-4 top-0" style={{ background: "var(--accent-lavender)", opacity: 0.2 }} />
            <div className="absolute w-16 h-16 rounded-2xl -rotate-6 right-16 top-8" style={{ background: "var(--accent-peach)", opacity: 0.25 }} />
            <div className="absolute w-14 h-14 rounded-full right-0 bottom-0" style={{ background: "var(--accent-primary)", opacity: 0.2 }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m, index) => (
          <div key={m.label} className={`glass-card p-6 slide-up stagger-${index + 1}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-dm font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{m.label}</p>
                <p className="text-3xl font-playfair font-bold mt-2" style={{ color: "var(--text-heading)" }}>{m.value}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: m.bg }}>
                <m.icon className="w-6 h-6" style={{ color: m.accent }} />
              </div>
            </div>
            <div className="absolute left-0 top-6 bottom-6 w-[3px] rounded-full" style={{ background: m.accent }} />
          </div>
        ))}
      </div>

      {/* Urgent SLA */}
      {urgentComplaints.length > 0 && (
        <div className="glass-card p-5 slide-up" style={{ borderLeft: "3px solid var(--accent-rose)" }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" style={{ color: "var(--accent-rose)" }} />
            <h3 className="font-playfair font-bold" style={{ color: "var(--text-heading)" }}>Urgent — SLA Approaching</h3>
          </div>
          {urgentComplaints.map((c: any) => (
            <div key={c.id} onClick={() => navigate(`/staff/complaints/${c.id}`)} className="flex items-center justify-between py-3 cursor-pointer rounded-xl px-3 transition-colors hover:bg-white/10" style={{ borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
              <div><span className="font-mono text-xs mr-2" style={{ color: "var(--text-muted)" }}>{c.reference_no}</span><span className="text-sm font-dm" style={{ color: "var(--text-body)" }}>{c.title}</span></div>
              <SLACountdown deadline={c.sla_deadline} warningSent={true} status={c.status} resolvedAt={c.resolved_at} />
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden p-0">
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.20)" }}>
          <h3 className="font-playfair font-bold" style={{ color: "var(--text-heading)" }}>Recent Assigned Complaints</h3>
          <button onClick={() => navigate("/staff/complaints")} className="text-sm font-dm font-medium flex items-center gap-1" style={{ color: "var(--accent-lavender)" }}>View all <ArrowRight className="w-3.5 h-3.5" /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
              <th className="text-left px-5 py-3.5">Reference</th>
              <th className="text-left px-5 py-3.5">Title</th>
              <th className="text-left px-5 py-3.5">Status</th>
              <th className="text-left px-5 py-3.5">Priority</th>
              <th className="text-left px-5 py-3.5">SLA</th>
            </tr></thead>
            <tbody>
              {complaints.slice(0, 5).map((c: any, i: number) => (
                <tr key={c.id} onClick={() => navigate(`/staff/complaints/${c.id}`)} className="cursor-pointer transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.10)", background: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent" }}>
                  <td className="px-5 py-3.5 text-sm font-mono" style={{ color: "var(--text-muted)" }}>{c.reference_no}</td>
                  <td className="px-5 py-3.5 text-sm font-dm truncate max-w-[200px]" style={{ color: "var(--text-body)" }}>{c.title}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-3.5"><PriorityBadge priority={c.priority} /></td>
                  <td className="px-5 py-3.5"><SLACountdown deadline={c.sla_deadline} warningSent={c.sla_warning_sent} status={c.status} resolvedAt={c.resolved_at} /></td>
                </tr>
              ))}
              {complaints.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center font-dm" style={{ color: "var(--text-muted)" }}>No assigned complaints</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
