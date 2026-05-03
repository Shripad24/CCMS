import api from "./axios";

export const complaintsApi = {
  submit: (formData: FormData) =>
    api.post("/complaints/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getAll: (params: Record<string, string | number | undefined>) =>
    api.get("/complaints/", { params }),

  getOne: (id: string) =>
    api.get(`/complaints/${id}`),

  updateStatus: (id: string, data: { new_status: string; message?: string }) =>
    api.patch(`/complaints/${id}/status`, data),

  assign: (id: string, data: { staff_id: string; note?: string }) =>
    api.patch(`/complaints/${id}/assign`, data),

  getUpdates: (id: string) =>
    api.get(`/complaints/${id}/updates`),

  submitRating: (id: string, data: { score: number; feedback_text?: string }) =>
    api.post(`/complaints/${id}/rating`, data),
};
