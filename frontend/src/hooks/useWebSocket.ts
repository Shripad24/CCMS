import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { toast } from "sonner";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const reconnectAttempts = useRef(0);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const { accessToken, isAuthenticated } = useAuthStore();
  const { addNotification, setConnected } = useNotificationStore();

  const connect = useCallback(() => {
    if (!accessToken || !isAuthenticated) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${accessToken}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        reconnectAttempts.current = 0;

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "pong") return;

          if (data.type === "notification" && data.data) {
            const notif = {
              id: data.data.id,
              user_id: "",
              type: data.data.notif_type,
              message: data.data.message,
              complaint_id: data.data.complaint_id,
              is_read: false,
              created_at: data.data.created_at,
            };
            addNotification(notif);
            toast(data.data.message, {
              description: new Date(data.data.created_at).toLocaleTimeString(),
            });
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        // Reconnect with exponential backoff
        if (isAuthenticated) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current += 1;
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // WebSocket creation failed
    }
  }, [accessToken, isAuthenticated, addNotification, setConnected]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, [setConnected]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connect();
    } else {
      disconnect();
    }
    return () => disconnect();
  }, [isAuthenticated, accessToken, connect, disconnect]);

  return { isConnected: useNotificationStore((s) => s.isConnected) };
}
