import type { ComplaintStatus } from "@/types";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  SUBMITTED: { bg: "bg-blue-500/10 border-blue-500/30", text: "text-blue-400", label: "Submitted" },
  ASSIGNED: { bg: "bg-indigo-500/10 border-indigo-500/30", text: "text-indigo-400", label: "Assigned" },
  IN_PROGRESS: { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400", label: "In Progress" },
  PENDING_INFO: { bg: "bg-orange-500/10 border-orange-500/30", text: "text-orange-400", label: "Pending Info" },
  ESCALATED: { bg: "bg-red-500/10 border-red-500/30", text: "text-red-400", label: "Escalated" },
  RESOLVED: { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400", label: "Resolved" },
  CLOSED: { bg: "bg-slate-500/10 border-slate-500/30", text: "text-slate-400", label: "Closed" },
  REJECTED: { bg: "bg-rose-500/10 border-rose-500/30", text: "text-rose-400", label: "Rejected" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.SUBMITTED;
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", config.bg, config.text)}>
      {config.label}
    </span>
  );
}

const priorityConfig: Record<string, { bg: string; text: string }> = {
  LOW: { bg: "bg-slate-500/10 border-slate-500/30", text: "text-slate-400" },
  MEDIUM: { bg: "bg-yellow-500/10 border-yellow-500/30", text: "text-yellow-400" },
  HIGH: { bg: "bg-orange-500/10 border-orange-500/30", text: "text-orange-400" },
  CRITICAL: { bg: "bg-red-500/10 border-red-500/30", text: "text-red-400" },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const config = priorityConfig[priority] || priorityConfig.MEDIUM;
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", config.bg, config.text)}>
      {priority}
    </span>
  );
}
