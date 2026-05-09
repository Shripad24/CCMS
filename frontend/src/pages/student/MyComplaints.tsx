import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { complaintsApi } from "@/api/complaints";
import { StatusBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { SLACountdown } from "@/components/shared/SLACountdown";
import { AICategoryBadge } from "@/components/shared/AICategoryBadge";
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function MyComplaints() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-complaints", page, status, search],
    queryFn: () => complaintsApi.getAll({ page, page_size: 10, status: status || undefined, search: search || undefined }),
  });

  const complaints = data?.data?.items || [];
  const totalPages = data?.data?.total_pages || 1;

  return (
    <div className="space-y-6">
      <h1 className="font-outfit text-2xl font-bold text-slate-100">My Complaints</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10" placeholder="Search complaints..." />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="input-field w-auto min-w-[150px]">
          <option value="">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="PENDING_INFO">Pending Info</option>
          <option value="ESCALATED">Escalated</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Reference</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">SLA</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Created</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c: any) => (
                  <tr key={c.id} onClick={() => navigate(`/student/complaints/${c.id}`)}
                    className="border-b border-slate-700/20 hover:bg-dark-700/50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-slate-300">{c.reference_no}</td>
                    <td className="px-4 py-3 text-sm text-slate-200 max-w-[200px] truncate">{c.title}</td>
                    <td className="px-4 py-3"><AICategoryBadge category={c.category} confidence={c.ai_confidence} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3"><SLACountdown deadline={c.sla_deadline} warningSent={c.sla_warning_sent} status={c.status} resolvedAt={c.resolved_at} /></td>
                    <td className="px-4 py-3 text-sm text-slate-400">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</td>
                  </tr>
                ))}
                {complaints.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No complaints found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-700/50">
              <p className="text-sm text-slate-400">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="btn-secondary p-2 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  className="btn-secondary p-2 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
