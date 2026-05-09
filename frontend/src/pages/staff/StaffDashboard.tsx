import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { complaintsApi } from "@/api/complaints";
import { StatusBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { SLACountdown } from "@/components/shared/SLACountdown";
import { FileText, CheckCircle2, Clock, Star, Loader2, AlertTriangle } from "lucide-react";
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
    : "—";

  const metrics = [
    { label: "Assigned", value: assigned, icon: FileText, color: "text-primary-400", bg: "bg-primary-500/10" },
    { label: "In Progress", value: inProgress, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Resolved (Month)", value: resolvedThisMonth, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Avg Rating", value: avgRating, icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  ];

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-outfit text-2xl font-bold text-slate-100">Welcome, {user?.full_name?.split(" ")[0]}!</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, index) => (
          <div key={m.label} className={`glass-card p-5 slide-up stagger-${index + 1}`}>
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-400">{m.label}</p><p className="text-2xl font-outfit font-bold text-slate-100 mt-1">{m.value}</p></div>
              <div className={`w-10 h-10 ${m.bg} rounded-lg flex items-center justify-center`}><m.icon className={`w-5 h-5 ${m.color}`} /></div>
            </div>
          </div>
        ))}
      </div>

      {urgentComplaints.length > 0 && (
        <div className="glass-card p-4 border-red-500/30">
          <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-5 h-5 text-red-400" /><h3 className="font-medium text-red-400">Urgent — SLA Approaching</h3></div>
          {urgentComplaints.map((c: any) => (
            <div key={c.id} onClick={() => navigate(`/staff/complaints/${c.id}`)} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0 cursor-pointer hover:bg-dark-700/30 px-2 rounded">
              <div><span className="text-sm text-slate-300 font-mono">{c.reference_no}</span> <span className="text-sm text-slate-400 ml-2">{c.title}</span></div>
              <SLACountdown deadline={c.sla_deadline} warningSent={true} status={c.status} resolvedAt={c.resolved_at} />
            </div>
          ))}
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="font-outfit font-semibold text-slate-200">Recent Assigned Complaints</h3>
          <button onClick={() => navigate("/staff/complaints")} className="text-sm text-primary-400 hover:text-primary-300">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-700/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Reference</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Title</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Priority</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">SLA</th>
            </tr></thead>
            <tbody>
              {complaints.slice(0, 5).map((c: any) => (
                <tr key={c.id} onClick={() => navigate(`/staff/complaints/${c.id}`)} className="border-b border-slate-700/20 hover:bg-dark-700/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-slate-300">{c.reference_no}</td>
                  <td className="px-4 py-3 text-sm text-slate-200 truncate max-w-[200px]">{c.title}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                  <td className="px-4 py-3"><SLACountdown deadline={c.sla_deadline} warningSent={c.sla_warning_sent} status={c.status} resolvedAt={c.resolved_at} /></td>
                </tr>
              ))}
              {complaints.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No assigned complaints</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
