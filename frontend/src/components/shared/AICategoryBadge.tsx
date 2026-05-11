import { Sparkles } from "lucide-react";

interface AICategoryBadgeProps {
  category: string | null;
  confidence: number | null;
}

export function AICategoryBadge({ category, confidence }: AICategoryBadgeProps) {
  if (!category) return null;

  const confPct = confidence ? Math.round(confidence * 100) : 0;
  const confColor = confPct >= 80 ? "#4d6548" : confPct >= 50 ? "#a06418" : "#7a8a7a";

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wide uppercase transition-all"
      style={{
        background: "rgba(196,184,232,0.15)",
        border: "1px solid rgba(196,184,232,0.30)",
        color: "#8e72c8",
      }}
    >
      <Sparkles className="w-3 h-3" style={{ color: "#c4b8e8" }} />
      <span>{category.replace("_", " ")}</span>
      <span style={{ color: confColor, fontWeight: 700 }}>{confPct}%</span>
    </span>
  );
}
