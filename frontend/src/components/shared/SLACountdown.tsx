import { useState, useEffect } from "react";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface SLACountdownProps {
  deadline: string | null;
  warningSent?: boolean;
  status?: string;
  resolvedAt?: string | null;
}

export function SLACountdown({ deadline, warningSent, status, resolvedAt }: SLACountdownProps) {
  const [remaining, setRemaining] = useState<string>("");
  const [urgency, setUrgency] = useState<"normal" | "warning" | "breached" | "completed">("normal");

  useEffect(() => {
    if (!deadline) return;

    if (status === "RESOLVED" || status === "CLOSED") {
      const end = new Date(deadline).getTime();
      const resolved = resolvedAt ? new Date(resolvedAt).getTime() : new Date().getTime(); // fallback if resolvedAt is missing but status is resolved
      
      if (resolved <= end) {
        setRemaining("Completed Early");
        setUrgency("completed");
      } else {
        const overdue = resolved - end;
        const hours = Math.floor(overdue / (1000 * 60 * 60));
        const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));
        setRemaining(`Resolved Late (${hours}h ${minutes}m overdue)`);
        setUrgency("breached");
      }
      return;
    }

    const update = () => {
      const now = new Date().getTime();
      const end = new Date(deadline).getTime();
      const diff = end - now;

      if (diff <= 0) {
        const overdue = Math.abs(diff);
        const hours = Math.floor(overdue / (1000 * 60 * 60));
        const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));
        setRemaining(`${hours}h ${minutes}m overdue`);
        setUrgency("breached");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setRemaining(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setRemaining(`${hours}h ${minutes}m`);
      } else {
        setRemaining(`${minutes}m`);
      }

      // Warning at 20% remaining or if warning was sent
      // Since we don't have created_at here, we'll just use 24h as a rough estimate for pct, or just rely on warningSent
      if (warningSent || (days === 0 && hours < 24)) {
        setUrgency("warning");
      } else {
        setUrgency("normal");
      }
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [deadline, warningSent, status, resolvedAt]);

  if (!deadline) return <span className="text-xs text-slate-500">No SLA</span>;

  const colors = {
    normal: "text-emerald-400",
    warning: "text-amber-400",
    breached: "text-red-400",
    completed: "text-blue-400",
  };

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${colors[urgency]}`}>
      {urgency === "completed" ? <CheckCircle2 className="w-3 h-3" /> :
       urgency === "breached" && status !== "RESOLVED" && status !== "CLOSED" ? <AlertTriangle className="w-3 h-3" /> : 
       <Clock className="w-3 h-3" />}
      {remaining}
    </span>
  );
}
