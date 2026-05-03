import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface SLACountdownProps {
  deadline: string | null;
  warningSent?: boolean;
}

export function SLACountdown({ deadline, warningSent }: SLACountdownProps) {
  const [remaining, setRemaining] = useState<string>("");
  const [urgency, setUrgency] = useState<"normal" | "warning" | "breached">("normal");

  useEffect(() => {
    if (!deadline) return;

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
      const total = end - (end - diff);
      const pct = diff / (end - (now - diff)) || 1;
      if (warningSent || pct < 0.2) {
        setUrgency("warning");
      } else {
        setUrgency("normal");
      }
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [deadline, warningSent]);

  if (!deadline) return <span className="text-xs text-slate-500">No SLA</span>;

  const colors = {
    normal: "text-emerald-400",
    warning: "text-amber-400",
    breached: "text-red-400",
  };

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${colors[urgency]}`}>
      {urgency === "breached" ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {remaining}
    </span>
  );
}
