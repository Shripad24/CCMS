import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { complaintsApi } from "@/api/complaints";
import { StatusBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { SLACountdown } from "@/components/shared/SLACountdown";
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AssignedComplaints() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["assigned-complaints", page, status],
    queryFn: () => complaintsApi.getAll({ page, page_size: 10, status: status || undefined, sort_by: "sla_deadline", sort_order: "asc" }),
  });

  const complaints = data?.data?.items || [];
  const totalPages = data?.data?.total_pages || 1;

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-outfit text-2xl font-bold text-slate-100">Assigned Complaints</h1>
      <div className="flex gap-3">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input-field w-auto min-w-[150px]">
          <option value="">All Statuses</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="PENDING_INFO">Pending Info</option>
          <option value="ESCALATED">Escalated</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-700/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Reference</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Title</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Student</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Priority</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">SLA</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Created</th>
            </tr></thead>
            <tbody>
              {complaints.map((c: any) => (
                <tr key={c.id} onClick={() => navigate(`/staff/complaints/${c.id}`)} className="border-b border-slate-700/20 hover:bg-dark-700/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-slate-300">{c.reference_no}</td>
                  <td className="px-4 py-3 text-sm text-slate-200 truncate max-w-[180px]">{c.title}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{c.student?.full_name || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                  <td className="px-4 py-3"><SLACountdown deadline={c.sla_deadline} warningSent={c.sla_warning_sent} /></td>
                  <td className="px-4 py-3 text-sm text-slate-400">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</td>
                </tr>
              ))}
              {complaints.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No complaints found</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-700/50">
            <p className="text-sm text-slate-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary p-2 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-secondary p-2 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
