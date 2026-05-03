import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { complaintsApi } from "@/api/complaints";
import { messagesApi } from "@/api/messages";
import { useAuthStore } from "@/store/authStore";
import { StatusBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { SLACountdown } from "@/components/shared/SLACountdown";
import { AICategoryBadge } from "@/components/shared/AICategoryBadge";
import { Loader2, Send, Sparkles, ChevronDown, ChevronUp, Paperclip } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

const STATUS_OPTIONS: Record<string, string[]> = {
  ASSIGNED: ["IN_PROGRESS", "PENDING_INFO", "REJECTED"],
  IN_PROGRESS: ["PENDING_INFO", "RESOLVED", "ESCALATED"],
  PENDING_INFO: ["IN_PROGRESS", "RESOLVED"],
  ESCALATED: ["IN_PROGRESS", "ASSIGNED", "RESOLVED"],
  SUBMITTED: ["ASSIGNED", "REJECTED"],
};

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const { data: complaintData, isLoading } = useQuery({ queryKey: ["complaint", id], queryFn: () => complaintsApi.getOne(id!), enabled: !!id });
  const { data: updatesData } = useQuery({ queryKey: ["complaint-updates", id], queryFn: () => complaintsApi.getUpdates(id!), enabled: !!id });
  const { data: messagesData, refetch: refetchMessages } = useQuery({ queryKey: ["messages", id], queryFn: () => messagesApi.getMessages(id!), enabled: !!id, refetchInterval: 10000 });

  const sendMutation = useMutation({ mutationFn: () => messagesApi.sendMessage(id!, message), onSuccess: () => { setMessage(""); refetchMessages(); } });

  const statusMutation = useMutation({
    mutationFn: () => complaintsApi.updateStatus(id!, { new_status: newStatus, message: statusMessage || undefined }),
    onSuccess: () => {
      toast.success("Status updated!");
      setNewStatus(""); setStatusMessage("");
      queryClient.invalidateQueries({ queryKey: ["complaint", id] });
      queryClient.invalidateQueries({ queryKey: ["complaint-updates", id] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to update status"),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>;

  const complaint = complaintData?.data;
  const updates = updatesData?.data || [];
  const messages = messagesData?.data || [];
  if (!complaint) return <div className="text-center text-slate-500 py-12">Complaint not found</div>;

  const availableStatuses = STATUS_OPTIONS[complaint.status] || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-sm text-slate-400">{complaint.reference_no}</span>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
            <h1 className="font-outfit text-xl font-bold text-slate-100">{complaint.title}</h1>
          </div>
          <SLACountdown deadline={complaint.sla_deadline} warningSent={complaint.sla_warning_sent} />
        </div>
        <p className="text-slate-300 whitespace-pre-wrap mb-4">{complaint.description}</p>
        {complaint.attachment_url && (
          <a href={complaint.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300">
            <Paperclip className="w-4 h-4" /> View Attachment
          </a>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/30">
          <div><p className="text-xs text-slate-400">Student</p><p className="text-sm text-slate-200">{complaint.student?.full_name || "—"}</p></div>
          <div><p className="text-xs text-slate-400">Category</p><p className="text-sm text-slate-200">{complaint.category || "N/A"}</p></div>
          <div><p className="text-xs text-slate-400">Created</p><p className="text-sm text-slate-200">{format(new Date(complaint.created_at), "PPp")}</p></div>
          <div><p className="text-xs text-slate-400">Resolved</p><p className="text-sm text-slate-200">{complaint.resolved_at ? format(new Date(complaint.resolved_at), "PPp") : "Pending"}</p></div>
        </div>
      </div>

      {/* Status Update Panel */}
      {availableStatuses.length > 0 && (
        <div className="glass-card p-6 border-primary-500/20">
          <h3 className="font-outfit font-semibold text-slate-200 mb-4">Update Status</h3>
          <div className="space-y-3">
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input-field">
              <option value="">Select new status</option>
              {availableStatuses.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
            <textarea value={statusMessage} onChange={(e) => setStatusMessage(e.target.value)} className="input-field min-h-[80px] resize-y" placeholder="Add a note (optional)" />
            <button onClick={() => newStatus && statusMutation.mutate()} disabled={!newStatus || statusMutation.isPending}
              className="btn-primary disabled:opacity-50">
              {statusMutation.isPending ? "Updating..." : "Update Status"}
            </button>
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {complaint.ai_category && (
        <div className="glass-card overflow-hidden">
          <button onClick={() => setShowAI(!showAI)} className="w-full flex items-center justify-between p-4 hover:bg-dark-700/50 transition-colors">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /><span className="font-medium text-slate-200">AI Analysis</span>
              <AICategoryBadge category={complaint.ai_category} confidence={complaint.ai_confidence} />
            </div>
            {showAI ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {showAI && (
            <div className="p-4 pt-0 grid grid-cols-2 gap-3">
              <div className="bg-dark-700/50 rounded-lg p-3"><p className="text-xs text-slate-400">Category</p><p className="text-sm text-slate-200">{complaint.ai_category}</p></div>
              <div className="bg-dark-700/50 rounded-lg p-3"><p className="text-xs text-slate-400">Priority</p><p className="text-sm text-slate-200">{complaint.ai_priority}</p></div>
              <div className="bg-dark-700/50 rounded-lg p-3"><p className="text-xs text-slate-400">Department</p><p className="text-sm text-slate-200">{complaint.ai_department}</p></div>
              <div className="bg-dark-700/50 rounded-lg p-3"><p className="text-xs text-slate-400">Reasoning</p><p className="text-sm text-slate-300">{complaint.ai_reasoning}</p></div>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="glass-card p-6">
        <h3 className="font-outfit font-semibold text-slate-200 mb-4">Status History</h3>
        <div className="space-y-4">
          {updates.map((u: any, i: number) => (
            <div key={u.id} className="flex gap-3">
              <div className="flex flex-col items-center"><div className="w-3 h-3 rounded-full bg-primary-500 mt-1.5" />{i < updates.length - 1 && <div className="w-0.5 flex-1 bg-slate-700 mt-1" />}</div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">{u.new_status && <StatusBadge status={u.new_status} />}<span className="text-xs text-slate-500">{formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}</span></div>
                {u.message && <p className="text-sm text-slate-300">{u.message}</p>}
                {u.author && <p className="text-xs text-slate-500 mt-1">by {u.author.full_name}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="glass-card p-6">
        <h3 className="font-outfit font-semibold text-slate-200 mb-4">Messages</h3>
        <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
          {messages.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No messages yet</p>}
          {messages.map((m: any) => {
            const isMe = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-primary-500/20 border border-primary-500/30" : "bg-dark-700 border border-slate-700"}`}>
                  {!isMe && <p className="text-xs text-primary-400 font-medium mb-1">{m.sender?.full_name}</p>}
                  <p className="text-sm text-slate-200">{m.content}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{format(new Date(m.created_at), "p")}</p>
                </div>
              </div>
            );
          })}
        </div>
        {!["CLOSED", "REJECTED"].includes(complaint.status) && (
          <div className="flex gap-2">
            <input value={message} onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && message.trim() && sendMutation.mutate()}
              className="input-field flex-1" placeholder="Type a message..." />
            <button onClick={() => message.trim() && sendMutation.mutate()} disabled={!message.trim()} className="btn-primary px-4"><Send className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
