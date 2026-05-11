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
      className="glass-card p-5 cursor-pointer transition-all duration-200 group"
      style={{ borderRadius: "24px" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-xs font-mono tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              {complaint.reference_no}
            </span>
            <StatusBadge status={complaint.status} />
          </div>
          <h3
            className="font-dm font-semibold truncate transition-colors"
            style={{ color: "var(--text-heading)" }}
          >
            {complaint.title}
          </h3>
          <p className="text-sm font-dm line-clamp-2 mt-1" style={{ color: "var(--text-muted)" }}>
            {complaint.description}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <PriorityBadge priority={complaint.priority} />
          <SLACountdown
            deadline={complaint.sla_deadline}
            warningSent={complaint.sla_warning_sent}
            status={complaint.status}
            resolvedAt={complaint.resolved_at}
          />
        </div>
      </div>
      <div
        className="flex items-center justify-between mt-4 pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}
      >
        <span className="text-xs font-dm" style={{ color: "var(--text-muted)" }}>
          {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
        </span>
        {complaint.category && (
          <span
            className="text-xs font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "var(--text-muted)",
            }}
          >
            {complaint.category.replace("_", " ")}
          </span>
        )}
      </div>
    </div>
  );
}
