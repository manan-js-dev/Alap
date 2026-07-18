import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  unreadCounts: Record<string, number>;
  clearUnread: (roomId: string) => void;
  incrementUnread: (roomId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const clearUnread = (roomId: string) => {
    setUnreadCounts((prev) => ({ ...prev, [roomId]: 0 }));
  };

  const incrementUnread = (roomId: string) => {
    setUnreadCounts((prev) => ({ ...prev, [roomId]: (prev[roomId] || 0) + 1 }));
  };

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const newSocket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
      {
        auth: { userId: user.id },
      },
    );

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

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
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within SocketProvider");
  return context;
};
