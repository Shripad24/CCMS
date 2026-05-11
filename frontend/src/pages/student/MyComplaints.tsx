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
      <h1 className="font-playfair text-2xl font-bold" style={{ color: "var(--text-heading)" }}>My Complaints</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
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
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent-primary)" }} />
        </div>
      ) : (
        <div className="glass-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
                  <th className="text-left px-5 py-3.5">Reference</th>
                  <th className="text-left px-5 py-3.5">Title</th>
                  <th className="text-left px-5 py-3.5">Category</th>
                  <th className="text-left px-5 py-3.5">Priority</th>
                  <th className="text-left px-5 py-3.5">Status</th>
                  <th className="text-left px-5 py-3.5">SLA</th>
                  <th className="text-left px-5 py-3.5">Created</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c: any, i: number) => (
                  <tr key={c.id} onClick={() => navigate(`/student/complaints/${c.id}`)}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.10)", background: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent" }}>
                    <td className="px-5 py-3.5 text-sm font-mono" style={{ color: "var(--text-muted)" }}>{c.reference_no}</td>
                    <td className="px-5 py-3.5 text-sm font-dm max-w-[200px] truncate" style={{ color: "var(--text-body)" }}>{c.title}</td>
                    <td className="px-5 py-3.5"><AICategoryBadge category={c.category} confidence={c.ai_confidence} /></td>
                    <td className="px-5 py-3.5"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3.5"><SLACountdown deadline={c.sla_deadline} warningSent={c.sla_warning_sent} status={c.status} resolvedAt={c.resolved_at} /></td>
                    <td className="px-5 py-3.5 text-sm font-dm" style={{ color: "var(--text-muted)" }}>{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</td>
                  </tr>
                ))}
                {complaints.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-10 text-center font-dm" style={{ color: "var(--text-muted)" }}>No complaints found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
              <p className="text-sm font-dm" style={{ color: "var(--text-muted)" }}>Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="btn-secondary p-2.5 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  className="btn-secondary p-2.5 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
