import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";
import { Loader2, Plus, X, Search, Mail } from "lucide-react";
import { toast } from "sonner";

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [approvedFilter, setApprovedFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [editEmail, setEditEmail] = useState("");
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "STAFF", department_id: "" });

  const { data, isLoading } = useQuery({ queryKey: ["admin-users", page, search, roleFilter, approvedFilter], queryFn: () => adminApi.getUsers({ page, page_size: 10, search: search || undefined, role: roleFilter || undefined, is_approved: approvedFilter === "true" ? true : approvedFilter === "false" ? false : undefined }) });
  const { data: deptData } = useQuery({ queryKey: ["departments"], queryFn: () => adminApi.getDepartments() });

  const users = data?.data?.items || [];
  const departments = deptData?.data || [];

  const createMutation = useMutation({
    mutationFn: () => adminApi.createUser({ ...form, department_id: form.department_id || undefined }),
    onSuccess: () => { toast.success("User created!"); setShowModal(false); setForm({ full_name: "", email: "", password: "", role: "STAFF", department_id: "" }); queryClient.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to create user"),
  });

  const updateEmailMutation = useMutation({
    mutationFn: () => adminApi.updateUser(editUser.id, { email: editEmail }),
    onSuccess: () => {
      toast.success("Email updated successfully!");
      setShowEditModal(false);
      setEditUser(null);
      setEditEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to update email"),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => { toast.success("User deactivated"); queryClient.invalidateQueries({ queryKey: ["admin-users"] }); },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminApi.activateUser(id),
    onSuccess: () => { toast.success("User activated"); queryClient.invalidateQueries({ queryKey: ["admin-users"] }); },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveUser(id),
    onSuccess: () => { toast.success("User approved!"); queryClient.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to approve user"),
  });

  const denyMutation = useMutation({
    mutationFn: (id: string) => adminApi.denyUser(id),
    onSuccess: () => { toast.success("User registration denied and removed"); queryClient.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to deny user"),
  });

  const openEditEmail = (user: any) => {
    setEditUser(user);
    setEditEmail(user.email);
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-playfair text-2xl font-bold" style={{ color: "var(--text-heading)" }}>User Management</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add User</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" placeholder="Search users..." />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select value={approvedFilter} onChange={(e) => setApprovedFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Approval Statuses</option>
          <option value="true">Approved</option>
          <option value="false">Pending Approval</option>
        </select>
      </div>

      {isLoading ? <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div> : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b" style={{ borderColor: "var(--divider)" }}>
                <th className="text-left px-4 py-3.5 text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Name</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Email</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Role</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Status</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Actions</th>
              </tr></thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b hover:bg-white/[0.03] transition-colors" style={{ borderColor: "var(--divider)" }}>
                    <td className="px-4 py-3.5 text-sm font-medium" style={{ color: "var(--text-heading)" }}>{u.full_name}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: "var(--text-body)" }}>{u.email}</span>
                        {(u.role === "STAFF" || u.role === "ADMIN") && (
                          <button 
                            onClick={() => openEditEmail(u)} 
                            className="p-1 rounded-lg hover:bg-white/10 transition-colors group"
                            title="Edit email"
                          >
                            <Mail className="w-3.5 h-3.5 transition-colors" style={{ color: "var(--text-muted)" }} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-500/10 text-primary-400 border border-primary-500/20">{u.role}</span></td>
                    <td className="px-4 py-3">
                      {!u.is_approved ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>{u.is_active ? "Active" : "Inactive"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex flex-wrap gap-2">
                      {!u.is_approved && (
                        <>
                          <button onClick={() => approveMutation.mutate(u.id)} className="text-xs text-amber-400 hover:text-amber-300 font-medium">Approve</button>
                          <button onClick={() => { if(window.confirm("Are you sure you want to deny this user? Their account will be deleted.")) denyMutation.mutate(u.id) }} className="text-xs text-red-400 hover:text-red-300 font-medium">Deny</button>
                        </>
                      )}
                      {u.is_approved && u.is_active && <button onClick={() => deactivateMutation.mutate(u.id)} className="text-xs text-red-400 hover:text-red-300">Deactivate</button>}
                      {u.is_approved && !u.is_active && <button onClick={() => activateMutation.mutate(u.id)} className="text-xs text-emerald-400 hover:text-emerald-300">Activate</button>}
                      <button onClick={() => adminApi.resetUserPassword(u.id).then(() => toast.success("Reset email sent"))} className="text-xs text-primary-400 hover:text-primary-300">Reset PW</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="glass-card p-6 w-full max-w-md animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-playfair text-xl font-bold" style={{ color: "var(--text-heading)" }}>Add User</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" style={{ color: "var(--text-muted)" }} /></button>
            </div>
            <div className="space-y-4">
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input-field" placeholder="Full Name" />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="Email" type="email" />
              <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" placeholder="Password" type="password" />
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
                <option value="STAFF">Staff</option><option value="ADMIN">Admin</option>
              </select>
              <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="input-field">
                <option value="">No Department</option>
                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="btn-primary w-full disabled:opacity-50">
                {createMutation.isPending ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Email Modal */}
      {showEditModal && editUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="glass-card p-6 w-full max-w-sm animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-playfair text-xl font-bold" style={{ color: "var(--text-heading)" }}>Edit Email</h3>
                <p className="text-xs font-mono tracking-widest uppercase mt-1" style={{ color: "var(--text-muted)" }}>{editUser.full_name} ({editUser.role})</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" style={{ color: "var(--text-muted)" }} /></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-dm font-medium mb-1.5" style={{ color: "var(--text-body)" }}>Current Email</label>
                <div className="text-sm font-mono px-3 py-2.5 rounded-xl border" style={{ background: "rgba(255,255,255,0.05)", borderColor: "var(--glass-border)", color: "var(--text-muted)" }}>{editUser.email}</div>
              </div>
              <div>
                <label className="block text-sm font-dm font-medium mb-1.5" style={{ color: "var(--text-body)" }}>New Email</label>
                <input 
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)} 
                  className="input-field" 
                  placeholder="Enter new email address" 
                  type="email"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editEmail.trim() && editEmail !== editUser.email) updateEmailMutation.mutate();
                  }}
                />
              </div>
              <button 
                onClick={() => updateEmailMutation.mutate()} 
                disabled={updateEmailMutation.isPending || !editEmail.trim() || editEmail === editUser.email} 
                className="btn-primary w-full disabled:opacity-50"
              >
                {updateEmailMutation.isPending ? "Updating..." : "Update Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
