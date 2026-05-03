import { Sparkles } from "lucide-react";

interface AICategoryBadgeProps {
  category: string | null;
  confidence: number | null;
}

export function AICategoryBadge({ category, confidence }: AICategoryBadgeProps) {
  if (!category) return null;

  const confPct = confidence ? Math.round(confidence * 100) : 0;
  const confColor = confPct >= 80 ? "text-emerald-400" : confPct >= 50 ? "text-amber-400" : "text-slate-400";

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs">
      <Sparkles className="w-3 h-3 text-purple-400" />
      <span className="text-purple-300 font-medium">{category.replace("_", " ")}</span>
      <span className={`${confColor} font-medium`}>{confPct}%</span>
    </span>
  );
}
