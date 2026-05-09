import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import type { Complaint } from "@/types";
import { StatusBadge, PriorityBadge } from "./StatusBadge";
import { SLACountdown } from "./SLACountdown";
import { formatDistanceToNow } from "date-fns";

export function ComplaintCard({ complaint }: { complaint: Complaint }) {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role?.toLowerCase() || "student");

  return (
    <div
      onClick={() => navigate(`/${role}/complaints/${complaint.id}`)}
      className="glass-card p-4 hover:border-primary-500/30 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/5 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-400">{complaint.reference_no}</span>
            <StatusBadge status={complaint.status} />
          </div>
          <h3 className="font-medium text-slate-200 truncate group-hover:text-primary-300 transition-colors">
            {complaint.title}
          </h3>
          <p className="text-sm text-slate-400 line-clamp-2 mt-1">{complaint.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <PriorityBadge priority={complaint.priority} />
          <SLACountdown deadline={complaint.sla_deadline} warningSent={complaint.sla_warning_sent} status={complaint.status} resolvedAt={complaint.resolved_at} />
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/30">
        <span className="text-xs text-slate-500">
          {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
        </span>
        {complaint.category && (
          <span className="text-xs text-slate-400 bg-dark-700 px-2 py-0.5 rounded">{complaint.category.replace("_", " ")}</span>
        )}
      </div>
    </div>
  );
}
