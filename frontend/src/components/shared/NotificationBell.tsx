import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import { notificationsApi } from "@/api/notifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, setNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await notificationsApi.getAll({ page: 1, page_size: 5 });
        setNotifications(res.data.items, res.data.unread_count);
      } catch {
        // ignore
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [setNotifications]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      markAllAsRead();
    } catch {
      // ignore
    }
  };

  const handleClick = async (notif: typeof notifications[0]) => {
    if (!notif.is_read) {
      try {
        await notificationsApi.markAsRead(notif.id);
        markAsRead(notif.id);
      } catch {
        // ignore
      }
    }
    if (notif.complaint_id) {
      setOpen(false);
      const stored = JSON.parse(localStorage.getItem("ccms-auth") || "{}");
      const role = stored?.state?.user?.role?.toLowerCase() || "student";
      navigate(`/${role}/complaints/${notif.complaint_id}`);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-2xl transition-all duration-200 hover:bg-white/10"
        id="notification-bell"
      >
        <Bell className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-pulse"
            style={{
              background: "linear-gradient(135deg, var(--accent-rose), #c96068)",
              boxShadow: "0 0 8px rgba(232,180,184,0.5)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-3xl z-50 overflow-hidden glass-card p-0"
          style={{
            background: "var(--bg-base)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <div
            className="flex items-center justify-between p-4"
            style={{ borderBottom: "1px solid var(--divider)" }}
          >
            <span className="font-playfair font-bold text-sm" style={{ color: "var(--text-heading)" }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-dm font-medium transition-colors"
                style={{ color: "var(--accent-primary)" }}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-5 text-center text-sm font-dm" style={{ color: "var(--text-muted)" }}>
                No notifications
              </p>
            ) : (
              notifications.slice(0, 5).map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className="w-full text-left p-4 transition-colors"
                  style={{
                    borderBottom: "1px solid var(--divider)",
                    background: !notif.is_read ? "var(--glass-card-bg-hover)" : "transparent",
                  }}
                >
                  <p
                    className="text-sm font-dm"
                    style={{
                      color: !notif.is_read ? "var(--text-heading)" : "var(--text-muted)",
                      fontWeight: !notif.is_read ? 600 : 400,
                    }}
                  >
                    {notif.message}
                  </p>
                  <p className="text-xs font-mono mt-1" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
