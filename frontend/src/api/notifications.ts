import api from "./axios";

export const notificationsApi = {
  getAll: (params?: { page?: number; page_size?: number; unread_only?: boolean }) =>
    api.get("/notifications/", { params }),

  markAsRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch("/notifications/read-all"),
};
