import { useEffect, useState, useCallback, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import {
  requestNotificationPermission,
  showNotification,
} from "../utils/notifications";
import { SocketContext } from "./SocketContextInstance";

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(
    () => {
      try {
        const stored = localStorage.getItem("unreadCounts");
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    },
  );

  const clearUnread = useCallback((roomId: string) => {
    setUnreadCounts((prev) => {
      const updated = { ...prev, [roomId]: 0 };
      localStorage.setItem("unreadCounts", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const incrementUnread = useCallback((roomId: string) => {
    setUnreadCounts((prev) => {
      const updated = { ...prev, [roomId]: (prev[roomId] || 0) + 1 };
      localStorage.setItem("unreadCounts", JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    requestNotificationPermission();

    const newSocket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
      { auth: { userId: user.id } },
    );

    newSocket.on("connect", () => setIsConnected(true));
    newSocket.on("disconnect", () => setIsConnected(false));

    newSocket.on(
      "new_message_notification",
      ({ roomId }: { roomId: string }) => {
        showNotification("New Message — Alap", "You have a new message", () => {
          window.location.href = "/chat";
        });
        incrementUnread(roomId);
      },
    );

    newSocket.on("new_request", () => {
      showNotification(
        "New Chat Request — Alap",
        "Someone wants to connect with you",
        () => {
          window.location.href = "/chat";
        },
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user, incrementUnread]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        unreadCounts,
        clearUnread,
        incrementUnread,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export { SocketContext };
