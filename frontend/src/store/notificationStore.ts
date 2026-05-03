import { create } from "zustand";
import type { Notification } from "@/types";

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  addNotification: (notification: Notification) => void;
  setNotifications: (notifications: Notification[], unreadCount: number) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setConnected: (connected: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  isConnected: false,

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50),
      unreadCount: state.unreadCount + 1,
    })),

  setNotifications: (notifications, unreadCount) =>
    set({ notifications, unreadCount }),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })),

  setConnected: (connected) => set({ isConnected: connected }),
}));
