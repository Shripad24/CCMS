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

  updateStatus: (id: string, data: { new_status: string; message?: string; file?: File | null }) => {
    const formData = new FormData();
    formData.append("new_status", data.new_status);
    if (data.message) formData.append("message", data.message);
    if (data.file) formData.append("file", data.file);
    return api.patch(`/complaints/${id}/status`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  assign: (id: string, data: { staff_id: string; note?: string }) =>
    api.patch(`/complaints/${id}/assign`, data),

  getUpdates: (id: string) =>
    api.get(`/complaints/${id}/updates`),

  submitRating: (id: string, data: { score: number; feedback_text?: string }) =>
    api.post(`/complaints/${id}/rating`, data),
};
