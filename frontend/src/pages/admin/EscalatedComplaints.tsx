import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/api/admin";
import { StatusBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { Loader2, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function EscalatedComplaints() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["escalated"], queryFn: () => adminApi.getEscalated() });
  const complaints = data?.data || [];

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-red-400" />
        <h1 className="font-outfit text-2xl font-bold text-slate-100">Escalated Complaints</h1>
        <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full text-sm font-medium">{complaints.length}</span>
      </div>
      <div className="glass-card overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-slate-700/50">
            <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase">Reference</th>
            <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase">Title</th>
            <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase">Priority</th>
            <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase">Student</th>
            <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase">Staff</th>
            <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase">Overdue</th>
          </tr></thead>
          <tbody>
            {complaints.map((c: any) => {
              const overdue = c.sla_deadline ? Math.max(0, (Date.now() - new Date(c.sla_deadline).getTime()) / (1000*60*60)) : 0;
              return (
                <tr key={c.id} onClick={() => navigate(`/admin/complaints/${c.id}`)} className="border-b border-slate-700/20 hover:bg-dark-700/50 cursor-pointer">
                  <td className="px-4 py-3 text-sm font-mono text-slate-300">{c.reference_no}</td>
                  <td className="px-4 py-3 text-sm text-slate-200 truncate max-w-[200px]">{c.title}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                  <td className="px-4 py-3 text-sm text-slate-300">{c.student?.full_name || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{c.assigned_staff?.full_name || "Unassigned"}</td>
                  <td className="px-4 py-3 text-sm font-medium text-red-400">{overdue.toFixed(0)}h overdue</td>
                </tr>
              );
            })}
            {complaints.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No escalated complaints 🎉</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
