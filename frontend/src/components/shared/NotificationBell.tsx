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
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-dark-700 transition-colors" id="notification-bell">
        <Bell className="w-5 h-5 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-dark-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-slate-700">
            <span className="font-medium text-sm text-slate-200">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">No notifications</p>
            ) : (
              notifications.slice(0, 5).map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left p-3 border-b border-slate-700/50 hover:bg-dark-700 transition-colors ${!notif.is_read ? "bg-primary-500/5" : ""}`}
                >
                  <p className={`text-sm ${!notif.is_read ? "text-slate-200 font-medium" : "text-slate-400"}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
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
