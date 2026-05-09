import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { complaintsApi } from "@/api/complaints";
import { StatusBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { SLACountdown } from "@/components/shared/SLACountdown";
import { FileText, CheckCircle2, Clock, PlusCircle, Loader2, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["student-complaints"],
    queryFn: () => complaintsApi.getAll({ page: 1, page_size: 100 }),
  });

  const complaints = data?.data?.items || [];
  const total = complaints.length;
  const pending = complaints.filter((c: any) => !["RESOLVED", "CLOSED", "REJECTED"].includes(c.status)).length;
  const resolved = complaints.filter((c: any) => ["RESOLVED", "CLOSED"].includes(c.status)).length;

  // Calculate avg resolution time
  const resolvedComplaints = complaints.filter((c: any) => c.resolved_at);
  const avgHours = resolvedComplaints.length > 0
    ? resolvedComplaints.reduce((sum: number, c: any) => {
        const diff = new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime();
        return sum + diff / (1000 * 60 * 60);
      }, 0) / resolvedComplaints.length
    : 0;

  const slaWarnings = complaints.filter((c: any) => c.sla_warning_sent && !["RESOLVED", "CLOSED", "REJECTED"].includes(c.status));

  const metrics = [
    { label: "Total Complaints", value: total, icon: FileText, color: "text-primary-400", bg: "bg-primary-500/10" },
    { label: "Pending", value: pending, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Resolved", value: resolved, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Avg Resolution", value: avgHours > 0 ? `${avgHours.toFixed(0)}h` : "N/A", icon: Clock, color: "text-purple-400", bg: "bg-purple-500/10" },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit text-2xl font-bold text-slate-100">Welcome back, {user?.full_name?.split(" ")[0]}!</h1>
          <p className="text-slate-400 mt-1">Here's an overview of your complaints</p>
        </div>
        <button onClick={() => navigate("/student/complaints/new")} className="btn-primary flex items-center gap-2" id="submit-complaint-btn">
          <PlusCircle className="w-4 h-4" /> New Complaint
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, index) => (
          <div key={m.label} className={`glass-card p-5 slide-up stagger-${index + 1}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{m.label}</p>
                <p className="text-2xl font-outfit font-bold text-slate-100 mt-1">{m.value}</p>
              </div>
              <div className={`w-10 h-10 ${m.bg} rounded-lg flex items-center justify-center`}>
                <m.icon className={`w-5 h-5 ${m.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {slaWarnings.length > 0 && (
        <div className="glass-card p-4 border-amber-500/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-medium text-amber-400">SLA Alerts</h3>
          </div>
          {slaWarnings.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
              <span className="text-sm text-slate-300">{c.reference_no}: {c.title}</span>
              <SLACountdown deadline={c.sla_deadline} warningSent={c.sla_warning_sent} status={c.status} resolvedAt={c.resolved_at} />
            </div>
          ))}
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="font-outfit font-semibold text-slate-200">Recent Complaints</h3>
          <button onClick={() => navigate("/student/complaints")} className="text-sm text-primary-400 hover:text-primary-300">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Reference</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">SLA</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Created</th>
              </tr>
            </thead>
            <tbody>
              {complaints.slice(0, 5).map((c: any) => (
                <tr key={c.id} onClick={() => navigate(`/student/complaints/${c.id}`)}
                  className="border-b border-slate-700/20 hover:bg-dark-700/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-slate-300">{c.reference_no}</td>
                  <td className="px-4 py-3 text-sm text-slate-200 max-w-[200px] truncate">{c.title}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                  <td className="px-4 py-3"><SLACountdown deadline={c.sla_deadline} status={c.status} resolvedAt={c.resolved_at} /></td>
                  <td className="px-4 py-3 text-sm text-slate-400">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</td>
                </tr>
              ))}
              {complaints.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No complaints yet. Submit your first complaint!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
