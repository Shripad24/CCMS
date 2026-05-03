import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const DEFAULT_HOURS: Record<string, number> = { LOW: 168, MEDIUM: 72, HIGH: 24, CRITICAL: 4 };

export default function SLAManagement() {
  const queryClient = useQueryClient();
  const [editCell, setEditCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["departments"], queryFn: () => adminApi.getDepartments() });
  const departments = data?.data || [];

  const saveMutation = useMutation({
    mutationFn: (d: { deptId: string; priority: string; hours: number }) =>
      adminApi.updateSLAPolicy(d.deptId, { priority: d.priority, resolution_hours: d.hours }),
    onSuccess: () => { toast.success("Updated!"); setEditCell(null); },
    onError: () => toast.error("Failed"),
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-outfit text-2xl font-bold text-slate-100">SLA Policies</h1>
      <div className="glass-card overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-slate-700/50">
            <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase">Department</th>
            {PRIORITIES.map(p => <th key={p} className="text-center px-4 py-3 text-xs text-slate-400 uppercase">{p}</th>)}
          </tr></thead>
          <tbody>
            {departments.map((dept: any) => (
              <tr key={dept.id} className="border-b border-slate-700/20">
                <td className="px-4 py-3 text-sm text-slate-200">{dept.name}</td>
                {PRIORITIES.map(p => {
                  const k = `${dept.id}-${p}`;
                  return (
                    <td key={p} className="px-4 py-3 text-center">
                      {editCell === k ? (
                        <div className="flex items-center gap-1 justify-center">
                          <input value={editValue} onChange={(e) => setEditValue(e.target.value)} type="number" className="input-field w-20 text-center py-1 text-sm" />
                          <button onClick={() => saveMutation.mutate({ deptId: dept.id, priority: p, hours: parseInt(editValue) })} className="text-emerald-400"><Save className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditCell(k); setEditValue(String(DEFAULT_HOURS[p])); }} className="text-sm text-slate-300 hover:text-primary-400">{DEFAULT_HOURS[p]}h</button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
