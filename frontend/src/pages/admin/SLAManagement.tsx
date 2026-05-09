import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";
import { Loader2, Save, X } from "lucide-react";
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
    onSuccess: () => { 
      toast.success("Updated!"); 
      setEditCell(null); 
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: () => toast.error("Failed"),
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-outfit text-2xl font-bold text-slate-100">SLA Policies</h1>
      <div className="glass-card overflow-x-auto">
        <table className="w-full border-collapse">
          <thead><tr className="border-b border-slate-700/50 bg-dark-800/50">
            <th className="text-left px-4 py-4 text-xs text-slate-400 uppercase tracking-wider font-semibold">Department</th>
            {PRIORITIES.map(p => <th key={p} className="text-center px-4 py-4 text-xs text-slate-400 uppercase tracking-wider font-semibold">{p}</th>)}
          </tr></thead>
          <tbody>
            {departments.map((dept: any) => (
              <tr key={dept.id} className="border-b border-slate-700/20 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-4 text-sm font-medium text-slate-200">{dept.name}</td>
                {PRIORITIES.map(p => {
                  const k = `${dept.id}-${p}`;
                  const policy = dept.sla_policies?.find((sp: any) => sp.priority === p);
                  const currentHours = policy ? policy.resolution_hours : DEFAULT_HOURS[p];
                  
                  return (
                    <td key={p} className="px-4 py-4 text-center">
                      {editCell === k ? (
                        <div className="flex items-center gap-1 justify-center animate-in fade-in duration-200">
                          <input 
                            value={editValue} 
                            autoFocus
                            onChange={(e) => setEditValue(e.target.value)} 
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveMutation.mutate({ deptId: dept.id, priority: p, hours: parseInt(editValue) });
                              if (e.key === "Escape") setEditCell(null);
                            }}
                            type="number" 
                            className="input-field w-20 text-center py-1 text-sm bg-dark-900" 
                          />
                          <button 
                            onClick={() => saveMutation.mutate({ deptId: dept.id, priority: p, hours: parseInt(editValue) })} 
                            className="p-1 hover:bg-emerald-500/20 rounded transition-colors text-emerald-400"
                            disabled={saveMutation.isPending}
                          >
                            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => setEditCell(null)} 
                            className="p-1 hover:bg-red-500/20 rounded transition-colors text-slate-500 hover:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => { setEditCell(k); setEditValue(String(currentHours)); }} 
                          className="text-sm font-mono px-3 py-1 rounded bg-dark-800 border border-slate-700/50 text-slate-300 hover:text-primary-400 hover:border-primary-500/50 transition-all"
                        >
                          {currentHours}h
                        </button>
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
