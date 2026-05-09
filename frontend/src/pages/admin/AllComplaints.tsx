import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { complaintsApi } from "@/api/complaints";
import { adminApi } from "@/api/admin";
import { StatusBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { SLACountdown } from "@/components/shared/SLACountdown";
import { Loader2, Search, ChevronLeft, ChevronRight, UserPlus, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function AllComplaints() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["admin-complaints", page, status, priority, search], queryFn: () => complaintsApi.getAll({ page, page_size: 10, status: status || undefined, priority: priority || undefined, search: search || undefined }) });
  const { data: usersData } = useQuery({ queryKey: ["staff-users"], queryFn: () => adminApi.getUsers({ role: "STAFF", page_size: 100 }) });

  const complaints = data?.data?.items || [];
  const totalPages = data?.data?.total_pages || 1;
  const staffUsers = usersData?.data?.items || [];

  const assignMutation = useMutation({
    mutationFn: (data: { complaintId: string; staffId: string }) => complaintsApi.assign(data.complaintId, { staff_id: data.staffId }),
    onSuccess: () => { toast.success("Complaint assigned!"); setAssignModal(null); queryClient.invalidateQueries({ queryKey: ["admin-complaints"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to assign"),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-outfit text-2xl font-bold text-slate-100">All Complaints</h1>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-10" placeholder="Search..." />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">All Statuses</option>
          {["SUBMITTED","ASSIGNED","IN_PROGRESS","PENDING_INFO","ESCALATED","RESOLVED","CLOSED","REJECTED"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
        </select>
        <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">All Priorities</option>
          {["LOW","MEDIUM","HIGH","CRITICAL"].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {isLoading ? <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div> : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-700/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Ref</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Student</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Staff</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">SLA</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr></thead>
              <tbody>
                {complaints.map((c: any) => (
                  <tr key={c.id} className="border-b border-slate-700/20 hover:bg-dark-700/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-slate-300 cursor-pointer" onClick={() => navigate(`/admin/complaints/${c.id}`)}>{c.reference_no}</td>
                    <td className="px-4 py-3 text-sm text-slate-200 truncate max-w-[150px] cursor-pointer" onClick={() => navigate(`/admin/complaints/${c.id}`)}>{c.title}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{c.student?.full_name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{c.assigned_staff?.full_name || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-4 py-3"><SLACountdown deadline={c.sla_deadline} status={c.status} resolvedAt={c.resolved_at} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => setAssignModal(c.id)} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                        <UserPlus className="w-3 h-3" /> Assign
                      </button>
                    </td>
                  </tr>
                ))}
                {complaints.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No complaints found</td></tr>}
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
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setAssignModal(null)}>
          <div className="glass-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-outfit font-semibold text-slate-200">Assign Complaint</h3>
              <button onClick={() => setAssignModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="input-field mb-4">
              <option value="">Select staff member</option>
              {staffUsers.map((u: any) => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
            </select>
            <button onClick={() => selectedStaff && assignMutation.mutate({ complaintId: assignModal, staffId: selectedStaff })}
              disabled={!selectedStaff || assignMutation.isPending} className="btn-primary w-full disabled:opacity-50">
              {assignMutation.isPending ? "Assigning..." : "Assign"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
