import api from "./axios";

export const messagesApi = {
  getMessages: (complaintId: string) =>
    api.get(`/complaints/${complaintId}/messages`),

  sendMessage: (complaintId: string, content: string) =>
    api.post(`/complaints/${complaintId}/messages`, { content }),
};
