import api from "./axios";

export const adminApi = {
  getUsers: (params?: Record<string, string | number | undefined>) =>
    api.get("/admin/users", { params }),

  createUser: (data: { full_name: string; email: string; password: string; role: string; department_id?: string }) =>
    api.post("/admin/users", data),

  updateUser: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/users/${id}`, data),

  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`),

  activateUser: (id: string) =>
    api.post(`/admin/users/${id}/activate`),

  approveUser: (id: string) =>
    api.post(`/admin/users/${id}/approve`),

  denyUser: (id: string) =>
    api.delete(`/admin/users/${id}/deny`),

  resetUserPassword: (id: string) =>
    api.post(`/admin/users/${id}/reset-password`),

  getAnalytics: () =>
    api.get("/admin/analytics"),

  generateReport: (start_date: string, end_date: string) =>
    api.post("/admin/reports/generate", null, {
      params: { start_date, end_date },
      responseType: "blob",
    }),

  getEscalated: () =>
    api.get("/admin/sla/escalated"),

  getDepartments: () =>
    api.get("/departments/"),

  createDepartment: (data: { name: string; description?: string; head_user_id?: string }) =>
    api.post("/departments/", data),

  updateDepartment: (id: string, data: Record<string, unknown>) =>
    api.patch(`/departments/${id}`, data),

  updateSLAPolicy: (deptId: string, data: { priority: string; resolution_hours: number; warning_threshold_pct?: number }) =>
    api.patch(`/departments/${deptId}/sla-policy`, data),
};
