import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

export default function DepartmentManagement() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const { data, isLoading } = useQuery({ queryKey: ["departments"], queryFn: () => adminApi.getDepartments() });
  const departments = data?.data || [];

  const createMutation = useMutation({
    mutationFn: () => adminApi.createDepartment(form),
    onSuccess: () => { toast.success("Department created!"); setShowModal(false); setForm({ name: "", description: "" }); queryClient.invalidateQueries({ queryKey: ["departments"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-outfit text-2xl font-bold text-slate-100">Department Management</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Department</button>
      </div>

      {isLoading ? <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d: any) => (
            <div key={d.id} className="glass-card p-5">
              <h3 className="font-outfit font-semibold text-slate-200 mb-1">{d.name}</h3>
              <p className="text-sm text-slate-400 mb-3">{d.description || "No description"}</p>
              <p className="text-xs text-slate-500">Created {new Date(d.created_at).toLocaleDateString()}</p>
            </div>
          ))}
          {departments.length === 0 && <div className="col-span-full text-center text-slate-500 py-12">No departments yet</div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="glass-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-outfit font-semibold text-slate-200">Add Department</h3><button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
            <div className="space-y-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Department Name" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field min-h-[80px]" placeholder="Description" />
              <button onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending} className="btn-primary w-full disabled:opacity-50">
                {createMutation.isPending ? "Creating..." : "Create Department"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
