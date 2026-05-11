import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";
import { Loader2, Plus, X, Edit2, User, Clock, AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function DepartmentManagement() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showSLAModal, setShowSLAModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", head_user_id: "" });
  const [slaForm, setSlaForm] = useState({ priority: "MEDIUM", resolution_hours: 24, warning_threshold_pct: 0.8 });

  const { data, isLoading } = useQuery({ queryKey: ["departments"], queryFn: () => adminApi.getDepartments() });
  const departments = data?.data || [];

  const { data: usersData } = useQuery({ 
    queryKey: ["staff-users"], 
    queryFn: () => adminApi.getUsers({ role: "STAFF", is_active: "true" }) 
  });
  const staffUsers = usersData?.data?.items || [];

  const createMutation = useMutation({
    mutationFn: () => adminApi.createDepartment({ ...form, head_user_id: form.head_user_id || undefined }),
    onSuccess: () => { 
      toast.success("Department created!"); 
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["departments"] }); 
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to create department"),
  });

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateDepartment(editId!, { ...form, head_user_id: form.head_user_id || undefined }),
    onSuccess: () => {
      toast.success("Department updated!");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to update department"),
  });

  const updateSLAMutation = useMutation({
    mutationFn: () => adminApi.updateSLAPolicy(selectedDept.id, slaForm),
    onSuccess: () => {
      toast.success("SLA policy updated!");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to update SLA policy"),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm({ name: "", description: "", head_user_id: "" });
  };

  const handleEdit = (dept: any) => {
    setForm({ 
      name: dept.name, 
      description: dept.description || "", 
      head_user_id: dept.head_user_id || "" 
    });
    setEditId(dept.id);
    setShowModal(true);
  };

  const openSLAModal = (dept: any) => {
    setSelectedDept(dept);
    setShowSLAModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-playfair text-2xl font-bold" style={{ color: "var(--text-heading)" }}>Department Management</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d: any) => (
            <div key={d.id} className="glass-card p-5 relative group">
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={() => openSLAModal(d)}
                  className="p-2 rounded-lg transition-all hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                  title="Manage SLA Policies"
                >
                  <Clock className="w-4 h-4" style={{ color: "var(--accent-lavender)" }} />
                </button>
                <button 
                  onClick={() => handleEdit(d)}
                  className="p-2 rounded-lg transition-all hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                  title="Edit Department"
                >
                  <Edit2 className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                </button>
              </div>
              <h3 className="font-playfair font-bold text-lg mb-1" style={{ color: "var(--text-heading)" }}>{d.name}</h3>
              <p className="text-sm mb-3 line-clamp-2" style={{ color: "var(--text-muted)" }}>{d.description || "No description"}</p>
              
              <div className="space-y-2 mt-4">
                {d.head_user_id && (
                  <div className="flex items-center gap-2 text-xs p-2.5 rounded-xl border" style={{ background: "rgba(255,255,255,0.05)", borderColor: "var(--glass-border)", color: "var(--text-body)" }}>
                    <User className="w-3.5 h-3.5" style={{ color: "var(--accent-lavender)" }} />
                    <span className="truncate font-medium">Head: {staffUsers.find((u: any) => u.id === d.head_user_id)?.full_name || "Unknown"}</span>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1.5">
                  {d.sla_policies?.length > 0 ? (
                    d.sla_policies.map((p: any) => (
                      <span key={p.priority} className="px-2.5 py-1 rounded-full text-[10px] font-mono border" style={{ background: "rgba(255,255,255,0.08)", borderColor: "var(--glass-border)", color: "var(--text-muted)" }}>
                        {p.priority}: {p.resolution_hours}h
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] italic" style={{ color: "var(--text-muted)", opacity: 0.7 }}>No SLA policies set</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {departments.length === 0 && <div className="col-span-full text-center text-slate-500 py-12">No departments yet</div>}
        </div>
      )}

      {/* Department Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="glass-card p-6 w-full max-w-md animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-playfair text-xl font-bold" style={{ color: "var(--text-heading)" }}>{editId ? "Edit Department" : "Add Department"}</h3>
              <button onClick={closeModal} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" style={{ color: "var(--text-muted)" }} /></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-dm font-medium mb-1.5" style={{ color: "var(--text-body)" }}>Department Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g. IT Services" />
              </div>
              
              <div>
                <label className="block text-sm font-dm font-medium mb-1.5" style={{ color: "var(--text-body)" }}>Head of Department (Optional)</label>
                <select 
                  value={form.head_user_id} 
                  onChange={(e) => setForm({ ...form, head_user_id: e.target.value })} 
                  className="input-field"
                >
                  <option value="">No Department Head</option>
                  {staffUsers.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-dm font-medium mb-1.5" style={{ color: "var(--text-body)" }}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field min-h-[100px]" placeholder="Brief description of the department's responsibilities" />
              </div>

              <button 
                onClick={() => editId ? updateMutation.mutate() : createMutation.mutate()} 
                disabled={!form.name || createMutation.isPending || updateMutation.isPending} 
                className="btn-primary w-full disabled:opacity-50 mt-2"
              >
                {editId ? (updateMutation.isPending ? "Updating..." : "Save Changes") : (createMutation.isPending ? "Creating..." : "Create Department")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SLA Policy Modal */}
      {showSLAModal && selectedDept && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowSLAModal(false)}>
          <div className="glass-card p-6 w-full max-w-lg animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-playfair text-xl font-bold" style={{ color: "var(--text-heading)" }}>SLA Policies</h3>
                <p className="text-xs font-mono tracking-widest uppercase mt-1" style={{ color: "var(--text-muted)" }}>{selectedDept.name}</p>
              </div>
              <button onClick={() => setShowSLAModal(false)} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" style={{ color: "var(--text-muted)" }} /></button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {PRIORITIES.map((priority) => {
                  const policy = selectedDept.sla_policies?.find((p: any) => p.priority === priority);
                  const isEditing = slaForm.priority === priority;

                  return (
                    <div key={priority} className={`p-4 rounded-2xl border transition-all duration-300 ${isEditing ? "shadow-lg scale-[1.02]" : ""}`} style={{ 
                      background: isEditing ? "rgba(168,197,160,0.08)" : "rgba(255,255,255,0.04)",
                      borderColor: isEditing ? "var(--accent-primary)" : "var(--glass-border)"
                    }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            priority === "CRITICAL" ? "bg-rose-400" :
                            priority === "HIGH" ? "bg-orange-400" :
                            priority === "MEDIUM" ? "bg-sky-400" : "bg-slate-400"
                          }`} style={{ boxShadow: "0 0 10px currentColor" }} />
                          <span className="font-mono text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-heading)" }}>{priority}</span>
                        </div>
                        {policy && !isEditing && (
                          <button 
                            onClick={() => setSlaForm({ priority, resolution_hours: policy.resolution_hours, warning_threshold_pct: policy.warning_threshold_pct })}
                            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                        )}
                        {!policy && !isEditing && (
                          <button 
                            onClick={() => setSlaForm({ priority, resolution_hours: 24, warning_threshold_pct: 0.8 })}
                            className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Set Policy
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] text-slate-500 uppercase mb-1">Resolution Time (hrs)</label>
                              <div className="relative">
                                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                <input 
                                  type="number" 
                                  value={slaForm.resolution_hours} 
                                  onChange={(e) => setSlaForm({ ...slaForm, resolution_hours: parseInt(e.target.value) })}
                                  className="input-field py-1.5 pl-8 text-sm"
                                  min="1"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 uppercase mb-1">Warning Threshold (%)</label>
                              <div className="relative">
                                <AlertTriangle className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                <input 
                                  type="number" 
                                  step="0.1"
                                  value={slaForm.warning_threshold_pct} 
                                  onChange={(e) => setSlaForm({ ...slaForm, warning_threshold_pct: parseFloat(e.target.value) })}
                                  className="input-field py-1.5 pl-8 text-sm"
                                  min="0.1"
                                  max="1"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => updateSLAMutation.mutate()}
                              disabled={updateSLAMutation.isPending}
                              className="btn-primary py-1.5 text-xs flex-1 flex items-center justify-center gap-1.5"
                            >
                              {updateSLAMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                              Save Policy
                            </button>
                            <button 
                              onClick={() => setSlaForm({ ...slaForm, priority: "" })}
                              className="btn-secondary py-1.5 text-xs px-3"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase">Target</span>
                            <span className="text-sm text-slate-300">{policy ? `${policy.resolution_hours} Hours` : "Not set"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase">Warning at</span>
                            <span className="text-sm text-slate-300">{policy ? `${Math.round(policy.warning_threshold_pct * 100)}%` : "Not set"}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

