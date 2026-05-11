import { cn } from "@/lib/utils";

const statusConfig: Record<string, { bg: string; border: string; text: string; label: string; dot: string }> = {
  SUBMITTED: {
    bg: "rgba(196,184,232,0.15)",
    border: "rgba(196,184,232,0.35)",
    text: "#8e72c8",
    label: "Submitted",
    dot: "#c4b8e8",
  },
  ASSIGNED: {
    bg: "rgba(168,197,160,0.15)",
    border: "rgba(168,197,160,0.35)",
    text: "#5f7d58",
    label: "Assigned",
    dot: "#a8c5a0",
  },
  IN_PROGRESS: {
    bg: "rgba(240,208,128,0.15)",
    border: "rgba(240,208,128,0.35)",
    text: "#a06418",
    label: "In Progress",
    dot: "#f0d080",
  },
  PENDING_INFO: {
    bg: "rgba(242,196,160,0.15)",
    border: "rgba(242,196,160,0.35)",
    text: "#a44e28",
    label: "Pending Info",
    dot: "#f2c4a0",
  },
  ESCALATED: {
    bg: "rgba(232,180,184,0.15)",
    border: "rgba(232,180,184,0.35)",
    text: "#c96068",
    label: "Escalated",
    dot: "#e8b4b8",
  },
  RESOLVED: {
    bg: "rgba(168,197,160,0.15)",
    border: "rgba(168,197,160,0.35)",
    text: "#4d6548",
    label: "Resolved",
    dot: "#a8c5a0",
  },
  CLOSED: {
    bg: "rgba(122,138,122,0.10)",
    border: "rgba(122,138,122,0.25)",
    text: "#7a8a7a",
    label: "Closed",
    dot: "#7a8a7a",
  },
  REJECTED: {
    bg: "rgba(232,112,112,0.12)",
    border: "rgba(232,112,112,0.30)",
    text: "#c96068",
    label: "Rejected",
    dot: "#e87070",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.SUBMITTED;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wide"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.text,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: config.dot }}
      />
      {config.label}
    </span>
  );
}

const priorityConfig: Record<string, { bg: string; border: string; text: string }> = {
  LOW: {
    bg: "rgba(168,197,160,0.12)",
    border: "rgba(168,197,160,0.25)",
    text: "#5f7d58",
  },
  MEDIUM: {
    bg: "rgba(242,196,160,0.15)",
    border: "rgba(242,196,160,0.35)",
    text: "#a44e28",
  },
  HIGH: {
    bg: "rgba(232,180,184,0.15)",
    border: "rgba(232,180,184,0.35)",
    text: "#c96068",
  },
  CRITICAL: {
    bg: "rgba(232,112,112,0.15)",
    border: "rgba(232,112,112,0.35)",
    text: "#b04350",
  },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const config = priorityConfig[priority] || priorityConfig.MEDIUM;
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.text,
      }}
    >
      {priority}
    </span>
  );
}
