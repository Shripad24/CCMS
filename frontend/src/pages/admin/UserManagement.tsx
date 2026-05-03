import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";
import { Loader2, Plus, X, Search } from "lucide-react";
import { toast } from "sonner";

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [approvedFilter, setApprovedFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-outfit text-2xl font-bold text-slate-100">User Management</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add User</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
              <thead><tr className="border-b border-slate-700/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr></thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b border-slate-700/20">
                    <td className="px-4 py-3 text-sm text-slate-200">{u.full_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{u.email}</td>
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
          <div className="glass-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-outfit font-semibold text-slate-200">Add User</h3><button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
            <div className="space-y-3">
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
    </div>
  );
}
